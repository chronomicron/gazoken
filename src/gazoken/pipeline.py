"""Small real handlers and an explicit contract for unimplemented specialists.

No pixel reconstruction is performed here. This module does not depend on the UI.
"""
from copy import deepcopy
from datetime import datetime, timezone
import json
import math
import platform
import time
from types import MappingProxyType

from . import __version__
from .catalog import CATALOG, BY_ID
from .tools.contracts import MAX_BYTES, ImageSource, PixelPackage, ToolInputs, ToolOutput
from .tools.registry import lookup
from .tools.encoded.byte_distribution import measure as byte_distribution


def source_identity(data: bytes, filename: str) -> dict:
    """Compatibility helper; tool execution uses the same immutable source class."""
    return ImageSource(data, filename).record()


def validate_plan(plan: list) -> list:
    if not isinstance(plan, list) or not 1 <= len(plan) <= len(CATALOG):
        raise ValueError(f"Choose between one and {len(CATALOG)} steps.")
    normalized, seen = [], set()
    for item in plan:
        if not isinstance(item, dict) or set(item) - {"id", "parameters"}:
            raise ValueError("Invalid step configuration.")
        step_id = item.get("id")
        if not isinstance(step_id, str) or step_id not in BY_ID or step_id in seen:
            raise ValueError("Unknown or duplicate step ID.")
        seen.add(step_id)
        supplied = item.get("parameters", {})
        spec = BY_ID[step_id]
        if not isinstance(supplied, dict) or set(supplied) - {p["key"] for p in spec["parameters"]}:
            raise ValueError(f"Unknown parameters for step {step_id}.")
        values = {}
        for p in spec["parameters"]:
            value = supplied.get(p["key"], p["default"])
            valid = False
            if p["type"] == "checkbox":
                valid = isinstance(value, bool)
            elif p["type"] == "number":
                valid = (type(value) in (int, float) and math.isfinite(value)
                         and p["min"] <= value <= p["max"]
                         and (p.get("step", 1) < 1 or int(value) == value))
            elif p["type"] == "select":
                valid = value in p["options"]
            elif p["type"] == "text":
                valid = isinstance(value, str) and len(value) <= 2000
            if not valid:
                raise ValueError(f"Invalid value for {step_id}/{p['key']}.")
            values[p["key"]] = value
        normalized.append({"id": step_id, "parameters": values})
    return sorted(normalized, key=lambda x: tuple(map(int, x["id"].split("."))))


def run_plan(data: bytes, filename: str, plan: list, *, pixels: PixelPackage | None = None) -> dict:
    """Run selected adapters in stable phase/step order on the same input packet.

    Dependencies are not run implicitly. The API supplies bytes only; future Python
    callers may supply a provenance-linked pixel package. Tools receive read-only
    parameters and return JSON measurements; a failure does not poison later tools.
    """
    plan = validate_plan(plan)
    inputs = ToolInputs(ImageSource(data, filename), pixels)
    source = inputs.source.record()
    results = []
    for item in plan:
        started = time.perf_counter()
        input_record = inputs.record()
        produced_inputs = {}
        spec = BY_ID[item['id']]
        registration = lookup(spec['tool']['key'])
        available = {'jpeg_bytes'} | ({'pixels'} if inputs.pixels else set())
        missing = [kind for kind in spec['tool']['inputs'] if kind not in available]
        status, output, warnings, error_type = 'not_implemented', None, [], None
        message = 'Configuration recorded; Python method not connected. No analysis result produced.'
        if registration:
            if missing:
                status = 'blocked'
                message = 'Required inputs unavailable: '+', '.join(missing)+'. No prerequisites were executed.'
            else:
                try:
                    result = registration.handler(inputs, MappingProxyType(deepcopy(item['parameters'])))
                    if not isinstance(result, ToolOutput) or not isinstance(result.measurements, dict):
                        raise TypeError('Tool must return ToolOutput with dictionary measurements.')
                    if not isinstance(result.warnings, tuple) or any(not isinstance(w, str) for w in result.warnings):
                        raise TypeError('Tool warnings must be a tuple of strings.')
                    # Detach results immediately and reject nonfinite / non-JSON values.
                    payload = json.loads(json.dumps({'measurements': result.measurements, 'warnings':result.warnings}, allow_nan=False))
                    if result.pixels is not None:
                        if 'pixels' not in spec['tool']['provides']:
                            raise ValueError('This tool is not a declared pixel provider.')
                        next_inputs = ToolInputs(inputs.source, result.pixels)
                        if inputs.pixels is not None and inputs.pixels.record() != result.pixels.record():
                            raise ValueError('A fixed decoded reference cannot be replaced during a plan.')
                        produced_inputs = {'pixels': result.pixels.record()}
                        inputs = next_inputs
                    output, warnings, status = payload['measurements'], payload['warnings'], 'completed'
                    message = 'Tool completed on declared inputs. Source preserved.'
                except Exception as exc:
                    status, error_type = 'failed', type(exc).__name__
                    message = f'Tool failed ({error_type}); no output committed. Later selected tools may continue.'
        results.append({**deepcopy(item), 'tool_key': spec['tool']['key'],
                        'input_contract_version': 1, 'inputs': deepcopy(input_record),
                        'required_inputs': list(spec['tool']['inputs']), 'missing_inputs': missing,
                        'produced_inputs': produced_inputs,
                        'method_version': registration.version if registration else None,
                        'status': status, 'output': output, 'warnings': warnings,
                        'error_type': error_type,
                        'elapsed_ms': round((time.perf_counter()-started)*1000, 3), 'message': message})
    return {'schema_version': 2, 'framework_version': __version__,
            'environment': {'python': platform.python_version(), 'implementation': platform.python_implementation()},
            'created_at': datetime.now(timezone.utc).isoformat(),
            'source': source, 'results': results}


def run_step(data: bytes, filename: str, step_id: str, parameters: dict | None = None, *, pixels: PixelPackage | None = None) -> dict:
    """Same entry point for one tool, notebooks and future batch callers."""
    return run_plan(data, filename, [{'id':step_id, 'parameters':parameters or {}}], pixels=pixels)
