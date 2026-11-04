"""Bounded embedded JPEG discovery; report source ranges, never replace source."""
import hashlib
from ..contracts import ImageSource, ToolInputs, ToolOutput
from .file_structure import run as structure
from .metadata_inventory import parse_exif

VERSION = '1.0.0'
MAX_EXIF_BLOCKS = 16


def run(inputs, parameters):
    inventory=structure(inputs,{'segment_limit':4096,'include_scan_layout':False})
    data=inputs.source.data
    previews,warnings=[],list(inventory.warnings)
    exif_count=0
    seen=set()

    def add(offset,length,kind,container_offset):
        if length<2 or data[offset:offset+2]!=b'\xff\xd8':
            warnings.append(f'{kind}: declared preview is not a JPEG SOI stream.');return
        if (offset,length) in seen:return
        if len(previews)>=parameters['preview_limit']:
            warnings.append('Embedded preview limit reached.');return
        seen.add((offset,length))
        content=data[offset:offset+length]
        preview={'index':len(previews),'kind':kind,'container_marker_offset':container_offset,
                 'source_sha256':inputs.source.sha256,'offset':offset,'byte_count':length,
                 'sha256':hashlib.sha256(content).hexdigest(),'mime':'image/jpeg'}
        if parameters['nested_structure']:
            nested=structure(ToolInputs(ImageSource(content,'embedded.jpg')),
                             {'segment_limit':256,'include_scan_layout':False})
            preview['structure']=nested.measurements
            preview['warnings']=list(nested.warnings)
            if nested.warnings:warnings.append(f'Preview {preview["index"]}: nested structure is partial.')
        previews.append(preview)

    for segment in inventory.measurements['segments']:
        start=segment['payload_offset'];length=segment['payload_length']
        if start is None:continue
        end=start+length
        if segment['marker']=='APP1' and data[start:start+6]==b'Exif\0\0':
            if exif_count>=MAX_EXIF_BLOCKS:
                warnings.append('Exif block inspection limit reached.');break
            exif_count+=1
            parsed,notes=parse_exif(data,start,end,False,False)
            warnings.extend(notes)
            # JPEGInterchangeFormat/Length are relative to this Exif TIFF header.
            pairs={tag:[e for e in parsed['entries'] if e['ifd']=='IFD1' and e['tag']==tag]
                   for tag in ('0x0201','0x0202')}
            if not any(pairs.values()):continue
            if any(len(entries)!=1 for entries in pairs.values()):
                warnings.append('Exif IFD1 preview requires exactly one offset and length.');continue
            entries=[pairs[tag][0] for tag in ('0x0201','0x0202')]
            if any(e['type']!='LONG' or e['count']!=1 or type(e['value']) is not int for e in entries):
                warnings.append('Exif IFD1 preview offset/length must be scalar LONG values.');continue
            relative,size=[e['value'] for e in entries]
            offset=start+6+relative
            if relative<8 or size<2 or offset+size>end:
                warnings.append('Exif preview range exceeds its APP1 container or TIFF header.');continue
            add(offset,size,'Exif IFD1 JPEG',segment['offset'])
        elif segment['marker']=='APP0' and data[start:start+5]==b'JFXX\0':
            if length<6:
                warnings.append('Truncated JFXX extension header.');continue
            if data[start+5]!=0x10:
                warnings.append('JFXX non-JPEG thumbnail is not extracted.');continue
            add(start+6,length-6,'JFXX JPEG',segment['offset'])
        elif segment['marker']=='APP0' and data[start:start+5]==b'JFIF\0' and length>=14:
            if data[start+12] or data[start+13]:
                warnings.append('JFIF RGB thumbnail is present but not extracted by this JPEG-only tool.')
    return ToolOutput({'extraction_status':'partial' if warnings else 'complete',
                       'eoi_reached':inventory.measurements['eoi_reached'],
                       'preview_count':len(previews),'previews':previews,
                       'nested_structure_requested':parameters['nested_structure'],
                       'interpretation':'Declared embedded JPEG ranges only; no pixel comparison, timestamp authentication or editing inference. Nested offsets are relative to each preview.'},tuple(warnings[:100]))
