# Phase 2, step 2.2 — Browser spatial measurements

The static adapter accepts the browser-decoded RGBA pixel package for JPEG, PNG,
or WebP. It reports an exact whole-image histogram for derived RGB luminance or
separate RGB channels, global luminance mean and population standard deviation,
and sampled local measurements. Each retained window reports its luma mean and
standard deviation, mean central-difference gradient magnitude, and optionally
the fraction of pixels with at least one RGB channel exactly at 0 or 255.

`window_size` is 8–512 pixels. Windows are non-overlapping. When the complete
grid would exceed 4,096 windows, a regular spatial sample is selected across the
image and its row/column sampling steps and represented-pixel coverage are
reported. Pixel processing runs in a module worker, with a 60-second timeout and
the browser viewer's existing 12-megapixel input limit.

The browser UI intentionally offers derived RGB luminance and separate RGB
channels only. The catalog's native first-stored-component option is unavailable
from browser-decoded RGB. The low-texture mask is also omitted because the catalog
does not define an eligibility threshold; local variation is reported without
classifying regions. These limits are reported on every result. Endpoint values
are simple display-space clipping indicators after the browser's color handling
and alpha-on-white compositing, not a sensor saturation measurement.

The isolated adapter is `assets/js/steps/spatial-measurements.mjs`; worker
calculations are in `assets/js/pixel-analysis.mjs`. Results are exploratory
descriptions of this browser decode. Local variance, gradients, or clipping do
not establish editing, a processing cause, or image authenticity.
