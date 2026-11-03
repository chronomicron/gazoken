# Decision log

Record accepted decisions with their date, basis, rationale, and consequences.
Proposals remain separate until agreed. The initial handoff predates this log;
2026-11-03 below is its recording date, not a claimed original decision date.

## D001 — Project identity and investigative philosophy

- Status: accepted; recorded 2026-11-03.
- Basis: [user-supplied handoff](archive/initial-handoff.md).
- Decision: use ガゾケン · GAZOKEN, Image Forensics Workbench, under
  グルー研究室 · Grou-lab. Support complementary, interpretable investigative
  tools and English/Japanese publications.
- Rationale: support research and examination of evidence across multiple image
  trace families.
- Consequences: keep origin, modification, processing, and concealed-information
  claims distinct; record assumptions and limitations for each tool.

## D002 — Documentation and intended website address

- Status: accepted; 2026-11-03.
- Basis: user instruction to keep good documentation and use
  `chronomicron.com/gazoken` for the future webpage.
- Decision: keep project documentation alongside source in
  `chronomicron/gazoken`; target `https://chronomicron.com/gazoken/`.
- Rationale: maintain a reviewable project record and publish under the user's
  existing web identity.
- Consequences: implementation must support the `/gazoken/` path. Hosting details
  and deployment settings remain subject to verification; the URL is not a claim
  that a site is already live.

## D003 — Website, packages, and publication research

- Status: accepted; 2026-11-03.
- Basis: user instruction to manage Gazoken as a work/research project, build a
  usable website and Python/C/C++ packages, and pursue journal or conference papers.
- Decision: organize work around these three connected strands, with local VS Code
  files and GitHub as the shared source and review location.
- Rationale: support practical tools, reusable software, and reproducible research.
- Consequences: maintain development and research workflows and a roadmap. Record
  experiment provenance with code. Language roles, package layout, venues, and the
  first study remain open; publication acceptance is not presumed.

## Pending proposals

| Proposal | Status | Next evidence or decision needed |
| --- | --- | --- |
| First milestone around threshold-sweep edge analysis | Proposed by architect | Agree research scope and controlled comparisons with user |
| GitHub Pages project site inheriting the main site's custom domain | Proposed publishing route | Verify Pages configuration and domain routing; choose website source |

## Entry format for future decisions

Use the next D-number and record: title, status, date, user agreement or other
basis, decision, rationale, consequences, and supporting links. If superseded,
retain the entry and link to the replacement.
