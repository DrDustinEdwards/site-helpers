# Prelum

The shared publishing code for the Dustin Edwards sites (ruling capsid/rulings/shared-homes-2026-10-06.md): the code that turns a site's
content into the documents it publishes. This repository was `DrDustinEdwards/site-helpers` and was renamed, keeping its history and
tags. The package is still named `@drdustinedwards/site-helpers` and is installed by tag:
`"@drdustinedwards/site-helpers": "github:DrDustinEdwards/prelum#v0.1.0"`.

Pure ES modules, no dependencies, Web-standard only, so the same file runs in a Worker and in Node.

## What it holds

The helpers every site wrote for itself, written once here in the form of the best of them:

| Module | Exports |
| --- | --- |
| `xml` | `escapeXml`, `escapeXmlText`, `cdata`, `rfc822`, `isoDay`, `absolutiseUrls`, `mathToTex` |
| `feeds` | `rssDocument`, `rssItem`, `atomDocument`, `atomEntry`, `jsonFeedDocument`, `feedItem` (`itemPath` moves where a post lives) |
| `sitemap` | `sitemapDocument(entries, { layout, lastmodFormat, trailingNewline })` |
| `llms` | `llmsDocument`, `llmsLink` |
| `search` | `ftsLiteral`, `toMatchExpression`, `fuse`, `RRF_K` |

The markdown pipeline moves in later, by its own job (carrel/design-markdown-pipeline.md).

## What it does not hold

These stay in each site:

- **Search behaviour.** Prelum escapes FTS5 queries and fuses ranked lists. Each site still decides which indexes it has, how it
  tokenizes, how it weights fields and what a result page shows.
- **Layouts.** No page, component or stylesheet lives here. The design system is Capsomer.
- **Ask.** Each site keeps its own question-answering feature, with its index, prompts and budget.

Runtime code that is not about publishing lives in `DrDustinEdwards/site-runtime`: security headers, the rate limiter, health, the
Access check and email.

## Tests

`test/fixtures/` holds each site's own published output, captured from germomics, foxhound and dustinedwards-info by
`scripts/capture-site-helper-fixtures.mjs` in dustinedwards-info. `PROVENANCE.json` lists the commits. `test/prelum.test.mjs`
holds the package to that output byte for byte. A change here changes what three sites publish, so it comes with a re-captured
fixture and a reviewed diff.

The tests exist to catch two defects in particular. One is an FTS5 term whose embedded quote is not doubled: the term escapes its
quotes and the query language reads the rest. The other is a fusion constant other than 60: every ranking shifts, with no error.

CI runs `npm run lint` (oxlint), `npm run typecheck` (tsc over the modules, their declarations and the tests) and `npm test` on
every pull request.
