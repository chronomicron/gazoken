import json
import struct
from unittest import TestCase,skipUnless
from unittest.mock import patch
from gazoken.pipeline import run_plan,run_step
from gazoken.tools.coefficients import CoefficientComponent,CoefficientPackage
from gazoken.tools.contracts import ImageSource
from tests.tools.test_stored_coefficients import HAS_READER,analytic

DATA=b'\xff\xd8known'
SOURCE=ImageSource(DATA,'known.jpg')


def component(blocks,index=0,component_id=1):
    raw=b''.join(struct.pack('<64h',*block) for block in blocks)
    return CoefficientComponent(index,component_id,1,len(blocks),1,1,0,tuple(range(1,65)),raw)


def package(*components):return CoefficientPackage(SOURCE.sha256,8*components[0].block_columns,8,'test','test',components)

def inspect(p,**parameters):
    r=run_step(DATA,'known.jpg','1.10',parameters,coefficients=p)['results'][0]
    assert r['status']=='completed',r
    return r['output']


class CoefficientStatisticsTests(TestCase):
    def test_analytic_histograms_population_moments_and_frequency_mapping(self):
        blocks=[]
        for dc,ac1,ac2 in [(-2,0,5),(0,2,5),(0,2,5),(2,-2,5)]:
            block=[0]*64;block[0]=dc;block[1]=ac1;block[8]=ac2;blocks.append(block)
        p=package(component(blocks));before=p.record()
        o=inspect(p,frequency_count=2);dc,ac1,ac2=o['components'][0]['frequencies']
        self.assertEqual(dc['histogram'],[[-2,1],[0,2],[2,1]])
        self.assertEqual(dc['mean'],0);self.assertEqual(dc['population_variance'],2)
        self.assertEqual(dc['zero_count'],2);self.assertEqual(dc['zero_fraction'],0.5)
        self.assertEqual(ac1['mean'],0.5);self.assertEqual(ac1['population_variance'],2.75)
        self.assertEqual((ac2['u'],ac2['v'],ac2['quantization_step']),(0,1,9))
        self.assertEqual(ac2['histogram'],[[5,4]]);self.assertEqual(ac2['population_variance'],0)
        self.assertEqual(o['coefficient_provenance'],before);self.assertEqual(p.record(),before)
        for frequency in (dc,ac1,ac2):self.assertEqual(sum(n for _,n in frequency['histogram']),4)

    def test_zero_flag_and_full_zigzag_range(self):
        p=package(component([[0]*64]))
        o=inspect(p,frequency_count=63,zero_fractions=False)
        frequencies=o['components'][0]['frequencies']
        self.assertEqual(len(frequencies),64)
        self.assertEqual((frequencies[-1]['u'],frequencies[-1]['v']),(7,7))
        self.assertTrue(all('zero_fraction' not in f and 'zero_count' not in f for f in frequencies))
        self.assertTrue(all(f['population_variance']==0 for f in frequencies))

    def test_components_keep_separate_populations_and_extreme_int16_values(self):
        first=[0]*64;second=[0]*64;first[0]=-32768;second[0]=32767
        p=package(component([first,second]),component([[0]*64],index=1,component_id=7))
        o=inspect(p,frequency_count=1)
        a,b=o['components']
        self.assertEqual(a['frequencies'][0]['mean'],-0.5)
        self.assertEqual(a['frequencies'][0]['population_variance'],1073709056.25)
        self.assertEqual(a['frequencies'][0]['sample_count'],2)
        self.assertEqual(b['component_id'],7);self.assertEqual(b['frequencies'][0]['sample_count'],1)
        json.dumps(o,allow_nan=False)

    def test_standalone_blocked_no_implicit_decoder_and_parameter_validation(self):
        r=run_step(DATA,'known.jpg','1.10')['results'][0]
        self.assertEqual(r['status'],'blocked');self.assertEqual(r['missing_inputs'],['coefficients'])
        self.assertIsNone(r['output'])
        for value in (0,64,1.5,True):
            with self.assertRaises(ValueError):run_step(DATA,'known.jpg','1.10',{'frequency_count':value})

    def test_histogram_bound_fails_without_output(self):
        p=package(component([[0]*64]))
        with patch('gazoken.tools.encoded.coefficient_statistics.MAX_HISTOGRAM_BINS',1):
            r=run_step(DATA,'known.jpg','1.10',coefficients=p)['results'][0]
        self.assertEqual(r['status'],'failed');self.assertIsNone(r['output'])
        self.assertIn('histogram output',r['message']);self.assertEqual(r['produced_inputs'],{})

    @skipUnless(HAS_READER,'Install .[coefficients] for native pipeline test')
    def test_native_known_coefficients_flow_to_statistics_and_report(self):
        r=run_plan(analytic(width=16),'known.jpg',[{'id':'1.12'},{'id':'1.10','parameters':{'frequency_count':1}},{'id':'1.9'}])
        self.assertTrue(all(row['status']=='completed' for row in r['results']))
        stats=r['results'][1]['output']['components'][0]['frequencies']
        self.assertEqual(stats[0]['histogram'],[[5,1],[10,1]])
        self.assertEqual(stats[0]['mean'],7.5);self.assertEqual(stats[0]['population_variance'],6.25)
        self.assertEqual(stats[1]['histogram'],[[0,2]])
        self.assertEqual(r['results'][2]['output']['records'][1]['output'],r['results'][1]['output'])
