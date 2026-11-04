import hashlib
from pathlib import Path
from unittest import TestCase
from gazoken.pipeline import run_step

ROOT=Path(__file__).resolve().parents[1]/'fixtures/jpeg-inspector'
JPEG=(ROOT/'baseline-exif.jpg').read_bytes()


def segment(code,payload):return bytes([255,code])+(len(payload)+2).to_bytes(2,'big')+payload

def exif_preview(content=JPEG,order='little',relative=44,size=None):
    enc=lambda n,w:n.to_bytes(w,order)
    entry=lambda tag,value:enc(tag,2)+enc(4,2)+enc(1,4)+enc(value,4)
    # TIFF header -> empty IFD0 at 8 -> IFD1 at 14 -> JPEG at 44.
    tiff=(b'II' if order=='little' else b'MM')+enc(42,2)+enc(8,4)+enc(0,2)+enc(14,4)
    tiff+=enc(2,2)+entry(0x201,relative)+entry(0x202,len(content) if size is None else size)+enc(0,4)+content
    return segment(0xe1,b'Exif\0\0'+tiff)


def inspect(data,**parameters):
    r=run_step(data,'case.jpg','1.6',parameters)['results'][0]
    assert r['status']=='completed',r
    return r


class EmbeddedTests(TestCase):
    def test_exif_both_endians_exact_bytes_hashes_and_nested_coordinates(self):
        for order in ['little','big']:
            data=b'\xff\xd8'+exif_preview(order=order)+b'\xff\xd9'
            r=inspect(data);o=r['output']
            self.assertFalse(r['warnings']);self.assertEqual(o['preview_count'],1)
            p=o['previews'][0]
            self.assertEqual(data[p['offset']:p['offset']+p['byte_count']],JPEG)
            self.assertEqual(p['sha256'],hashlib.sha256(JPEG).hexdigest())
            self.assertEqual(p['source_sha256'],hashlib.sha256(data).hexdigest())
            self.assertEqual(p['structure']['frames'][0]['width'],32)
            self.assertEqual(p['structure']['segments'][0]['offset'],0)
            self.assertEqual(data,b'\xff\xd8'+exif_preview(order=order)+b'\xff\xd9')

    def test_jfxx_and_nested_option(self):
        data=b'\xff\xd8'+segment(0xe0,b'JFXX\0\x10'+JPEG)+b'\xff\xd9'
        p=inspect(data,nested_structure=False)['output']['previews'][0]
        self.assertEqual(p['kind'],'JFXX JPEG');self.assertNotIn('structure',p)
        self.assertEqual(data[p['offset']:p['offset']+p['byte_count']],JPEG)

    def test_declared_ranges_cannot_escape_app1_or_trust_unrelated_bytes(self):
        for relative,size,content in [(0xffffffff,10,JPEG),(0,10,JPEG),(44,0xffffffff,JPEG),(44,4,b'nope')]:
            data=b'\xff\xd8'+exif_preview(content,relative=relative,size=size)+b'\xff\xd9'+JPEG
            r=inspect(data)
            self.assertTrue(r['warnings']);self.assertEqual(r['output']['previews'],[])

    def test_limit_keeps_only_requested_previews_with_warning(self):
        data=b'\xff\xd8'+segment(0xe0,b'JFXX\0\x10'+JPEG)*2+b'\xff\xd9'
        r=inspect(data,preview_limit=1)
        self.assertEqual(r['output']['preview_count'],1)
        self.assertTrue(any('limit' in w for w in r['warnings']))

    def test_partial_nested_jpeg_keeps_manifest_and_warns(self):
        data=b'\xff\xd8'+exif_preview(b'\xff\xd8\xff')+b'\xff\xd9'
        r=inspect(data);p=r['output']['previews'][0]
        self.assertEqual(r['output']['extraction_status'],'partial')
        self.assertEqual(p['structure']['extraction_status'],'partial')
        self.assertTrue(p['warnings'])

    def test_absent_unsupported_and_truncated_inputs(self):
        self.assertEqual(inspect(JPEG)['output']['previews'],[])
        for payload in [b'JFXX\0',b'JFXX\0\x11\x00']:
            r=inspect(b'\xff\xd8'+segment(0xe0,payload)+b'\xff\xd9')
            self.assertEqual(r['output']['previews'],[]);self.assertTrue(r['warnings'])
        r=inspect((ROOT/'truncated.jpg').read_bytes())
        self.assertEqual(r['output']['extraction_status'],'partial')
