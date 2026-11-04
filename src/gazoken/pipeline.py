"""Small real handlers and an explicit contract for unimplemented specialists.

No pixel reconstruction is performed here. This module does not depend on the UI.
"""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import platform
import time

from . import __version__

MAX_BYTES = 25 * 1024 * 1024
CATALOG = json.loads((Path(__file__).parent / "web/steps.json").read_text())
BY_ID = {step["id"]: step for step in CATALOG}


def source_identity(data: bytes, filename: str) -> dict:
    if not data or len(data) > MAX_BYTES:
        raise ValueError("Choose a non-empty JPEG no larger than 25 MiB.")
    if not data.startswith(b"\xff\xd8"):
        raise ValueError("JPEG SOI signature FF D8 is missing.")
    return {"filename": filename[:255], "size": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "signature": "FF D8", "validation": "Signature only; not a conformance check"}


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


def byte_distribution(data: bytes) -> dict:
    counts = Counter(data)
    histogram = [counts[i] for i in range(256)]
    entropy = -sum((n / len(data)) * math.log2(n / len(data)) for n in counts.values())
    return {"scope": "whole_file", "count": len(data), "histogram": histogram,
            "entropy_bits_per_byte": entropy,
            "limitation": "Descriptive encoded-byte entropy; not a forensic probability."}


def run_plan(data: bytes, filename: str, plan: list) -> dict:
    """Execute declared real handlers; return explicit not_implemented elsewhere."""
    plan = validate_plan(plan)
    source = source_identity(data, filename)
    results = []
    for item in plan:
        started = time.perf_counter()
        step_id = item["id"]
        if step_id == "1.1":
            status, output = "completed", {**source, "note": item["parameters"]["note"]}
        elif step_id == "1.7":
            status, output = "completed", byte_distribution(data)
        else:
            status, output = "not_implemented", None
        results.append({**item, "method_version": __version__, "status": status,
                        "output": output, "elapsed_ms": round((time.perf_counter()-started)*1000, 3),
                        "message": "Measured original bytes." if output is not None else
                        "Configuration recorded; Python method not connected. No analysis result produced."})
    return {"schema_version": 1, "framework_version": __version__,
            "environment": {"python": platform.python_version(), "implementation": platform.python_implementation()},
            "created_at": datetime.now(timezone.utc).isoformat(),
            "source": source, "results": results}
