# First image workbench

Updated: 2026-11-05
Implementation: v0.1.0, exploratory prototype  
Owner: Gazoken / Grou-lab

## Scope and use

The landing page now loads a JPEG, PNG, or WebP image, provides independent tool
checkboxes and parameters, and displays a separate result for each selected tool.
Load a file using **Choose image** or drag one onto the source area. The generated
JPEG demo illustrates a textured field with a smoother rectangle; it is not a
research dataset or a demonstration of detector accuracy.

The static Phase 1 steps 1.1–1.4 run in JavaScript on JPEG files. Step 1.1 reports
the original file's byte length, start-of-image signature, and SHA-256; step 1.2
inventories JPEG markers, frame declarations, and optional scan layout; step 1.3
lists bounded metadata blocks and classic TIFF/Exif values; step 1.4 extracts
stored quantization tables and their frame/scan references. They receive the
unchanged encoded source; the decoded pixel buffer used by Phase 2 views is a
separate representation. See [browser tool inputs and modules](browser-tools.md).

Run selected tools, compare outputs with the source preview, and optionally save
a result as a PNG. Result cards record method version, settings, a descriptive
measurement, and interpretation limits. Changing settings clears earlier results
so they cannot be mistaken for outputs from the new configuration. Clearing or
replacing the source cancels pending work.

The initial tool selection is an architect implementation choice within the user's
request for a small, versatile workbench. No detection rates, published results,
or forensic validity have been established. These filters do not determine whether
an image is doctored, identify editing software, or assign an authenticity probability.
A paper-specific replication study and a dataset evaluation suite remain future work.

## Processing and limits

- Supported signatures: JPEG, PNG, WebP; maximum 25 MiB and 12,000,000 decoded pixels.
- All image decoding and analysis happens in the browser. Image bytes are not
  sent to a server; Statcounter measures public-page visits. Images are not stored
  in web storage.
  Normal website requests and browser-managed memory/cache are separate from this.
- The common input is browser-decoded 8-bit RGB, composited onto white with opaque
  alpha, at decoded dimensions without resizing. Browser orientation and colour
  handling can affect the pixels. This is not a raw sensor or original-byte view.
- Animated image analysis is not supported; only a decoded still is analyzed.
- Every method sees the same source pixels, never another method's output.
- CPU pixel loops run in a module Web Worker with a 60-second timeout per method.
  JPEG encoding/decoding and canvas display use browser APIs on the page.
- A worker error or unsupported input produces an unavailable result, not a
  negative finding. There is no server fallback.
- The UI uses English controls with Japanese branding and a bilingual project
  introduction. Full interface localization remains open.

## Method briefs

These are new Gazoken implementations of elementary operations. No third-party
source code or model weights were incorporated. Versioned computation is in
[`analysis.mjs`](../assets/js/analysis.mjs), also imported by numerical checks.

### JPEG error-level analysis (ELA)

**Question:** where do decoded pixels change after a new JPEG compression?

Re-encode the common RGB canvas through the browser JPEG encoder at quality
`q / 100` (default q = 90). Decode that JPEG, compute the absolute difference in
each RGB channel, multiply by a display gain (default 15), and clamp to 0–255.
The mean measurement averages absolute differences across all pixels and RGB
channels before gain or clipping. It is expressed in 8-bit channel-value units.

ELA is available only for JPEG source signatures in this prototype. Edges,
textures, previous recompression, resizing, and encoder behavior can affect the
map. Brightness alone does not identify edited pixels. Browser quality values
are encoder controls, not recovered source JPEG quality, and results can differ
between browsers. This is not an exact reproduction of any author's implementation.

**Reference:** Jonas Wagner's [Forensically documentation](https://29a.ch/photo-forensics/#error-level-analysis)
explains recompression comparison and cautions that outputs can mislead; its
credits attribute the ELA concept to Neal Krawetz's presentation. Consulted
2026-11-03. The supplied presentation could not be retrieved during implementation;
no reproduction of its experiments is claimed.

### Noise residual / local high-pass view

**Question:** where is high-frequency variation visible in decoded grayscale?

Compute encoded-channel luma `Y = .299 R + .587 G + .114 B`, a 3 × 3 arithmetic
mean with clamped border coordinates, and `abs(Y - local_mean)`. Display this
absolute residual in grayscale with gain (default 8), clamped to 0–255. The mean
measurement is computed before gain in 8-bit luma-value units.

