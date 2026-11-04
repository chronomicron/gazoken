# Local Python research workbench

Updated: 2026-11-04  
Version: 0.5.0 — modular tool foundation; four registered Python measurements

## Launch

Run from the Gazoken source checkout. Initial setup:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[test]'
```

Start the app:

```bash
.venv/bin/gazoken
```

Open <http://127.0.0.1:8765/>. Use `--port 8766` if the default port is occupied.
Stop with Ctrl+C in the launching terminal. After updating the framework or step catalog, restart the Python process and hard-refresh the browser (Ctrl+Shift+R)
to load the expanded catalog. Python 3.11+ is required. The package
currently needs an editable installation from this checkout: browser inspection
modules and the synthetic sample use sibling repository assets. Standalone wheel
distribution is not supported yet.

This is a custom HTML/CSS/JavaScript interface served by FastAPI, not Open WebUI
or a desktop widget toolkit. GitHub Pages remains the separate static public
workbench and cannot launch this Python app for remote visitors. Existing
`index.html` and `jpeg.html` entry points are preserved.

## Workflow and visualizations

1. Choose or drop a JPEG up to 25 MiB, or open the bundled synthetic reference.
2. Source identity runs automatically in Python. A separate existing browser
   worker parses raw structure for display previews.
3. Switch between twelve Phase 1, eleven Phase 2, and fourteen Phase 3 cards. Each has a named parameter group,
   inclusion checkbox, view button, implementation status, and per-step run button.
4. Run implemented steps or a selected plan. Unimplemented steps record their
   parameters with `not_implemented` and null output.
5. Export the session as JSON; import a prior export to restore settings only.
   Imported source identity/results are not attached to a new source.

The controls now use larger parameter labels/inputs, darker supporting text and
stronger borders. Step actions wrap into two columns with an independent inclusion
checkbox row, preserving readable controls as parameter lists grow.

## Step cards and the phase report

Below the image and observation desk, every execution appends a report card in
execution order, including reruns. Completed identity measurements use a value
table; byte statistics use a histogram and entropy measurement. Cards retain the
actual parameter snapshot, timestamp, method version, runtime, and status from
that execution. Planned steps use compact expandable records and explicitly state
that no measurement was produced.
Future adapters can add result-specific figures/tables or use the generic JSON
renderer until their visualization is implemented.

Each phase has a summary following its run journal. It reports the latest attempt per
step, attempt counts, source hash, and measured/unrun/unimplemented coverage across
the active phase (12, 11, or 14 steps). A phase is marked partial until all steps have completed; a
completed request containing placeholders does not mean a completed phase.
Only runs matching the current source hash contribute. Changing/clearing sources
resets cards and summaries across all phases; changing parameters alone preserves historical cards.

**Download phase report** saves a separate JSON summary containing latest per-step
results and executed parameters. The full session export includes that summary
and every run from all three phases. The framework summaries are separate from the
future 1.12 and 2.11 Python analysis adapters, which remain unimplemented. Neither is an authenticity verdict.

The stage offers fit/100%/200% display, an optional 64-pixel coordinate guide,
an encoded-byte color map, and numeric quantization heatmaps. The guide is an
annotation in display coordinates, **not a detected JPEG grid**. Image display
uses browser color/orientation handling and is not a reproducible scientific
decoder. Raw frame dimensions may differ from oriented display dimensions.
Rendering is skipped above 12 megapixels; encoded inspection can continue.
Malformed files may have partial structural reports.

The byte map colors byte values in file order. Large files are sampled with the
stride stated in the view; this is not a spatial layout of the photograph. The
histogram uses exact counts, a per-chart maximum and a linear count scale; it
includes headers and coded scans. Quantization charts display up to four
definitions, each with its own labeled color range. Natural order denotes (u,v);
zigzag view is a sequence wrapped to eight columns, not a frequency map.

The observation desk distinguishes **Python measurement**, **browser preview**,
and **configuration**. Previews reuse the existing bounded JPEG/EXIF parser and
are not new Python implementations. GPS directory rows are hidden by default;
browser metadata previews are not included in session exports.

Intermediate-image and overlay space is established by the viewer. No forensic
heatmap, coefficient array, inferred camera, past quality estimate, or calibrated
probability is fabricated. Phases 2 and 3 provide configuration controls only; the browser preview is not a
Python decoded reference and prerequisites are not automatically executed.

## What runs today

| Step | Python handler | Result |
| --- | --- | --- |
| 1.1 Source identity | Implemented; automatic on load and independently runnable | Filename, byte count, SHA-256, SOI signature, acquisition note. Signature recognition is not full JPEG validation. |
| 1.2 File structure | Implemented | Marker map, frame dimensions/sampling, scan layout, DRI intervals, trailing-byte count and partial-data warnings. See [coverage](file-structure.md). |
| 1.4 Quantization atlas | Implemented | Exact DQT values, precision, layouts, component assignments, scan-time definition references and partial-data warnings. See [coverage](quantization-tables.md). |
| 1.7 Byte distribution | Implemented | Exact 256-bin whole-file histogram and Shannon entropy in bits/byte. Descriptive only. |
| Other Phase 1 steps | Not implemented | Validated configuration and explicit status; no analytical output. |
| All eleven Phase 2 steps | Not implemented | Parameter records linked to the same original JPEG; no Python decode or spatial analysis. |
| All fourteen Phase 3 steps | Not implemented | Typed settings and explicit unmet requirements; no processing-history algorithms, reference matching or model inference. |

Future-method parameters are provisional scaffolding. Selecting a library does
not install or invoke it. Coefficient steps declare their intended dependency
on 1.9; dependency execution is not implemented because those handlers do not
exist. Both implemented steps directly consume original bytes. There is no CPU
job queue, cancellation, batch CLI, or persistent experiment database yet.

## Phase 2 — decoded-image framework

Load a JPEG once in any phase. All three phases share the original bytes, file
identity, and browser display preview. Switching phases preserves settings,
selection, expanded groups and run history. Source replacement/clearing resets
records in all phases. Selection actions affect the active phase only.

The Phase 2 banner explicitly says **Python decoder pending**. The browser image
is not a fixed research decode, and choosing decoder/color/orientation settings
has no effect on the displayed source. A real reproducible reference, dependency
execution, intermediate pixels and coordinate-mapped detector overlays are future
method work. No source is repeatedly rotated, filtered or recompressed by this
framework.

| Step | Configuration scope | Expected future artifacts |
| --- | --- | --- |
| 2.1 Decoded reference | Decoder candidate, representation, orientation, color policy | Reference pixels, decoder manifest, coordinate mapping. |
| 2.2 Spatial measurements | Channel, window size, clipping/texture flags | Histograms, local measurements and eligibility masks. |
| 2.3 Current JPEG grid | Method preference, window and stride | Boundary response, phase map and support overlay. |
| 2.4 Displaced earlier grids | Phase-search policy, window and candidate retention | Earlier phase candidates and supporting regions. |
| 2.5 Calibration/recompression | Operation, candidate quality setting and sampling | Explicit derived copies, residuals and provenance. |
| 2.6 Regional compression | Tile size, stride and coverage | Regional maps and measurement tables. |
| 2.7 Main image vs previews | Registration candidate, comparison size and overlap | Registered image pairs and comparison records. |
| 2.8 Scaled earlier grids | Fractional period range/increment | Spacing responses and conditional candidates. |
| 2.9 Rotated earlier grids | Angle range/increment | Orientation responses and lattice hypotheses. |
| 2.10 Threshold/directional study | Review mode, edge-operator candidate, threshold count | Later baseline comparisons; no proposed method is executed. |
| 2.11 Spatial JPEG report | Graphics, alternatives and coverage options | Future spatial evidence assembly. |

Each step has a brief explanation, provisional typed parameters and an **Inspect
view** action showing expected outputs labeled **not generated**. **Record settings**
records one step; **Record selected plan** records the active selection. Both
produce explicit `not_implemented` cards. Declared prerequisites (including 1.6
for embedded previews) are informational until method adapters exist. Numeric
validation checks finite values and per-field ranges, not scientific adequacy or
relationships between proposed search bounds.

Cards and phase summaries show only their own phase's records and keep original
session run numbers. A Phase 1 identity record does not count as Phase 2 execution.
The Phase 2 download is `gazoken-phase-2-report.json`; full-session export schema 3
contains all 37 configurations and separate `phase_reports`. Schema 1 initializes
Phases 2 and 3 to defaults; schema 2 retains Phase 1/2 settings and initializes
Phase 3 defaults. Schema 3 imports all phases. Imports reject missing, duplicate,
unknown or invalid settings and restore settings only; no source or old measurements
are imported. Browser storage and automatic persistence remain off.

## Phase 3 — processing-history framework

The third tab shares the same original bytes, SHA-256 and browser preview.
All fourteen groups have **Inspect view**, **Record settings**, inclusion controls,
and a **Record selected plan** action. Each records `not_implemented` with null
output. Parameter defaults are provisional; they are not validated experiment
settings. Phase 1 planned steps also use the functional Record settings action.

| Step | Configuration scope |
| --- | --- |
| 3.1 Resampling | Representation, method preference, windows, scale bounds, response request. |
| 3.2 Tonal mappings | Channel, mapping family, histogram bins, regional window. |
| 3.3 Hue/channel relationships | Color representation, saturation support, regional plots. |
| 3.4 White balance/illumination | Regional method and missing-metadata policy. |
| 3.5 Blur/sharpness | Measurement and blur-model preference, support windows. |
| 3.6 Filtering/denoising | Operation family, proposed kernel width, residual request. |
| 3.7 Sharpening | Profile radius, regional support, descriptive profile request. |
| 3.8 Noise consistency | Patch size/count, scope, noise-curve request. |
| 3.9 CFA/demosaicing | Pipeline assumption, window/stride, consistency request. |
| 3.10 Sensor references | Manifest note, unmet enrollment requirement, alignment preference. |
| 3.11 Learned traces | Unavailable model preference, weights-manifest note, tile/overlap. |
| 3.12 Copy-move | Descriptor preference, block size, separation and match-count bounds. |
| 3.13 Compositing/physical consistency | Test preference, scope and scene-assumption notes. |
| 3.14 Operation order | Finite candidate pair, limit, prerequisites and unresolved alternatives. |

Reference/model identifiers are notes only: no picker, enrollment, installation,
weights download or inference is implied. Expected artifacts are explicitly marked
**not generated**. Declared inputs are neither verified nor executed by the
framework. Fields are type/range checked; cross-field scientific adequacy (such
as minimum/maximum bounds, valid kernel widths, or overlap relative to tile size)
remains for the eventual method adapter. No authenticity score is produced.

The Phase 3 journal, executed parameter snapshots, coverage and downloadable
`gazoken-phase-3-report.json` remain isolated from other phases. Clearing or
replacing a source discards all phases' run records while retaining settings.
Changing settings does not rewrite previously executed snapshots.

## Code boundaries and adding a method

- `src/gazoken/web/steps.json`: stable step IDs, typed parameters, and tool input declarations.
- `src/gazoken/catalog.py`: resolves executable coverage from the explicit registry.
- `src/gazoken/tools/contracts.py`: immutable original bytes, optional decoded pixel package, and tool outputs.
- `src/gazoken/tools/registry.py`: explicitly registered executable adapters.
- `src/gazoken/tools/{encoded,decoded,history}/`: isolated modules by phase.
- `src/gazoken/pipeline.py`: validates plans, calls adapters sequentially, and records provenance and failures.
- `src/gazoken/server.py`: bounded local uploads and API/static routes.
- `src/gazoken/web/`: controls, selected call order, input availability, and evidence renderers.

Follow [tool development](tool-development.md) for the contract, complete folder map,
module and documentation templates, tests, and registration checklist. Each tool uses
`run(inputs, parameters)`. Unregistered tools record configuration only; registered
tools with missing prerequisites are blocked. A failed adapter is recorded without
preventing subsequent calls. No decoder is registered yet. Browser previews are not
passed off as canonical Python pixels. Future expensive methods need background
execution/cancellation instead of today's short synchronous handler dispatch.
Paper-specific evaluations remain in the private research checkout.

`run_plan(data, filename, plan)` works without the HTTP server. It records
normalized parameters, source SHA-256, UTC timestamp, framework/method version,
Python version, elapsed time, status, and measurements. Export adds current
configuration and run history, omitting original bytes, decoded pixels, and
browser metadata. Code revision, dataset provenance, and full dependency locks
still need a study record; the export alone is not a complete paper artifact.

## Local data handling

The launcher binds to `127.0.0.1` only. Bytes travel from the browser to that local
Python process. There are no third-party fonts/scripts, telemetry, remote image
uploads, browser storage, or external inference services. Request size is bounded
before multipart parsing. Transient uploads may spool to the OS temporary
directory and are closed after processing. The backend does not retain sources
between requests. The browser holds the current source/journal until cleared,
replaced, or closed. Clearing retains settings; replacing clears old run records.

Invalid replacements leave the previous source intact. Parameter edits do not
rewrite historical run configurations. Export explicitly downloads a file that
can contain source filenames and acquisition notes. Host/origin checks reject
foreign browser writes. This prototype is not for public network deployment.

## Verification

```bash
.venv/bin/python -m unittest discover -s tests -p 'test_workbench.py' -v
node --check src/gazoken/web/workbench.mjs
node tests/session.test.mjs
node tests/jpeg.test.mjs
node tests/analysis.test.mjs
```

The original Phase 2 verification used nine API checks for real/placeholder separation across twenty-three steps, hash/count
invariants, known entropy, parameter validation, invalid files, upload limits,
origin/host checks, asset serving and repository-file isolation. These verify
the framework, not forensic accuracy. Eight session checks cover export snapshot
isolation, settings roundtrip without importing foreign source/results, invalid
configuration rejection, unique-step/latest-attempt coverage, and source isolation
of phase reports, cross-phase isolation, legacy settings migration, and fractional
geometry parameters. Existing twenty JPEG and seven pixel numerical checks
also pass.

Browser QA in Brave covered the synthetic-source flow, a full twelve-step request
with two completed/ten unimplemented records, byte-histogram provenance, numeric
quantization views, overlay and zoom controls, and desktop/narrow responsive
layouts. Native file selection automation was blocked by the extension's file
access setting; that setting was not changed. The exported JSON was saved and inspected: its source hash, twelve configurations,
and two measured/ten unimplemented records matched the session. The automation
download-event signal timed out despite successful delivery. Native file selection
and end-to-end settings import still need manual confirmation. Other browsers have not been checked.

Follow-up browser QA on 2026-11-04 verified the larger control text (12px selection
actions, 12.5px inputs), appended identity/histogram cards, and unique-step phase
coverage after reruns. Running all twelve steps produced a partial report with two
measured and ten unimplemented steps; its downloaded JSON was inspected. Desktop
and narrow layouts showed no horizontal page overflow, and no browser errors
were recorded. Five session checks and the module syntax check pass.

Phase 2 verification (2026-11-04): nine API checks and eight session checks pass.
Browser QA verified unchanged source hash and preview URL across phase switches;
retained Phase 1 notes/selections and fractional Phase 2 parameters; eleven
configuration-only cards with zero completed measurements; phase-specific counts;
source loading from either phase; and clearing both histories together. Downloaded
Phase 2 and full-session JSON files were inspected for counts, phase IDs, executed
parameters, and source identity. Desktop and narrow layouts were inspected.
Native file-picker/import automation limits from the earlier checks still apply.

Technical references checked 2026-11-04:
[FastAPI uploads](https://fastapi.tiangolo.com/tutorial/request-files/),
[FastAPI static files](https://fastapi.tiangolo.com/tutorial/static-files/).

Phase 3 verification (2026-11-04): ten API tests, ten session tests, twenty JPEG
checks and seven pixel checks pass; both UI modules pass syntax checks. API tests
cover catalog order across 37 steps, Phase 3 typed bounds, unchanged source bytes,
and null planned outputs. Session tests cover schema 1/2 migration, schema 3
roundtrip, retained snapshots and cross-phase/source isolation. Browser QA on an
independent loopback port verified all fourteen groups, single-source phase
switching, retained Phase 1 notes, Phase 2 records, Phase 3 reruns and a fourteen-step
plan showing zero measured outputs. Clearing removed all three histories while
retaining settings; a new source was loaded directly from Phase 3. Desktop and narrow layouts had no horizontal
overflow. Phase 3 and full-session JSON downloads were inspected: all 37 settings, three
phase reports, executed snapshots and expected unimplemented counts matched. The
extension did not expose a download event despite successful file delivery. Native
picker/import confirmation remains limited by browser automation; serialization
and migration paths are covered in tests.

Restart the user's existing process after review: stop it with Ctrl+C in its
terminal, then run `.venv/bin/gazoken --port 8766` and hard-refresh the browser.
The verification server uses port 8771 and does not replace the user's process.


Modular tool foundation verification (2026-11-04): 17 Python checks (ten API and
seven tool-contract checks), ten session checks, twenty JPEG parser checks, and
seven pixel-analysis checks passed. Contract checks cover source preservation,
pixel provenance, explicit provider handoff, missing-input blocking, invalid
outputs, and continuing after an adapter failure. Desktop browser verification
loaded the synthetic reference and ran 1.1 and 1.7 through the registry in order;
the selected call list and per-tool input records were inspected. No new detector
or canonical decoder was added. Changes remain local and undeployed.

## Bundled sample gallery

The persistent **Explore a sample** selector offers the reference quality-90
JPEG, its quality-55 recompression, and a JPEG with a known locally blurred region.
Each describes its construction and an appropriate comparison. Opening a sample
uses the ordinary source replacement path, clearing previous run history while
retaining settings. Only implemented measurements execute; the blur example does
not enable an automatic edit detector. `/api/samples` lists the public JPEG cases;
`/api/sample?id=reference|recompressed|smoothed` serves allowlisted files.

The separate static workbench also offers blank/pattern red-bit-0 PNG controls.
Select Red / bit 0 there to explore the known pattern. The Python framework and
raw JPEG inspector accept JPEG only. See [fixtures](../tests/fixtures/README.md)
for ground truth and [distribution options](publishing.md#browser-demo-and-full-local-app)
for browser versus local use.

Gallery verification (2026-11-04): 18 Python API/contract checks and 37 JavaScript
checks passed. API checks compare all three served JPEGs with their documented
fixture bytes and reject unknown sample IDs. Browser checks loaded recompressed
and smoothed JPEGs in the local app, parsed the smoothed JPEG in the static
inspector, and completed Red / bit 0 analysis on the pattern PNG in the static
workbench. Desktop gallery appearance was inspected. No deployment was performed.


Step 1.4 added (2026-11-04): the [quantization atlas](quantization-tables.md) is
now a registered Python measurement. Implemented adapters are 1.1, 1.4 and 1.7;
other steps remain configuration-only. It records exact tables and assignments,
partial-data warnings, and optional definition history. Earlier verification counts
above describe their dated increments. Restart the server for catalog changes.


Step 1.2 added (2026-11-04): the [file-structure adapter](file-structure.md) now
executes through the common registry. Current executable IDs are 1.1, 1.2, 1.4
and 1.7; the next implementation priority is bounded metadata inventory (1.3).
Selected analytical execution remains numeric order. Restart for catalog changes.
