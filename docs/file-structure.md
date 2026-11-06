# Step 1.2 — JPEG file structure

Implemented locally, 2026-11-04. Adapter version 1.0.0.

`gazoken.tools.encoded.file_structure.run(inputs, parameters)` uses the common
immutable original-byte packet. Select **1.2 File structure**, then **Run step**,
or call:

```python
from gazoken.pipeline import run_step
record = run_step(jpeg_bytes, 'source.jpg', '1.2', {
    'segment_limit': 4096, 'include_scan_layout': True,
})
```

## Parameters

- `segment_limit`: 32–4096, default 4096. Counts SOI and EOI and all inventoried
  structural markers, including TEM. In-scan restart markers are counted per scan
  instead of generating an unbounded marker list.
- `include_scan_layout`: default true. False omits detailed scan records but retains
  scan count, frames, segments, restart interval declarations and boundary walking.

## Outputs

`extraction_status` is `complete` when the walk reaches EOI without extraction
warnings; otherwise `partial`. This describes extraction coverage, not JPEG
conformance or the authenticity of its content. The shared result record retains
method version, parameters, source SHA-256 and warning strings.

- `segments`: chronological marker name/code, byte offset, total byte length,
  payload offset and payload length. Standalone markers have no payload offset.
  Offsets are zero-based into preserved original bytes; lengths include marker fill
  bytes where present and segment-length bytes. APP/COM contents are not interpreted.
- `frames`: marker and offset, declared width/height, sample precision, component
  IDs, horizontal/vertical sampling factors, and quantization-table selectors.
  Component IDs do not by themselves assert RGB or YCbCr semantics. Dimensions are
  declarations; no EXIF orientation, color conversion or pixel decoding is applied.
- `scan_count`, optional `scans`: component and coding-table selectors, spectral
  bounds, successive approximation fields, active restart interval, encoded data
  start/end, byte count, restart-marker count and stuffed-byte count. Byte ranges
  are half-open and include stuffed bytes and restart markers. No symbol counts,
  decoded coefficients or validation of scan progression are produced.
- `restart_intervals`: DRI declarations with byte offset and interval in MCUs.
- `eoi_reached`, `file_bytes`, `trailing_bytes`: bytes after the first EOI are
  counted, not interpreted. Without EOI the trailing count is null, not zero.

Malformed/truncated headers stop extraction with warnings and retain earlier
complete records. A segment with a complete byte range but invalid frame/scan
fields may appear in `segments` without a corresponding interpreted frame/scan.
Reaching the segment limit produces an explicit partial record. Original input is
bounded by the shared 25 MiB limit. No image or entropy buffer is expanded.

## Boundaries and verification

This is a structural inventory, not a JPEG decoder, full conformance validator,
metadata parser, encoder identifier or prior-compression detector. Marker ordering,
entropy validity, restart sequence order, coding-table availability, hierarchical
semantics and DNL continuation are not validated/interpreted. Unusual files can
therefore yield a partial inventory or uninterpreted declarations. Scan layout is
reported as stored; it does not establish a processing history.

Seven tests check baseline/progressive dimensions against independent stored Pillow
references; analytic sampling/scan fields; exact byte coverage and offsets;
stuffing, restart markers and fill; known trailing bytes; layout omission;
segment limits; malformed/truncated headers; incomplete entropy data; source
identity and unchanged bytes. Run:

```bash
.venv/bin/python -m unittest tests.tools.test_file_structure -v
```

Marker conventions were checked against the primary
[libjpeg-turbo marker reader](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/src/jdmarker.c)
on 2026-11-04 during the preceding quantization increment. This implementation was
written for Gazoken without copying that source. Fixture generation and reference
environment are described in the [fixture README](../tests/fixtures/jpeg-inspector/README.md).
Scientific detector accuracy is outside these software checks.

Integration verification (2026-11-04): all 31 Python API/adapter tests and 37
JavaScript tests passed; module syntax and Git whitespace checks passed. Browser
verification ran 1.2 through the GUI on the reference JPEG: 11 segments, one scan,
zero trailing bytes, and a stored Python result with executed parameters. This
increment is recorded in local Git; it has not been pushed or deployed.

## Static browser adapter

The public workbench also exposes step 1.2 through the isolated JavaScript adapter
[`file-structure.mjs`](../assets/js/formats/jpeg/steps/file-structure.mjs). It
accepts the shared browser `SourceContext`, reads its original encoded bytes, and
projects the existing browser JPEG inspector's parse into a step result. It does
not decode pixels. The browser result limits displayed marker rows in the UI;
the structured result retains up to the selected segment limit. See
[browser tool inputs and modules](browser-tools.md) for the browser contract and
current limits. This does not change the Python implementation described above.
