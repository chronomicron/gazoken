# Step 1.9 — Stored quantized DCT arrays

Implemented locally, 2026-11-04; adapter version 1.0.0. This reads the actual
stored quantized coefficients, not a DCT recomputed from decoded pixels.

## Install and run

Python 3.11+ and a supported jpeglib wheel/platform are required. From the checkout:

```bash
.venv/bin/pip install -e '.[coefficients]'
.venv/bin/gazoken
```

The optional extra pins jpeglib 0.14.0 and setuptools 80.9.0 (the reader imports
`pkg_resources`, removed from newer setuptools), with NumPy >=1.26,<3. Base
installation still runs the earlier tools. If the extra is missing or the reader
is unsupported, step 1.9 fails with an actionable diagnostic; no fake measurement
or package is returned. No dependencies install automatically during analysis.

Select **1.9**, choose **Auto (jpeglib)** or **jpeglib**, and Run step. The legacy
`jpeglib candidate` value is accepted as an alias. `Not selected` requires an
explicit selection; `jpegio candidate` fails clearly because that reader is not
integrated. Old setting values still import without silently selecting jpegio.

`components` selects all stored components or only the first. The native decoder
still reads all components; selection controls the published package. Original
component IDs/indices are preserved; no unsupported color-space interpretation is
assigned to arbitrary component IDs. Select 1.12 in the same run to include its
record in the evidence report.

## Representation and outputs

The new immutable `CoefficientPackage` contains component byte buffers in signed
16-bit **little-endian**, ordered `[block_row, block_column, v, u]`, with each
8×8 frequency block in natural row-major order. It records source SHA-256, image
dimensions, jpeglib version and libjpeg version (explicitly selected `6b`). Each
component records original ID/index, horizontal/vertical sampling, block shape,
quantization-table ID and 64 natural-order quantization values. Quantization has
**not** been multiplied into these stored coefficients. No inverse DCT, color
conversion, orientation handling or pixel reference is produced.

The runner passes a successful package to subsequent selected tools declaring
`coefficients`. No prerequisite runs automatically. The package is fixed for that
plan; source mismatch, undeclared providers or attempted replacement fail without
committing derived inputs. The runner publishes produced inputs atomically.
Python callers may pass an existing package using `run_plan(..., coefficients=p)`.

JSON/API/session reports contain package descriptors, component/content hashes,
quantization values and **one first-block sample per selected component**. They do
not serialize full coefficient buffers. The GUI displays component shapes and
provenance, not a coefficient heatmap or pixel image. Full packages are available
inside Python adapters; for direct Python inspection:

```python
from gazoken.tools.contracts import ImageSource, ToolInputs
from gazoken.tools.encoded.stored_coefficients import run

result = run(ToolInputs(ImageSource(jpeg_bytes, 'source.jpg')), {
    'reader': 'jpeglib', 'components': 'All stored components',
})
package = result.coefficients
first_block = package.components[0].block(0, 0)  # 64 immutable integer values
# Optional NumPy view; data is immutable, use .copy() for working data:
# np.frombuffer(package.components[0].data, dtype='<i2').reshape(rows, cols, 8, 8)
```

Call `run_plan` for schema validation/execution records; direct calls above must
supply the documented parameters themselves. Component grids are the stored block
grids, rounded up at image edges. Chroma grids follow their sampling factors;
padding values should not be mistaken for extra image pixels. The package hash
includes component bytes, shape, assignments and reader/source provenance.

## Supported scope and process bounds

Supports one complete **8-bit SOF0 baseline or SOF2 progressive frame**, grayscale
or three components, with in-file quantization/Huffman tables. Before native work,
the existing structural/table tools check bounded declarations. Geometry is limited
to 12 megapixels and **8 million total stored coefficients**, whichever is stricter;
all components count even when only the first is requested. Redefined quantization
tables are rejected in this increment to avoid assigning final tables incorrectly.

Native reading runs in a separate fixed-command Python worker, not in the web
server process. Source bytes are copied into a private temporary directory;
metadata and coefficient files are removed when the call completes or fails. This
means the file can touch local temporary storage; no third-party upload occurs.
The command never accepts user-controlled executable paths. Wall timeout is 30s.
On POSIX, CPU is limited to 20s, address space to 3 GiB, and individual output files
to 32 MiB. Windows retains the wall timeout and preflight/output bounds, without
these POSIX resource limits. This is failure containment, **not a security sandbox**.
A hard interruption of the parent process can leave OS temporary files behind.

Returned dimensions, every component shape, byte count, table ID and quantization
values are checked against the original declarations. Native stderr is file-bound;
any remaining diagnostic rejects the result. Only the known `pkg_resources` import
deprecation is suppressed in the worker. Reader failures/exits/timeouts publish no
package and do not prevent later selected tools from executing.

Not supported: arithmetic coding, lossless JPEG, CMYK/four components, hierarchical
JPEG, abbreviated streams requiring external tables, truncated files, quantization
redefinitions, or general JPEG conformance validation. No previous-compression,
encoder attribution or editing score is inferred. 1.10 statistics remains separate.

## Dependencies, sources and verification

Tested on Linux x86-64, Python 3.12, jpeglib 0.14.0, libjpeg 6b, NumPy 2.5.4 and
setuptools 80.9.0. Wheel availability and native behavior on other platforms are
not verified. jpeglib's installed LICENSE is **MPL-2.0**; it bundles JPEG codec
implementations under their own notices. It is an optional external dependency;
no third-party native source or wheel is vendored into Gazoken. NumPy is external
under its BSD-style license. Distribution of bundled dependencies would need to
retain their applicable notices; this change does not create an installer.

Primary references checked 2026-11-04:

- [jpeglib DCT API](https://jpeglib.readthedocs.io/en/latest/reference.html):
  coefficient layout, lazy access and documented native-exit behavior.
- [Author repository](https://github.com/martinbenes1996/jpeglib): codec selection
  and installation. Version 0.14.0 was selected to match the reviewed API, rather
  than automatically adopting a newer release.

Ten focused tests cover hand-encoded positive/negative DC and nonzero AC values,
DC prediction/odd dimensions, baseline/progressive equality and quantization
references, immutable/source-bound layouts, provider handoff, absent dependencies,
undeclared/foreign packages, component selection, bad inputs, oversized geometry,
native warnings/exits/timeouts. Native tests skip without the optional extra;
contract tests still run. These are software correctness checks, not validation of
a forensic detector. Known coefficient streams are constructed directly in tests,
independently of jpeglib's encoder. No pixel decode is used as an oracle.

```bash
.venv/bin/python -m unittest tests.tools.test_stored_coefficients -v
```

Integration verification (2026-11-04): 69 Python API/adapter checks and 37
JavaScript checks passed with the optional extra installed; all ten new checks
ran without skips. `pip check`, module syntax, documentation links and Git
whitespace checks passed. GUI verification read the bundled 768×512 JPEG in
about 0.3 seconds on this machine and displayed three 64×96 component block grids
with matching quantization assignments and reader provenance. This is a smoke
measurement, not a performance benchmark. Changes committed locally, not pushed
or deployed. Installed optional environment dependencies are separate from Git;
reverting this increment removes the integration but does not uninstall packages.
