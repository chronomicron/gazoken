# Step 1.5 — Entropy coding inventory

Implemented locally, 2026-11-04; adapter version 1.0.0. Uses the common original
byte input and the bounded file-structure inventory. No entropy symbols,
coefficients or pixels are decoded. Select 1.5 and Run step, or call:

```python
from gazoken.pipeline import run_step
result = run_step(jpeg_bytes, 'source.jpg', '1.5', {
    'codebooks': True, 'scan_script': True,
})
```

## Controls and results

`codebooks` defaults true; false omits symbol lists and canonical codes while
retaining table IDs, classes, counts and definition identities. `scan_script`
defaults true; false omits detailed scan records without changing inspected scan
count or checking assignments. These controls do not skip input validation.

`definitions` preserves chronological DHT definitions: stable index, marker and
definition byte offsets, DC/AC class, table ID, counts for lengths 1–16 and total
symbols. Optional `symbols` and `codes` retain stored symbol order and derived
canonical bit strings. Redefinitions retain distinct indices. Multiple tables in
one DHT are supported; no common/default encoder signature database is consulted.

`scans` includes the file-structure scan declarations and `huffman_assignments`
linking component, class and table selector to the definition active at that scan.
Progressive DC initial scans use DC tables, AC scans use AC tables, and DC
refinement does not require a Huffman codebook. Sequential scans inspect both
classes; lossless frame declarations inspect DC only. Arithmetic frames produce
an unsupported-interpretation warning; DAC conditioning is recognized but not
parsed. Missing in-file tables yield null references and warnings, including
abbreviated streams that could rely on external definitions.

`extraction_status` is partial if extraction warnings occur; otherwise complete.
`eoi_reached` describes the underlying structural walk, not successful codebook
validation or JPEG conformance. DHT parsing stops at the first malformed table,
retaining earlier definitions and scan records. Thus inspected scan count can be
smaller than the file's full declared scan count on partial inputs. Structural
warnings and supported-method limits remain visible in the shared result.

## Bounds and exclusions

Source bytes are unchanged and bounded to 25 MiB. The structural walk is limited
to 4,096 markers; this adapter retains at most 1,024 definitions, each with at
most 256 symbols and code lengths up to 16, and returns at most 100 warnings.
It rejects invalid classes/IDs, truncated or empty definitions, impossible counts,
oversubscribed trees, reserved all-ones codes and duplicate symbols. It does not
validate mode-dependent symbol meaning, scan progression or actual entropy data.

This is **not** a measurement of symbol frequencies, coded bit cost, optimality,
encoder identity, repeated compression or editing. Different codebooks can encode
the same coefficients. The tool reports declarations and derived codes only.
All file-structure limitations, including unusual DNL continuation, still apply.

## Verification and sources

Eight tests cover analytically known canonical codes and assignments, baseline and
progressive fixtures, prefix-free code checks, chronological redefinition,
progressive DC refinement, malformed/truncated definitions, optional output
controls, absent tables, arithmetic declarations, duplicate symbols and resource
bounds. API tests verify registration alongside the earlier tools.

```bash
.venv/bin/python -m unittest tests.tools.test_entropy_coding -v
```

Canonical code construction and the reserved all-ones rule were checked against
[libjpeg-turbo's Huffman reader](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/src/jdhuff.c)
on 2026-11-04. Implementation written for Gazoken without copying that code.
[Fixture provenance](../tests/fixtures/jpeg-inspector/README.md) records generated
inputs; these software tests establish no forensic detection accuracy.

Integration verification (2026-11-04): all 46 Python API/adapter checks and 37
JavaScript checks passed. GUI verification ran 1.5 on the reference JPEG and
recorded four definitions (DC/AC tables 0 and 1) and one scan through the shared
runner. Phase 1 and project READMEs were updated. Committed locally; not pushed
or deployed.

## Static browser adapter

On 2026-11-05 the public workbench gained a separate JavaScript adapter at
`assets/js/formats/jpeg/steps/entropy-coding.mjs`. It uses the original JPEG
bytes from `SourceContext`, implements the catalog's `codebooks` and `scan_script`
options, validates DHT declarations, and displays canonical codes and active
scan-time table assignments. It caps the inventory at 1,024 definitions and
inherits the low-level parser's marker, frame, and scan limits. JavaScript syntax
and whitespace checks were run; browser interaction was not verified for this
increment. The existing Python tests and GUI observations above do not validate
this browser adapter.
