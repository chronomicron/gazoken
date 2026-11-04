"""Original-byte JPEG structure inventory; no entropy or pixel decoding."""
from ..contracts import ToolOutput

VERSION = '1.0.0'
SOF = set(range(0xc0, 0xd0)) - {0xc4, 0xc8, 0xcc}
NAMES = {0xd8:'SOI',0xd9:'EOI',0xda:'SOS',0xdb:'DQT',0xc4:'DHT',0xcc:'DAC',
         0xdd:'DRI',0xdc:'DNL',0xde:'DHP',0xdf:'EXP',0xfe:'COM',0x01:'TEM'}
NAMES.update({code:f'SOF{code-0xc0}' for code in SOF})
NAMES.update({code:f'APP{code-0xe0}' for code in range(0xe0,0xf0)})


def run(inputs, parameters):
    data = inputs.source.data
    segments = [{'marker':'SOI','code':'FFD8','offset':0,'byte_length':2,
                 'payload_offset':None,'payload_length':0}]
    frames, scans, intervals, warnings = [], [], [], []
    pos, scan, reached_eoi, trailing = 2, None, False, None
    restart_interval = 0
    try:
        while pos < len(data):
            if scan is not None:
                found = data.find(b'\xff',pos)
                if found < 0:
                    scan['data_end'] = len(data)
                    pos = len(data)
                    break
                pos = found
            offset = pos
            if data[pos] != 255:
                raise ValueError(f'Expected marker at byte {pos}.')
            while pos < len(data) and data[pos] == 255:
                pos += 1
            if pos == len(data):
                if scan is not None:
                    scan['data_end'] = len(data)
                raise ValueError('Truncated marker.')
            code = data[pos]; pos += 1
            if scan is not None and code == 0:
                scan['stuffed_byte_count'] += 1
                continue
            if scan is not None and 0xd0 <= code <= 0xd7:
                scan['restart_marker_count'] += 1
                continue
            if scan is not None:
                scan['data_end'] = offset
                scan = None
            if len(segments) >= parameters['segment_limit']:
                raise ValueError('Segment limit reached; inventory is partial.')
            if code in (0,0xd8) or 0xd0 <= code <= 0xd7:
                raise ValueError(f'Unexpected standalone marker FF{code:02X} at {offset}.')
            if code in (0xd9,0x01):
                segments.append({'marker':NAMES[code],'code':f'FF{code:02X}','offset':offset,
                                 'byte_length':pos-offset,'payload_offset':None,'payload_length':0})
                if code == 0xd9:
                    reached_eoi = True
                    trailing = len(data)-pos
                    break
                continue
            if pos+2 > len(data):
                raise ValueError('Truncated segment length.')
            length = int.from_bytes(data[pos:pos+2],'big')
            if length < 2 or pos+length > len(data):
                raise ValueError(f'Invalid or truncated segment length at {offset}.')
            start, end = pos+2, pos+length
            segments.append({'marker':NAMES.get(code,f'UNKNOWN_FF{code:02X}'),
                             'code':f'FF{code:02X}','offset':offset,'byte_length':end-offset,
                             'payload_offset':start,'payload_length':length-2})
            payload = data[start:end]
            pos = end
            if code in SOF:
                if len(payload)<6 or payload[5]==0 or len(payload)!=6+3*payload[5]:
                    raise ValueError('Invalid frame component declarations.')
                components=[]
                for i in range(payload[5]):
                    cid, sampling, qt = payload[6+3*i:9+3*i]
                    h, v = sampling>>4, sampling&15
                    if not 1<=h<=4 or not 1<=v<=4 or qt>3:
                        raise ValueError('Invalid frame sampling or table selector.')
                    components.append({'component_id':cid,'horizontal_sampling':h,
                                       'vertical_sampling':v,'quantization_table_id':qt})
                if len({c['component_id'] for c in components}) != len(components):
                    raise ValueError('Duplicate frame component identifier.')
                frames.append({'marker_offset':offset,'marker':NAMES[code],
                               'sample_precision_bits':payload[0],
                               'height':int.from_bytes(payload[1:3],'big'),
                               'width':int.from_bytes(payload[3:5],'big'),'components':components})
            elif code == 0xdd:
                if len(payload)!=2:
                    raise ValueError('Invalid restart interval length.')
                restart_interval=int.from_bytes(payload,'big')
                intervals.append({'marker_offset':offset,'interval_mcus':restart_interval})
            elif code == 0xda:
                if not payload or not 1<=payload[0]<=4 or len(payload)!=4+2*payload[0]:
                    raise ValueError('Invalid scan header.')
                components=[{'component_id':payload[1+2*i],
                             'dc_table_id':payload[2+2*i]>>4,
                             'ac_table_id':payload[2+2*i]&15} for i in range(payload[0])]
                scan={'marker_offset':offset,'components':components,
                      'spectral_start':payload[-3],'spectral_end':payload[-2],
                      'approximation_high':payload[-1]>>4,'approximation_low':payload[-1]&15,
                      'restart_interval_mcus':restart_interval,'data_start':end,'data_end':end,
                      'restart_marker_count':0,'stuffed_byte_count':0}
                scans.append(scan)
                if not frames:
                    warnings.append(f'Scan at {offset} has no preceding frame declaration.')
    except ValueError as error:
        warnings.append(str(error))
    if scan is not None:
        scan['data_end'] = len(data)
    for item in scans:
        item['encoded_data_bytes'] = item['data_end']-item['data_start']
    if not reached_eoi:
        warnings.append('EOI not reached; inventory is partial.')
    return ToolOutput({'extraction_status':'complete' if reached_eoi and not warnings else 'partial',
                       'eoi_reached':reached_eoi,'file_bytes':len(data),
                       'trailing_bytes':trailing,'segment_count':len(segments),'segments':segments,
                       'frames':frames,'scan_count':len(scans),
                       'scan_layout_included':parameters['include_scan_layout'],
                       'scans':scans if parameters['include_scan_layout'] else [],
                       'restart_intervals':intervals,
                       'interpretation':'Structural inventory only; not JPEG conformance, processing-history or editing evidence.'},tuple(warnings))
