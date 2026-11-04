# Working on Gazoken

## Project direction

Read `README.md`, `docs/project-overview.md`, and `docs/decisions.md` before
proposing architecture or implementing tools. Consult `docs/publishing.md` for
website work. Read `docs/development.md` for software work and
`docs/research/README.md` for experiments and publication work. The user directs the project; the architect coordinates research,
shared interfaces, and integration. Tool agents work within explicit task scopes.

Preserve the identity ガゾケン · GAZOKEN, Image Forensics Workbench,
グルー研究室 · Grou-lab. Publications are intended in English and Japanese.

## Documentation discipline

Repository split: keep tool code, implementations, software tests/fixtures, and
implementation documentation in this checkout. Keep literature notes, papers,
research data/manifests, experimental proposals/results, unpublished ideas, and
manuscripts in the sibling `/home/omoikane/workspace/gazoken-research` checkout.
Consult its guidance before writing research material. Public release of private
research remains a deliberate user decision.

Use existing research summaries for routine work. Reserve Mentat for focused,
difficult research questions; do not automatically repeat its broad literature
survey. The day-to-day architect handles ordinary synthesis and coordination.

- Update relevant documentation with each substantive implementation or research change.
- Separate accepted decisions, proposals, hypotheses, and measured results.
- Record the date, rationale, and consequences of accepted architectural decisions
  in `docs/decisions.md`. Preserve superseded decisions with a link to their replacement.
- Attribute the user's research contributions. Do not present a proposed method
  as implemented or validated until there is evidence.
- Use `docs/research/tool-template.md` for tool briefs. Record enough method,
  data, parameter, and environment detail to reproduce experiments.
- Link primary sources for external technical claims and record when they were checked.
- Keep the archived handoff unchanged; maintain evolving project state in the other documents.
- For handoffs, report files changed, validation performed, limitations, and unresolved decisions.

## Scientific and implementation boundaries

Tools reveal evidence; a processing trace alone does not establish deceptive
editing. Document confounders and distinguish correlated detector responses from
independent evidence. Preserve the source image and explicitly describe derived
representations when implementing analysis.

Python, C, and C++ packages are intended outputs alongside the website and
publication research; their responsibilities and integration remain undecided.

The local Python framework uses FastAPI and a custom browser UI; consult
`docs/local-workbench.md` for its actual coverage. Future method adapters,
scientific result contracts, datasets, and paper-specific baselines remain open.
Do not treat an architectural proposal as an accepted constraint.
Do not claim the planned website is live without checking its deployed behavior.
