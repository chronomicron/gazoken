"""Explicit allowlist of executable adapters; never import a module from a request."""
from dataclasses import dataclass
from .contracts import ToolHandler
from .encoded import source_identity, byte_distribution, quantization_tables, file_structure, metadata_inventory, entropy_coding, embedded_images, evidence_report, stored_coefficients, coefficient_statistics


@dataclass(frozen=True)
class Registration:
    handler: ToolHandler
    version: str


REGISTRY = {
    "encoded.coefficient_statistics": Registration(coefficient_statistics.run, coefficient_statistics.VERSION),
    "encoded.stored_coefficients": Registration(stored_coefficients.run, stored_coefficients.VERSION),
    "encoded.evidence_report": Registration(evidence_report.run, evidence_report.VERSION),
    "encoded.embedded_images": Registration(embedded_images.run, embedded_images.VERSION),
    "encoded.entropy_coding": Registration(entropy_coding.run, entropy_coding.VERSION),
    "encoded.metadata_inventory": Registration(metadata_inventory.run, metadata_inventory.VERSION),
    "encoded.file_structure": Registration(file_structure.run, file_structure.VERSION),
    "encoded.quantization_tables": Registration(quantization_tables.run, quantization_tables.VERSION),
    "encoded.source_identity": Registration(source_identity.run, source_identity.VERSION),
    "encoded.byte_distribution": Registration(byte_distribution.run, byte_distribution.VERSION),
}


def lookup(key: str) -> Registration | None:
    return REGISTRY.get(key)
