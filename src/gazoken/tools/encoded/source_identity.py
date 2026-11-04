"""1.1: descriptive source identity; no full JPEG conformance claim."""
from ..contracts import ToolInputs, ToolOutput

VERSION = "1.0.0"


def run(inputs: ToolInputs, parameters) -> ToolOutput:
    return ToolOutput({**inputs.source.record(), "note": parameters["note"]})