This is an elementary baseline chosen by the architect, not an original research
contribution or a sensor-noise estimator. Scene texture, edges, contrast,
sharpening, and noise contribute. Do not equate it with a published noise detector.
For comparison, [Forensically's noise analysis](https://29a.ch/photo-forensics/#noise-analysis)
documents a separable median filter; our mean-filter baseline differs and is not
an implementation or validation of that algorithm (reference checked 2026-11-03).

### Edge strength

**Question:** where are grayscale intensity transitions stronger?

Use the same luma approximation and clamped borders. Convolve with the conventional
3 × 3 Sobel kernels `[-1,0,1; -2,0,2; -1,0,1]` and
`[-1,-2,-1; 0,0,0; 1,2,1]`. Compute `sqrt(gx² + gy²)`. Display magnitude divided
by 4 and clamped to 0–255. The descriptive mean is the unscaled gradient magnitude.

This is an elementary structure visualization. Low texture, lower contrast, blur,
and scene content can all change it. It is not the user's threshold-sweep method,
a blur estimator, or a validated editing detector.

### Bit-plane inspection

**Question:** what structure appears in one bit of a decoded colour channel?

For selected channel R, G, or B and bit b = 0–7, display
`((channel_value >> b) & 1) × 255`. Report the fraction of pixels whose bit is set
as bit occupancy. This percentage is not a manipulation or payload probability.

This is elementary binary inspection. Browser decoding, colour handling, alpha
compositing, and lossy compression can alter low bits; this is not direct inspection
of encoded file bytes. Patterns do not establish steganography. No payload
extraction, decoding, or decryption is implemented.

## Minimal shared contract

`analyze(kind, pixels, width, height, options, reference)` is a pure computation
entry point accepting RGBA bytes for a normalized source. ELA additionally requires
the matching decoded recompression. It returns opaque display RGBA bytes, mean,
maximum, and method version. The call does not mutate the source.

This is a prototype JavaScript contract, not yet the cross-language package API.
The worker wraps this exact function; browser orchestration owns decoding and
recompression. A future evaluation runner must reproduce preprocessing and record
the JPEG encoder/browser as well as parameters when comparing ELA.

## Sample inputs

Eight small synthetic images are available in
[`tests/fixtures/images/`](../tests/fixtures/README.md): a reference chart, benign
JPEG processing, controlled smoothing and copy-move edits, and a known red-bit
pattern with a control. Three construction masks and a checksum manifest document
what changed. They are exploratory software fixtures, not camera images or a
representative detection benchmark. The fixture README explains how to use and
regenerate them. Other file types can later live alongside `images/` under
`tests/fixtures/`.

## Verification and next research step

Numerical checks (Node.js with built-in test support; checked with Node 24):

```bash
node tests/analysis.test.mjs
```

Seven checks cover constant-field invariants including borders, an analytic step
edge, an impulse residual, known ELA differences and clipping, channel/bit
selection, source preservation, and explicit invalid-input failures.

For browser integration checks, run the local server described in
[publishing](publishing.md), then open `tests/browser.html` under the served project
path. The page creates its own PNG and JPEG inputs and exercises the actual input
handler and worker pipeline. Eight checks cover initial disabled controls, PNG
and transparency handling, selected analysis, invalid input, all four methods,
stale settings, clearing in-flight work, and rapid replacement. It does not test
the operating system's file picker or native drag-and-drop.

On 2026-11-03, all seven numerical and eight browser checks passed. The workbench
was also exercised through its visible demo controls at `/gazoken/` and inspected
at desktop and 390-pixel mobile widths in Brave. Automated native file selection
was blocked by the browser extension's local-file permission; no browser settings
were changed. The Save-PNG click produced no application error, but automated download-event
verification timed out; delivery and native drag-and-drop still need manual checks.
No scientific accuracy benchmark or other-browser validation has been performed.

Next, select a bounded published claim, collect controlled originals and edits,
and evaluate sensitivity and false alarms independently of these software checks.

## Browser API references

Checked 2026-11-03:

- [MDN: reading canvas pixels](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData).
- [MDN: canvas encoding and JPEG quality controls](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob).
