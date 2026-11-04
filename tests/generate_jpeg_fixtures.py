#!/usr/bin/env python3
"""Generate tiny JPEG structure fixtures and independent Pillow expectations."""
from pathlib import Path
import hashlib
import json
import PIL
from PIL import Image, TiffImagePlugin, features

ROOT=Path(__file__).resolve().parent/'fixtures'/'jpeg-inspector'
ROOT.mkdir(parents=True,exist_ok=True)
image=Image.new('RGB',(32,24))
image.putdata([((x*11+y*3)%256,(y*17)%256,(x*7)%256) for y in range(24) for x in range(32)])
exif=Image.Exif()
exif[0x010f]='Gazoken synthetic fixture'
exif[0x0110]='Test chart (not a camera)'
exif[0x0131]='Gazoken fixture generator'
exif[0x0132]='2001:02:03 04:05:06'
exif[0x0112]=6
exif[0x8769]={0x9003:'2001:02:03 04:05:00',0x829a:TiffImagePlugin.IFDRational(1,125),0x829d:TiffImagePlugin.IFDRational(28,10)}
image.save(ROOT/'baseline-exif.jpg',quality=85,subsampling=2,exif=exif)
image.save(ROOT/'progressive-optimized.jpg',quality=85,subsampling=2,progressive=True,optimize=True)
baseline=(ROOT/'baseline-exif.jpg').read_bytes()
(ROOT/'truncated.jpg').write_bytes(baseline[:100])
(ROOT/'trailing-data.jpg').write_bytes(baseline+b'GAZOKEN_TEST_TRAILER')
records={}
for path in sorted(ROOT.glob('*.jpg')):
    data=path.read_bytes()
    entry={'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
    if path.name!='truncated.jpg':
        with Image.open(path) as decoded:
            entry.update(width=decoded.width,height=decoded.height,quantization={str(k):v for k,v in decoded.quantization.items()},progressive=bool(decoded.info.get('progressive')))
    records[path.name]=entry
(ROOT/'expected.json').write_text(json.dumps({'pillow':PIL.__version__,'jpeg_codec':features.version_codec('jpg'),'provenance':'Generated synthetic 32x24 chart; all metadata is deliberately fictitious.','files':records},indent=2)+'\n')
print(f'Generated four JPEG inspector fixtures in {ROOT}')
