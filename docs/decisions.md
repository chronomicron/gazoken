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

## D007 — Automatic and expert image-investigation workflows

- Status: accepted direction; 2026-11-03; not implemented by this decision.
- Basis: user clarification in the project's phone-based research conversation.
- Decision: start with images and support two workflows: an automatic action
  that runs multiple analyses for non-specialists, and expert exploration with
  selectable tools and adjustable parameters. Expert questions include image
  features, modification traces, and possible concealed information.
- Rationale: serve both accessible individual-image investigation and informed
  research exploration within Gazoken.
- Consequences: choose and evaluate the automatic suite and its interpretation
  before claiming detection performance or calibrated probabilities. Preserve
  method details for expert inspection. Audio and video are future ambitions;
  this decision does not select server uploads, evidence-combination rules, or
  change the current browser-local prototype. See the
  private research conversation synopsis in the sibling `gazoken-research` checkout.

## D008 — Preserve input and an immutable decoded reference

- Status: accepted direction; 2026-11-03.
- Basis: user's description of importing images and using an immutable in-memory
  bitmap for analysis while preserving the original input.
- Decision: preserve the source file and keep a decoded pixel reference unchanged;
  analyses operate on derived working representations.
- Rationale: enable tools to examine the same reference without modifying it.
- Consequences: describe derived representations explicitly. Decoder, color and
  orientation handling, pixel format, and supported input formats remain open.
  Retain encoded source data for analyses that need file-specific information;
  decoding does not establish a clean or unaltered camera original.

## D009 — JPEG file inspection as the first focused research direction

- Status: accepted research direction; 2026-11-03; not implemented or validated.
- Basis: user selection during the research conversation.
- Decision: first investigate information available from original JPEG bytes
  before pixel rendering: structure, metadata, quantization tables, and possible
  camera/software encoding signatures, including hex-level inspection.
- Rationale: establish observable file evidence before interpreting processing
  history or combining detector outputs.
- Consequences: separate direct extraction from attribution hypotheses. Review
  existing projects and signature evidence; no unique encoder identification,
  authenticity probability, parser stack, or integration choice is established.
  This defines a first investigation within the broader automatic-analysis goal.

## D010 — Raw JPEG inspection with metadata and graphical statistics

- Status: accepted scope; local structural prototype implemented, 2026-11-03.
- Basis: user approval of read-only JPEG inspection treating the original file
  as encoded data, explicitly including Exif and graphical table/statistical views.
- Decision: retain original bytes and provide a separate inspector without pixel
  rendering. Display quantization tables and distributions, coding structures,
  encoded-byte statistics, Exif, hex offsets, and an observation-based interpretation.
- Rationale: establish testable raw-file evidence before statistical history or
  source-attribution research.
- Consequences: supersedes the earlier EXIF deferral. The interpretation is
  rule-based and identifies unresolved history; no signature database, coefficient
  entropy decoder, learned detector, or calibrated probability is implemented.
  See [coverage and verification](jpeg-inspector.md).

## D011 — Repository responsibilities and selective deep research

- Status: accepted; 2026-11-03.
- Basis: user's clarification after adding private research folder access.
- Decision: keep code, tools, implementations, software tests, and implementation
  documentation in `gazoken`. Keep papers, literature, research data, proposals,
  unpublished results, and manuscript material in `gazoken-research`.
- Rationale: preserve the public development workflow and a private research record.
- Consequences: uncommitted research-only drafts were relocated to the private
  checkout; historical published commits are not rewritten. Reuse existing
  summaries for routine work and reserve Mentat for focused difficult questions.
  Private material is released only when explicitly selected by the user.

## D012 — Python research toolkit with a local browser interface

- Status: accepted direction and initial framework implemented locally; 2026-11-04.
- Basis: user prioritizes Python tools for research data collection and asks for
  a visual framework with parameter groups for all Phase 1 steps before methods
  are complete.
