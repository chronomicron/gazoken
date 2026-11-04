# Read-only JPEG inspector

Updated: 2026-11-03  
Implementation version: 0.1.0  
Status: structural prototype implemented locally; no attribution/history detector validated

## Purpose and workflow

The JPEG inspector treats a supplied file as encoded data of unknown provenance.
It reads the original bytes without rendering pixels, creating a bitmap, or
recompressing the file. Open **JPEG inspector** from the workbench header, choose
or drop a JPEG, and inspect the extracted fields and statistical displays.

This implementation follows the user's request for file-first investigation,
including EXIF and graphical quantization-table inspection. It does not implement
the unpublished conductor, component-comparison, or directional research proposals.

All parsing, charting, hashing, and report export are local to the browser. The
only optional fetch is the bundled synthetic reference JPEG on the same site.
There are no external metadata lookups, image uploads, analytics, or web-storage
persistence. A JSON export contains the metadata displayed, including GPS fields
if present; the user chooses whether to save or share that report.

The source bytes remain available unchanged for hex inspection. A worker receives
a clone, extracts the report, and calculates SHA-256 where Web Crypto is available.
The page retains no decoded pixel representation for this tool. Input size is
limited to 25 MiB; pixel dimensions do not constrain structural inspection.

## Observable file information

- Segment markers, lengths, ordering, and zero-based file offsets.
- Frame process, precision, declared dimensions, component IDs and sampling factors.
- Quantization destinations, definition history, 8/16-bit precision, original
  zigzag values, and reordered 8 × 8 frequency values.
- Huffman class/destination, code-length counts, and stored symbol values.
- Scan selectors, spectral selection, successive approximation, stored scan-byte
  lengths, stuffing counts, and restart-marker counts.
- Restart interval declarations; JFIF fields and Adobe APP14 fields when present.
- Application-block identification for Exif, JFIF, ICC chunks, Adobe APP14, and XMP.
- Comment previews; EXIF/TIFF directory entries, tag IDs, field types, counts,
  offsets, common tag names, and bounded value previews.
- Whole-file and scan-byte frequency histograms, file-byte entropy, and trailing
  byte count after EOI.

Original TIFF component values and metadata are reported as stored. The tool does
not silently relabel component IDs as RGB or YCbCr, infer a camera from sampling,
or interpret EXIF Orientation by rotating an image.

## Graphical displays and measurements

**Quantization heatmaps:** the stored zigzag sequence is mapped into its 8 × 8
frequency layout; columns are u and rows are v. DC is at (0,0). Every cell shows
the exact number; colour uses each table's own minimum and maximum. Compare
numbers rather than colours across tables. A constant table uses a uniform tint.

**Quantization distribution:** counts of the 64 stored values, with a bar for each
distinct value and an exact frequency table. Absent values are omitted from the
bar layout; the x-axis explicitly states this. Min, max, mean, and DC value are
shown separately. These are quantization-step values, not coefficient samples.

**Encoded-byte histograms:** fixed byte values 0–255 on the x-axis and counts on
the y-axis. Whole-file statistics include headers/metadata and coded data. Combined
scan statistics include original stuffed bytes and restart-marker bytes. They are
not histograms of reconstructed pixels, unstuffed entropy symbols, or coefficients.

**Byte entropy:** `H = -sum(p_b log2(p_b))`, over the whole-file byte histogram,
expressed in bits per byte. This descriptive quantity is not a tampering score,
encryption test, or estimate of the original image's information content.

**Huffman charts:** number of assigned symbols for each code length 1–16. They
show codebook definitions, not actual symbol usage, optimality, or coding gain.

**Hex view:** select a segment or enter a decimal/hex offset to display up to 256
original bytes, with zero-based offsets and printable ASCII alongside. A view may
extend beyond the selected segment; the caption gives its length and displayed
range. Previous/next controls page through the original file without modifying it.

## Interpretation of possible history

The report separates observed values from a rule-based interpretation. The
interpretation identifies the declared current encoding and explains how metadata
claims or missing fields should be treated. An Exif Software value is a declaration,
not verified provenance. Adobe APP14 alone is not a Photoshop signature.

No encoder-signature database is used. The tool cannot yet infer the encoder,
recover an original quality setting, count saves, detect earlier JPEG compression,
identify resizing/local edits, or attribute AI use. Those are separate statistical
investigations requiring controlled references and validation. Unknown history is
an explicit result. Finding EOI means that the marker walker reached EOI; it does
not certify a fully valid or authentic image.

A statistical history detector can later consume this report and additional
coefficient measurements, without replacing direct observations with conclusions.

## Supported cases and limits

Baseline sequential and progressive Huffman-coded JPEGs are covered by reference
fixtures. Other recognized SOF processes expose structural fields with an explicit
coverage warning. This is a structural parser, not a standards-conformance validator
or a JPEG entropy decoder. Arithmetic/lossless/hierarchical processes, DNL within
scan data, abbreviated streams, and unusual extensions have not been validated.

