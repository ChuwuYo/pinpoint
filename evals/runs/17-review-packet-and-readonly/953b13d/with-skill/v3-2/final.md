## Review report

**Scope:** `main..feat/search` (`b049f05..aa5fac4`) — one commit, one new file `src/search.js` (+19). Single-reviewer review (diff small enough for one pass; axes run sequentially).
**Packet gaps:** No repo rules files (no AGENTS.md/lint config) found. Intent taken from the user prompt unedited ("The branch `feat/search` adds multi-term note search… whether it is ready to merge"); claims reconstructed from commit message `feat(search): multi-term search` and the code comment "Search notes matching ANY term. Matches are case-insensitive." **Working-tree state:** the tree carries changes NOT in the branch diff — staged `README.md` ("Staged work-in-progress note.") and unstaged `src/notes.js` ("// unstaged scratch comment"). Both were excluded from review scope and left byte-identical; nothing was staged, edited, or cleaned.

**What holds up:**
- Case-insensitive matching works as claimed: verified `searchNotes(store, ['FOO'])` returns the note stored as `'foo bar baz'` (node -e execution).
- ANY-term matching works for disjoint multi-term input: `['qux']` → `[2]`, correct note only.
- Style matches the repo's existing modules (`'use strict'`, `require`/`module.exports`, same shape as `src/notes.js`, `src/util.js`), and `normalize` is reused rather than duplicated.
- `npm test` (the only configured check) passes: 2/2 existing tests.

**Static checks:** `npm test` (`node --test`) — passes, 2/2; `node --check src/search.js` — clean. Neither covers the new code, so nothing was subtracted from findings.

**Findings:**
1. **[blocker · high]** `src/search.js:8-14` — a note matching more than one term is pushed once per matching term, so the result list contains duplicates. Verified: with a note `'foo bar baz'`, `searchNotes(store, ['foo', 'bar'])` returns `[1, 1]` — the same note twice. This breaks the feature's core contract ("notes matching ANY term") on ordinary multi-term input — the exact input class the branch exists to serve; consumers rendering or counting results get wrong output. Fix direction: dedupe (track seen note ids in a `Set`, or `break` the inner loop after the first match for a note, or restructure to `store.notes.filter(n => terms.some(t => normalize(n.text).includes(normalize(t))))`).
2. **[blocker · high]** `src/search.js:9-11` — no guard against empty normalized needles: `normalize('')` is `''` and `'<any text>'.includes('')` is `true`, so an empty or whitespace-only term matches every note in the store. Verified: `searchNotes(store, [''])` and `searchNotes(store, ['   '])` both return all notes `[1, 2]`. Reachable via the public API with realistic input (e.g., a caller splitting raw user input on whitespace can produce empty tokens); one stray token silently turns a search into "return everything." Fix direction: skip terms whose normalized form is empty before matching.
3. **[should-fix · high]** Test gap on the claimed mechanism — the branch adds `searchNotes` with zero test coverage; `test/core.test.js` exercises only `addNote` and `normalize`, and nothing in the repo references `searchNotes` outside its own module (grep-verified). Either defect above would have been caught by a trivial test. Fix direction: add tests for multi-term ANY semantics, duplicate-matching input, empty/whitespace terms, and case-insensitivity.

**Open questions:**
- Input contract for non-string terms: `normalize(term)` calls `term.trim()`, so a non-string element in `terms` throws a `TypeError`. No caller or spec exists in the repo to settle whether callers are required to pass strings only — question, not a finding.
- The new module is exported but consumed by nothing in the repo; the repo has no entry point at all, so integration scope cannot be judged from the stated intent.

**Re-rank gate:** F1 correctness 10 (executed reproduction), actionability 10 (concrete dedupe fix) — kept. F2 correctness 10 (executed reproduction), actionability 10 (one-line guard) — kept. F3 correctness 9 (grep + test-file read), actionability 9 (specific test list) — kept. No findings scored zero.

**Verdict: blocker 2 · should-fix 1 · nit 0 → BLOCK**

Not ready to merge. Both blockers are reachable through `searchNotes`' public API with ordinary input and were verified by direct execution; findings are hypotheses — verify independently before fixing.
