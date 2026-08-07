## Review report

**Scope:** `main...feat/search` (merge-base `5396cce`..head `e609772`) — one commit, one file: `src/search.js` (+19). Chosen diff: `git diff main...feat/search`; the worktree's staged (`README.md` WIP line) and unstaged (`src/notes.js` scratch comment) changes are outside the branch diff and excluded from scope.
**Mode:** single-reviewer (no subagents spawned — 19-line diff, one pass covers all axes).

**Packet gaps:**
- No external spec beyond the one-line prompt; "multi-term note search" does not state ANY-vs-ALL semantics or result-shape expectations. Claims reconstructed from the commit message and the code comment at `src/search.js:5`.
- The test gate ran against the working tree, not the pure branch; the contamination is comment-only (no behavioral impact), but a merge decision based on this run inherits that caveat.

**Gate status:** `node --test` → 2/2 pass, exit 0. Both tests pre-date the branch (`test/core.test.js:9,16`); the gate exercises none of the new code.

**What holds up:**
- Case-insensitive matching reuses the existing `normalize` (`src/util.js:3-5`) rather than reimplementing it; verified empirically (`['milk']` matches `"Buy milk and eggs"`).
- Module shape matches repo convention: `'use strict'`, CommonJS `module.exports`, same as `src/notes.js:1,11`.
- Zero blast radius to existing behavior: the diff touches no existing file, and `searchNotes` has no callers yet (grep confirms only definition/export), so `addNote`/`listNotes`/`normalize` cannot regress.

**Static checks:** only `node --test` is configured (`package.json:6`) — no formatter, linter, or type checker exists, so nothing was subtracted.

**Findings:**
1. **[blocker · high]** `src/search.js:8-15` — a note matching multiple terms is returned once per matching term, so multi-term search yields duplicates. Reproduced: `searchNotes(store, ['milk','eggs'])` → `[{id:1},{id:1}]`. Overlapping ANY-matches are the common case for multi-term search, not an edge case; any consumer rendering or counting results gets wrong output. Fix: dedupe (e.g., track seen note ids, or break inner loop after first term match per note).
2. **[should-fix · high]** `src/search.js:9-11` — an empty or whitespace-only term normalizes to `''`, and `String.prototype.includes('')` is always true, so one blank term returns the entire store. Reproduced: `searchNotes(store, [''])` and `['  ']` → all notes. Realistically reachable when a caller tokenizes input with consecutive/leading spaces (`'milk  eggs'.split(' ')` → `['milk','','eggs']`). Fix: skip terms whose normalized form is empty.
3. **[should-fix · high]** `test/core.test.js` — the branch adds the entire claimed feature with zero tests; `node --test` passes with `searchNotes` deleted. There is no regression net for findings 1–2 or the claimed case-insensitive ANY-semantics. Fix: add tests covering multi-term match, dedupe, blank-term handling, and case-insensitivity.

**Advisory nits:** none meeting the concrete-impact bar (per-term re-normalization of every note at `src/search.js:11` is O(terms × notes), but immaterial for a tiny in-memory store).

**Open questions:**
- Semantics: the prompt says only "multi-term note search"; the code comment claims ANY-match (`src/search.js:5`). If ALL-terms (AND) was intended, the loop structure is wrong by design — intent cannot settle this.
- `searchNotes` has no caller anywhere in the repo. Is landing an unwired feature the intended scope of this branch?

**Verdict:** blocker 1 · should-fix 2 · nit 0 → **BLOCK**. Not ready to merge: fix the duplicate-results defect, guard blank terms, and add tests that actually exercise `searchNotes`. Findings are hypotheses — verify each independently before acting.
