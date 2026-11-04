# Gazoken documentation

This directory is the evolving record for ガゾケン · GAZOKEN,
Image Forensics Workbench, under グルー研究室 · Grou-lab.

| Document | Purpose |
| --- | --- |
| [Local Python workbench](local-workbench.md) | Launch instructions, all three phases, shared-source previews, reports, session migration, and extension points. |
| [Tool development](tool-development.md) | Common inputs, isolated phase modules, execution lifecycle, templates, and future-tool checklist. |
| [Entropy coding](entropy-coding.md) | Python step 1.5: stored Huffman codebooks, canonical codes and scan-time assignments. |
| [Metadata inventory](metadata-inventory.md) | Python step 1.3: bounded Exif, reader options, GPS/vendor controls and limitations. |
| [JPEG file structure](file-structure.md) | Python step 1.2: marker map, frames, scans, restart intervals and byte-boundary checks. |
| [Quantization atlas](quantization-tables.md) | Python step 1.4: exact tables, assignments, history, output schema and checks. |
| [Test fixtures](../tests/fixtures/README.md) | Synthetic inputs, known edits, masks, and regeneration instructions. |
| [Private research workspace](https://github.com/chronomicron/gazoken-research) | Literature, papers, research data, study proposals, and unpublished results. |
| [JPEG inspector](jpeg-inspector.md) | Raw JPEG/Exif inspection, graphical tables, byte statistics, and coverage. |
| [First workbench](first-workbench.md) | Usage, implemented methods, preprocessing, and verification limits. |
| [Project overview](project-overview.md) | Confirmed scope, philosophy, and open decisions. |
| [Roadmap](roadmap.md) | Proposed milestones and completion criteria. |
| [Workbench and evaluation](workbench-and-evaluation.md) | Checkbox workflow, external-method testing, and statistical reporting. |
| [Decision log](decisions.md) | Accepted decisions, rationale, and pending proposals. |
| [Development workflow](development.md) | Local work, packages, review, and agent coordination. |
| [Research workflow](research/README.md) | Experiments, reproducibility, and publication preparation. |
| [Tool brief template](research/tool-template.md) | Scope and validation plan for an individual method. |
| [Publishing plan](publishing.md) | Website address and proposed deployment route. |
| [Initial handoff](archive/initial-handoff.md) | Original context, preserved unchanged. |

## Maintaining the record

Use Markdown so project documentation can be edited locally in VS Code and
reviewed with associated code. Keep each fact in its main document and link to it
elsewhere. Update documentation with substantive software or research changes.

Distinguish confirmed requirements, proposals, hypotheses, implemented methods,
and evaluated results. Record dates and evidence for decisions and findings.
Preserve superseded decisions with replacement links; do not silently rewrite
historical results. The handoff is an archive: maintained documents record later
decisions that supersede its open questions.

Use the sibling `gazoken-research` checkout for literature and research briefs,
study records, data, and manuscripts. This repository retains implementation
documentation, method coverage, reproducible software checks, and synthetic
fixtures. The `docs/research/` workflow and template describe the process; completed
research records belong in the private repository until selected for release.

Documentation is sufficient when another contributor can understand the purpose,
reproduce the relevant work, and identify its limitations.
