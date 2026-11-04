"""Shared versioned UI/tool manifest. Registration determines executable coverage."""
import json
from pathlib import Path
from .tools.registry import lookup

CATALOG = json.loads((Path(__file__).parent / "web/steps.json").read_text())
BY_ID = {step['id']: step for step in CATALOG}
if len(BY_ID) != len(CATALOG):
    raise ValueError("Duplicate tool step ID.")
for step in CATALOG:
    step['implementation'] = 'ready' if lookup(step['tool']['key']) else 'planned'
