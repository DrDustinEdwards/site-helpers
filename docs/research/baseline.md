# Prelum baseline (job_5a14c78fb205)

Measured 2026-10-10 at commit f0d16dc (main). Linux container, 4 cores, Node 22.22.0.
Same method as Foxhound's `docs/research/baseline.md`. Nothing in the source, the
tests, `package.json` or the lockfile changed, and nothing was deleted. Stryker was
installed per run with `npm install --no-save`.

## Test suite

| What | Command | Result |
|------|---------|--------|
| Tests | `npm test` (`node --test "test/*.test.mjs"`) | 1 file, 19 tests passed, 0 failed, 0 skipped |
| Runtime | `time npm test` | 0.37 s wall, 142 ms inside the runner |
| Lines | `wc -l` | 552 in the 6 modules (`xml` 172, `feeds` 214, `sitemap` 60, `search` 65, `llms` 36, `index` 5), 187 in the test file |
| Fixtures | `test/fixtures` | 9 captured outputs from the sites plus `PROVENANCE.json` |

The suite is byte-for-byte comparisons against those fixtures, so a test fails on
any change to the output. That is why most tests kill many mutants.

## Mutation baseline (StrykerJS 9.6.1)

Prelum tests with `node:test`, which Stryker has no runner for (and 10.0.0 has a
Babel 8 parser bug, so 9.6.1). The run uses the `command` runner with
`coverageAnalysis: off`, `disableBail: true`, concurrency 4, timeout 10 s. A
small wrapper (`docs/research/kill-runner.mjs`, run as the Stryker command with
`CHUNK=<file> OUT=<dir>`) ran the whole test file
once per mutant and logged which tests failed, which is what makes a per-test kill
matrix possible without per-test coverage. `ignoreStatic` needs per-test coverage,
so it is off and no mutant is ignored (Foxhound ignored 2,422 static ones).

Mutated: the five modules `sitemap`, `xml`, `feeds`, `llms`, `search` (`index.mjs`
is re-exports, `*.d.mts` are types). One chunk per file, each chunk's Stryker JSON
and matrix log pushed to `results/prelum-mutation-baseline` (`chunks/`) as it
finished. `node docs/research/build-matrix.mjs <chunks-dir>` merges them.

### Score

| Status | Mutants |
|--------|---------|
| Killed | 210 |
| Timeout (counted as killed) | 15 |
| Survived | 99 |
| No coverage | 0 |
| Ignored | 0 |
| Valid | 324 |

**Mutation score: 69.44%** (225 of 324). Every mutant is covered by some test (the
single test file loads every module), so the covered score is the same.

### Per file

| File | Mutants | Killed | Timeout | Survived | Score | Baseline |
|------|---------|--------|---------|----------|-------|----------|
| sitemap.mjs | 42 | 40 | 0 | 2 | 95.24% | 95.24% |
| search.mjs | 40 | 38 | 0 | 2 | 95.00% | 95.00% |
| llms.mjs | 21 | 19 | 0 | 2 | 90.48% | 90.48% |
| xml.mjs | 157 | 117 | 26 | 14 | 91.08% | 71.97% |
| feeds.mjs | 64 | 58 | 0 | 6 | 90.63% | 23.44% |

The `xml.mjs` and `feeds.mjs` rows are the re-run after the feed and XML tests
(job_b61976427fb8, below); the other three rows and the score above are still the
baseline. The Baseline column is the first run.

At baseline `feeds.mjs` was the gap: one test (`itemPath`) exercises it, and the byte-for-byte
fixtures cover the three feed formats only through the `xml` fragments. 49 of the
99 survivors are there, and 44 more in `xml.mjs`. Adding feed tests is worth more
than trimming anything.

### Per-test kill matrix

19 tests, keyed by name. The full matrix (per test: kills, unique kills, candidate
kind, protected flag) is `docs/research/kill-matrix.json`. Kills count mutants
across all five files, because tests reach modules through each other (the sitemap
tests also kill `xml` mutants). The 15 timeouts have no per-test attribution, since
Stryker stops the process.

| Group | Tests | Of which protected |
|-------|-------|--------------------|
| Zero-kill (kills no mutant) | 0 | 0 |
| Covered by others (every kill is also made by another test) | 4 | 3 |
| Unprotected zero-kill candidates | 0 | |
| Unprotected covered-by-others candidates | 1 | |

