# Development workflow

Updated: 2026-11-04

## Local work and GitHub

The user works on local files in VS Code and pushes to
[chronomicron/gazoken](https://github.com/chronomicron/gazoken). Source,
documentation, experiment procedures, and eventual manuscript sources should be
versioned together where practical.

The following is an initial working convention, not configured branch protection
or CI:

1. Inspect the working tree and branch before editing. Preserve unrelated work.
2. Define a bounded task and completion criteria. Use a GitHub issue when useful
   for tracking a research question, bug, or shared change.
3. Use a focused branch for substantial changes. Agent-created branches use
   `codex/` unless directed otherwise. Coordinate overlapping files first.
4. Implement the change and update its documentation together.
5. Run proportionate checks and review the diff, including generated artifacts.
6. Commit coherent changes with descriptive messages. Push and use pull requests
   for substantive shared changes so rationale and validation are reviewable.
   The user controls the final merge and release workflow.

Useful local review commands, also available through VS Code Source Control:

```bash
git status --short
git diff
git diff --check
```

Agents should report whether edits are local, committed, pushed, or deployed;
these are separate states.

## Python, C, and C++ packages

The first Python package uses an editable `src/gazoken` layout and FastAPI with a
custom browser interface. See [local workbench](local-workbench.md) for setup,
framework boundaries, API checks, and adding a method. The executable adapter coverage is maintained in that guide and the Phase 1
README; C/C++ roles remain open.

All three languages are intended project outputs. Broader build systems,
bindings, and distribution channels remain undecided.
A method need not be independently reimplemented in every language; decide roles
and interoperability from actual research and performance needs.

When introducing a package, document:

- Purpose, research status, supported inputs, outputs, units, and error behavior.
- Build or installation commands, dependencies, supported environments, and examples.
- Public interfaces, versioning expectations, and any language bindings.
- Relevant correctness checks and reproducible performance measurements.
- Attribution, dependency licenses, and known limitations.

Keep method logic reusable apart from website presentation where practical. This
is implemented locally through the [version 1 tool interface](tool-development.md).
The wider scientific result schema, C/C++ bindings, and production execution
location remain open. Add adapter checks under `tests/tools/`; run them with
`.venv/bin/python -m unittest discover -s tests/tools -v`.

## Validation

Algorithm changes should check known inputs and meaningful invariants or reference
results. Cross-language implementations should be compared under documented
numeric tolerances. Measure performance before claiming an improvement.

Scientific evaluation must include controls for ordinary processing when it could
explain the measured trace. Code tests alone do not validate forensic claims.
Website work should verify the user workflow and deployed `/gazoken/` navigation
and assets. Documentation changes need link, consistency, and whitespace checks.

The prototype is buildless HTML/CSS/JavaScript. Run its numerical checks with
`node tests/analysis.test.mjs` and `node tests/jpeg.test.mjs`. Browser checks are
at `tests/browser.html` and `tests/jpeg-browser.html`
through a local HTTP server. See [first workbench](first-workbench.md) for the
contract and validation scope. No CI workflow or cross-language build is configured.

## Roles and handoffs

The user sets priorities and final decisions. The architect maintains shared
direction, reviews claims, defines interfaces, and coordinates integration.
Tool agents receive bounded assignments using the
[tool brief](research/tool-template.md) where applicable.

Assignments should specify owned files, dependencies, acceptance criteria, and
required documentation. Coordinate shared-interface changes with consumers.
Completion reports should explain changes, checks, limitations, and open questions.

Keep private images, credentials, and unlicensed data out of public commits.
Version dataset manifests and acquisition instructions without committing large
or restricted datasets. Artifact storage remains an open decision.

The [evidence assembler](evidence-report.md) adds optional source-bound current-run
records to the shared input packet. Follow its documented scope when adding report
consumers; do not import unverified browser history into measurement provenance.
