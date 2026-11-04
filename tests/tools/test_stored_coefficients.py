"""Analytic entropy streams, real baseline/progressive fixtures and handoff guards."""
from dataclasses import replace
import hashlib
import importlib.metadata
import json
from pathlib import Path
import subprocess
from unittest import TestCase, skipUnless
from unittest.mock import patch
from gazoken.pipeline import run_plan, run_step
from gazoken.tools.coefficients import CoefficientComponent, CoefficientPackage
from gazoken.tools.contracts import ImageSource, ToolInputs, ToolOutput
from gazoken.tools.registry import REGISTRY, Registration

ROOT=Path(__file__).resolve().parents[1]/'fixtures/jpeg-inspector'
try:HAS_READER=importlib.metadata.version('jpeglib')=='0.14.0'
except importlib.metadata.PackageNotFoundError:HAS_READER=False


def segment(code,payload):return bytes([255,code])+(len(payload)+2).to_bytes(2,'big')+payload


def analytic(amplitude='101',ac=False,width=8):
    # One grayscale block: DC category 3 uses code 0; magnitude bits encode +/-5.
    # Optional AC(0,1) uses 00 then amplitude 1; EOB uses 01. Otherwise EOB=0.
    frame=segment(0xc0,b'\x08\x00\x08'+width.to_bytes(2,'big')+b'\x01\x01\x11\x00')
    dc=segment(0xc4,b'\x00\x01'+bytes(15)+b'\x03')
    ac_table=segment(0xc4,b'\x10'+(b'\x00\x02'+bytes(14)+b'\x01\x00' if ac else b'\x01'+bytes(15)+b'\x00'))
    bits=('0'+amplitude+('00101' if ac else '0'))*((width+7)//8)
    bits+='1'*((-len(bits))%8)
    encoded=bytes(int(bits[i:i+8],2) for i in range(0,len(bits),8)).replace(b'\xff',b'\xff\x00')
    return b'\xff\xd8'+segment(0xdb,b'\x00'+bytes([1])*64)+frame+dc+ac_table+segment(0xda,b'\x01\x01\x00\x00\x3f\x00')+encoded+b'\xff\xd9'


def packet():
    source=ImageSource(analytic(),'test.jpg')
    c=CoefficientComponent(0,1,1,1,1,1,0,(1,)*64,bytes(128))
    return source,CoefficientPackage(source.sha256,8,8,'test','test',(c,))


class CoefficientContractTests(TestCase):
    def test_component_layout_source_linkage_and_immutable_copies(self):
        source,p=packet();c=p.components[0]
        self.assertEqual(c.block(0,0),(0,)*64)
        for changes in [{'data':b''},{'block_rows':0},{'quantization':(0,)*64}]:
            with self.assertRaises(ValueError):replace(c,**changes)
        buffer=bytearray(128);copy=replace(c,data=buffer);buffer[0]=4
        self.assertEqual(copy.data,bytes(128))
        with self.assertRaises(ValueError):ToolInputs(ImageSource(source.data+b'x','other.jpg'),coefficients=p)
        self.assertNotIn('data',p.record()['components'][0])

    def test_provider_handoff_and_blocking_without_implicit_read(self):
        source,p=packet();seen=[]
        def consumer(i,params):seen.append(i.coefficients);return ToolOutput({'count':len(i.coefficients.components)})
        def provider(i,params):return ToolOutput({},coefficients=p)
        with patch.dict(REGISTRY,{'encoded.stored_coefficients':Registration(provider,'test'),
                                  'encoded.coefficient_statistics':Registration(consumer,'test')}):
            blocked=run_step(source.data,'case.jpg','1.10')['results'][0]
            self.assertEqual(blocked['status'],'blocked')
            r=run_plan(source.data,'case.jpg',[{'id':'1.10'},{'id':'1.9'}])
            self.assertTrue(all(row['status']=='completed' for row in r['results']))
            self.assertIs(seen[0],p)
            self.assertEqual(r['results'][1]['inputs']['coefficients'],p.record())

    def test_undeclared_or_foreign_package_does_not_poison_later_tools(self):
        source,p=packet()
        for key in ['encoded.source_identity','encoded.stored_coefficients']:
            bad=p if key.endswith('source_identity') else replace(p,source_sha256='0'*64)
            with patch.dict(REGISTRY,{key:Registration(lambda i,params:ToolOutput({},coefficients=bad),'test')}):
                r=run_plan(source.data,'case.jpg',[{'id':'1.1' if key.endswith('source_identity') else '1.9'},{'id':'1.12'}])
                self.assertEqual(r['results'][0]['status'],'failed')
                self.assertEqual(r['results'][0]['produced_inputs'],{})
                self.assertIsNone(r['results'][1]['inputs']['coefficients'])

    def test_missing_dependency_produces_actionable_failure(self):
        with patch('gazoken.tools.encoded.stored_coefficients.importlib.metadata.version',side_effect=importlib.metadata.PackageNotFoundError):
            r=run_step(analytic(),'case.jpg','1.9')['results'][0]
        self.assertEqual(r['status'],'failed');self.assertIn('coefficients extra',r['message'])


@skipUnless(HAS_READER,'Install .[coefficients] for native reader integration checks')
class StoredCoefficientTests(TestCase):
    def extract(self,data,**params):
        r=run_step(data,'case.jpg','1.9',params)['results'][0]
        self.assertEqual(r['status'],'completed',r['message']);return r

    def test_hand_encoded_positive_negative_dc_and_nonzero_ac(self):
        for amplitude,dc in [('101',5),('010',-5)]:
            r=self.extract(analytic(amplitude))
            self.assertEqual(r['output']['components'][0]['first_block'],[dc]+[0]*63)
        r=self.extract(analytic(ac=True))
        self.assertEqual(r['output']['components'][0]['first_block'],[5,1]+[0]*62)
        r=self.extract(analytic(width=16))
        self.assertEqual(r['output']['package']['components'][0]['shape'],[1,2,8,8])

    def test_baseline_progressive_quantization_and_no_pixel_package(self):
        packages=[]
        expected=json.loads((ROOT/'expected.json').read_text())['files']
        for filename in ['baseline-exif.jpg','progressive-optimized.jpg']:
            data=(ROOT/filename).read_bytes();r=self.extract(data);p=r['output']['package'];packages.append(p)
            self.assertEqual([c['shape'] for c in p['components']],[[3,4,8,8],[2,2,8,8],[2,2,8,8]])
            for c in p['components']:self.assertEqual(c['quantization'],expected[filename]['quantization'][str(c['table_id'])])
            self.assertEqual(p['source_sha256'],hashlib.sha256(data).hexdigest())
            self.assertIsNone(r['inputs']['pixels']);self.assertNotIn('pixels',r['produced_inputs'])
            self.assertEqual(data,(ROOT/filename).read_bytes())
        self.assertEqual([c['sha256'] for c in packages[0]['components']],[c['sha256'] for c in packages[1]['components']])

    def test_dc_prediction_and_odd_width_handoff(self):
        seen=[]
        def consumer(i,p):
            seen.append(i.coefficients)
            return ToolOutput({'dc':i.coefficients.components[0].block(0,1)[0]})
        with patch.dict(REGISTRY,{'encoded.coefficient_statistics':Registration(consumer,'test')}):
            r=run_plan(analytic(width=9),'odd.jpg',[{'id':'1.9'},{'id':'1.10'}])
        self.assertEqual(r['results'][1]['output']['dc'],10)
        self.assertEqual(seen[0].components[0].record()['shape'],[1,2,8,8])

    def test_native_warning_and_large_header_fail_without_artifacts(self):
        def warn(command,**kwargs):
            kwargs['stderr'].write(b'Corrupt JPEG data')
            return subprocess.CompletedProcess(command,0)
        with patch('gazoken.tools.encoded.stored_coefficients.subprocess.run',side_effect=warn):
            r=run_step(analytic(),'case.jpg','1.9')['results'][0]
        self.assertEqual(r['status'],'failed');self.assertIn('warnings',r['message'])
        data=analytic()
        offset=data.index(b'\xff\xc0')
        data=data[:offset+5]+b'\xff\xff\xff\xff'+data[offset+9:]
        r=run_step(data,'large.jpg','1.9')['results'][0]
        self.assertEqual(r['status'],'failed');self.assertIn('geometry',r['message'])
        self.assertEqual(r['produced_inputs'],{})

    def test_first_component_and_reader_choices(self):
        data=(ROOT/'baseline-exif.jpg').read_bytes()
        r=self.extract(data,components='First stored component',reader='jpeglib candidate')
        self.assertEqual(len(r['output']['package']['components']),1)
        unselected=run_step(data,'case.jpg','1.9',{'reader':'Not selected'})['results'][0]
        self.assertEqual(unselected['status'],'failed');self.assertIn('Select',unselected['message'])
        r=run_step(data,'case.jpg','1.9',{'reader':'jpegio candidate'})['results'][0]
        self.assertEqual(r['status'],'failed');self.assertIn('not integrated',r['message'])

    def test_malformed_geometry_truncation_and_native_timeout(self):
        for data in [(ROOT/'truncated.jpg').read_bytes(),analytic()[:-2]]:
            r=run_step(data,'case.jpg','1.9')['results'][0]
            self.assertEqual(r['status'],'failed');self.assertEqual(r['produced_inputs'],{})
        with patch('gazoken.tools.encoded.stored_coefficients.subprocess.run',side_effect=subprocess.TimeoutExpired('reader',30)):
            r=run_step(analytic(),'case.jpg','1.9')['results'][0]
        self.assertIn('timed out',r['message'])
        with patch('gazoken.tools.encoded.stored_coefficients.subprocess.run',return_value=subprocess.CompletedProcess([],1,stderr=b'bad')):
            r=run_step(analytic(),'case.jpg','1.9')['results'][0]
        self.assertEqual(r['status'],'failed');self.assertEqual(r['produced_inputs'],{})
