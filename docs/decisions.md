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

## D004 — Selectable analyses and independent method evaluation

- Status: accepted; 2026-11-03.
- Basis: user description of a checkbox-based analysis page and an independent
  suite for testing methods from other projects and research laboratories.
- Decision: begin with existing methods, integrating available code where permitted
  or reimplementing published procedures. Build a workbench for selecting analyses
  and a complementary suite to test methods and their research claims. Pursue
  statistical interpretation of results where supported by validation.
- Rationale: establish practical utility and experimental evidence before extending
  methods or developing original work.
- Consequences: record provenance, distinguish code correctness from scientific
  evaluation, and document the scope of each reproduced result. The first method,
  result contract, metrics, and probability calibration remain open. Detailed
  behavior is proposed in [workbench and evaluation requirements](workbench-and-evaluation.md).

## D005 — Initial static placeholder webpage

- Status: accepted; 2026-11-03.
- Basis: user request for a simple placeholder at `chronomicron.com/gazoken`.
- Decision: prepare a self-contained bilingual `index.html` and `.nojekyll`,
  suitable for GitHub Pages branch publishing from `main` / `/(root)`.
- Rationale: establish the project page without build tooling or dependencies.
- Consequences: retain the user's local commit-and-push workflow. Public deployment
  requires pushing the files and enabling Pages; neither is implied by local
  preview. This choice does not select the future workbench architecture.

## D006 — First browser-local investigation workbench

- Status: implemented, 2026-11-03; initial tool selection pending user review.
- Basis: user request to replace the landing page with image input and separately
  selectable, versatile analysis tools.
- Decision: implement a static browser-local prototype with a shared source,
  independent checkbox selections, parameterized views, descriptive measurements,
  and PNG exports. The architect selected ELA, local-mean residual, Sobel edges,
  and bit-plane inspection as elementary starting tools.
- Rationale: deliver an inspectable workflow compatible with existing Pages
  hosting, without server uploads or package dependencies.
- Consequences: these views are exploratory and have no established detection
  rates or probability calibration. Source decoding and computation are documented
  in [first workbench](first-workbench.md). This does not select the future
  Python/C/C++ integration or replace paper-specific replication studies.

## Pending proposals

| Proposal | Status | Next evidence or decision needed |
| --- | --- | --- |
| Threshold-sweep edge analysis as an original research expert | Candidate for later investigation; not the selected starting milestone | Scope after initial evaluation of existing methods |
| Future evaluated detector and shared package API | Open | Select a published claim, controlled inputs, and language requirements |

## Entry format for future decisions

Use the next D-number and record: title, status, date, user agreement or other
basis, decision, rationale, consequences, and supporting links. If superseded,
retain the entry and link to the replacement.