Protected means the test is about FTS5 escaping (`search:` quote, operators and
prefix tests), sitemap validity (`sitemap:`), or feed validity (`feeds:` and the
`xml:` feed fragments, CDATA, escaping and date tests). The name match errs toward
keeping.

### Removal candidates (nothing removed)

| Test | Kills | Unique | Kind | Protected |
|------|-------|--------|------|-----------|
| search: the fusion constant is the argument's, not a baked-in one | 10 | 0 | covered by others | no |
| sitemap: this site's document is reproduced byte for byte | 42 | 0 | covered by others | yes |
| sitemap: a loc with an ampersand does not end the document | 6 | 0 | covered by others | yes |
| xml: escaping the ampersand first does not double-escape | 2 | 0 | covered by others | yes |
| search: operators and hyphens stay literal text | 12 | 0 | covered by others | yes |

(The last four are shown for completeness: they are protected, so they are not
candidates.) That leaves one candidate in a 19-test suite, and it is the test that
pins the fusion constant to its argument, which `fusion uses k = 60` covers only
for the default. Candidates are per test, not joint: two tests that only cover each
other are both flagged, so re-run after any removal. With 99 survivors against one
candidate, this suite needs tests more than pruning.

Nothing was deleted or changed.

## Feed and XML tests (job_b61976427fb8)

Measured 2026-10-10 on top of 42b1ec9, same container, Node 22.22.0, StrykerJS
9.6.1 installed with `npm install --no-save`, same settings as above, one chunk
each for `xml.mjs` and `feeds.mjs`. No source, `package.json` or lockfile change.

Two test files were added, `test/feeds.test.mjs` (15 tests) and
`test/xml.test.mjs` (13 tests), so the suite is 3 files and 47 tests, 0.6 s wall.
They read elements back out of the output rather than comparing bytes: the
elements RSS, Atom and JSON Feed require, dates (ISO strings, Date objects,
SQLite's form read as UTC with the process in Chicago and Tokyo, missing and
invalid ones), `&`, `<`, `>` and both quotes in every text field and attribute,
`]]>` in a body, empty feeds and posts, a 35 KB post and 50 posts in order, and
root-relative links made absolute while absolute and protocol-relative ones are
left. Each feed document also goes through a small well-formedness check (tags
close in order, no bare `&`, no loose `<`).

`kill-runner.mjs` now runs every `test/*.test.mjs` file rather than
`test/prelum.test.mjs` alone, so the new tests count. Each of the 28 new tests
failed under at least one mutant in the re-run, which is the planted break it
was seen failing against. `kill-matrix.json` is not regenerated: its
`build-matrix.mjs` reads test names from one file and covers all five chunks.

### Survivors, all equivalent

`feeds.mjs`, 6, whitespace only (the output stays the same XML):

| Line | Mutant | Why it changes nothing a reader sees |
|------|--------|--------------------------------------|
| 29, 98 | `.filter(Boolean)` removed | an omitted element becomes an empty line, not an empty element |
| 44, 60, 114, 131 | `.join("\n")` to `.join("")` | items and lines run together; whitespace between elements |

`xml.mjs`, 14:

| Line | Mutants | Why it is equivalent |
|------|---------|----------------------|
| 62 | 8, every change to `isoDay`'s null, undefined and `""` guard | without it, `toDate(value, null)` reads all three as an invalid date, and `isoDay` returns null anyway |
| 75 | 2, `value !== ""` made true or compared to another string | `""` then becomes `new Date("Z")`, which is invalid, so it falls back the same |
| 123 | `display === -1` made true | KaTeX always nests a `katex` span inside `katex-display`, so a display match always has an inline one |
| 124 | `inline === -1` made false | same reason: never reached with a display match and no inline one |
| 158 | `i < source.length` to `<=` | at `i === length` both `indexOf`s miss and `spanEnd` returns -1 either way |
| 162 | `open < close` to `<=` | `<span` and `</span` cannot start at the same index |

### Noticed, not changed

`rssItem` and `atomEntry` read `publishAt` and `updatedAt` with `new Date(value)`
directly, not the `toDate` that `rfc822` uses. A SQLite-form string
(`2026-06-21 09:30:00`) is therefore read in the machine's zone (UTC in a Worker,
not on a laptop), an unreadable one prints `Invalid Date` in RSS, and Atom
throws on it. Whether that matters depends on the form `listBlogPostsRendered`
returns, which this repository does not show, so the tests use ISO strings and
Date objects and nothing here asserts either behaviour.
