import json
from dataclasses import FrozenInstanceError
from unittest import TestCase
from unittest.mock import patch
from gazoken.pipeline import run_plan, run_step
from gazoken.tools.contracts import ImageSource, RunEvidence, ToolInputs
from gazoken.tools.registry import REGISTRY, Registration

DATA=b'\xff\xd8example'


class EvidenceReportTests(TestCase):
    def test_assembles_same_run_in_numeric_order_and_preserves_original_records(self):
        run=run_plan(DATA,'case.jpg',[{'id':'1.12'},{'id':'1.7'},{'id':'1.1','parameters':{'note':'Known'}}])
        report=run['results'][-1]
        self.assertEqual(report['status'],'completed')
        o=report['output']
        self.assertEqual([r['id'] for r in o['records']],['1.1','1.7'])
        self.assertEqual(o['records'],run['results'][:-1])
        self.assertEqual(o['source'],run['source'])
        self.assertEqual(o['completed_count'],2)
        self.assertEqual(o['evidence_provenance']['record_count'],2)
        self.assertEqual(report['inputs']['evidence'],o['evidence_provenance'])
        self.assertTrue(all(row['status']=='not_run' for row in o['coverage'] if row['id'] not in ('1.1','1.7')))

    def test_standalone_report_does_not_inherit_other_runs(self):
        run_step(DATA,'case.jpg','1.7')
        r=run_step(DATA,'case.jpg','1.12')['results'][0]
        self.assertEqual(r['status'],'completed');self.assertEqual(r['output']['records'],[])
        self.assertEqual(r['output']['completed_count'],0);self.assertTrue(r['warnings'])

    def test_flags_omit_details_but_preserve_statuses_and_warning_counts(self):
        run=run_plan(DATA,'case.jpg',[{'id':'1.2'},{'id':'1.12','parameters':{'include_measurements':False,'include_warnings':False}}])
        original,report=run['results'];o=report['output']
        self.assertIn('output',original);self.assertTrue(original['warnings'])
        self.assertNotIn('output',o['records'][0]);self.assertNotIn('warnings',o['records'][0])
        self.assertGreater(o['warning_count'],0);self.assertTrue(o['coverage'][1]['partial_extraction'])
        self.assertTrue(o['coverage'][1]['has_warnings']);self.assertEqual(o['limitations'],[])
        self.assertIn('no authenticity verdict',o['interpretation'])

    def test_planned_and_failed_steps_remain_distinct(self):
        def fail(i,p):raise ValueError('Synthetic failure')
        with patch.dict(REGISTRY,{'encoded.source_identity':Registration(fail,'test')}):
            run=run_plan(DATA,'case.jpg',[{'id':'1.1'},{'id':'1.8'},{'id':'1.12'}])
        coverage={r['id']:r for r in run['results'][-1]['output']['coverage']}
        self.assertEqual(coverage['1.1']['status'],'failed')
        self.assertEqual(coverage['1.8']['status'],'not_implemented')
        self.assertEqual(coverage['1.9']['status'],'not_run')
        self.assertEqual(run['results'][-1]['output']['completed_count'],0)

    def test_evidence_is_immutable_source_bound_and_returns_detached_records(self):
        source=ImageSource(DATA,'case.jpg')
        record=run_step(DATA,'case.jpg','1.1')['results'][0]
        snapshot=RunEvidence(source.sha256,json.dumps([record]))
        with self.assertRaises(FrozenInstanceError):snapshot.records_json='[]'
        snapshot.records()[0]['parameters']['note']='changed'
        self.assertNotEqual(snapshot.records()[0]['parameters']['note'],'changed')
        with self.assertRaises(ValueError):ToolInputs(ImageSource(DATA+b'other','other.jpg'),evidence=snapshot)
        with self.assertRaises(ValueError):RunEvidence('0'*64,json.dumps([record]))
        self.assertNotIn('records_json',snapshot.record())

    def test_report_does_not_claim_later_phases_were_run(self):
        run=run_plan(DATA,'case.jpg',[{'id':'1.1'},{'id':'1.12'},{'id':'2.2'}])
        report=run['results'][1]['output']
        self.assertEqual([r['id'] for r in report['records']],['1.1'])
        self.assertTrue(all(r['id'].startswith('1.') for r in report['coverage']))
