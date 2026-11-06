# Browser tool inputs and modules

Updated: 2026-11-05  
Status: browser source context v1 and JPEG step 1.1 implemented; later steps remain unchanged

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

`assets/js/app.mjs` creates the context after the browser has decoded the selected
image for display and attaches that separate RGBA pixel representation with
browser-decoder provenance. The context retains the original file independently.
It keeps the workbench's existing pixel buffer rather than allocating a duplicate;
tools receive a detached copy only when they request that representation.
The browser step currently accepts detected JPEG input only. PNG and WebP remain
usable for existing Phase 2 browser views, but cannot run this JPEG-specific step.
The Phase 1 **Run selected** control executes selected browser-backed steps; at
present that is step 1.1. When other selected steps are included, it runs 1.1 and
reports that the remaining selections require the local workbench. Selecting no
browser-backed step while local steps are selected opens the local-workbench guidance.

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
Step 1.1 currently computes the whole-file SHA-256 on the main browser thread;
large-file hashing may later move to a worker. File-size and pixel limits remain
those of the existing public viewer.
