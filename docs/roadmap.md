# Project roadmap

Updated: 2026-11-03

This proposed sequence connects the website, software packages, and research.
These strands are confirmed; the individual milestones still need agreement.
There are no deadlines or promised publication outcomes.

| Stage | Deliverable | Completion criteria | Status |
| --- | --- | --- | --- |
| 0. Foundation | README and project workflows | Scope, decisions, and open questions documented and reviewable | Initial foundation reviewed and committed; requirements evolving |
| 1. Existing-method selection | First external method brief | Source, claim, reuse or reimplementation approach, controls, and evaluation criteria agreed | First method open; development-first direction confirmed |
| 2. Baseline | Reference method and controlled evaluation | Another contributor can reproduce the experiment and assess failures | Not started |
| 3. Packages | Reusable interfaces and examples | Selected method runs through documented interfaces and relevant checks; language roles recorded | Not started |
| 4. Website | Initial workbench integration | Load image, run tool, inspect evidence and limitations; deployed paths verified | Browser prototype implemented and locally checked; public update pending |
| 5. Publication study | Evaluation and manuscript | Claims supported, related work assessed, limitations stated, venue requirements checked | Not started |

Stages may overlap: a project information page can precede tool integration, and
literature review starts with the research brief. A baseline may reveal that an
idea needs revision or does not support a publication claim; record that result
and adjust the plan.

## Next discussion

Select the first external method and smallest useful checkbox-based workflow. Use the
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
