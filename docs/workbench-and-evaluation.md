# Image workbench and method evaluation

Updated: 2026-11-03

## Confirmed product direction

Gazoken will provide a page where a user loads an image and selects filters or
analysis algorithms using checkboxes. Results should help investigate artefacts,
processing traces, and possible doctoring, with statistical evidence where the
method and validation support it.

Development starts with existing methods from research papers, other laboratories,
and online projects. We will integrate available code where its terms permit, or
implement the described method ourselves. A separate evaluation suite will test
those implementations and the underlying research claims. Findings will inform
which tools are useful and where improvements or original research are warranted.

The first prototype now implements elementary ELA, residual, edge, and bit-plane
views; see [first workbench](first-workbench.md). No published detection claim has
been independently evaluated yet. The requirements below remain the broader
direction; the prototype does not establish a final software architecture.

## Workbench behavior — proposed

1. Load an image and retain an identifiable original as the reference.
2. Select one or more tools using checkboxes. Explain what each measures and any
   input restrictions or required parameters.
3. Run the selected analyses and show each tool's status and result separately.
4. Present derived images, maps, measurements, or detector outputs with their
   meaning, units, method version, parameters, and limitations.
5. Link results to the method description and evaluation record when available.

By default, selected tools should analyze the same source image independently.
Selection order should not silently turn the checkboxes into a processing pipeline.
If chaining filters is later supported, make the order and derived input explicit.
Record method-specific preprocessing so results can be reproduced in the suite.

A visualization filter can be useful without producing a detection score.
Unsupported inputs, errors, and inconclusive results must be distinct from a
negative detection. A failed run is not evidence of an unaltered image.

## Statistical reporting — proposed

Each method brief must define its output before the interface labels it. Record
whether an output is a measurement, detector score, p-value, likelihood ratio,
or estimated probability. Do not relabel these quantities interchangeably.

For a probability claim, define the event being predicted, the evaluated
population, and the calibration procedure and validation results. A raw score
between zero and one should retain its score label unless probability
interpretation is supported. Likewise, statistical significance must not be
presented as the probability that the image was doctored.

Report benchmark performance with dataset context, thresholds, sample counts,
and uncertainty where appropriate. Do not substitute a benchmark success rate
for the probability of alteration in an individual upload. When a defensible
per-image probability is unavailable, show the evidence and measured performance
without inventing a percentage.

Keep per-tool results separate initially. Any future evidence-fusion method needs
its own evaluation, including detector dependence and the effect of running many
tests. Multiple checked boxes do not automatically provide independent support.

## Independent evaluation suite — proposed

The suite should support batch experiments using known inputs and ground truth,
with machine-readable measurements and reproducible reports. It should run the
same method implementation and preprocessing used by the workbench, avoiding
separate analysis logic that could drift. Language bindings and execution
interfaces remain open.

For each external method:

1. Record the paper, authors, source repository, version, availability of weights
   or required data, and code/model/data license information as applicable.
2. State the claim being examined and whether the implementation is original
   author code, an adaptation, or a Gazoken reimplementation. Document deviations.
3. Check implementation behavior against author examples or reference outputs
   where available. Separate implementation correctness from scientific validity.
4. Attempt the published experiment where code, data, and resources permit.
   Record unavailable inputs and differences from the published setup.
5. Test generalization on separate, controlled material: originals, ordinary
   processing, target manipulations, and relevant difficult cases. Keep parameter
   tuning and any calibration separate from held-out evaluation.
6. Report false alarms, missed detections, and task-appropriate metrics. For a
   localization claim, evaluate location accuracy as well as image-level detection.
7. Compare with relevant baselines and preserve raw outputs, failed cases,
   configurations, input identifiers, and code revisions.

Record the scope of each conclusion: reproducing a published experiment,
testing a reimplementation, and testing broader generalization answer different
questions. A discrepancy should trigger investigation of implementation, setup,
and data differences before a conclusion about the original claim.

Do not collapse evaluation into one permanent pass/fail badge. A useful report
states which claim was supported under which conditions, where performance
deteriorated, and what could not be tested.

## Next decisions

- Select the first external method and a bounded claim to evaluate.
- Define the minimum input/output contract shared by the workbench and suite.
- Choose initial controlled examples, baselines, and reporting metrics.
- Decide which outputs can support statistical interpretation after evaluation.

Use the [tool brief](research/tool-template.md) for the first assignment and the
[research workflow](research/README.md) for experiment records.
