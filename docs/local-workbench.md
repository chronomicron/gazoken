# Local Python research workbench

Updated: 2026-11-04  
Version: 0.3.0 — Phase 1 and Phase 2 framework; two basic Python measurements

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
Stop with Ctrl+C in the launching terminal. After upgrading from the Phase 1-only
version, restart the Python process and hard-refresh the browser (Ctrl+Shift+R)
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
3. Switch between the twelve Phase 1 and eleven Phase 2 cards. Each has a named parameter group,
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
the active phase (twelve or eleven steps). A phase is marked partial until all steps have completed; a
completed request containing placeholders does not mean a completed phase.
Only runs matching the current source hash contribute. Changing/clearing sources
resets both cards and summary; changing parameters alone preserves historical cards.

**Download phase report** saves a separate JSON summary containing latest per-step
results and executed parameters. The full session export includes that summary
and every run from both phases. The framework summaries are separate from the
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
probability is fabricated. Phase 2 provides configuration controls only; Phase 3
remains a noninteractive roadmap placeholder.

## What runs today

| Step | Python handler | Result |
| --- | --- | --- |
| 1.1 Source identity | Implemented; automatic on load and independently runnable | Filename, byte count, SHA-256, SOI signature, acquisition note. Signature recognition is not full JPEG validation. |
| 1.7 Byte distribution | Implemented | Exact 256-bin whole-file histogram and Shannon entropy in bits/byte. Descriptive only. |
| Other Phase 1 steps | Not implemented | Validated configuration and explicit status; no analytical output. |
| All eleven Phase 2 steps | Not implemented | Parameter records linked to the same original JPEG; no Python decode or spatial analysis. |

Future-method parameters are provisional scaffolding. Selecting a library does
not install or invoke it. Coefficient steps declare their intended dependency
on 1.9; dependency execution is not implemented because those handlers do not
exist. Both implemented steps directly consume original bytes. There is no CPU
job queue, cancellation, batch CLI, or persistent experiment database yet.

## Phase 2 — decoded-image framework

Load a JPEG once in either phase. Both phases share the original bytes, file
identity, and browser display preview. Switching phases preserves settings,
selection, expanded groups and run history. Source replacement/clearing resets
records in both phases. Selection actions affect the active phase only.

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
The Phase 2 download is `gazoken-phase-2-report.json`; full-session export schema 2
contains all 23 configurations and separate `phase_reports`. Schema 1 Phase 1-only
settings remain importable: Phase 2 is initialized to defaults, and no source or
old measurements are imported. Browser storage and automatic persistence remain off.

## Code boundaries and adding a method

- `src/gazoken/web/steps.json`: shared step catalog, selection defaults, labels,
  typed parameters, notes, and implementation status.
- `src/gazoken/pipeline.py`: reusable input/parameter validation, measurements,
  and result records; imports no UI or FastAPI code.
- `src/gazoken/server.py`: bounded local uploads and API/static routes.
- `src/gazoken/web/`: controls and evidence renderers.

Revise a step's parameter specification; implement a method in the analysis
package; connect it in `run_plan`; add correctness/reference cases and update
coverage before changing its status to `ready`. Add an appropriate result
renderer without modifying the source. Future expensive methods need background
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

Nine API checks cover real/placeholder separation across twenty-three steps, hash/count
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
