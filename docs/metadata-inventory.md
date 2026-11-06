# Step 1.3 — Metadata inventory

Implemented locally, 2026-11-04; adapter version 1.0.0. Uses the shared
`run(inputs, parameters)` interface and the file-structure adapter's bounded marker
inventory. Original bytes are never modified; no pixel decoding or external
process runs. Select 1.3 and Run step, or use:

```python
from gazoken.pipeline import run_step
result = run_step(jpeg_bytes, 'source.jpg', '1.3', {
    'reader': 'Auto', 'include_gps': False, 'include_vendor': False,
})
```

## Parameters and compatibility

`Auto` and `Bounded TIFF reader` select the implemented reader. The legacy
`Auto (not connected)` and `Bounded TIFF reader (not connected)` values remain
accepted so older settings exports import unchanged. `ExifTool (not connected)`
returns an explicit unavailable reader, partial coverage and warning; it does not
silently invoke another reader. No external executable is installed or launched.

`include_gps` defaults false: omit the standard GPS pointer entry and do not follow
its IFD. This is **not location redaction**: descriptions, vendor bytes or other
metadata may contain location information. `include_vendor` defaults false: omit
MakerNote values; when true show bounded opaque bytes, without vendor decoding.
Exported metadata can include identifying information supplied by the input file.

## Output and limits

- `blocks`: APP/COM markers, byte offsets, payload sizes and recognized Exif,
  JFIF, XMP and ICC signatures. XMP, ICC, comments and other APP bodies are not
  decoded or exported as text.
- `exif`: APP1 payload offset, byte order, and entries containing IFD, hexadecimal
  tag, common tag name (or Unknown), type, count, absolute entry/value offsets,
  value, truncation indicator, and omission/unreadable indicators where applicable.
- `reader`, `extraction_status`, GPS/vendor flags and an interpretation reminder.
  Missing Exif is a valid empty inventory, not evidence of editing. `complete`
  means the supported inventory completed without warnings; unsupported bodies
  remain opaque. It never means all possible metadata has been understood.

Supports classic TIFF magic 42 in either byte order, basic integer/float/ASCII and
rational types, Exif/GPS/Interop/SubIFD pointers, and subsequent IFDs. Rationals
retain numerator/denominator and a nullable decimal; nonfinite floats become text.
Unknown tags retain numeric identity. GPS tag names currently remain numeric.

Bounds: 25 MiB original file, 4,096 structural markers, 16 Exif blocks, 32 visited
directories per block, depth 8, 1,000 examined entries per block, pointer queue 64,
1,024 ASCII bytes or 64 numeric values per entry, and 100 returned warning strings.
Every TIFF offset/value extent must remain inside its own APP1 segment. Repeated
pointers, unsupported types, invalid ranges, truncation and resource limits produce
partial coverage warnings. Earlier readable values remain available.

No BigTIFF, vendor-specific MakerNote parser, XMP XML parser, ICC interpretation,
thumbnail extraction, authentication, encoder attribution or history inference is
provided. File timestamps and other metadata are editable declarations.

## Verification

Seven tests cover independent synthetic Exif fixtures, both byte orders, nested
fields, pointer cycles, large counts and invalid offsets, standard GPS exclusion,
optional opaque vendor bytes, display truncation, zero-denominator rationals,
legacy reader settings and unavailable ExifTool. Fixture provenance is in
[the fixture README](../tests/fixtures/jpeg-inspector/README.md). This bounded
reader follows the existing Gazoken browser reader's supported TIFF field layout;
no third-party Exif dependency was introduced.

```bash
.venv/bin/python -m unittest tests.tools.test_metadata_inventory -v
```

Integration verification (2026-11-04): 38 Python API/adapter checks and 37
JavaScript checks passed. Browser verification executed 1.3 on the reference JPEG,
showing its JFIF block and a valid empty Exif inventory as a Python measurement.
Real nested Exif values were verified with the documented baseline fixture in
adapter tests. Changes are committed locally, not pushed or deployed.

## Static browser adapter

The static workbench also runs step 1.3 through the isolated JavaScript adapter
[`metadata-inventory.mjs`](../assets/js/formats/jpeg/steps/metadata-inventory.mjs).
It uses the shared `SourceContext` original-byte representation and the bounded
browser TIFF/Exif reader. GPS and MakerNote options are applied during Exif parsing.
The browser reports APP/COM block inventory, bounded Exif fields, parser warnings,
and the selected reader state. `ExifTool` remains unavailable in the browser. As
with the Python tool, excluding the standard GPS IFD does not establish that all
location information has been removed. See [browser tool inputs and modules](browser-tools.md).
