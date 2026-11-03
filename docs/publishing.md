# Website publishing plan

Updated: 2026-11-03

## Target and verified repository facts

- Source repository: [chronomicron/gazoken](https://github.com/chronomicron/gazoken).
- Intended public address: [chronomicron.com/gazoken/](https://chronomicron.com/gazoken/).
- The GitHub connector reports that the Gazoken repository is public and its
  default branch is `main` (checked 2026-11-03).
- The main website repository contains a
  [CNAME file specifying chronomicron.com](https://github.com/chronomicron/chronomicron.github.io/blob/main/CNAME)
  (checked 2026-11-03).

The domain's live DNS, certificate, Pages settings, and `/gazoken/` response have
not been verified. Attempts to inspect the website with the web tool did not
return accessible pages; this does not establish that the website is offline.
No deployment, DNS, or repository settings were changed in this documentation step.

## Proposed route: GitHub Pages project site

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
   or an Actions workflow. No framework or publishing source is selected yet.
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
