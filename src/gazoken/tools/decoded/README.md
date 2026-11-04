# Phase 2 tool adapters

Fixed decoded reference and spatial measurements. The reference provider is step 2.1; no decoder is registered yet.

Use the common [tool contract](../../../../docs/tool-development.md). Each module
exports `VERSION` and `run(inputs, parameters)`. Only registered adapters execute.
Planned paths below are reserved names, not generated stubs or implemented methods.

| Step | Module / future package | Current status | Required input packages |
| --- | --- | --- | --- |
| 2.1 Decoded reference | `decoded_reference.py` | Planned | jpeg_bytes |
| 2.2 Spatial measurements | `spatial_measurements.py` | Planned | pixels |
| 2.3 Current JPEG grid | `current_grid.py` | Planned | pixels |
| 2.4 Displaced earlier grids | `displaced_grids.py` | Planned | pixels |
| 2.5 Calibration & recompression | `recompression.py` | Planned | jpeg_bytes, pixels |
| 2.6 Regional compression | `regional_compression.py` | Planned | pixels |
| 2.7 Main image vs previews | `preview_comparison.py` | Planned | jpeg_bytes, pixels |
| 2.8 Scaled earlier grids | `scaled_grids.py` | Planned | pixels |
| 2.9 Rotated earlier grids | `rotated_grids.py` | Planned | pixels |
| 2.10 Threshold & directional study | `threshold_study.py` | Planned | pixels |
| 2.11 Spatial JPEG report | `spatial_report.py` | Planned | pixels |
