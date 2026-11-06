# Phase 3, step 3.3 — Browser RGB channel relationships

The static browser adapter runs on the decoded pixel package and summarizes
whole-image RGB channel distributions. It reports each channel's 256-bin
histogram (optional), mean, and population standard deviation; Pearson
correlations for R–G, R–B, and G–B; and the count/fraction below a configurable
saturation floor. Saturation is defined as `(max(R,G,B) - min(R,G,B)) / max(R,G,B)`;
when all channels are zero, saturation is defined as zero.

The report overlays R, G, and B histograms in one SVG chart. It identifies the
browser decoder, color handling, alpha compositing, and coordinate policy through
the source-linked pixel package. Browser output is partial: it does not calculate
hue maps, regional comparisons, or the catalog's wavelet-ratio candidate. Hue
analysis near zero saturation remains unreliable; the low-saturation fraction is
descriptive support information, not a correction for hue.

The adapter is `assets/js/steps/color-relationships.mjs`; its pixel loop runs in
the shared module worker through `assets/js/pixel-analysis.mjs`. This is a
descriptive RGB summary, not a forensic color-processing test or an attribution
method. Differences and channel correlations do not establish edits, lighting
history, camera identity, or authenticity.
