## Review report

**Scope:** `main..feat/search` (merge-base `b049f05` → head `aa5fac4`; one file, `src/search.js`, +19)
**Packet gaps:** No external statement of intent exists — no issue, spec, or PR description; the request was only "review the diff against main." Intent was reconstructed from the commit message `feat(search): multi-term search` and the in-code comment "Search notes matching ANY term. Matches are case-insensitive." No validation evidence was supplied with the change. Review was single-reviewer (diff is one small file; per the skill, parallel axis reviewers are for depth, not ritual).

**What holds up:**
- ANY-term union semantics work as claimed: `searchNotes(store, ['buy','call'])` returns notes `[1, 3]` (verified by execution).
- Case-insensitivity claim holds: `normalize` (`src/util.js:3-5`) lowercases both needle and haystack; `['MILK']` → `[1, 2]` (verified).
- Module shape matches repo conventions (`'use strict'`, `module.exports`, CommonJS), consistent with `src/notes.js` and `src/util.js`.
- Existing suite still passes: `npm test` → 2 pass, 0 fail.

**Static checks:** No formatter, linter, or type checker is configured (`package.json` has only `"test": "node --test"`). Nothing to subtract. Note the configured gate does not exercise the changed code at all (see finding 3).

**Findings:**

1. **[blocker · high]** `src/search.js:9-14` — a note matching more than one term is pushed once *per matching term*, so the result contains duplicates. Verified: `searchNotes(store, ['milk','MILK'])` returns `[1, 2, 1, 2]`. The change's claimed mechanism is "search notes matching ANY term" — a result set with the same note twice contradicts that claim on a trivially reachable path. Fix direction: iterate notes in the outer loop (break on first matching term) or track seen note ids.

2. **[should-fix · medium]** `src/search.js:9` — an empty or whitespace-only term normalizes to `''`, and `''.includes('')` is true, so every note matches. Verified: `searchNotes(store, [''])` and `['   ']` both return all 3 notes — a degenerate input silently dumps the whole store. Fix direction: skip terms whose normalized form is empty.

3. **[should-fix · high]** `test/core.test.js:1-18` — the branch adds `src/search.js` but no test touches it; the suite covers only `addNote` and `normalize`. This is a test gap on the exact claimed mechanism, and finding 1 proves a real defect in that mechanism that any behavior-level test would have caught. Fix direction: add tests for union semantics, case-insensitivity, term overlap (no duplicates), and empty terms.

**Open questions:**
- Whether duplicate results are acceptable to callers cannot be settled from the packet — `searchNotes` has no consumer in the repo yet, and no external intent was stated. The defect itself (finding 1) stands on the code as written; only its blast radius is unsettled.
- Whether empty-term-matches-all is intended behavior (a "match everything" convention) is likewise not decidable from the commit message alone.

**Verdict:** blocker 1 · should-fix 2 · nit 0 → **BLOCK** — not ready to merge; fix the duplicate-match defect and add coverage for the new module first. Findings are hypotheses; verify each independently before acting.
