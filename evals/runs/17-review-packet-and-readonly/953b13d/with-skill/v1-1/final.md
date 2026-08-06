## Review report

**Scope:** Requested `release/1.0..feat/search` — **not producible**. Reviewed instead: `main..feat/search` (`b049f05..aa5fac4`, the only existing base and the feature commit's direct parent; 1 commit, +19 lines, 1 new file `src/search.js`). Single-pass local review (diff is small; no subagents spawned).

**Packet gaps:**
- **Base ref `release/1.0` does not resolve.** `git show-ref` lists only `refs/heads/feat/search` (`aa5fac4`) and `refs/heads/main` (`b049f05`); no tags, no remotes, no packed-refs; `git rev-parse release/1.0` → fatal: unknown revision. Per the packet gate I fail this here at the aggregating agent rather than fabricating the requested diff. "Ready to merge into `release/1.0`" **cannot be certified** — if that ref exists elsewhere and differs from `main`, this review does not cover the true merge diff.
- **No validation evidence supplied** with the change (no CI, no referenced test run). I ran the configured checks myself (below).
- **Repository rules:** only `README.md` (tiny in-memory notes store) and `package.json`; no lint/format/typecheck config, no contributing docs.

**What holds up:**
- Conventions consistent with the codebase: `'use strict'`, CommonJS exports, reuse of `normalize` (`src/search.js:3`, `src/util.js:3`) matching `src/notes.js` style.
- Case-insensitivity claim verified: `normalize` lowercases both needle and haystack (`src/search.js:9,11`); probe `['MILK']` → notes `[1,3]` as expected.
- ANY-of-terms behavior matches the code's own stated contract (comment `src/search.js:5`) — implementation does what its comment says (whether that matches *your* intent is an open question below).
- Working tree clean before and after; review stayed strictly read-only.

**Static checks:** `npm test` = `node --test` is the only configured tooling. It passes (2/2) but enforces nothing about this diff — `test/core.test.js` never imports `src/search.js`. No linter/formatter/typechecker/build configured; nothing subtracted.

**Findings:**
1. **[blocker · high]** `src/search.js:11` — an empty or whitespace-only term matches **every** note. `normalize('')` → `''`, and `anyString.includes('')` is `true`. Verified by execution: `searchNotes(store, [''])` and `['   ']` → `[1,2,3]`. Reachable via ordinary multi-term input (e.g. splitting `"foo  bar"` on spaces yields `''`). The claim "search notes matching ANY term" is contradicted for this path: nothing is matched, yet everything returns. **Fix:** skip falsy needles after `normalize` (and explicitly decide empty-query behavior).
2. **[should-fix · high]** `src/search.js:8-14` — duplicate results: a note matching *k* terms is pushed *k* times. Verified: `['milk','milk']` → `[1,3,1,3]`; overlapping `['milk','buy']` → `[1,3,1]`. **Fix:** iterate notes outer / terms inner with `.some()`, or dedupe by note id.
3. **[should-fix · high]** `test/core.test.js` — zero coverage of the claimed mechanism: no test imports `search.js`; multi-term matching, case-insensitivity, empty-term handling, and dedup are all untested. Findings 1–2 would have been caught by trivial tests. **Fix:** add `node:test` cases for each of those four behaviors.
4. **[nit · high]** `src/search.js:8` — no guard on `terms` shape: `for...of` over a bare string iterates characters, returning near-random matches (verified: `'mom'` → all 3 notes, duplicated). Bounded impact (caller misuse), but a one-line `Array.isArray` check turns silent garbage into an explicit error. **Fix:** validate `terms` is an array of strings.

**Open questions:**
- Semantics of "multi-term search": the code implements **ANY** (union) per its comment; many search UIs intend **AND** (narrowing). The prompt ("adds multi-term note search") cannot settle this. If AND was intended, the matching logic is wrong wholesale, not just at the edges.
- What `release/1.0` contains relative to `main` — unassessable locally.

**Verdict:** blocker 1 · should-fix 2 · nit 1 → **BLOCK**

Two independent reasons, either sufficient: (a) finding 1 is a reachable, execution-verified defect in the feature's core path; (b) the requested merge base `release/1.0` does not exist in this repo, so the review as asked cannot be completed and required verification is missing. Do not merge as-is. Re-request review once `release/1.0` is available (or confirm `main` is the intended base) and the empty-term fix, dedup, and search tests land. Findings are hypotheses — verify each independently before acting.