- Decision: use a reusable Python analysis package, a FastAPI local server, and
  a custom browser UI. Preserve original bytes, typed per-step configurations,
  run records, and explicit unimplemented states. Static public tools remain
  a separate supported subset; public Python hosting is not selected.
- Rationale: enable research packages and repeatable measurements while providing
  image/data visualization without a separate desktop GUI implementation.
- Consequences: first framework has twelve parameter groups, two elementary
  Python handlers, browser-derived structural previews, and JSON export/import.
  Scientific validation, long-job execution, dependencies between future handlers,
  C/C++ integration, and distribution remain later work. See
  [local workbench](local-workbench.md). No private paper text or findings were
  transferred to public documentation.

## D013 — Phase 2 framework shares source, preserves separate records

- Status: accepted and framework implemented locally; 2026-11-04.
- Basis: user requests the same controls, explanations and report cards for the
  decoded-image phase, using the Phase 1 image, before implementing its methods.
- Decision: add eleven configurable Phase 2 steps and selectable phase workspaces
  sharing original JPEG bytes and source identity. Preserve per-phase settings,
  selections, report cards and summaries; export both phases in one session.
- Rationale: establish method interfaces and traceable experiment configuration
  without presenting browser display pixels as a reproducible Python reference.
- Consequences: all Phase 2 handlers remain unimplemented and produce no analytical
  outputs. Decoder choices and expected artifacts are explicitly provisional.
  Session schema 2 supports both phases; legacy Phase 1 settings import initializes
  Phase 2 defaults. A backend restart is needed to load the expanded catalog.
  See [coverage and usage](local-workbench.md).

## D014 — Complete the three-phase configuration framework

- Status: accepted scope; implemented locally, 2026-11-04.
- Basis: Robert's request, relayed in the Architect's scoped assignment, for the
  third Processing history tab and the encompassing framework before methods.
- Decision: add fourteen planned Phase 3 groups with editable provisional controls,
  functional configuration recording and inspection, isolated phase reports, and
  one preserved source across all phases. Extend export to schema 3 and explicitly
  migrate settings from schemas 1 and 2.
- Rationale: make future method requirements and planned outputs reviewable without
  presenting unavailable algorithms or references as implemented capabilities.
- Consequences: only 1.1 and 1.7 produce Python measurements. No Phase 2 decode,
  Phase 3 analysis, reference enrollment, learned weights or automatic prerequisites
  are implemented. Existing design is retained; launch/restart and verification
  scope are documented in [local workbench](local-workbench.md).

## D015 — Isolated adapters and common local inputs — 2026-11-04

- Status: accepted for the local framework, based on the user's request to isolate
  each step and give tools consistent original-byte or decoded-pixel inputs.
- Decision: introduce a versioned Python tool interface, explicit adapter registry,
  separate encoded/decoded/history folders, and matching GUI input declarations and
  selected call order. Preserve stable step IDs and numeric execution order.
- Rationale: implement and test methods one at a time without adding method branches
  to the shared runner or changing the source supplied to other methods.
- Consequences: source identity and byte distribution move into individual modules;
  no new forensic detector is introduced. Pixels require explicit decoder provenance;
  no decoder is registered in this increment. Missing prerequisites block registered
  adapters, failures are recorded per adapter, and configuration-only steps stay
  distinguishable from executed methods. The interface is cooperative in-process
  isolation, not a security sandbox. Broader scientific schemas remain open.
- Guide: [tool development](tool-development.md).

## D016 — Current-run evidence input and report — 2026-11-04

- Status: accepted local increment, following the user's approval to implement 1.12
  before coefficient reader 1.9 and statistics 1.10.
- Decision: add optional `RunEvidence` to the common input packet. The runner supplies
  a detached, immutable, source-bound JSON snapshot of earlier records in the current
  plan to declared consumers. Report 1.12 assembles Phase 1 records only.
- Rationale: reuse real validated execution records without allowing user-supplied
  history to masquerade as measurements or merging unrelated browser runs.