Exif parsing supports classic TIFF little/big endian, common field types, IFD0,
IFD1, Exif/GPS/Interop pointers, and bounded SubIFD links. Unknown tags are retained
by ID and known type. MakerNotes, thumbnail contents, XMP XML, ICC profile contents,
and vendor extensions are not semantically decoded. ASCII is previewed through
UTF-8 decoding; nonstandard encodings may not display correctly. UNDEFINED fields
are byte arrays. Dates are not authenticated, ordered into a timeline, or converted
to a common time zone; GPS values remain recorded fields rather than map lookups.

Bounds: 4,096 marker segments, 32 frame headers, 256 quantization definitions, 256 Huffman definitions,
256 scans, 32 Exif blocks, and per Exif block 32 directories / depth 8 / 1,000
entries. ASCII previews are at most 1,024 bytes; other arrays preview 64 elements;
comment previews are 2,048 bytes. The UI shows at most 16 definitions of each table
kind, 512 segment rows, 1,000 Exif rows, 1,000 rows per other data table, and 64 comments. JSON retains all extracted
records and previews, not the complete contents of unparsed metadata payloads.

Malformed lengths, unknown field types, cyclic TIFF pointers, out-of-bounds values,
and selected invalid table definitions produce errors or partial reports with
warnings. The original bytes remain the reference; absent, unreadable, and
unimplemented information are distinct from a negative forensic finding.

## Implementation

- [`jpeg.mjs`](../assets/js/jpeg.mjs): pure structural parser, byte statistics, explicit interpretation rules.
- [`exif.mjs`](../assets/js/exif.mjs): bounded TIFF/Exif parsing.
- [`jpeg-worker.mjs`](../assets/js/jpeg-worker.mjs): parser worker and SHA-256.
- [`jpeg-ui.mjs`](../assets/js/jpeg-ui.mjs): source handling, charts, tables, hex and export.
- [`jpeg.html`](../jpeg.html): standalone entry point linked from the pixel workbench.

No external source code, trained model, or parser package was incorporated. The
current interface is JavaScript; a future Python/C/C++ API remains undecided.

## Verification

```bash
node tests/jpeg.test.mjs
node tests/analysis.test.mjs
```

Twenty JPEG checks cover table mapping, 16-bit definitions, scan stuffing/restarts,
definition history, Huffman counts, malformed input, Exif endianness/pointers,
non-mutation, byte entropy, baseline/progressive reference files, nested EXIF,
truncation, and trailing bytes. Quantization values and dimensions are compared
against independently extracted Pillow expectations; this checks extraction,
not forensic attribution accuracy.

Serve the project locally, then open `tests/jpeg-browser.html`. Nine integration
checks exercise input handling, worker parsing, charts, Exif interpretation,
source hashes, linked hex offsets, JSON serialization, replacement, partial
reports, invalid files, and clearing. Pixel decode/canvas APIs are deliberately
blocked in the test, demonstrating that the inspector works independently of
rendering. JSON serialization is intercepted in the test: OS download delivery
and native drag-and-drop are not established by it.

Synthetic fixtures and generation instructions are in
[`tests/fixtures/jpeg-inspector/README.md`](../tests/fixtures/jpeg-inspector/README.md).
On 2026-11-03, all twenty parser checks, nine inspector browser checks, and the
existing seven numerical/eight browser workbench regression checks passed. Desktop
and 390-pixel-wide report layouts were inspected in Brave at `/gazoken/`.

Native file-picker delivery, OS downloads, and additional browsers still need
manual checks. No scientific history/attribution benchmark has been run.

## References

Technical sources consulted 2026-11-03:

- [ITU-T T.81 / ISO 10918-1, Annexes B and C](https://www.w3.org/Graphics/JPEG/itu-t81.pdf): marker syntax, quantization definitions, table replacement, scan organization, and Huffman table structure.
- [libjpeg-turbo library documentation](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/doc/libjpeg.txt): related coding concepts and future reference-tool integration.
- [CIPA Exif standards catalogue](https://www.cipa.jp/e/std/std-sec.html): official specification source for future coverage work. The historical Exif PDF could not be retrieved in this session.
- [Pillow Exif tag definitions](https://github.com/python-pillow/Pillow/blob/main/src/PIL/ExifTags.py): primary library reference for common tag names and the independent fixture expectations.
- [Exif/TIFF structural description](https://www.media.mit.edu/pia/Research/deepview/exif.html): TIFF byte order, directory structure, offsets, and common field types; a secondary technical description with acknowledged limitations, not full specification compliance.
- [JPEG-header attribution research](https://people.csail.mit.edu/kimo/publications/jpeg/): candidate future inference work; not implemented or reproduced here.
