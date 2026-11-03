# Gazoken documentation

This directory is the evolving record for ガゾケン · GAZOKEN,
Image Forensics Workbench, under グルー研究室 · Grou-lab.

| Document | Purpose |
| --- | --- |
| [Project overview](project-overview.md) | Confirmed scope, philosophy, and open decisions. |
| [Roadmap](roadmap.md) | Proposed milestones and completion criteria. |
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

Add method briefs under `research/` when investigations are assigned. Create
experiment, package, and manuscript directories when they contain actual work;
plans do not imply those artifacts already exist.

Documentation is sufficient when another contributor can understand the purpose,
reproduce the relevant work, and identify its limitations.
