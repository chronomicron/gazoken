# Step 1.4 — Quantization atlas

Implemented locally, 2026-11-04. Adapter version 1.0.0.

`gazoken.tools.encoded.quantization_tables.run(inputs, parameters)` reads original
JPEG bytes through the common tool interface. It never decodes coefficients or
pixels and never changes the source. Select 1.4 and Run step/Run selected in the
local app, or use `run_step(data, filename, '1.4', parameters)` from Python.

## Parameters and output

- `order`: `Natural 8 × 8` (row-major frequency layout, default) or `Stored zigzag`.
- `retain_history`: retain every complete table definition (default true), or only
  the final definition for each table ID. This affects table output, not scanning.

Outputs include extraction status, EOI reached, complete definition count, table
IDs, stable chronological definition indices, marker/payload byte offsets, 8/16-bit
precision, 64 exact values in the selected layout, minimum/maximum/mean,
frame component-to-table assignments, and definition references at each scan.
Values and summary statistics are quantization steps, not measured pixel loss.
When history is disabled, old scan references may point to omitted definitions;
indices are never renumbered. Later definitions are not substituted for earlier ones.
Scan-time declarations do not implement a decoder's progressive component table
latching semantics. No coefficient reconstruction is attempted.

Incomplete/malformed data returns complete definitions obtained before the stopping
point, with `partial` status and warnings. EOI alone does not assert JPEG
conformance. Missing in-file tables are flagged, including abbreviated streams that
might rely on external tables. Marker walking handles entropy byte stuffing and
restart markers; it does not validate entropy data. Parsing stops at the first EOI,
ignores subsequent data, and limits processing to 4,096 structural markers and
1,024 table definitions, in addition to the shared 25 MiB source bound.

No quality-factor estimate, camera/software attribution, double-compression test,
editing probability, or detection accuracy claim is produced. Full JPEG conformance,
hierarchical/lossless decoding, externally supplied tables, and encoder signatures
remain outside this tool's coverage.

## Verification and sources

Six adapter checks cover baseline/progressive files against independently recorded
Pillow quantization values, analytic zigzag mapping, values above 255, multiple
DQT definitions, redefinitions between scans, byte stuffing/restarts, missing
references, resource bounds, malformed/truncated data, and source preservation.
The API coverage check verifies 1.4 is executable alongside 1.1 and 1.7.

```bash
.venv/bin/python -m unittest tests.tools.test_quantization_tables -v
```

Implementation written for Gazoken. Marker layout was checked against the primary
[libjpeg-turbo marker reader](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/src/jdmarker.c)
on 2026-11-04; no source code was copied. Existing
[fixture provenance](../tests/fixtures/jpeg-inspector/README.md) records the Pillow
and JPEG codec environment used for the independent extraction references.

Integration verification: 24 Python checks and 37 JavaScript checks passed. A
local browser run of 1.4 on the bundled reference produced two tables, displayed
Python measurements and retained its parameter/provenance record. This increment is recorded in local Git; it has not been pushed or deployed.
