# Phase 2, step 2.1 — Browser-decoded reference manifest

The static workbench records the decoded pixel representation that the browser
already produced for display. It reports source identity, width and height,
channel names, numeric type, memory layout, coordinates, and the browser's decoder,
color, alpha, and orientation provenance. It does not decode a second copy.

The module is `assets/js/steps/decoded-reference.mjs`. It uses the common
`SourceContext` and supports browser-decoded JPEG, PNG, and WebP inputs. The
current viewer composites transparency onto white, captures RGBA 8-bit pixels,
and records a top-left pixel-coordinate origin. The exact browser decoder version
is represented by the browser user agent. Image limits remain those of the
existing viewer.

This manifest makes the browser pixel representation explicit for later static
tools. Browser decoder/color/orientation behavior can vary, so it is not the
reproducible Python decode planned by the catalog, a native JPEG component-plane
reader, or a clean-camera reference. Those decoder choices remain unresolved in
the Python workbench. Measurements derived from this package must retain this
provenance and must not be described as if they came from another decoder.
