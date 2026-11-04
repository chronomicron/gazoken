"""Foundation checks; synthetic adapters exercise boundaries, not forensic claims."""
from dataclasses import FrozenInstanceError, replace
from unittest import TestCase
from unittest.mock import patch

from gazoken.catalog import CATALOG
from gazoken.pipeline import run_plan, run_step
from gazoken.tools.contracts import ImageSource, PixelPackage, ToolInputs, ToolOutput
from gazoken.tools.registry import REGISTRY, Registration

DATA = b'\xff\xd8example'


def pixels(source):
    return PixelPackage(bytes([0, 128, 255, 64]), 2, 2, ('Y',), source.sha256,
                        'synthetic test provider', 'test-1', 'gray test', 'stored orientation', 'source axes')


class ToolContractTests(TestCase):
    def test_catalog_has_unique_stable_adapters_and_typed_inputs(self):
        keys = [s['tool']['key'] for s in CATALOG]
        self.assertEqual(len(set(keys)), 37)
        for s in CATALOG:
            self.assertEqual(s['tool']['module'], 'gazoken.tools.'+s['tool']['key'])
            self.assertEqual(s['tool']['contract_version'], 1)
            self.assertTrue(s['tool']['inputs'])
            self.assertEqual(s['implementation']=='ready',s['tool']['key'] in REGISTRY)
        self.assertEqual([s['id'] for s in CATALOG if s['tool']['provides']],['1.9','2.1'])

    def test_shared_input_copies_mutable_buffers_and_rejects_foreign_pixels(self):
        buffer=bytearray(DATA);source=ImageSource(buffer,'test.jpg');buffer[-1]=0
        self.assertEqual(source.data,DATA)
        with self.assertRaises(FrozenInstanceError): source.filename='changed'
        packet=pixels(source)
        with self.assertRaises(ValueError): ToolInputs(ImageSource(DATA+b'other','other.jpg'),packet)
        for kwargs in [{'width':3},{'height':True},{'decoder':''},{'channels':('Y','Y','Y')},{'source_sha256':'x'}]:
            with self.assertRaises(ValueError): replace(packet,**kwargs)
        self.assertNotEqual(packet.record()['sha256'],replace(packet,width=1,height=4).record()['sha256'])
        self.assertNotIn('data',packet.record())

    def test_registered_pixel_consumer_blocks_without_decoding_implicitly(self):
        calls=[]
        def consumer(inputs, parameters):
            calls.append(inputs);return ToolOutput({'maximum':max(inputs.pixels.data)})
        with patch.dict(REGISTRY,{'decoded.spatial_measurements':Registration(consumer,'test-1')}):
            blocked=run_step(DATA,'test.jpg','2.2')['results'][0]
            self.assertEqual(blocked['status'],'blocked');self.assertIsNone(blocked['output'])
            self.assertEqual(blocked['missing_inputs'],['pixels']);self.assertFalse(calls)
            packet=pixels(ImageSource(DATA,'test.jpg'))
            measured=run_step(DATA,'test.jpg','2.2',pixels=packet)['results'][0]
            self.assertEqual(measured['output'],{'maximum':255})
            self.assertEqual(measured['inputs']['pixels']['sha256'],packet.record()['sha256'])

    def test_explicit_provider_hands_same_pixels_to_later_tools(self):
        seen=[]
        def provider(inputs, parameters):return ToolOutput({'test_only':True},pixels=pixels(inputs.source))
        def consumer(inputs, parameters):
            seen.append(inputs.pixels);return ToolOutput({'test_only':True})
        additions={'decoded.decoded_reference':Registration(provider,'test'),
                   'decoded.spatial_measurements':Registration(consumer,'test'),
                   'history.tonal_mappings':Registration(consumer,'test')}
        with patch.dict(REGISTRY,additions):
            result=run_plan(DATA,'test.jpg',[{'id':'3.2'},{'id':'2.2'},{'id':'2.1'}])
        self.assertEqual([r['id'] for r in result['results']],['2.1','2.2','3.2'])
        self.assertTrue(all(r['status']=='completed' for r in result['results']))
        self.assertIs(seen[0],seen[1]);self.assertEqual(seen[0].source_sha256,result['source']['sha256'])
        self.assertIsNone(result['results'][0]['inputs']['pixels'])
        self.assertEqual(result['results'][0]['produced_inputs']['pixels'],seen[0].record())

    def test_failed_tool_cannot_mutate_parameters_or_poison_next_call(self):
        def mutation(inputs, parameters):parameters['note']='rewrite'
        plan=[{'id':'1.7'},{'id':'1.1','parameters':{'note':'preserved'}}]
        with patch.dict(REGISTRY,{'encoded.source_identity':Registration(mutation,'test')}):
            run=run_plan(DATA,'test.jpg',plan)
        first,second=run['results']
        self.assertEqual(first['status'],'failed');self.assertIsNone(first['output'])
        self.assertEqual(first['parameters']['note'],'preserved')
        self.assertEqual(second['status'],'completed');self.assertEqual(second['output']['count'],len(DATA))
        self.assertEqual(plan[1]['parameters']['note'],'preserved')
        self.assertEqual(first['inputs']['source_sha256'],second['inputs']['source_sha256'])

    def test_invalid_outputs_and_undeclared_providers_fail_without_artifacts(self):
        for callback in [lambda i,p:ToolOutput({'value':float('nan')}),
                         lambda i,p:{'fake':'output'},
                         lambda i,p:ToolOutput({},pixels=pixels(i.source))]:
            with patch.dict(REGISTRY,{'encoded.source_identity':Registration(callback,'test')}):
                result=run_step(DATA,'test.jpg','1.1')['results'][0]
            self.assertEqual(result['status'],'failed');self.assertIsNone(result['output'])
            self.assertEqual(result['produced_inputs'],{})

    def test_planned_adapter_has_no_version_or_output(self):
        r=run_step(DATA,'test.jpg','3.2')['results'][0]
        self.assertEqual(r['status'],'not_implemented');self.assertIsNone(r['method_version'])
        self.assertEqual(r['missing_inputs'],['pixels']);self.assertIsNone(r['output'])
