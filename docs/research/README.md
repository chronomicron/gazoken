# Research and publication workflow

Updated: 2026-11-03

Gazoken aims to support original research and submissions to journals or
conferences alongside usable software. Publications are intended in English and
Japanese. Venues, manuscript tooling, datasets, and the first study remain open.
No experiments, papers, or publication results exist in this repository yet.

These are initial project practices to refine with the first investigation.

The initial emphasis is evaluating existing research through our own testing
suite, using author code or a documented implementation. See
[workbench and evaluation](../workbench-and-evaluation.md) for the proposed
evaluation lifecycle and statistical reporting requirements. Improvements and
original research will build on these findings.

## From idea to study

1. Create a [method brief](tool-template.md) with attribution, a bounded research
   question, assumptions, and a claim to test.
2. Review primary literature. Record bibliographic details and persistent
   identifiers where available. Distinguish reproduced methods from original
   contributions; novelty remains a hypothesis until related work is assessed.
3. Define controls, baselines, metrics, parameter selection, and criteria for
   supporting or rejecting the claim before interpreting results.
4. Implement a reference procedure and pilot controlled examples. Record protocol
   changes and their rationale.
5. Preserve the evaluation, including failures and contrary evidence.
6. Decide whether the evidence supports further exploration, software integration,
   a revised hypothesis, or a publication study.

For threshold-sweep edge analysis, preserve the user's original contribution and
distinguish it from new formalizations or extensions. The
[initial handoff](../archive/initial-handoff.md) is the current attribution source.

## Reproducible experiment records

Give each experiment an identifier, date, owner, question, and method-brief link.
Record the following in its Markdown record and associated configuration:

| Field | Information to preserve |
| --- | --- |
| Code and environment | Commit identifier, uncommitted patch if relevant, dependency versions, relevant hardware and platform. |
| Inputs | Dataset version, provenance, permission or license, selection rules, file identifiers or hashes. |
| Transformations | Processing steps, parameters, seeds, masks, and known ground truth. |
| Protocol | Controls, baselines, train/validation/test splits when applicable, and parameter selection rules. |
| Execution | Commands or scripts, configuration, logs, failures, and timing where relevant. |
| Results | Metrics and units, sample counts, appropriate uncertainty, figures, tables, and artifact locations. |
| Interpretation | Supported conclusions, confounders, negative findings, protocol deviations, and next questions. |

Keep originals and derived inputs identifiable. Include ordinary transformations
such as resizing, recompression, sharpening, or denoising when they could explain
a result. Use paired comparisons where appropriate. Prevent evaluation leakage,
including related crops or transformed versions of the same source when that
would invalidate the intended test.

Preserve raw measurements separately from presentation figures and record how
figures and tables were generated. Agreement between correlated detectors is not
automatically independent evidence.

Large or restricted datasets need not live in Git. Version manifests and access
or generation instructions, and record artifact locations. The storage platform
and data-retention policy remain open.

## Manuscripts and bilingual material

Create a manuscript workspace when a study has a defined contribution and
publication plan. Select a venue and check its current submission, formatting,
anonymity, originality, data, and language requirements directly with the venue.
Record the source and date; no specific venue policy is assumed here.

Maintain manuscript sources, bibliography, figure-generation procedures, and
links to the exact experiments supporting major claims. Use verified references
and measurements. Resolve authorship, contribution descriptions, and affiliations
with participating researchers.

Prepare consistent English and Japanese titles, abstracts, terminology, and
research explanations as appropriate. Bilingual publication intent does not
presume that a venue accepts two versions of the same manuscript; coordinate
translations and releases with applicable venue policies.

Before submission, review novelty against related work, reproduce principal
results, check figures and tables against measurements, and state limitations.
Preserve dated submitted versions, revisions, reviews, and responses with their
submission status. Submission and acceptance are separate milestones.
