# Step 1.6 — Embedded JPEG images

Implemented locally, 2026-11-04; adapter version 1.0.0. Uses preserved original
bytes through the common interface, bounded file-structure inventory and bounded
Exif reader. Select 1.6 then Run step, or use:

```python
from gazoken.pipeline import run_step
result = run_step(jpeg_bytes, 'source.jpg', '1.6', {
    'preview_limit': 4, 'nested_structure': True,
})
```

## Scope and outputs

Finds JPEG thumbnails declared by scalar LONG JPEGInterchangeFormat (0x0201) and
JPEGInterchangeFormatLength (0x0202) in classic Exif IFD1, and JPEG payloads in
JFXX extension 0x10. TIFF offsets are relative to the enclosing Exif TIFF header;
ranges must remain within that same APP1 segment. No byte-pattern search across
unknown file regions is performed. Missing previews are a valid empty result.
Duplicate/missing tags and malformed pointers are reported, not guessed.

Each `previews` record includes a stable index, kind, container marker offset,
absolute source byte offset/count, source SHA-256, extracted-content SHA-256 and
JPEG MIME type. Content is sliced and hashed in memory. To obtain those same
bytes in Python, slice `jpeg_bytes[offset:offset + byte_count]` using that record.
No temporary image files are written; JSON reports contain descriptors, not binary
buffers. The GUI shows records and nested structure; it does not render or offer
separate preview downloads in this increment.

`nested_structure` defaults true: invoke the structural inventory on each bounded
preview, with a 256-marker limit and scan detail omitted. These offsets are
**relative to the preview**, whereas the parent manifest offset is relative to the
original file. Original pixels, EXIF orientation and color profiles are not decoded.
There is no recursive embedded-preview discovery. A nested partial result retains
the preview manifest and raises a parent coverage warning. With this option false,
SOI is checked but the embedded stream is not otherwise validated.

`preview_limit` is 1–16, default 4. Excess candidates produce a partial-coverage
warning. Parent scanning uses the 4,096-marker bound; at most 16 Exif blocks are
inspected, with the metadata reader's directory/depth/entry/value limits. At most
100 top-level warnings are returned. Source bytes retain the shared 25 MiB limit;
no pixel buffer is allocated. `extraction_status` describes supported extraction
coverage and `eoi_reached` describes the parent structural walk.

JFIF raw RGB thumbnails and JFXX palette/RGB thumbnails are flagged as unsupported.
Other TIFF directories, raw/strip thumbnails, vendor MakerNote previews, MPF/MPO,
XMP and arbitrary nested streams are outside this increment. A complete result
means supported declarations were inspected without warnings, not that every
possible embedded image has been found. Container/header bounds do not authenticate
a declared preview or prove it corresponds to the current main image.

No pixel comparison, chronology, encoder matching or editing verdict is produced.
Preview bytes can themselves contain identifying metadata; no redaction is claimed.
The source and fixed decoded reference are never replaced by a preview.

## Verification and references

Six tests cover both byte orders, exact extraction/hashes and source preservation,
nested coordinate origins, JFXX, optional structure omission, range escape attempts,
preview limits, invalid signatures, damaged nested files and absent previews.
They construct small Exif/JFXX containers around existing documented JPEG fixtures.

```bash
.venv/bin/python -m unittest tests.tools.test_embedded_images -v
```

Tag conventions checked on 2026-11-04 against the primary
[ExifTool Exif tag implementation](https://github.com/exiftool/exiftool/blob/master/lib/Image/ExifTool/Exif.pm).
JPEG marker conventions use the existing Gazoken structural reader; see its
[coverage and sources](file-structure.md). The adapter was written for Gazoken;
no third-party decoder or copied implementation was introduced.

Integration verification (2026-11-04): 52 Python API/adapter tests and 37
JavaScript tests passed. GUI verification ran 1.6 on the reference JPEG and
recorded a valid empty preview inventory. Positive extraction cases and exact
byte identities were verified using constructed Exif and JFXX containers in the
adapter tests. Phase 1 and project READMEs updated. Committed locally, not pushed
or deployed.

## Static browser adapter

On 2026-11-05 the public workbench gained an isolated JavaScript adapter at
`assets/js/formats/jpeg/steps/embedded-images.mjs`. It reads the original JPEG,
reuses the bounded TIFF/Exif parser, extracts only declared Exif IFD1 or JFXX JPEG
ranges, and records source and preview SHA-256 values. Optional nested structure
uses the file-structure adapter with a 256-marker cap. The browser report shows
range descriptors and nested summary; it does not decode or download preview
pixels. JavaScript syntax and whitespace checks were run; browser interaction has
not yet been verified for this increment.
