# Browser tool inputs and modules

Updated: 2026-11-06
Status: browser source context v1, JPEG steps 1.1–1.7, Phase 2 steps 2.1–2.2, and Phase 3 step 3.3 implemented.

## Shared source context

The public static workbench passes a `SourceContext` to browser-side tools. It is
format-neutral at the wrapper boundary: it records detected media type and basic
file metadata, while format-specific adapters decide which media they accept. A
future BMP adapter can use the same context without making JPEG parsing part of
the shared wrapper.

The wrapper keeps representations distinct:

- **Original encoded file:** the browser `File`/`Blob`, retained unchanged. A tool
  requests a fresh byte copy with `readOriginalBytes()` when it needs compressed
  or container data. The wrapper does not eagerly cache a second full copy.
- **Decoded pixels:** an optional separately named package with dimensions,
  channels, numeric type, layout, source-context link, and decoder/color/orientation
  provenance. `getDecodedPixels()` returns a detached copy linked to the source
  SHA-256. No tool should infer encoded bytes from pixels or replace the original
  representation with a decoded or transformed image.
- **Future derived representations:** filters, coefficient buffers, or other
  transforms should be named outputs with their own method and provenance. They
  do not overwrite either input representation.

Each step is an ES module with a focused `run(inputs, parameters)` entry point and
returns a structured record containing its stable step ID, method version, status,
input representation/provenance, parameters, measurements, and warnings. This is
a browser-specific first version. It follows the same separation as the Python
`ImageSource`, `PixelPackage`, and `ToolInputs` concepts, but does not establish a
cross-language serialization schema or replace the Python contract.

## Current module

`assets/js/core/source-context.mjs` owns the shared browser wrapper.
`assets/js/formats/jpeg/steps/source-identity.mjs` implements JPEG Phase 1, step
1.1 in isolation. It reads the original bytes, checks the JPEG start-of-image
signature, and reports file size and SHA-256. It does not claim full JPEG
conformance or provenance authenticity, and it does not inspect decoded pixels.
The Phase 1.1 card's acquisition note is recorded as a user-supplied note, not as
verified provenance.

`assets/js/formats/jpeg/steps/file-structure.mjs` implements Phase 1, step 1.2 as
an independent adapter over the existing low-level JPEG inspector. It reads the
same original-byte representation and returns a bounded marker inventory, frame
declarations, optional scan layout, restart intervals, and parser warnings in the
browser tool-result shape. The step adapter applies its segment limit and projects
only structural fields into the result; it does not use decoded pixels. Parser
warnings and reaching EOI describe extraction coverage, not JPEG conformance.

`assets/js/formats/jpeg/steps/metadata-inventory.mjs` implements Phase 1, step
1.3 using the original encoded bytes. It inventories APP/COM blocks and reads
bounded classic TIFF/Exif values through `assets/js/exif.mjs`. The reader
selection, GPS IFD inclusion, and MakerNote-value inclusion are explicit
parameters. With GPS or vendor data excluded, the Exif parser avoids following or
reading those values;
the controls are not a guarantee that location or identifying information cannot
appear in other metadata. `ExifTool` remains explicitly unavailable and is never
launched by the static page.

`assets/js/formats/jpeg/steps/quantization-tables.mjs` implements Phase 1, step
1.4 using original encoded bytes. It extracts exact 8- or 16-bit table values,
keeps stable chronological definition indexes, and associates current table
definitions with frame components and scan-time declarations. Its layout and
history options match the step catalog. The browser card renders exact values as
8 × 8 grids (natural frequency order or stored zigzag sequence), along with
definition history, assignments, and bounded parser warnings. These are stored
encoding choices; they do not estimate quality, identify an encoder, or prove a
prior save or edit.

`assets/js/formats/jpeg/steps/entropy-coding.mjs` implements Phase 1, step 1.5
using the original encoded bytes. It inventories chronological DHT definitions,
validates canonical code trees, optionally includes stored symbols and derived
codes, and links scan selectors to the active definitions. Its options match the
step catalog. Progressive DC refinement requires no Huffman assignment, and
arithmetic-coded frames are reported as unsupported for these assignments. The
adapter does not decode entropy symbols or infer coding efficiency or encoder
identity.

`assets/js/formats/jpeg/steps/embedded-images.mjs` implements Phase 1, step 1.6
using the original encoded bytes. It recognizes bounded Exif IFD1 and JFXX JPEG
preview declarations, validates their container ranges and SOI signatures, hashes
the extracted bytes, and can inventory nested marker structure with its own
256-marker limit. It does not decode preview pixels, search arbitrary byte ranges,
or discover unsupported thumbnail formats.

