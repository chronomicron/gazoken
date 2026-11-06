# Website publishing plan

Updated: 2026-11-05

## Target and verified repository facts

- Source repository: [chronomicron/gazoken](https://github.com/chronomicron/gazoken).
- Intended public address: [chronomicron.com/gazoken/](https://chronomicron.com/gazoken/).
- The GitHub connector reports that the Gazoken repository is public and its
  default branch is `main` (checked 2026-11-03).
- The main website repository contains a
  [CNAME file specifying chronomicron.com](https://github.com/chronomicron/chronomicron.github.io/blob/main/CNAME)
  (checked 2026-11-03).

The user confirmed on 2026-11-03 that the placeholder is visible at the target
address. Live DNS, certificate details, and HTTPS enforcement were not independently
checked in this session. No DNS or GitHub settings were changed from this checkout.

## Current application and local preview

The initial workbench is buildless HTML, CSS, and JavaScript, with browser-local
image processing and module workers. Publish `index.html`, `jpeg.html`, `.nojekyll`, the entire `assets/` directory,
and the bundled `tests/fixtures/` reference files together. It has no package installation or build step.
Relative asset and worker URLs support the `/gazoken/` path. Do not open it as a
`file://` document: JavaScript modules and workers need an HTTP/HTTPS server.

From the repository root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`; stop with Ctrl+C. Browser integration checks are at
`http://127.0.0.1:8000/tests/browser.html`. See
[first workbench](first-workbench.md) for capabilities and verification limits.

## Publish after pushing the files

1. Commit and push both pages, the complete `assets/` directory, bundled fixtures,
   and `.nojekyll`
   to `main` using the normal local VS Code/Git workflow.
2. Open [Gazoken Pages settings](https://github.com/chronomicron/gazoken/settings/pages).
3. Under **Build and deployment**, choose **Deploy from a branch**, branch
   **main**, folder **/(root)**, and save.
4. Leave the Gazoken project's custom-domain override unset to inherit the user
   site's domain. Do not enter `chronomicron.com/gazoken` as a custom domain.
5. Wait for the Pages deployment to complete, then verify
   `https://chronomicron.com/gazoken/` and the redirect from `/gazoken`.

See [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
The user has confirmed the placeholder deployment. The interactive workbench is
currently local and must be pushed before it replaces that page. No custom
Actions workflow is needed for this setup.

For a content rollback, revert the relevant page change and push the revert to
`main`; with branch publishing enabled, Pages will redeploy the previous content.

## GitHub Pages project-site routing

GitHub documents that project sites inherit the custom domain configured on the
same account's user site when the project has no custom domain override.
Applied to these repository names, that would serve Gazoken at
`https://chronomicron.com/gazoken/`, provided the main site's custom-domain
configuration is active and Gazoken Pages is published.
See [GitHub: using a custom domain across multiple repositories](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages#using-a-custom-domain-across-multiple-repositories).

`/gazoken/` is a URL path under `chronomicron.com`. It is not a separate DNS
domain or a value to place in a project CNAME file. Under the inherited-domain
plan, leave the project custom-domain override unset; do not assign the main
site's domain directly to this project.

GitHub Pages serves static HTML, CSS, and JavaScript, optionally produced by a
build process. It could host project documentation and a browser-based workbench;
server-side analysis would require a separate execution service. This does not
yet select the tool execution architecture.
See [GitHub: what is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Implementation checklist when website work begins

1. Verify the main user site's Pages custom-domain setting, DNS, and HTTPS.
2. Choose the Gazoken website implementation and publishing source: branch output
   or an Actions workflow. The initial placeholder uses buildless HTML with
   `main` / `/(root)` branch publishing; a future application may change this.
3. Configure generated assets, navigation, and any client routes for `/gazoken/`.
4. Publish Gazoken as a project site with no project custom-domain override under
   the inherited-domain plan.
5. Verify the intended HTTPS address and trailing-slash behavior, asset loading,
   navigation, and direct links or reloads on any nested routes.
6. Add a link from the main website to Gazoken when the project page is ready.
7. Record deployment settings, build command, rollback procedure, and verified
   public URL here once established.

If the root domain is served elsewhere, confirm path routing with that host
before selecting an alternative deployment route.

## Browser demo and full local app

Checked 2026-11-04 against the current checkout and
[GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
Pages hosts static HTML/CSS/JavaScript; it does not execute our Python API.

| Entry point | Runs where | Current capabilities |
| --- | --- | --- |
| `index.html` | Visitor's browser; no Python installation | Workbench-matched three-phase layout and catalog; JPEG steps 1.1 source identity, 1.2 file structure, and 1.3 metadata inventory; ELA, local-mean residual, Sobel edges, bit planes; sample gallery including a known PNG bit pattern. Other catalog steps explain local installation or planned status. |
| `jpeg.html` | Visitor's browser; no Python installation | Raw JPEG segments, metadata, quantization/Huffman tables, scan structure, hex view, byte statistics; three JPEG samples. |
| `gazoken` command | User's local Python server and browser | Three-phase module framework, original-byte identity, file structure, bounded metadata, distribution, exact quantization tables, Huffman codebook/scan inventory and bounded embedded JPEG extraction, current-run evidence assembly, parameter/result/session records; most planned adapters remain unimplemented. |

The static pages already provide a working subset, rather than a disabled copy of
the Python framework. A useful public portal can link these two demos, describe
the local app's additional workflow, and link installation instructions/source.
Sharing a visual shell/catalog later is possible, but each executable capability
must declare its browser/Python availability. Browser decode results and local
Python outputs need explicit provenance and parity checks before being equated.

The public `index.html` uses the same `src/gazoken/web/workbench.css` stylesheet as
the local Python interface and mirrors its rail, media selector, phase navigation,
source viewer, step selection controls, execution plan, and run bar. It opens in
Phase 1, reads the shared step catalog from `src/gazoken/web/steps.json`, and shows
Python parameters as read-only previews. Selected Python steps lead to setup
guidance; the four browser image views remain runnable in Phase 2. The browser
viewer also has working grid and zoom controls. The Phase 1 JPEG inspector remains
a separate page and asks visitors to choose the file there again. This shared
presentation does not make the local FastAPI API available on GitHub Pages.

For the full app today, users can clone the repository **or download its source
ZIP**, install Python 3.11+, create a virtual environment, install the checkout
with `pip install -e .`, and run `gazoken`. See
[local setup](local-workbench.md). A source checkout is currently needed because
shared assets and fixtures live outside the Python package. No standalone wheel,
PyPI release, or desktop installer is promised by these instructions.

A future installer could remove the source-download requirement. A hosted Python
service is also possible, but requires a separate backend and explicit upload,
resource-limit and retention decisions. Neither is implemented here. Python in
WebAssembly is another future option, not required for the existing JavaScript demo.

The gallery reads `assets/samples.json` and loads existing generated fixtures.
Publish that file and `assets/js/samples.mjs` with the existing complete assets and
fixture directories. The current changes are local; public deployment has not
been verified or changed by this increment.

The optional [1.9 native coefficient reader](stored-coefficients.md) runs only in
the local Python app; install `.[coefficients]` separately. Its buffers are not
available to the static JavaScript demo. No public backend was added.

Step 1.10 [coefficient statistics](coefficient-statistics.md) consumes that native
package in the same local run. It is not added to the static browser demo.

The public `index.html` and `jpeg.html` pages load the user-provided Statcounter
snippet (project 13365206) and disclose page-visit analytics in their footers.
The tracker is a third-party request; local image decoding and inspection remain
in the visitor's browser, and image bytes are not sent to Statcounter. The local
Python workbench does not include this tracker.

The static workbench now has a browser-specific shared `SourceContext` and
isolated JavaScript adapters for JPEG steps 1.1 (source identity), 1.2 (file
structure), and 1.3 (metadata inventory). The wrapper retains the original encoded file and records an optional
decoded-pixel representation separately, so later format-specific steps can
choose the representation they require. See [browser tool inputs and modules](browser-tools.md).
This does not add BMP support or change the Python adapter contract.
