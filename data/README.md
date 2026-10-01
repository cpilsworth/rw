# Static JSON content

JSON files in this directory are repository assets served by AEM Code Sync.
JSON2HTML reads those assets and applies a Mustache template when a page is
**previewed**. The generated HTML is stored separately from the JSON.

**Pushing updated JSON does not, by itself, regenerate or publish the page.**
The sequence is: update JSON -> push to Git -> wait for Code Sync -> preview the
page -> review it -> publish the page.

## Current job mapping

| Item | Location |
| --- | --- |
| JSON | [`jobs/1914237-clinical-negligence-solicitor.json`](jobs/1914237-clinical-negligence-solicitor.json) |
| Template | [`../templates/job-detail.html`](../templates/job-detail.html) |
| JSON2HTML mapping | [`../tools/json2html/config.json`](../tools/json2html/config.json) |
| Page path | `/legal/jobs/personalinjury/1914237-clinical-negligence-solicitor` |

The examples below target `cpilsworth/rw`, branch `main`, and run from the
repository root. Use the JSON's top-level `path` as the page path: **do not
preview/publish the JSON asset URL or the template URL**.

## Authorization

Set `HLX_TOKEN` to a valid AEM Admin API token with preview/publish permissions.
If the token is stored as an unquoted `HLX_TOKEN=...` line in the ignored `.env`
file, load it without printing it:

```sh
export HLX_TOKEN="$(sed -n 's/^HLX_TOKEN=//p' .env)"
: "${HLX_TOKEN:?Set HLX_TOKEN to a valid AEM Admin API token}"
```

Never commit `.env` or the token. Tokens expire; authenticate again through
<https://admin.hlx.page/auth/adobe> when necessary.

## 1. Update and push the JSON

Edit the JSON, check its syntax, then commit and push:

```sh
node -e "JSON.parse(require('node:fs').readFileSync('data/jobs/1914237-clinical-negligence-solicitor.json', 'utf8'))"

git add -- data/jobs/1914237-clinical-negligence-solicitor.json
git commit -m "Update clinical negligence job content"
git push origin main
```

Wait for Code Sync to deploy the asset. Fetch the following URL and confirm it
contains the values you just changed before triggering a preview:

```sh
curl --fail-with-body --silent --show-error \
  https://main--rw--cpilsworth.aem.page/data/jobs/1914237-clinical-negligence-solicitor.json
```

Previewing before the asset is updated can regenerate the page with old data.

## 2. Regenerate the preview page

Read the mapped page path from the JSON and trigger an AEM preview:

```sh
PAGE_PATH="$(node -p "require('./data/jobs/1914237-clinical-negligence-solicitor.json').path")"

curl --fail-with-body --silent --show-error \
  -X POST "https://admin.hlx.page/preview/cpilsworth/rw/main${PAGE_PATH}" \
  -H "Authorization: token ${HLX_TOKEN}"
```

The Admin service requests the page from the configured JSON2HTML overlay.
JSON2HTML fetches the latest deployed JSON, renders the template, and AEM ingests
the result into its preview content store.

Review the updated page at:

<https://main--rw--cpilsworth.aem.page/legal/jobs/personalinjury/1914237-clinical-negligence-solicitor>

## 3. Publish the reviewed preview

When the preview is correct, promote that page to the live content store:

```sh
curl --fail-with-body --silent --show-error \
  -X POST "https://admin.hlx.page/live/cpilsworth/rw/main${PAGE_PATH}" \
  -H "Authorization: token ${HLX_TOKEN}"
```

Review the published page at:

<https://main--rw--cpilsworth.aem.live/legal/jobs/personalinjury/1914237-clinical-negligence-solicitor>

**Publish copies the latest preview; it does not fetch the JSON again.**
Always preview after a JSON update before publishing, otherwise the previous
HTML may be published. Both POST calls return HTTP 200 on success.

## Mapping changes and troubleshooting

Normal content edits do not require re-registering the JSON2HTML configuration.
Renaming a JSON file, changing its page path, or adding another page requires a
matching service configuration update. Preserve other mappings when registering
the updated array. See [the repository setup guide](../README.md#activate-the-hosted-json2html-overlay).

For stale content, first check the deployed JSON asset, then re-preview the
page, review it, and publish again. Refreshing the browser alone cannot rebuild
the stored HTML. HTTP 401 indicates missing/expired authentication; HTTP 403
indicates insufficient permissions.

If automating this workflow, trigger on relevant JSON changes, wait for Code
Sync, and call preview for each affected mapped page before any publish call.
Keep credentials in a secret store, not in Git.

API reference: [AEM Admin API](https://www.aem.live/docs/admin.html).
