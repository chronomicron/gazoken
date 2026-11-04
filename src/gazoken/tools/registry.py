"""Explicit allowlist of executable adapters; never import a module from a request."""
from dataclasses import dataclass
from .contracts import ToolHandler
from .encoded import source_identity, byte_distribution, quantization_tables, file_structure


@dataclass(frozen=True)
class Registration:
    handler: ToolHandler
    version: str


REGISTRY = {
    "encoded.file_structure": Registration(file_structure.run, file_structure.VERSION),
    "encoded.quantization_tables": Registration(quantization_tables.run, quantization_tables.VERSION),
    "encoded.source_identity": Registration(source_identity.run, source_identity.VERSION),
    "encoded.byte_distribution": Registration(byte_distribution.run, byte_distribution.VERSION),
}


def lookup(key: str) -> Registration | None:
    return REGISTRY.get(key)
