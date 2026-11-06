# Phase 1 tool adapters

Original bytes and compressed-domain data; later coefficient tools require a separately implemented reader.

This table lists the Python adapters registered in the local workbench. The
static browser has separate JavaScript modules for steps 1.1–1.3; see the
[browser tool guide](../../../../docs/browser-tools.md).

Use the common [tool contract](../../../../docs/tool-development.md). Each module
exports `VERSION` and `run(inputs, parameters)`. Only registered adapters execute.
Planned paths below are reserved names, not generated stubs or implemented methods.

| Step | Module / future package | Current status | Required input packages |
| --- | --- | --- | --- |
| 1.1 Source identity | `source_identity.py` | Registered | jpeg_bytes |
| 1.2 File structure | `file_structure.py` | Registered | jpeg_bytes |
| 1.3 Metadata inventory | `metadata_inventory.py` | Registered | jpeg_bytes |
| 1.4 Quantization atlas | `quantization_tables.py` | Registered | jpeg_bytes |
| 1.5 Entropy coding | `entropy_coding.py` | Registered | jpeg_bytes |
| 1.6 Embedded images | `embedded_images.py` | Registered | jpeg_bytes |
| 1.7 Byte distribution | `byte_distribution.py` | Registered | jpeg_bytes |
| 1.8 Encoder profiles | `encoder_profiles.py` | Planned | jpeg_bytes |
| 1.9 Stored DCT arrays | `stored_coefficients.py` | Registered (optional coefficients extra) | jpeg_bytes |
| 1.10 Coefficient statistics | `coefficient_statistics.py` | Registered | jpeg_bytes, coefficients |
| 1.11 Compression history | `compression_history.py` | Planned | jpeg_bytes, coefficients |
| 1.12 Evidence report | `evidence_report.py` | Registered | jpeg_bytes, run_evidence |

The GUI places a readiness dot below each step number, visible when collapsed:
green = selected/ready, amber = selected/needs attention, gray = not selected,
red = selected with invalid settings or a matching failed attempt. Tooltips explain
why. These UI cues do not change execution order or implementation coverage; see
[workbench indicator behavior](../../../../docs/local-workbench.md#step-indicators--2026-11-05).
