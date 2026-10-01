# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--rw--cpilsworth.aem.page/
- Live: https://main--rw--cpilsworth.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `rw` directory in your favorite IDE and start coding :)

## JSON-backed job page

The captured job is stored in
[`data/jobs/1914237-clinical-negligence-solicitor.json`](data/jobs/1914237-clinical-negligence-solicitor.json).
It contains the full description, job facts, consultant contact information,
metadata and actions, with provenance and capture date. The conflicting salary
ranges in the source description and sidebar are deliberately preserved.
The dynamically populated "Similar jobs" cards are not fabricated; the section
retains its heading and official "View more jobs" link.

For subsequent JSON updates, see [the data preview/publish guide](data/README.md).

[`templates/job-detail.html`](templates/job-detail.html) is a Mustache template for
[AEM JSON2HTML](https://www.aem.live/developer/json2html). It generates BYOM sections
and a `job-detail` block. Styling and behavior reuse this repository's
`head.html`, page scripts, header/footer, Outfit font, `styles/brand.css` tokens
and global button styles. No original-site CSS, JavaScript, tracking scripts or
account APIs are included. Apply and save links open the official job page.

### Local preview

The preview and tests require Node.js 22 or later.

```sh
npm install
npm run preview:job
```

Open <http://localhost:3000/legal/jobs/personalinjury/1914237-clinical-negligence-solicitor>.
The `.html` variant also works. The development server renders the same JSON and
Mustache template on each page request, injects the repository's `head.html`, and
uses the existing preview site's navigation, footer and media. There is no build
step or browser-side templating dependency. Set `PORT` to use a different port.

```sh
npm run test:job
```

The tests cover content, escaping, optional/authored cells, official-site actions,
clipboard feedback and the local preview routes.

### Activate the hosted JSON2HTML overlay

The repository includes a mapping at
[`tools/json2html/config.json`](tools/json2html/config.json); it is **not**
automatically applied to the hosted service. After deploying the JSON, template
and block through normal Code Sync:

1. In the existing site configuration at <https://tools.aem.live/>, add this
   `content.overlay` without replacing the primary DA content source:

   ```json
   {
     "url": "https://json2html.adobeaem.workers.dev/cpilsworth/rw/main",
     "type": "markup"
   }
   ```

2. Register the mapping with an AEM admin token in `HLX_TOKEN`:

   ```sh
   curl --fail-with-body --silent --show-error \
     -X POST https://json2html.adobeaem.workers.dev/config/cpilsworth/rw/main \
     -H "Authorization: token $HLX_TOKEN" \
     -H "Content-Type: application/json" \
     --data-binary @tools/json2html/config.json
   ```

3. Preview the generated content:

   ```sh
   curl --fail-with-body --silent --show-error \
     -X POST https://admin.hlx.page/preview/cpilsworth/rw/main/legal/jobs/personalinjury/1914237-clinical-negligence-solicitor \
     -H "Authorization: token $HLX_TOKEN"
   ```

The resulting page is
<https://main--rw--cpilsworth.aem.page/legal/jobs/personalinjury/1914237-clinical-negligence-solicitor>.
Other content remains on the primary DA source. For branch testing, use that
branch in the overlay/configuration URLs and in the mapping's JSON endpoint host.
The development tools and tests are excluded from Code Sync by `.hlxignore`;
the JSON and template are intentionally served.
