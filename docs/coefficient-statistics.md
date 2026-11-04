# Step 1.10 — Coefficient statistics

Implemented locally, 2026-11-04; adapter version 1.0.0. Uses the existing immutable
stored quantized-DCT package, without decoding pixels or re-encoding images.

## Run

Select **1.9 and 1.10 together**, then Run selected. Add 1.12 for an assembled
report. Step 1.9 requires the optional `.[coefficients]` installation; 1.10 itself
uses only the Python standard library. The runner does not invoke prerequisites
implicitly. Running 1.10 alone without a package returns `blocked`, not a result.
Separate browser runs do not retain the binary coefficient package.

```python
from gazoken.pipeline import run_plan, run_step
run = run_plan(jpeg_bytes, 'source.jpg', [
    {'id': '1.9'},
    {'id': '1.10', 'parameters': {'frequency_count': 9, 'zero_fractions': True}},
    {'id': '1.12'},
])
# Python callers can also reuse an explicitly supplied source-bound package:
# run_step(jpeg_bytes, 'source.jpg', '1.10', coefficients=package)
```

## Parameters and output

`frequency_count`: integer 1–63, default 9. Inspect DC **plus** the first N AC
positions in zigzag order. Positions are converted into natural `(u,v)` coordinates
before reading the package's `[block_row, block_column, v, u]` values. This is not
simply the first N row-major array slots. `zero_fractions` defaults true; false
omits explicit zero count/fraction fields, but exact histogram bins remain unchanged.
This is a display/output choice, not suppression of zero-valued observations.

Results retain full coefficient package descriptors and hashes (no binary arrays),
selected AC count, frequency order, histogram-bin count and per-component records.
Each component retains original ID/index, block dimensions, sampling and table ID.
Each frequency records:

- Zigzag index (0 is DC), kind, natural `u,v` and associated quantization step.
- Sample count: one coefficient per stored block in this component.
- Exact signed-integer histogram as sorted `[value, count]` pairs; unlisted bins
  have zero observations. No smoothing, clipping or normalization is applied.
- Minimum, maximum and arithmetic mean.
- Population variance, divided by N (not the sample estimator divided by N−1).
- Optional exact zero count and zero fraction in [0,1].

For values x with bin counts n, the implementation accumulates integer sums S and
squared sums Q, then reports mean S/N and variance `(Q*N - S*S)/(N*N)`. Integer
accumulation avoids integer overflow and cancellation from subtracting rounded
floating-point moments. Final means/variances/fractions use Python floats.
Singleton and constant populations therefore have zero variance.

The GUI displays a per-component frequency summary; expand **Exact histograms and
coefficient provenance** for full bins and provenance. Step/session/evidence
exports retain these measurement records. Histogram rendering as plots is not
added in this increment. Raw report-card JSON is collapsed behind an expandable
detail so exact histograms do not overwhelm the page; exports retain full records.

## Interpretation and limits

Values are the **stored quantized integers**, not dequantized DCT amplitudes or
pixel intensities. Means use coefficient units; variance uses squared coefficient
units. Quantization steps are reported for context, not multiplied into values.
No components are pooled and no unequal block populations are silently combined.
All stored blocks count, including boundary blocks containing encoder edge padding.
The first-component selection made in 1.9 limits which components 1.10 receives.

These are descriptive distributions. They do not assume independent blocks, fit
Gaussian likelihoods, identify double compression, infer an encoder, or estimate
editing probability. Different content, quantization, sampling and processing can
change the same statistics; cross-image comparisons need controlled conditions.

The shared package limit is 8 million stored coefficients. This tool adds a limit
of **100,000 nonempty histogram bins across the complete result**. If exceeded,
it fails with an explicit diagnostic and commits no partial measurement. Reducing
selected frequencies/components reduces output size; no approximate substitute is
silently produced. Each signed-int16 frequency has at most 65,536 possible bins.
The coefficient package and original source are never modified; no new artifact
package is produced. Unsupported/native-input limitations belong to the 1.9 reader.

## Verification

Six tests cover exact analytic distributions and moments, zigzag mapping and
quantization lookup, full 64-frequency coverage, zero-field omission, separate
component populations, signed-int16 extremes, singleton variance, source/package
preservation, missing prerequisites, parameter bounds, bounded-output failure,
and the native-reader-to-statistics-to-report path. The native path uses a directly
hand-encoded two-block JPEG: DC [5,10], mean 7.5, variance 6.25 and zero AC values.
It skips without `.[coefficients]`; the other tests need no native dependency.

```bash
.venv/bin/python -m unittest tests.tools.test_coefficient_statistics -v
```

This is a Gazoken descriptive measurement, not a paper-specific detector or a
scientifically evaluated method. See [stored-coefficient representation and
reader references](stored-coefficients.md) for the upstream package contract.

Integration verification (2026-11-04): 75 Python API/adapter tests and 37
JavaScript tests passed, including all six new statistics checks with the native
extra available. GUI verification ran the ten implemented Phase 1 tools together;
1.10 displayed three component summaries with 6,144 block samples per frequency
and 2,092 nonempty bins in total for the bundled reference. Raw report-card JSON
was collapsed to keep the page usable; exact records remain expandable/exportable.
Phase 1 and project READMEs updated. Committed locally, not pushed or deployed.
