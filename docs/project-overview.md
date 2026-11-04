# Gazoken project overview

Updated: 2026-11-03

## Purpose and identity

**ガゾケン · GAZOKEN — Image Forensics Workbench**, developed under
**グルー研究室 · Grou-lab**, is a suite of tools for image investigation.
Gazoken is a coined name associated with 画像 (gazō, image) and 研究
(kenkyū, research), with a secondary phonetic association with 検証
(kenshō, verification). Name availability has not been checked.

The working question is: given a file of unknown provenance, what can we learn
from its contents, structure, and processing traces? Camera origin, editing,
generation, and concealed information are hypotheses to examine. This framing
supersedes the initial camera-origin working assumption.

## Confirmed direction

- Load an image and choose from a suite of investigative tools.
- Select filters and analysis algorithms using checkboxes on the workbench page.
- Start development by implementing or integrating existing published methods
  and testing their results with our own evaluation suite.
- Support statistical interpretation where justified by method-specific validation.
- Investigate acquisition, processing history, modifications, synthetic content,
  and concealed information as distinct but related questions.
- Show measurements and visual evidence with assumptions, plausible explanations,
  confounding factors, and limitations.
- Prepare research publications in English and Japanese.
- Maintain documentation in the source repository as the project develops.
- Target the public website address `https://chronomicron.com/gazoken/`.
- Develop reusable Python, C, and C++ code packages alongside the website.
- Pursue research papers for journals or conferences.
- Manage local files in VS Code and push changes to GitHub.
- Prioritize Python tools for research measurements, operated through a local
  browser interface; the public static page may expose a smaller tool subset.

Ordinary camera processing produces structured traces. Differences in texture,
lighting, motion, and depth of field can resemble editing evidence. Recompression
does not by itself establish content alteration. Multiple detectors may respond
to the same underlying trace.

For concealed information, distinguish detection, extraction, decoding, and
decryption. Failure to extract readable content does not establish its absence.

## Current state

The placeholder is live at the intended URL according to the user. A first
interactive workbench is now implemented locally with browser-only image loading,
independent checkboxes, four exploratory visualizations, and result exports.
See [first workbench](first-workbench.md) for precise methods and verification.
The updated workbench has not been pushed or its public deployment verified.
A separate read-only [JPEG inspector](jpeg-inspector.md) now extracts original
encoding structures and EXIF, with graphical tables, byte statistics, and hex
inspection. A local [Python framework](local-workbench.md) now provides all three phases of
controls, shared-source visual previews, seven Python measurements (source identity, file structure, bounded metadata inventory, byte distribution, exact quantization tables, Huffman codebook/scan inventory, and bounded embedded JPEG extraction), and session
exports. A [modular tool interface](tool-development.md) now isolates adapters,
preserves source identity, declares prerequisites, and shows selected call order.
An optional [stored-coefficient reader](stored-coefficients.md) now supplies
source-bound quantized DCT packages without reconstructing pixels.
A [current-run evidence report](evidence-report.md) assembles Phase 1 outputs
without adding a forensic verdict. All Phase 2 and Phase 3 analyses remain configuration-only.
No calibrated detector, scientific benchmark, C/C++ package, or paper is
implemented yet.

The architect supports brainstorming, research planning, shared architecture,
tool-agent task definition, and integration review. The user retains direction
and final project decisions.

## Candidate first investigation

Development will begin with existing methods and independent evaluation. The
first external method is still to be chosen. See the
[workbench and evaluation requirements](workbench-and-evaluation.md).

The user's threshold-sweep edge analysis is a candidate regional blur-consistency
expert. It compares regional edge responses across thresholds. Its attribution
and proposed mathematical formalization are preserved in the
[initial handoff](archive/initial-handoff.md#7-prior-research-idea-relevant-to-gazoken-threshold-sweep-edge-analysis-for-blur).

The architect previously proposed a first workflow around image loading, region
selection, response curves, and controlled comparisons. **This milestone was not
accepted; the user's clarified starting direction is evaluating existing methods.**
Low texture, contrast, noise, and scene content must be controlled before treating
curve differences as blur evidence. Edge operators and threshold units remain open.

## Open decisions

- First paper-specific research question, benchmark, and evaluated detector suite.
- Future cross-language interfaces and execution needs beyond the local Python framework and static browser prototype.
- Future image formats and limits beyond the prototype; any server upload, retention, or privacy requirements.
- Datasets, model selection, evaluation protocol, and evidence combination.
- Future website architecture and full interface languages; the prototype uses static Pages hosting.
- Visual design and consistent bilingual research terminology.

The repository already contains an Apache-2.0 license. Licensing for future
datasets, models, and publication artifacts must be recorded when selected.

See the [roadmap](roadmap.md), [development workflow](development.md),
[research workflow](research/README.md), [decision log](decisions.md), and
[publishing plan](publishing.md).
