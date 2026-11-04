"""Stored Huffman codebooks and scan declarations, without symbol decoding."""
from ..contracts import ToolOutput
from .file_structure import run as structure

VERSION = '1.0.0'
MAX_DEFINITIONS = 1024
ARITHMETIC = {'SOF9','SOF10','SOF11','SOF13','SOF14','SOF15'}


def run(inputs, parameters):
    inventory=structure(inputs,{'segment_limit':4096,'include_scan_layout':True})
    records=inventory.measurements
    data=inputs.source.data
    warnings=list(inventory.warnings)
    definitions,scans,active=[],[],{}
    by_offset={s['marker_offset']:s for s in records['scans']}
    frame=None
    stopped=False
    for segment in records['segments']:
        if stopped:break
        marker=segment['marker'];offset=segment['offset']
        if marker.startswith('SOF'):
            frame=marker
            if frame in ARITHMETIC:warnings.append('Arithmetic-coded frame: Huffman assignment interpretation is unavailable.')
        if marker=='DAC':warnings.append('DAC conditioning is present but is not parsed by this Huffman tool.')
        if marker=='DHT':
            pos=segment['payload_offset'];end=pos+segment['payload_length']
            try:
                if pos==end:raise ValueError('Empty DHT segment.')
                while pos<end:
                    start=pos
                    if end-pos<17:raise ValueError('Truncated DHT header.')
                    header=data[pos];kind,table_id=header>>4,header&15
                    if kind not in (0,1) or table_id>3:raise ValueError('Invalid Huffman class or identifier.')
                    counts=list(data[pos+1:pos+17]);total=sum(counts)
                    if not 1<=total<=256:raise ValueError('Invalid Huffman symbol count.')
                    pos+=17
                    if pos+total>end:raise ValueError('Truncated Huffman symbol list.')
                    symbols=list(data[pos:pos+total]);pos+=total
                    codes=[];code=0;index=0
                    for length,count in enumerate(counts,1):
                        if code+count>1<<length:raise ValueError('Oversubscribed Huffman code lengths.')
                        for _ in range(count):
                            if code==(1<<length)-1:raise ValueError('JPEG reserves the all-ones Huffman code.')
                            codes.append({'symbol':symbols[index],'length':length,'code':format(code,f'0{length}b')})
                            index+=1;code+=1
                        code<<=1
                    if len(set(symbols))!=total:raise ValueError('Duplicate Huffman symbols.')
                    if len(definitions)>=MAX_DEFINITIONS:raise ValueError('Huffman definition limit reached.')
                    entry={'definition_index':len(definitions),'marker_offset':offset,'definition_offset':start,
                           'class':'DC' if kind==0 else 'AC','table_id':table_id,
                           'counts_by_length':counts,'symbol_count':total}
                    if parameters['codebooks']:entry.update(symbols=symbols,codes=codes)
                    definitions.append(entry);active[(kind,table_id)]=entry['definition_index']
            except ValueError as error:
                warnings.append(f'DHT at {offset}: {error}');stopped=True
        elif marker=='SOS' and offset in by_offset:
            scan=by_offset[offset]
            assignments=[]
            # Progressive DC refinement emits raw bits and uses no Huffman table.
            progressive=frame in {'SOF2','SOF6'}
            for component in scan['components']:
                if frame in ARITHMETIC:
                    classes=[]
                elif progressive:
                    if scan['spectral_start']>0:
                        classes=[1]
                    else:
                        classes=[] if scan['approximation_high']>0 else [0]
                else:
                    classes=[0] if frame in {'SOF3','SOF7'} else [0,1]
                for kind in classes:
                    table_id=component['dc_table_id' if kind==0 else 'ac_table_id']
                    definition=active.get((kind,table_id))
                    assignments.append({'component_id':component['component_id'],'class':'DC' if kind==0 else 'AC',
                                        'table_id':table_id,'definition_index':definition})
                    if definition is None:warnings.append(f'Scan at {offset}: missing in-file Huffman definition.')
            scans.append({**scan,'huffman_assignments':assignments})
    return ToolOutput({'extraction_status':'partial' if warnings else 'complete',
                       'eoi_reached':records['eoi_reached'],'definition_count':len(definitions),
                       'codebooks_included':parameters['codebooks'],'definitions':definitions,
                       'scan_script_included':parameters['scan_script'],
                       'scan_count':len(scans),'scans':scans if parameters['scan_script'] else [],
                       'interpretation':'Stored codebooks and declarations only; no observed symbol frequencies, compression efficiency, optimization or encoder attribution estimate.'},tuple(warnings[:100]))
