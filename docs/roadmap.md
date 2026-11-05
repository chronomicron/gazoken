# Project roadmap

Updated: 2026-11-05

This proposed sequence connects the website, software packages, and research.
These strands are confirmed; the individual milestones still need agreement.
There are no deadlines or promised publication outcomes.

| Stage | Deliverable | Completion criteria | Status |
| --- | --- | --- | --- |
| 0. Foundation | README and project workflows | Scope, decisions, and open questions documented and reviewable | Initial foundation reviewed and committed; requirements evolving |
| 1. Existing-method selection | First external method brief | Source, claim, reuse or reimplementation approach, controls, and evaluation criteria agreed | First method open; development-first direction confirmed |
| 2. Baseline | Reference method and controlled evaluation | Another contributor can reproduce the experiment and assess failures | Not started |
| 3. Packages | Reusable interfaces and examples | Selected method runs through documented interfaces and relevant checks; language roles recorded | Local Python adapter interface and tests implemented; C/C++ roles and broader distribution remain open |
| 4. Website | Initial workbench integration | Load image, run tool, inspect evidence and limitations; deployed paths verified | Browser prototype implemented and locally checked; public update pending |
| 5. Publication study | Evaluation and manuscript | Claims supported, related work assessed, limitations stated, venue requirements checked | Not started |

Stages may overlap: a project information page can precede tool integration, and
literature review starts with the research brief. A baseline may reveal that an
idea needs revision or does not support a publication claim; record that result
and adjust the plan.

## Initial research milestone (still open)

The numbered local JPEG inspection adapters are now implemented within the coverage
in [local workbench](local-workbench.md), except 1.8 and 1.11. A paper-specific
evaluated detector is still open. Select that external method and use the
chosen method's requirements to decide input/output contracts, language roles,
execution location, and validation material. Record accepted choices in the
[decision log](decisions.md).

The workbench and independent evaluation suite are confirmed directions; their
detailed proposed behavior is recorded in [workbench and evaluation](workbench-and-evaluation.md).
Improvements and original methods, including threshold-sweep edge analysis, can
follow the initial work on existing research.

The first interactive prototype is described in [first workbench](first-workbench.md).
Its numerical and browser checks establish software behavior, not scientific
validity. A claim-based independent evaluation is still to be designed.

## Media expansion direction — accepted 2026-11-05

Robert confirmed this sequence: **JPEG → additional image formats → audio → video**.
These are future workstreams, not implemented detection capabilities or deadlines.
For each format, preserve the original source and distinguish encoded-file
inspection, a documented decoded representation, and further analysis of processing
history or concealed information. Format-specific evidence must not be silently
interpreted using JPEG assumptions.

| Order | Scope | Planned work and completion gate |
| --- | --- | --- |
| 1. JPEG, current | Complete the current JPEG investigation path | Continue raw-file work (1.8 profiles and 1.11 compression history remain research-led), then decoded pixels and broader processing-history analysis. Current tool coverage is in the local workbench guide. |
| 2. Other still images | BMP first, then TIFF and other formats such as PNG | Inventory file structures and declared payloads, define format-appropriate decoded pixels, and investigate hidden images/messages with controlled statistical methods. Add separate format adapters, fixtures and limits before enabling each workspace. |
| 3. Audio | MP3 and other audio signals | Separate encoded stream/container evidence from decoded samples; investigate frequency/time-frequency and cross-channel relationships under explicit hypotheses and controls. |
| 4. Video | Containers, encoded streams and decoded frame sequences | Investigate frame differences and temporal/spatial relationships, then audio/video relationships where applicable, with timestamps and decoding provenance retained. |

Concealed-information work must distinguish **detection, localization, extraction,
decoding and decryption**. Statistical anomalies alone neither establish a hidden
message nor supply its decoder. Review published methods and test known embedded
signals alongside clean controls before implementing claimed detection/extraction.
RF/communications-inspired approaches are a future research direction, with the
user's detailed proposal retained in the private research workspace; no specific
modulation or validated method has been selected.

The local GUI now exposes a media-workspace menu: JPEG is current; BMP, TIFF,
PNG/other images, audio and video are labeled Under development. Opening a planned
choice shows its status and leaves the JPEG session untouched. This menu does not
activate new parsers or relax the JPEG-only upload boundary. Enabling a format later
requires an accepted adapter/input/result scope and verified software behavior.