`assets/js/formats/jpeg/steps/byte-distribution.mjs` implements Phase 1, step
1.7 on the original encoded bytes. It reports exact counts for all 256 byte
values and Shannon entropy in bits per byte; the static catalog currently offers
whole-file scope only. The result card plots the counts as an SVG histogram.
These are descriptive byte-stream statistics, not a tampering score.

The static source viewer's **Byte map** mode reads the preserved original bytes
and renders their values as a color map. For larger files, it uniformly samples
the byte stream to fit the bounded display canvas; this is a visualization, not a
pixel map or a byte-frequency result. **Quantization** mode uses the same Phase 1,
step 1.4 JPEG adapter to show the final stored 8 × 8 quantization tables in the
viewer. It stays on the workbench page and explains when a non-JPEG source has no
JPEG quantization tables.

`assets/js/steps/decoded-reference.mjs` implements Phase 2, step 2.1 as a
format-neutral manifest of the decoded pixels already attached to the source
context. It records dimensions, channel layout, coordinate mapping, source hash,
and browser decoder/color/orientation provenance without decoding again or
allocating another pixel copy. This browser result is explicitly a display-pixel
reference; it does not satisfy the planned reproducible Python/native decoder
choice or provide native JPEG component planes.

`assets/js/steps/spatial-measurements.mjs` implements Phase 2, step 2.2 using the
same detached browser-decoded pixel package in a module worker. It reports
luminance or RGB histograms, global luminance statistics, and a regular sample of
local mean, standard deviation, gradient magnitude, and optional exact 0/255
channel endpoint fractions. The sample is capped at 4,096 windows. No low-texture
eligibility threshold is defined, so the result is explicitly partial and does
not classify low-texture regions. The browser control does not offer native
JPEG component planes.

`assets/js/steps/color-relationships.mjs` implements Phase 3, step 3.3 as a
whole-image descriptive RGB summary over the same browser-decoded package. It
reports optional layered RGB histograms, per-channel means and standard
deviations, pairwise Pearson correlations, and the fraction below the selected
saturation floor. The floor uses `(max-min)/max`, with black defined as zero
saturation. Pixel calculations run in a module worker. This is not the catalog's
wavelet-ratio method, a hue map, a regional analysis, or a forensic detector.

`assets/js/app.mjs` creates the context after the browser has decoded the selected
image for display and attaches that separate RGBA pixel representation with
browser-decoder provenance. The context retains the original file independently.
It keeps the workbench's existing pixel buffer rather than allocating a duplicate;
tools receive a detached copy only when they request that representation.
JPEG steps 1.1–1.7 accept detected JPEG input only. Step 2.1 accepts the decoded
JPEG, PNG, or WebP pixel package when available. PNG and WebP cannot run the
JPEG-specific Phase 1 steps.
**Run selected** executes selected browser-backed steps in the active phase and
catalog order. Phase 1 steps 1.1–1.7 run on encoded JPEG bytes; Phase 2 steps
2.1–2.2 and Phase 3 step 3.3 use the browser-decoded pixel package. Remaining Phase 2/3 selections show inline
configuration-only status and do not open the full-workbench dialog. Per-step
guidance remains available for implementation status.

Example future organization:

```text
assets/js/
├── core/source-context.mjs
├── steps/<format-neutral-step-module>.mjs
└── formats/
    ├── jpeg/steps/<step-module>.mjs
    └── bmp/steps/<step-module>.mjs
```

Keep each tool in its own module, using format-neutral steps when they consume the
shared decoded package and format-specific modules when they inspect an encoding.
Do not create placeholder algorithms or imply that a browser adapter is a Python
measurement. The public GitHub Pages site still has no Python backend.

## Limits and next extensions

The browser wrapper currently supports the image files accepted by the existing
viewer and is designed to carry their format identity. The active public media
workspace remains JPEG. BMP signature parsing, BMP decoding, per-format tool
registration, worker transfer rules, larger numerical types, color-management
policy, and a stable serialized/cross-language contract are open future work.
JPEG steps 1.1–1.7 currently read/hash or parse the whole file on the main browser
thread; steps 2.2 and 3.3 process decoded pixels in a worker. The low-level JPEG inspector
computes some additional byte statistics internally, although steps 1.2–1.6
return only their declared structural, metadata, table, coding, or preview fields. The
low-level parser defaults to 256 Huffman definitions; it also limits structural
markers to 4,096, frame headers to 32, scan headers to 256, and quantization
definitions to 1,024. Step 1.5 disables the low-level shallow Huffman inventory
and applies its own limit of 1,024 fully parsed definitions. File-size and pixel
limits remain those of the existing public viewer.