- Consequences: current-run reports require selecting analysis tools and 1.12 together.
  Standalone reports are explicitly empty. Existing session/phase exports still handle
  multi-run browser history. No automatic dependencies, detector fusion or probability
  calculation is introduced. The addition is compatible with existing source/pixel
  callers; broader scientific schemas and evaluated specialist evidence remain open.
- Guide: [evidence report](evidence-report.md).

## D017 — Optional stored-coefficient package and bounded reader — 2026-11-04

- Status: accepted implementation increment, based on the user's instruction to
  implement 1.9 after the evidence report and keep it independently revertible.
- Decision: add immutable source-bound quantized DCT packages and a jpeglib 0.14.0
  adapter using explicitly selected libjpeg 6b in a temporary subprocess. Keep the
  dependency optional; retain the existing interface with additive package fields.
- Rationale: expose stored coefficients to future statistics while containing
  documented native process exits and preserving the original bytes/pixel boundary.
- Consequences: baseline/progressive 8-bit grayscale/three-component scope only,
  explicit geometry/time/output limits, source/table/shape validation, and atomic
  derived-input publication. Missing dependencies and unsupported inputs fail clearly.
  No IDCT, permanent artifacts, browser coefficient decoder or 1.10 method is added.
  The worker is not a security sandbox; cross-platform native behavior remains to test.
- Guide: [stored coefficients](stored-coefficients.md).

## D018 — Media expansion order and JPEG-only selector — 2026-11-05

- Status: accepted direction, requested by Robert in this chat.
- Decision: finish JPEG investigation first, then BMP/TIFF/other images, then
  MP3/audio, then video. Show planned media workspaces in a dimmed menu with an
  Under development explanation while JPEG remains the only active workspace.
- Rationale: make future scope visible without implying unavailable parsers or
  detectors are operational; retain encoded/decoded/further-analysis boundaries.
- Consequences: no new format support, decoder, statistical steganalysis or signal
  detector is implemented by this UI increment. Planned menu choices preserve the
  current JPEG session. Format-specific contracts and validation remain open.
