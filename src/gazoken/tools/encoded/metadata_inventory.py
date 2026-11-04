"""Bounded classic TIFF/Exif inventory; metadata values are unverified claims."""
import math
import struct
from ..contracts import ToolOutput
from .file_structure import run as structure

VERSION = '1.0.0'
TYPES = {1:('BYTE',1,'B'),2:('ASCII',1,None),3:('SHORT',2,'H'),4:('LONG',4,'I'),
         5:('RATIONAL',8,None),6:('SBYTE',1,'b'),7:('UNDEFINED',1,'B'),
         8:('SSHORT',2,'h'),9:('SLONG',4,'i'),10:('SRATIONAL',8,None),
         11:('FLOAT',4,'f'),12:('DOUBLE',8,'d'),13:('IFD',4,'I')}
TAGS={0x10e:'ImageDescription',0x10f:'Make',0x110:'Model',0x112:'Orientation',
      0x131:'Software',0x132:'DateTime',0x13b:'Artist',0x8298:'Copyright',
      0x829a:'ExposureTime',0x829d:'FNumber',0x9003:'DateTimeOriginal',
      0x927c:'MakerNote',0x9286:'UserComment',0xa002:'PixelXDimension',0xa003:'PixelYDimension'}
POINTERS={0x8769:'Exif',0x8825:'GPS',0xa005:'Interop',0x14a:'SubIFD'}


def parse_exif(data, start, end, include_gps, include_vendor):
    base=start+6
    entries, warnings=[], []
    def check(pos,size):
        if pos<base or size<0 or pos+size>end:
            raise ValueError('TIFF range exceeds its APP1 segment.')
    def warn(message):
        if len(warnings)<50:
            warnings.append(message)
    order=None
    try:
        check(base,8)
        signature=data[base:base+2]
        if signature not in (b'II',b'MM'):
            raise ValueError('Invalid TIFF byte order.')
        order='little' if signature==b'II' else 'big'
        prefix='<' if order=='little' else '>'
        def integer(pos,size):
            check(pos,size)
            return int.from_bytes(data[pos:pos+size],order)
        if integer(base+2,2)!=42:
            raise ValueError('Only classic TIFF magic 42 is supported.')
        queue=[(integer(base+4,4),'IFD0',0)]
        visited=set(); examined=0
        while queue:
            relative,name,depth=queue.pop(0)
            if not relative:
                continue
            if relative in visited:
                warn('Repeated or cyclic IFD pointer.');continue
            if depth>8 or len(visited)>=32 or examined>=1000:
                warn('TIFF directory/entry limit reached.');break
            visited.add(relative)
            try:
                pos=base+relative;count=integer(pos,2)
                check(pos+2,count*12+4)
                for i in range(count):
                    if examined>=1000:
                        warn('TIFF entry limit reached.');break
                    examined+=1
                    p=pos+2+12*i
                    tag,kind,length=integer(p,2),integer(p+2,2),integer(p+4,4)
                    if tag==0x8825 and not include_gps:
                        continue
                    entry={'ifd':name,'tag':f'0x{tag:04X}',
                           'name':POINTERS.get(tag,TAGS.get(tag,f'Unknown 0x{tag:04X}')),
                           'type':TYPES.get(kind,('Unsupported',))[0],
                           'count':length,'entry_offset':p,'value_offset':None,'value':None,'truncated':False}
                    entries.append(entry)
                    if kind not in TYPES:
                        warn(f'Unsupported TIFF type {kind}.');continue
                    _,width,fmt=TYPES[kind]
                    size=width*length
                    offset=p+8 if size<=4 else base+integer(p+8,4)
                    entry['value_offset']=offset
                    if tag==0x927c and not include_vendor:
                        entry['omitted']='Vendor data excluded';continue
                    try:
                        check(offset,size)
                        limit=min(length,1024 if kind==2 else 64)
                        entry['truncated']=length>limit
                        if kind==2:
                            entry['value']=data[offset:offset+limit].decode('ascii',errors='replace').rstrip('\0')
                        else:
                            values=[]
                            for j in range(limit):
                                q=offset+j*width
                                if kind in (5,10):
                                    numerator,denominator=struct.unpack_from(prefix+('II' if kind==5 else 'ii'),data,q)
                                    value={'numerator':numerator,'denominator':denominator,
                                           'decimal':numerator/denominator if denominator else None}
                                else:
                                    value=struct.unpack_from(prefix+fmt,data,q)[0]
                                    if isinstance(value,float) and not math.isfinite(value):value=str(value)
                                values.append(value)
                            entry['value']=values[0] if length==1 else values
                            if tag in POINTERS and kind in (4,13):
                                for relative in values:
                                    if len(queue)>=64:
                                        warn('TIFF pointer queue limit reached.');break
                                    queue.append((relative,POINTERS[tag],depth+1))
                        if entry['truncated']:
                            warn('Metadata value display limit reached.')
                    except ValueError as error:
                        entry['unreadable']=True;warn(str(error))
                following=integer(pos+2+count*12,4)
                if following:
                    queue.append((following,'IFD1' if name=='IFD0' else name+' next',depth+1))
            except ValueError as error:
                warn(str(error))
    except ValueError as error:
        warn(str(error))
    return {'marker_payload_offset':start,'byte_order':order,'entries':entries},warnings


def run(inputs,parameters):
    reader=parameters['reader'].replace(' (not connected)','')
    if reader=='ExifTool':
        return ToolOutput({'reader':'unavailable','extraction_status':'partial','blocks':[], 'exif':[]},
                          ('ExifTool is not integrated; no external process was invoked.',))
    inventory=structure(inputs,{'segment_limit':4096,'include_scan_layout':False})
    blocks,exif,warnings=[],[],list(inventory.warnings)
    for segment in inventory.measurements['segments']:
        marker=segment['marker']
        if not marker.startswith('APP') and marker!='COM':continue
        offset=segment['payload_offset'];length=segment['payload_length']
        block={'marker':marker,'marker_offset':segment['offset'],'payload_bytes':length,'kind':'Opaque metadata block'}
        if marker=='APP1' and inputs.source.data[offset:offset+6]==b'Exif\0\0':
            block['kind']='Exif'
            if len(exif)>=16:
                warnings.append('Exif block limit reached.');blocks.append(block);break
            record,notes=parse_exif(inputs.source.data,offset,offset+length,parameters['include_gps'],parameters['include_vendor'])
            exif.append(record);warnings.extend(notes)
        elif marker=='APP0' and inputs.source.data[offset:offset+5]==b'JFIF\0':block['kind']='JFIF'
        elif marker=='APP1' and inputs.source.data[offset:offset+29]==b'http://ns.adobe.com/xap/1.0/\0':block['kind']='XMP (not parsed)'
        elif marker=='APP2' and inputs.source.data[offset:offset+12]==b'ICC_PROFILE\0':block['kind']='ICC (not parsed)'
        blocks.append(block)
    return ToolOutput({'reader':'Bounded TIFF reader','extraction_status':'partial' if warnings else 'complete',
                       'gps_included':parameters['include_gps'],'vendor_bytes_included':parameters['include_vendor'],
                       'blocks':blocks,'exif':exif,
                       'interpretation':'Metadata declarations are editable claims, not authenticated provenance. GPS exclusion omits the standard GPS IFD, not all possible location information.'},tuple(warnings[:100]))
