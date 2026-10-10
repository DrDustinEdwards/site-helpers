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

| File | Mutants | Killed | Timeout | Survived | Score |
|------|---------|--------|---------|----------|-------|
| sitemap.mjs | 42 | 40 | 0 | 2 | 95.24% |
| search.mjs | 40 | 38 | 0 | 2 | 95.00% |
| llms.mjs | 21 | 19 | 0 | 2 | 90.48% |
| xml.mjs | 157 | 98 | 15 | 44 | 71.97% |
| feeds.mjs | 64 | 15 | 0 | 49 | 23.44% |

`feeds.mjs` is the gap: one test (`itemPath`) exercises it, and the byte-for-byte
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
