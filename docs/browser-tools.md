# Browser tool inputs and modules

Updated: 2026-11-05  
Status: browser source context v1 and JPEG steps 1.1–1.3 implemented; later steps remain unchanged

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

`assets/js/app.mjs` creates the context after the browser has decoded the selected
image for display and attaches that separate RGBA pixel representation with
browser-decoder provenance. The context retains the original file independently.
It keeps the workbench's existing pixel buffer rather than allocating a duplicate;
tools receive a detached copy only when they request that representation.
The browser steps currently accept detected JPEG input only. PNG and WebP remain
usable for existing Phase 2 browser views, but cannot run these JPEG-specific
steps.
The Phase 1 **Run selected** control executes selected browser-backed steps 1.1,
1.2, and 1.3 in catalog order. When other selected steps are included, it runs the
browser-backed steps and reports that the remaining selections require the local
workbench. Selecting only local-workbench steps opens the local-workbench guidance.

Example future organization:

```text
assets/js/
├── core/source-context.mjs
└── formats/
    ├── jpeg/steps/<step-module>.mjs
    └── bmp/steps/<step-module>.mjs
```

Add a format-specific module only when that step is implemented. Do not create
placeholder algorithms or claim that the current Python step catalog runs in the
static browser. The public GitHub Pages site still has no Python backend.

## Limits and next extensions

The browser wrapper currently supports the image files accepted by the existing
viewer and is designed to carry their format identity. The active public media
workspace remains JPEG. BMP signature parsing, BMP decoding, per-format tool
registration, worker transfer rules, larger numerical types, color-management
policy, and a stable serialized/cross-language contract are open future work.
Steps 1.1–1.3 currently read/hash or parse the whole file on the main browser
thread; large-file work may later move to a worker. The low-level JPEG inspector
computes some additional byte statistics internally, although steps 1.2 and 1.3
return only their declared structural or metadata fields. File-size and pixel
limits remain those of the existing public viewer.
