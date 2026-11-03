# Gazoken project overview

Updated: 2026-11-03

## Purpose and identity

**ガゾケン · GAZOKEN — Image Forensics Workbench**, developed under
**グルー研究室 · Grou-lab**, is a suite of tools for image investigation.
Gazoken is a coined name associated with 画像 (gazō, image) and 研究
(kenkyū, research), with a secondary phonetic association with 検証
(kenshō, verification). Name availability has not been checked.

The working question is: assuming an image originated from a camera, what traces
suggest alteration, generation, or concealed information? Camera origin is a
hypothesis to examine, not a conclusion from loading the file.

## Confirmed direction

- Load an image and choose from a suite of investigative tools.
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

Ordinary camera processing produces structured traces. Differences in texture,
lighting, motion, and depth of field can resemble editing evidence. Recompression
does not by itself establish content alteration. Multiple detectors may respond
to the same underlying trace.

For concealed information, distinguish detection, extraction, decoding, and
decryption. Failure to extract readable content does not establish its absence.

## Current state

The repository began with a minimal README and Apache-2.0 license. Project
documentation is now being established. No detector, dataset, experiment,
application stack, or deployment has been selected or implemented here.

The architect supports brainstorming, research planning, shared architecture,
tool-agent task definition, and integration review. The user retains direction
and final project decisions.

## Candidate first investigation

The user's threshold-sweep edge analysis is a candidate regional blur-consistency
expert. It compares regional edge responses across thresholds. Its attribution
and proposed mathematical formalization are preserved in the
[initial handoff](archive/initial-handoff.md#7-prior-research-idea-relevant-to-gazoken-threshold-sweep-edge-analysis-for-blur).

The architect proposed a first workflow around image loading, region selection,
response curves, and controlled comparisons. **This milestone is not yet accepted.**
Low texture, contrast, noise, and scene content must be controlled before treating
curve differences as blur evidence. Edge operators and threshold units remain open.

## Open decisions

- First research question, milestone, and initial tool suite.
- Stack, shared tool interfaces, execution location, and result representation.
- Image formats, limits, upload handling, retention, and privacy behavior.
- Datasets, model selection, evaluation protocol, and evidence combination.
- Website implementation and publishing source; launch interface languages.
- Visual design and consistent bilingual research terminology.

The repository already contains an Apache-2.0 license. Licensing for future
datasets, models, and publication artifacts must be recorded when selected.

See the [roadmap](roadmap.md), [development workflow](development.md),
[research workflow](research/README.md), [decision log](decisions.md), and
[publishing plan](publishing.md).
