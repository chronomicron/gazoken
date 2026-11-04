from pathlib import Path
from unittest import TestCase
from gazoken.pipeline import run_step

ROOT=Path(__file__).resolve().parents[1]/'fixtures/jpeg-inspector'


def segment(code,payload):
    return bytes([255,code])+(len(payload)+2).to_bytes(2,'big')+payload


def dht(kind=0,table=0,symbols=b'\x00\x01\x02'):
    return segment(0xc4,bytes([(kind<<4)|table,1,0,2])+bytes(13)+symbols)


def frame(code=0xc0):return segment(code,b'\x08\x00\x01\x00\x01\x01\x01\x11\x00')
def scan(ss=0,se=63,approx=0):return segment(0xda,bytes([1,1,0,ss,se,approx]))
def inspect(data,**parameters):
    r=run_step(data,'case.jpg','1.5',parameters)['results'][0]
    assert r['status']=='completed',r
    return r


class EntropyTests(TestCase):
    def test_canonical_codes_multiple_tables_and_analytic_scan_assignments(self):
        data=b'\xff\xd8'+frame()+dht()+dht(1)+scan()+b'\x00\xff\xd9'
        r=inspect(data);o=r['output'];self.assertFalse(r['warnings'])
        self.assertEqual(o['definition_count'],2)
        self.assertEqual(o['definitions'][0]['codes'],[{'symbol':0,'length':1,'code':'0'},
                         {'symbol':1,'length':3,'code':'100'},{'symbol':2,'length':3,'code':'101'}])

    def test_real_baseline_and_progressive_are_complete(self):
        for name in ['baseline-exif.jpg','progressive-optimized.jpg']:
            data=(ROOT/name).read_bytes();r=inspect(data)
            self.assertEqual(r['output']['extraction_status'],'complete',r['warnings'])
            self.assertGreaterEqual(r['output']['definition_count'],4)
            self.assertEqual(data,(ROOT/name).read_bytes())
            for definition in r['output']['definitions']:
                self.assertEqual(sum(definition['counts_by_length']),len(definition['symbols']))
                codes=[c['code'] for c in definition['codes']]
                self.assertTrue(all(not b.startswith(a) for i,a in enumerate(codes) for j,b in enumerate(codes) if i!=j))

    def test_redefinitions_are_resolved_at_each_scan(self):
        data=b'\xff\xd8'+frame(0xc2)+dht()+scan(0,0)+b'\x00'+dht(symbols=b'\x03\x04\x05')+scan(0,0)+b'\x00\xff\xd9'
        o=inspect(data)['output']
        self.assertEqual([s['huffman_assignments'][0]['definition_index'] for s in o['scans']],[0,1])

    def test_progressive_dc_refinement_requires_no_codebook(self):
        r=inspect(b'\xff\xd8'+frame(0xc2)+scan(0,0,0x10)+b'\x00\xff\xd9')
        self.assertFalse(r['warnings']);self.assertEqual(r['output']['scans'][0]['huffman_assignments'],[])

    def test_invalid_and_truncated_codebooks_return_partial(self):
        payloads=[b'',b'\x00',bytes([0,3])+bytes(15)+b'abc',bytes([0,2])+bytes(15)+b'ab',
                  bytes([0,1])+bytes(15),bytes([0x20,1])+bytes(15)+b'a']
        for payload in payloads:
            r=inspect(b'\xff\xd8'+segment(0xc4,payload)+b'\xff\xd9')
            self.assertTrue(r['warnings']);self.assertEqual(r['output']['extraction_status'],'partial')

    def test_options_omit_details_without_changing_definition_or_scan_counts(self):
        data=(ROOT/'progressive-optimized.jpg').read_bytes()
        o=inspect(data,codebooks=False,scan_script=False)['output']
        self.assertEqual(o['scans'],[]);self.assertGreater(o['scan_count'],1)
        self.assertNotIn('symbols',o['definitions'][0]);self.assertNotIn('codes',o['definitions'][0])

    def test_missing_tables_arithmetic_and_limits_are_explicit(self):
        r=inspect(b'\xff\xd8'+frame()+scan()+b'\x00\xff\xd9')
        self.assertTrue(any('missing' in w for w in r['warnings']))
        r=inspect(b'\xff\xd8'+frame(0xc9)+scan()+b'\x00\xff\xd9')
        self.assertTrue(any('Arithmetic' in w for w in r['warnings']))
        self.assertEqual(r['output']['scans'][0]['huffman_assignments'],[])

    def test_definition_bound_and_duplicate_symbols(self):
        r=inspect(b'\xff\xd8'+dht()*1025+b'\xff\xd9')
        self.assertEqual(r['output']['definition_count'],1024)
        self.assertTrue(any('limit' in w for w in r['warnings']))
        r=inspect(b'\xff\xd8'+dht(symbols=b'\x00\x00\x01')+b'\xff\xd9')
        self.assertTrue(any('Duplicate' in w for w in r['warnings']))
