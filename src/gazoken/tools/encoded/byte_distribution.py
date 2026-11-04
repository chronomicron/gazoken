"""1.7: exact whole-file histogram and descriptive Shannon entropy."""
from collections import Counter
import math

from ..contracts import ToolInputs, ToolOutput

VERSION = "1.0.0"


def measure(data: bytes) -> dict:
    if not data:
        raise ValueError("Byte distribution requires a non-empty buffer.")
    counts = Counter(data)
    histogram = [counts[i] for i in range(256)]
    entropy = -sum((n/len(data))*math.log2(n/len(data)) for n in counts.values())
    return {"scope": "whole_file", "count": len(data), "histogram": histogram,
            "entropy_bits_per_byte": entropy,
            "limitation": "Descriptive encoded-byte entropy; not a forensic probability."}


def run(inputs: ToolInputs, parameters) -> ToolOutput:
    return ToolOutput(measure(inputs.source.data))
