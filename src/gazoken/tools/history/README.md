# Phase 3 tool adapters

Processing-history specialists on declared inputs. Reference/model requirements remain explicit and unmet until implemented.

Use the common [tool contract](../../../../docs/tool-development.md). Each module
exports `VERSION` and `run(inputs, parameters)`. Only registered adapters execute.
Planned paths below are reserved names, not generated stubs or implemented methods.

| Step | Module / future package | Current status | Required input packages |
| --- | --- | --- | --- |
| 3.1 Resampling | `resampling.py` | Planned | pixels |
| 3.2 Tonal mappings | `tonal_mappings.py` | Planned | pixels |
| 3.3 Hue & channel relationships | `color_relationships.py` | Planned | pixels |
| 3.4 White balance & illumination | `illumination.py` | Planned | pixels |
| 3.5 Blur & local sharpness | `blur_sharpness.py` | Planned | pixels |
| 3.6 Filtering & denoising | `filtering.py` | Planned | pixels |
| 3.7 Sharpening | `sharpening.py` | Planned | pixels |
| 3.8 Noise consistency | `noise_consistency.py` | Planned | pixels |
| 3.9 CFA & demosaicing | `demosaicing.py` | Planned | pixels |
| 3.10 Sensor / device references | `sensor_references.py` | Planned | pixels, sensor_reference |
| 3.11 Learned forensic traces | `learned_traces.py` | Planned | pixels, model_weights |
| 3.12 Copy-move candidates | `copy_move.py` | Planned | pixels |
| 3.13 Compositing & physical consistency | `physical_consistency.py` | Planned | pixels |
| 3.14 Operation-order hypotheses | `operation_order.py` | Planned | pixels, evaluated_evidence |
