"""Known JPEG layouts and malformed byte boundaries; no decoder dependency."""
import hashlib
import json
from pathlib import Path
from unittest import TestCase
from gazoken.pipeline import run_step

FIXTURES=Path(__file__).resolve().parents[1]/'fixtures/jpeg-inspector'


def segment(code,payload):
    return bytes([255,code])+(len(payload)+2).to_bytes(2,'big')+payload


def inspect(data,**parameters):
    result=run_step(data,'case.jpg','1.2',parameters)['results'][0]
    assert result['status']=='completed',result
    return result


class FileStructureTests(TestCase):
    def test_real_baseline_and_progressive_frames_match_independent_references(self):
        expected=json.loads((FIXTURES/'expected.json').read_text())['files']
        for filename,marker in [('baseline-exif.jpg','SOF0'),('progressive-optimized.jpg','SOF2')]:
            data=(FIXTURES/filename).read_bytes()
            result=inspect(data);o=result['output'];frame=o['frames'][0]
            self.assertEqual(o['extraction_status'],'complete');self.assertFalse(result['warnings'])
            self.assertEqual((frame['width'],frame['height']),(expected[filename]['width'],expected[filename]['height']))
            self.assertEqual(frame['marker'],marker)
            self.assertEqual(o['segments'][0]['marker'],'SOI');self.assertEqual(o['segments'][-1]['marker'],'EOI')
            self.assertEqual(o['trailing_bytes'],0)
            self.assertEqual(sum(s['byte_length'] for s in o['segments'])+sum(s['encoded_data_bytes'] for s in o['scans']),len(data))
            for s in o['segments']:
                self.assertEqual(data[s['offset']],255)
                self.assertLessEqual(s['offset']+s['byte_length'],len(data))
            self.assertEqual(result['inputs']['source_sha256'],hashlib.sha256(data).hexdigest())
            self.assertEqual(data,(FIXTURES/filename).read_bytes())
        self.assertGreater(inspect((FIXTURES/'progressive-optimized.jpg').read_bytes())['output']['scan_count'],1)

    def test_analytic_scan_fields_sampling_restart_stuffing_and_trailing_bytes(self):
        frame=segment(0xc2,b'\x08\x00\x18\x00\x20\x01\x05\x21\x02')
        dri=segment(0xdd,b'\x00\x07')
        sos=segment(0xda,b'\x01\x05\x12\x01\x3f\x21')
        entropy=b'\x01\xff\x00\x02\xff\xd0\x03\xff\xd1'
        data=b'\xff\xd8'+frame+dri+sos+entropy+b'\xff\xd9TRAIL'
        o=inspect(data)['output'];scan=o['scans'][0]
        self.assertEqual(o['frames'][0]['components'],[{'component_id':5,'horizontal_sampling':2,'vertical_sampling':1,'quantization_table_id':2}])
        self.assertEqual(scan['components'],[{'component_id':5,'dc_table_id':1,'ac_table_id':2}])
        self.assertEqual([scan[k] for k in ['spectral_start','spectral_end','approximation_high','approximation_low']],[1,63,2,1])
        self.assertEqual(scan['restart_interval_mcus'],7)
        self.assertEqual(scan['restart_marker_count'],2)
        self.assertEqual(scan['stuffed_byte_count'],1)
        self.assertEqual(data[scan['data_start']:scan['data_end']],entropy)
        self.assertEqual(o['trailing_bytes'],5)
        self.assertEqual(o['segment_count'],5)

    def test_scan_layout_can_be_hidden_without_changing_scan_count(self):
        data=(FIXTURES/'progressive-optimized.jpg').read_bytes()
        full=inspect(data)['output'];hidden=inspect(data,include_scan_layout=False)['output']
        self.assertFalse(hidden['scan_layout_included']);self.assertEqual(hidden['scans'],[])
        for key in ['scan_count','segments','frames','trailing_bytes']:
            self.assertEqual(hidden[key],full[key])

    def test_marker_fill_and_segment_limit(self):
        o=inspect(b'\xff\xd8'+segment(0xfe,b'\xff\xd9')+b'\xff\xff\xd9')['output']
        self.assertEqual(o['segments'][-1]['byte_length'],3)
        self.assertEqual(o['segments'][1]['payload_length'],2)
        result=inspect(b'\xff\xd8'+b'\xff\x01'*40+b'\xff\xd9',segment_limit=32)
        self.assertEqual(result['output']['segment_count'],32)
        self.assertEqual(result['output']['extraction_status'],'partial')
        self.assertTrue(any('limit' in w for w in result['warnings']))

    def test_partial_data_and_invalid_headers_never_invent_missing_fields(self):
        for data in [b'\xff\xd8',b'\xff\xd8\xff',b'\xff\xd8\xff\xfe\x00',
                     b'\xff\xd8\xff\xfe\x00\x01',b'\xff\xd8\x00',
                     b'\xff\xd8'+segment(0xda,b'\x00'),
                     b'\xff\xd8'+segment(0xc0,b'\x08'*6),
                     b'\xff\xd8'+segment(0xdd,b'\x00')]:
            with self.subTest(data=data):
                result=inspect(data)
                self.assertEqual(result['output']['extraction_status'],'partial')
                self.assertIsNone(result['output']['trailing_bytes']);self.assertTrue(result['warnings'])
        result=inspect((FIXTURES/'truncated.jpg').read_bytes())
        self.assertFalse(result['output']['eoi_reached'])

    def test_entropy_without_terminating_marker_is_partial_and_bounded(self):
        sos=segment(0xda,b'\x01\x01\x00\x00\x3f\x00')
        for entropy in [b'abc',b'abc\xff']:
            o=inspect(b'\xff\xd8'+sos+entropy)['output']
            self.assertEqual(o['scans'][0]['encoded_data_bytes'],len(entropy))
            self.assertEqual(o['extraction_status'],'partial')

    def test_real_trailer_matches_known_fixture_length(self):
        base=(FIXTURES/'baseline-exif.jpg').read_bytes()
        data=(FIXTURES/'trailing-data.jpg').read_bytes()
        o=inspect(data)['output']
        self.assertEqual(o['trailing_bytes'],len(data)-len(base))
        self.assertEqual(o['extraction_status'],'complete')
