# Step 1.7 — Byte distribution

The tool counts each of the 256 possible byte values in the original encoded
JPEG file and reports Shannon entropy in bits per byte:

\[H = -\sum_{b:p_b>0} p_b \log_2(p_b),\qquad p_b = n_b/N\]

where `n_b` is the count for byte value `b` and `N` is the file length. The
histogram is exact. The static result card plots the counts as an SVG chart; each
bar's tooltip gives its byte value and count. The current scope control supports
whole-file measurement only, including JPEG headers and coded image data.

## Interpretation and limits

This is a descriptive summary of the encoded byte stream. Entropy does not say
where byte values occur in the image, identify an encoder, measure editing, or
provide a tampering probability. Different files and encoding choices can have
similar distributions. No research claim or detection accuracy is made.

The browser adapter at `assets/js/formats/jpeg/steps/byte-distribution.mjs`
operates on the original `SourceContext` bytes and uses the existing bounded
byte-statistics helper. It does not use decoded pixels. It returns the 256-bin
histogram and entropy with source identity and method version. Its scope matches
the only currently selectable catalog value, **Whole file**.

The Python implementation is
[`src/gazoken/tools/encoded/byte_distribution.py`](../src/gazoken/tools/encoded/byte_distribution.py).
