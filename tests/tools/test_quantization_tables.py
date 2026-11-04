"""Exact values, chronological definitions, malformed boundaries and source identity."""
import hashlib
import json
from pathlib import Path
from unittest import TestCase
from gazoken.pipeline import run_step

FIXTURES = Path(__file__).resolve().parents[1] / 'fixtures/jpeg-inspector'


def segment(code, payload):
    return bytes([255, code]) + (len(payload)+2).to_bytes(2,'big') + payload


def dqt(value, precision=0, table_id=0):
    return segment(0xdb, bytes([(precision<<4)|table_id]) + value.to_bytes(precision+1,'big')*64)


def extract(data, **parameters):
    result = run_step(data,'case.jpg','1.4',parameters)['results'][0]
    assert result['status'] == 'completed', result
    return result


class QuantizationTests(TestCase):
    def test_real_baseline_and_progressive_match_independent_pillow_references(self):
        expected = json.loads((FIXTURES/'expected.json').read_text())['files']
        for name in ('baseline-exif.jpg','progressive-optimized.jpg'):
            data = (FIXTURES/name).read_bytes()
            result = extract(data)
            self.assertEqual(result['output']['extraction_status'],'complete')
            self.assertFalse(result['warnings'])
            actual = {str(t['table_id']):t['values'] for t in result['output']['tables']}
            self.assertEqual(actual,expected[name]['quantization'])
            self.assertEqual(result['inputs']['source_sha256'],hashlib.sha256(data).hexdigest())
            self.assertEqual(data,(FIXTURES/name).read_bytes())
            self.assertTrue(all(a['definition_index'] is not None for scan in result['output']['scans'] for a in scan['assignments']))

    def test_zigzag_mapping_and_16bit_precision(self):
        stored = list(range(1,65))
        data = b'\xff\xd8'+segment(0xdb,b'\x10'+b''.join(x.to_bytes(2,'big') for x in stored))+b'\xff\xd9'
        natural = extract(data)['output']['tables'][0]
        self.assertEqual(natural['precision_bits'],16)
        self.assertEqual(natural['values'][:8],[1,2,6,7,15,16,28,29])
        self.assertEqual(natural['values'][8],3)
        self.assertEqual(extract(data,order='Stored zigzag')['output']['tables'][0]['values'],stored)
        large = extract(b'\xff\xd8'+dqt(513,1)+b'\xff\xd9')['output']['tables'][0]
        self.assertEqual(large['values'],[513]*64)

    def test_redefinition_between_scans_and_stuffed_restart_bytes(self):
        frame = segment(0xc0,b'\x08\x00\x01\x00\x01\x01\x01\x11\x00')
        scan = segment(0xda,b'\x01\x01\x00\x00\x3f\x00')
        data = b'\xff\xd8'+dqt(5)+frame+scan+b'\x11\xff\x00\xdb\xff\xd0\x22'+dqt(9)+scan+b'\x01\xff\xd9'
        full = extract(data)['output']
        self.assertEqual([t['values'][0] for t in full['tables']],[5,9])
        self.assertEqual([s['assignments'][0]['definition_index'] for s in full['scans']],[0,1])
        compact = extract(data,retain_history=False)['output']
        self.assertEqual(len(compact['tables']),1)
        self.assertEqual(compact['tables'][0]['definition_index'],1)
        self.assertEqual(compact['definition_count'],2)
        self.assertEqual(compact['scans'],full['scans'])

    def test_multiple_definitions_in_one_segment(self):
        data=b'\xff\xd8'+segment(0xdb,b'\x00'+bytes([7])*64+b'\x01'+bytes([8])*64)+b'\xff\xd9'
        self.assertEqual([t['table_id'] for t in extract(data)['output']['tables']],[0,1])

    def test_malformed_and_truncated_inputs_return_partial_evidence(self):
        cases=[b'\xff\xd8', b'\xff\xd8'+dqt(5)[:-1], b'\xff\xd8'+segment(0xdb,b'\x20'+bytes(64)),
               b'\xff\xd8'+dqt(0)+b'\xff\xd9',b'\xff\xd8'+dqt(1,table_id=4)+b'\xff\xd9',
               (FIXTURES/'truncated.jpg').read_bytes()]
        for data in cases:
            with self.subTest(data=data[:12]):
                result=extract(data)
                self.assertEqual(result['output']['extraction_status'],'partial')
                self.assertTrue(result['warnings'])
        partial=extract(b'\xff\xd8'+dqt(5)+b'\xff\xdb\x00\x43\x00')
        self.assertEqual(partial['output']['definition_count'],1)

    def test_marker_bound_and_undefined_component_reference(self):
        result=extract(b'\xff\xd8'+b'\xff\x01'*4097+b'\xff\xd9')
        self.assertTrue(any('limit' in warning for warning in result['warnings']))
        scan=segment(0xda,b'\x01\x01\x00\x00\x3f\x00')
        result=extract(b'\xff\xd8'+scan+b'\xff\xd9')
        self.assertIsNone(result['output']['scans'][0]['assignments'][0]['definition_index'])
        self.assertTrue(result['warnings'])
