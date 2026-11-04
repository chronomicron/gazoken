# Tool tests

`test_contracts.py` checks source/pixel immutability, provenance, sequential
provider handoff, missing-input gating, isolated failures and JSON output contracts.
Its temporary adapters are synthetic test doubles, not available forensic methods.

Add `test_<tool>.py` per small tool, or a subpackage for a larger method. Keep
synthetic software fixtures in this checkout with provenance and expected values.
Keep research data/manifests, experimental protocols, results and paper material
in the private sibling research checkout.

Run with `.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v`.
