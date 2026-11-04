import json
from pathlib import Path
from unittest import TestCase
from gazoken.pipeline import run_step
from gazoken.tools.encoded.metadata_inventory import parse_exif

FIXTURES=Path(__file__).resolve().parents[1]/'fixtures/jpeg-inspector'


def inspect(data,**parameters):
    return run_step(data,'case.jpg','1.3',parameters)['results'][0]


def exif_tiff(endian='little',tag=0x10f,kind=2,count=4,value=b'ABC\0',following=0):
    enc=lambda n,size:n.to_bytes(size,endian)
    return b'Exif\0\0'+(b'II' if endian=='little' else b'MM')+enc(42,2)+enc(8,4)+enc(1,2)+enc(tag,2)+enc(kind,2)+enc(count,4)+value+enc(following,4)


class MetadataTests(TestCase):
    def test_real_exif_is_extracted_and_source_preserved(self):
        data=(FIXTURES/'baseline-exif.jpg').read_bytes()
        r=inspect(data)
        self.assertEqual(r['status'],'completed');self.assertFalse(r['warnings'])
        entries=[entry for block in r['output']['exif'] for entry in block['entries']]
        names={entry['name']:entry['value'] for entry in entries}
        self.assertEqual(names['Orientation'],6)
        self.assertIn('Make',names);self.assertIn('DateTimeOriginal',names)
        self.assertEqual(data,(FIXTURES/'baseline-exif.jpg').read_bytes())
        self.assertFalse(r['output']['gps_included'])

    def test_both_byte_orders_inline_ascii(self):
        for order in ['little','big']:
            data=exif_tiff(order)
            block,warnings=parse_exif(data,0,len(data),False,False)
            self.assertFalse(warnings);self.assertEqual(block['byte_order'],order)
            self.assertEqual(block['entries'][0]['value'],'ABC')

    def test_cycles_bounds_and_large_counts_are_bounded(self):
        cases=[exif_tiff(following=8),exif_tiff(count=0xffffffff,value=b'\xff'*4),b'Exif\0\0II\x2a\0']
        for data in cases:
            record,warnings=parse_exif(data,0,len(data),False,False)
            self.assertTrue(warnings);self.assertLessEqual(len(record['entries']),1000)
        data=exif_tiff(kind=99)
        record,warnings=parse_exif(data,0,len(data),False,False)
        self.assertTrue(warnings);self.assertIsNone(record['entries'][0]['value'])

    def test_gps_ifd_is_not_followed_by_default(self):
        # IFD0 GPS pointer -> a second one-entry IFD containing LatitudeRef.
        base=exif_tiff(tag=0x8825,kind=4,count=1,value=(26).to_bytes(4,'little'))
        second=exif_tiff(tag=1,kind=2,count=2,value=b'N\0\0\0')[14:]
        data=base+second
        hidden,notes=parse_exif(data,0,len(data),False,False)
        self.assertFalse(notes);self.assertEqual(hidden['entries'],[])
        visible,notes=parse_exif(data,0,len(data),True,False)
        self.assertFalse(notes)
        self.assertEqual(visible['entries'][1]['ifd'],'GPS')
        self.assertEqual(visible['entries'][1]['value'],'N')

    def test_vendor_bytes_are_explicitly_optional(self):
        data=exif_tiff(tag=0x927c,kind=7,count=4,value=b'abcd')
        hidden,_=parse_exif(data,0,len(data),False,False)
        shown,_=parse_exif(data,0,len(data),False,True)
        self.assertIsNone(hidden['entries'][0]['value'])
        self.assertEqual(shown['entries'][0]['value'],list(b'abcd'))

    def test_reader_choices_and_absent_metadata_are_honest(self):
        data=(FIXTURES/'progressive-optimized.jpg').read_bytes()
        for reader in ['Auto','Auto (not connected)','Bounded TIFF reader','Bounded TIFF reader (not connected)']:
            r=inspect(data,reader=reader)
            self.assertEqual(r['output']['reader'],'Bounded TIFF reader')
            self.assertEqual(r['output']['exif'],[])
        r=inspect(data,reader='ExifTool (not connected)')
        self.assertEqual(r['output']['extraction_status'],'partial')
        self.assertEqual(r['output']['reader'],'unavailable');self.assertTrue(r['warnings'])

    def test_ascii_display_limit_and_zero_rational_denominator(self):
        tiff=exif_tiff(count=1100,value=(26).to_bytes(4,'little'))+b'A'*1100
        record,warnings=parse_exif(tiff,0,len(tiff),False,False)
        self.assertEqual(len(record['entries'][0]['value']),1024);self.assertTrue(warnings)
        tiff=exif_tiff(tag=0x829a,kind=5,count=1,value=(26).to_bytes(4,'little'))+b'\x01\0\0\0\0\0\0\0'
        record,warnings=parse_exif(tiff,0,len(tiff),False,False)
        self.assertFalse(warnings);self.assertIsNone(record['entries'][0]['value']['decimal'])