- Roadmap: [media expansion](roadmap.md#media-expansion-direction--accepted-2026-11-05).

## D019 — Browser source context and per-step modules — 2026-11-05

- Status: accepted direction and first increment implemented, based on Robert's
  request to keep future BMP tools in mind and support tools needing either
  original JPEG bytes or decoded pixel data.
- Decision: browser tools receive a format-neutral source context that preserves
  the original encoded file and represents decoded pixels separately with
  dimensions, layout, channels, source linkage, and decoder provenance. Keep
  executable steps in individual format-specific JavaScript modules. Implement
  JPEG step 1.1 as the first isolated browser adapter.
- Rationale: let each step request the representation it needs without losing or
  confusing the original file, decoded view, or future derived data.
- Consequences: static JPEG step 1.1 reports size, JPEG SOI signature and SHA-256;
  it does not perform full JPEG conformance validation. The browser context is not
  a cross-language schema and adds no BMP implementation. Future BMP and other
  format adapters remain open. See [browser tool inputs and modules](browser-tools.md).

## D020 — Browser JPEG file-structure step — 2026-11-05

- Status: implemented increment, requested by Robert after the browser source
  context and step 1.1 were in place.
- Decision: add a dedicated JavaScript adapter for JPEG step 1.2 using the shared
  `SourceContext` original-byte input and the existing low-level JPEG inspector.
  Add it to the browser-supported Phase 1 selection runner alongside step 1.1.
- Rationale: let visitors inspect marker, frame, scan, and restart structure in
  the static browser workbench while preserving one adapter module per step.
- Consequences: step 1.2 produces a structural inventory only. It does not claim
  JPEG conformance or editing history, and it does not add BMP support. The
  existing low-level inspector computes additional statistics internally, while
  the step result exposes structural fields. See [browser tool inputs and modules](browser-tools.md).

## D021 — Browser JPEG metadata inventory — 2026-11-05

- Status: implemented increment, requested by Robert after step 1.2.
- Decision: add a separate JavaScript adapter for JPEG step 1.3 using the shared
  source context, browser marker parser, and bounded TIFF/Exif reader. Apply GPS
  IFD and MakerNote options during parsing and preserve explicit `ExifTool`
  unavailability.
- Rationale: provide a useful metadata inventory in the static browser while
  preserving the same original-byte input boundary and per-step module structure.
- Consequences: values remain editable metadata claims; the GPS option omits only
  the standard GPS IFD. The browser adapter adds no external process, XMP parser,
  or BMP support. See [metadata inventory](metadata-inventory.md) and
  [browser tool inputs and modules](browser-tools.md).

## D022 — Browser JPEG quantization atlas — 2026-11-05

- Status: implemented increment, requested by Robert after step 1.3.
- Decision: add a dedicated JavaScript adapter for step 1.4 using the common
  `SourceContext` original-byte representation and exact DQT parsing. Preserve
  stable table-definition references for frame and scan assignments; expose the
  step catalog's value-layout and history controls.
- Rationale: make exact compressed-domain table evidence inspectable on the static
  site without decoding pixels or duplicating the Python input boundary.
- Consequences: the result reports stored table choices and extraction coverage
  only. It does not estimate quality, identify an encoder, or infer prior edits.
  See [quantization atlas](quantization-tables.md) and
  [browser tool inputs and modules](browser-tools.md).

## D023 — Browser JPEG entropy coding inventory — 2026-11-05

- Status: implemented increment, requested by Robert after step 1.4.
- Decision: add an isolated JavaScript adapter for step 1.5 using the shared
  `SourceContext` original-byte representation. Parse and validate chronological
  Huffman definitions, derive canonical codes, and link scan assignments to the
  definitions active at each scan. Preserve the catalog's codebook and scan-script
  options.
- Rationale: let visitors inspect stored Huffman declarations on the static site
  using the same file boundary and per-step module structure.
- Consequences: the adapter does not decode entropy symbols, measure symbol
  frequencies, infer coding efficiency, or identify an encoder. It imposes a
  1,024-definition cap and retains the underlying structural parser limits. See
  [entropy coding](entropy-coding.md) and [browser tool inputs and modules](browser-tools.md).

## D024 — Browser JPEG embedded-image inventory — 2026-11-05

- Status: implemented increment, requested by Robert after step 1.5.
- Decision: add an isolated JavaScript adapter for step 1.6 using original JPEG
  bytes, the bounded TIFF/Exif reader, and the file-structure adapter. Recognize
  only declared Exif IFD1 and JFXX JPEG ranges; validate container boundaries and
  hash extracted ranges; optionally inspect nested JPEG structure.
- Rationale: expose a bounded source-inspection tool in the static workbench while
  preserving the original bytes and the per-step module boundary.
- Consequences: no arbitrary byte-pattern discovery, pixel decoding, recursive
  extraction, or unsupported thumbnail decoding is added. Nested structure is
  bounded to 256 markers. See [embedded images](embedded-images.md) and
  [browser tool inputs and modules](browser-tools.md).

## D025 — Browser JPEG byte distribution — 2026-11-05

- Status: implemented increment, requested by Robert after step 1.6.
- Decision: add an isolated JavaScript adapter for step 1.7 using original
  encoded bytes and expose the catalog's whole-file scope. Report all 256 byte
  counts and Shannon entropy, with a browser-rendered histogram.
- Rationale: make a small descriptive byte-stream measurement directly available
  in the static workbench without introducing another parser or pixel operation.
- Consequences: output is descriptive only and does not localize byte patterns,
  identify an encoder, or estimate editing. The JavaScript result remains a
  browser adapter record, not a Python-backed execution. See
  [byte distribution](byte-distribution.md) and
  [browser tool inputs and modules](browser-tools.md).

## D026 — Browser-decoded Phase 2 reference — 2026-11-05

- Status: implemented increment, requested by Robert after the Phase 2/3 review.
- Decision: add a format-neutral static-browser adapter for step 2.1. It records
  the decoded pixel package already attached to `SourceContext`, including source
  identity, dimensions, channels, layout, coordinate mapping, and browser decoder,
  color, alpha, and orientation provenance. It does not decode a second copy.
- Rationale: make the exact browser pixel representation available to subsequent
  static tools while preserving the source and describing decoder limits.
- Consequences: this supports JPEG, PNG, and WebP browser display pixels but does
  not provide the reproducible Python/native JPEG decoder or component planes
  proposed for the local framework. See [decoded reference](decoded-reference.md)
  and [browser tool inputs and modules](browser-tools.md).

## D027 — Browser spatial measurements — 2026-11-05

- Status: implemented increment, requested by Robert after step 2.1.
- Decision: add a separate JavaScript adapter for Phase 2, step 2.2 over the
  detached browser-decoded RGBA package. Report derived-luminance or RGB
  histograms, global luminance moments, and a regular sample of local variation,
  gradients, and optional exact endpoint clipping. Run pixel loops in a worker.
- Rationale: expose bounded descriptive spatial measurements using the browser
  pixel representation without presenting the display decode as a canonical
  Python reference.
- Consequences: cap retained windows at 4,096, report sample coverage, and omit
  low-texture classification because no eligibility threshold is defined. Native
  JPEG component planes remain unavailable. See
  [spatial measurements](spatial-measurements.md) and
  [browser tool inputs and modules](browser-tools.md).

## D028 — Browser RGB channel relationships — 2026-11-05

- Status: implemented increment, requested by Robert after step 2.2.
- Decision: add an isolated JavaScript adapter for Phase 3, step 3.3 using the
  browser-decoded pixel package. Provide whole-image RGB histograms, channel
  moments, pairwise correlations, and a low-saturation fraction; run pixel loops
  in the module worker.
- Rationale: give visitors a layered channel visualization and basic comparison
  measurements without claiming a method-specific forensic result.
- Consequences: report partial coverage because hue maps, regional comparisons,
  and the wavelet-ratio candidate are not implemented. Preserve browser decoder
  provenance and make no editing or device attribution. See
  [color relationships](color-relationships.md) and
  [browser tool inputs and modules](browser-tools.md).

## D029 — Public romaji styling — 2026-11-05

- Status: accepted at Robert's request.
- Decision: style the project name as **GAZŌKEN** in website and project identity
  copy, reflecting its association with 画像 (*gazō*, image). Keep repository,
  package, CLI, and URL identifiers in ASCII as `gazoken`.
- Rationale: make the long vowel in the intended *gazō* association visible in
  the project's romaji brand.
- Consequences: the original archived handoff and machine-facing identifiers
  remain unchanged; visible browser workbench labels use the macron form.

## Pending proposals


### D007 implementation priority clarification — 2026-11-03

The user prioritizes an automatic prototype that runs tools sequentially,
assesses their outputs statistically, and ultimately presents an estimated
probability of doctoring or AI generation. The user's example of 75% specifies
the desired presentation, not an established performance result. Defining the
target event and validating and calibrating the estimate remain necessary
research work. Expert exploration remains in the broader accepted direction.
This clarification does not replace the existing local prototype or establish
that its exploratory visualizations can produce that probability.

| Proposal | Status | Next evidence or decision needed |
| --- | --- | --- |
| Threshold-sweep edge analysis as an original research expert | Candidate for later investigation; not the selected starting milestone | Scope after initial evaluation of existing methods |
| Future evaluated detector and shared package API | Open | Select a published claim, controlled inputs, and language requirements |

## Entry format for future decisions

Use the next D-number and record: title, status, date, user agreement or other
basis, decision, rationale, consequences, and supporting links. If superseded,
retain the entry and link to the replacement.
