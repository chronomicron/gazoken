# Step 1.12 — Evidence report

Implemented locally, 2026-11-04; adapter version 1.0.0, report schema 1.

Select the Phase 1 tools to run **and 1.12**, then **Run selected**. The runner
executes selected tools in numeric order; the report receives a detached snapshot
of earlier results. **Inspect view** on 1.12 displays coverage and the assembled
JSON; **Download assembled report** saves `gazoken-evidence-report.json`.
Phase/session exports also retain the report as its executed step output.

```python
from gazoken.pipeline import run_plan
run = run_plan(jpeg_bytes, 'source.jpg', [
    {'id': '1.1'}, {'id': '1.7'}, {'id': '1.12'},
])
report = run['results'][-1]['output']
```

## Scope and parameters

Only earlier **Phase 1 records in this run** are included. Prior GUI runs,
imported sessions, browser previews, later Phase 2/3 steps, and the report itself
are excluded. No dependencies run implicitly. Running 1.12 alone is allowed and
produces zero records with an empty-input warning; it does not merge history or
rerun methods. This is different from the existing phase/session summary, which
can include several executions from the active browser session.

`include_measurements` defaults true; false removes raw `output` fields from the
report's copies. `include_warnings` defaults true; false removes copied warning
lists and explanatory limitations. Execution statuses, warning counts/flags,
partial-extraction flags and the no-verdict disclaimer always remain. Source
records are unchanged. These options are content controls, not privacy redaction;
parameters, metadata and produced-input descriptors can contain identifying data.

## Output and provenance

The report includes source identity, UTC generation time, framework/report versions,
Python version, report parameters, input evidence digest, copied executed records,
and coverage for steps 1.1–1.11. Unselected steps are `not_run`; planned, failed,
blocked and completed statuses remain distinct. A completed tool can still have
partial extraction or warnings; those are separately flagged. `completed_count`
counts executions, not scientifically validated methods. No combined probability,
independence assumption or editing conclusion is produced.

The additive `RunEvidence` input package contains an immutable JSON snapshot,
source identity and digest. The runner constructs it from its own result list only
for adapters declaring `run_evidence`. It is never accepted from HTTP uploads or
settings imports. Each tool still uses `run(inputs, parameters)`; ordinary source
and pixel tools continue unchanged. `records()` returns detached copies. The input
record exposes digest/count, not the serialized evidence payload. This is a
cooperative in-process boundary, not an authentication or security sandbox.

Evidence validates same-source linkage and at most 37 earlier records (the current
catalog size). No images or pixel buffers are serialized. The broader future
scientific evidence schema remains open. This report does not implement the
Phase 3 `evaluated_evidence` package or evaluate/correlate specialist scores.

## Verification

Six tests check numeric ordering, source linkage, snapshot immutability, detached
copies, standalone reports, no cross-run leakage, flag-controlled omissions,
partial-data flags, failed/planned/unrun distinctions and exclusion of later phases.
The report does not replace the software or scientific validation of its inputs.

```bash
.venv/bin/python -m unittest tests.tools.test_evidence_report -v
```

Integration verification (2026-11-04): 59 Python checks and 37 JavaScript checks
passed. GUI verification selected the seven implemented inspection steps and 1.12
together, displayed seven source-bound records and eleven coverage rows, and
downloaded/verified the assembled JSON. Phase 1/project READMEs and input-contract
decision D016 updated. Committed locally, not pushed or deployed.
