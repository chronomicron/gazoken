"""Framework contracts, upload boundaries and honest placeholder behavior."""
import hashlib
import importlib.metadata
import json
from pathlib import Path
import unittest

from fastapi.testclient import TestClient
from gazoken.pipeline import byte_distribution, run_plan
from gazoken.server import app

FIXTURE = Path(__file__).parent / "fixtures/jpeg-inspector/baseline-exif.jpg"


class WorkbenchTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.data = FIXTURE.read_bytes()

    def upload(self, plan, data=None, headers=None):
        return self.client.post("/api/run", files={"image": ("source.jpg", self.data if data is None else data, "image/jpeg")},
                                data={"configuration": json.dumps(plan)}, headers=headers)

    def test_catalog_has_all_three_ordered_phases(self):
        catalog = self.client.get("/api/catalog").json()["steps"]
        self.assertEqual([s["id"] for s in catalog], [f"1.{i}" for i in range(1,13)] + [f"2.{i}" for i in range(1,12)] + [f"3.{i}" for i in range(1,15)])
        result = self.upload([{"id": s["id"]} for s in catalog])
        self.assertEqual(result.status_code, 200, result.text)
        records = result.json()["results"]
        expected = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"]
        try:
            if importlib.metadata.version('jpeglib') == '0.14.0': expected.append('1.9')
        except importlib.metadata.PackageNotFoundError:
            pass
        expected.append('1.12')
        self.assertEqual([r['id'] for r in records if r['status'] == 'completed'], expected)
        self.assertTrue(all(r["output"] is None for r in records if r["status"] == "not_implemented"))

    def test_bytes_hash_and_parameter_record(self):
        result = self.upload([{"id":"1.7"}, {"id":"1.1", "parameters":{"note":"Known fixture"}}]).json()
        self.assertEqual(result["source"]["sha256"], hashlib.sha256(self.data).hexdigest())
        self.assertEqual(result["results"][0]["parameters"]["note"], "Known fixture")
        counts = result["results"][1]["output"]["histogram"]
        self.assertEqual(sum(counts), len(self.data))
        self.assertEqual(counts[255], self.data.count(255))
        self.assertEqual(self.data, FIXTURE.read_bytes())

    def test_sample_gallery_has_distinct_known_jpegs_and_no_arbitrary_paths(self):
        entries = self.client.get('/api/samples').json()
        self.assertEqual([entry['id'] for entry in entries], ['reference', 'recompressed', 'smoothed'])
        hashes = set()
        for entry in entries:
            response = self.client.get('/api/sample', params={'id': entry['id']})
            self.assertEqual(response.status_code, 200)
            expected = Path(__file__).parent / 'fixtures/images' / entry['file']
            self.assertEqual(response.content, expected.read_bytes())
            hashes.add(hashlib.sha256(response.content).hexdigest())
        self.assertEqual(len(hashes), 3)
        self.assertEqual(self.client.get('/api/sample?id=../../README.md').status_code, 404)
        self.assertEqual(self.client.get('/api/sample').content,
                         (Path(__file__).parent / 'fixtures/images/02-reference-q90.jpg').read_bytes())

    def test_report_assembles_api_run_without_cross_request_history(self):
        run = self.upload([{'id':'1.12'}, {'id':'1.7'}, {'id':'1.1'}]).json()
        report = run['results'][-1]['output']
        self.assertEqual([r['id'] for r in report['records']], ['1.1','1.7'])
        self.assertEqual(report['source'], run['source'])
        self.assertEqual(report['evidence_provenance']['record_count'], 2)
        empty = self.upload([{'id':'1.12'}], data=self.data+b'other source').json()['results'][0]
        self.assertEqual(empty['output']['records'], [])
        self.assertNotEqual(empty['output']['source']['sha256'], report['source']['sha256'])
        self.assertTrue(empty['warnings'])

    def test_known_entropy(self):
        self.assertEqual(byte_distribution(bytes(range(256)))["entropy_bits_per_byte"], 8)
        self.assertEqual(byte_distribution(b"aaaa")["entropy_bits_per_byte"], 0)

    def test_phase_two_records_configuration_without_decoding(self):
        first = self.upload([{"id":"1.1"}]).json()
        second = self.upload([{"id":f"2.{i}"} for i in range(1,12)]).json()
        self.assertEqual(first["source"]["sha256"], second["source"]["sha256"])
        self.assertEqual(len(second["results"]), 11)
        self.assertTrue(all(r["status"] == "not_implemented" and r["output"] is None for r in second["results"]))
        self.assertEqual(self.data, FIXTURE.read_bytes())

    def test_phase_three_is_typed_configuration_only_and_source_isolated(self):
        first = self.upload([{"id":"1.1"}]).json()
        plan = [{"id":f"3.{i}"} for i in range(1,15)]
        response = self.upload(plan)
        self.assertEqual(response.status_code, 200, response.text)
        run = response.json()
        self.assertEqual(run["source"], first["source"])
        self.assertEqual(len(run["results"]),14)
        self.assertTrue(all(r["status"] == "not_implemented" and r["output"] is None for r in run["results"]))
        for value in [True, -1, 1.2, "20", float('inf')]:
            self.assertEqual(self.upload([{"id":"3.10","parameters":{"minimum_references":value}}]).status_code,400)
        for parameters in [{"include_response":"yes"},{"method":"installed detector"},{"minimum_scale":0}]:
            self.assertEqual(self.upload([{"id":"3.1","parameters":parameters}]).status_code,400)
        changed = self.upload(plan, data=self.data+b"different source").json()
        self.assertNotEqual(changed["source"]["sha256"], run["source"]["sha256"])
        self.assertEqual(self.data, FIXTURE.read_bytes())

    def test_mixed_phase_order_and_fractional_parameters(self):
        response = self.upload([{"id":"2.11"}, {"id":"1.7"}, {"id":"2.9", "parameters":{"minimum_angle":-12.5}},
                                {"id":"1.10"}, {"id":"2.2"}, {"id":"2.8", "parameters":{"period_increment":0.75}}])
        self.assertEqual(response.status_code,200,response.text)
        records=response.json()["results"]
        self.assertEqual([r["id"] for r in records],["1.7","1.10","2.2","2.8","2.9","2.11"])
        self.assertEqual(records[3]["parameters"]["period_increment"],0.75)
        for value in [True,0,"0.5",float('nan')]:
            self.assertEqual(self.upload([{"id":"2.8","parameters":{"period_increment":value}}]).status_code,400)

    def test_invalid_inputs_and_parameters(self):
        plans = [[], [{"id":"1.99"}], [{"id":"1.2","parameters":{"segment_limit":-1}}],
                 [{"id":"1.1","parameters":{"unexpected":True}}], [{"id":"1.1"},{"id":"1.1"}],
                 [{"id":"1.1","parameters":{"note":7}}], [{"id":"1.2","parameters":{"include_scan_layout":"yes"}}]]
        for plan in plans:
            with self.subTest(plan=plan):
                self.assertEqual(self.upload(plan).status_code, 400)
        self.assertEqual(self.upload([{"id":"1.1"}], data=b"not jpeg").status_code, 400)

    def test_upload_size_limit(self):
        response = self.upload([{"id":"1.1"}], data=b"\xff\xd8" + b"0" * (25*1024*1024))
        self.assertEqual(response.status_code, 413)

    def test_cross_origin_and_host_rejected(self):
        self.assertEqual(self.upload([{"id":"1.1"}], headers={"Origin":"https://unrelated.example"}).status_code, 403)
        self.assertEqual(self.client.get("/api/catalog", headers={"host":"unrelated.example"}).status_code, 400)

    def test_ui_assets_and_no_repository_exposure(self):
        self.assertEqual(self.client.get("/").status_code, 200)
        self.assertEqual(self.client.get("/ui/workbench.mjs").status_code, 200)
        self.assertEqual(self.client.get("/inspector/jpeg-worker.mjs").status_code, 200)
        self.assertEqual(self.client.get("/.git/config").status_code, 404)
        self.assertEqual(self.client.get("/api/sample").content[:2], b"\xff\xd8")


if __name__ == "__main__":
    unittest.main()
