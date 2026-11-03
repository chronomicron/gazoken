# Tool research brief: <name>

Status: proposed / investigating / implemented / evaluated
Updated: YYYY-MM-DD
Owner: <person or agent>
Research attribution: <originator and source>

Copy this template to a descriptive filename for each tool; replace placeholders
and retain explicit unknowns. A completed implementation is not automatically a
validated forensic method.

## Question and claim

What investigative question does this tool address? What specific trace does it
measure? What can a positive or negative result establish, and what remains
unknown? Is the output global or localized?

## Method

Record the original paper and authors, source repository and pinned version,
required models or data, and applicable licenses. Identify whether this is author
code, an adaptation, a reimplementation, or an original method. List deviations
from the published procedure and unavailable reference material.

Describe the algorithm, equations, preprocessing, parameters, threshold units,
and image representation. Cite primary sources. Distinguish the original research
idea from proposed extensions and implementation choices.

## Inputs and outputs

Specify supported formats and limits, required metadata, source-image handling,
derived artifacts, region coordinates, units, visualization scales, and error
behavior. Identify shared interface dependencies or decisions still needed.

Define whether each numeric output is a measurement, detector score, p-value,
likelihood ratio, or estimated probability. For probability claims, specify the
predicted event, population, calibration procedure, and held-out validation.
Describe how workbench and batch evaluations use the same implementation.

## Assumptions and confounders

Record image-quality constraints, scene-content effects, ordinary processing
that may cause similar results, and relationships with other detectors.

## Controlled evaluation

- Hypothesis and success criteria, defined before interpreting results.
- Known originals, ordinary transformations, and relevant known manipulations.
- Dataset provenance, licenses, sample counts, and any training/test separation.
- Generation procedures, random seeds, parameters, code revision, dependencies,
  and environment sufficient to reproduce the experiment.
- Metrics suited to the claim, controls, failures, and uncertainty.
- Author-reference checks, published-experiment reproduction, and independent
  generalization tests, clearly distinguished.
- False alarms and missed detections at recorded thresholds; localization metrics
  for localization claims. Keep tuning and calibration separate from final tests.

## Findings

Link reproducible experiment instructions and artifacts. Separate measured results
from interpretation. Record negative findings and remaining limitations.

## Agent assignment and handoff

- Objective and deliverables.
- Owned files and explicit scope boundaries.
- Dependencies and shared contracts requiring architect coordination.
- Acceptance criteria and proportionate validation commands.
- Completion report: changes, results, limitations, and unresolved questions.

## Publication notes

Record English/Japanese terminology, attribution, and figures or explanations
needed for publication. The full launch interface's language scope remains open.
