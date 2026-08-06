## Review report

**Scope:** `main..feat/search` (merge-base b049f05 → aa5fac4; one new file, `src/search.js`, +19)
**Packet gaps:** no external spec beyond the one-line intent ("The branch `feat/search` adds multi-term note search"); no validation evidence supplied for the new behavior. Working tree carries unrelated changes excluded from scope and left byte-identical: staged `README.md` edit ("Staged work-in-progress note.") and unstaged `src/notes.js` comment ("// unstaged scratch comment"). Review was single-reviewer (diff small enough for one pass; no subagents spawned).

**What holds up:**
- Style matches the codebase: `'use strict'`, CommonJS exports, small single-purpose module — consistent with `src/notes.js` and `src/util.js` (src/search.js:1,19).
- The case-insensitivity claim in the header comment is real: both needle and haystack pass through the existing `util.normalize` (src/search.js:8,10; src/util.js:3).
- Zero blast radius on existing paths: the diff adds one file and modifies none; nothing on `main` calls or is changed by it.
- `npm test` passes (2/2).

**Static checks:** only configured tooling is `npm test` (`node --test`) — passes; no linter, formatter, or type checker configured. Nothing enforced to subtract; note the passing tests exercise none of the new code.

**Findings:**
1. **[blocker · high]** src/search.js:7-13 — a note matching more than one term is returned once per matching term (outer loop over terms never dedupes). Reproduced: `searchNotes(store, ['milk','eggs'])` on a note "buy milk and eggs" returns `[1, 1]`. Multi-term search returning duplicate rows is a defect in the exact mechanism the branch claims to add, reachable through the normal supported path. Fix: match each note at most once — e.g. inner `terms.some(t => normalizedText.includes(normalize(t)))` over a single pass of notes, or track seen note ids.
2. **[should-fix · high]** src/search.js:8-10 — a term that normalizes to `''` (empty or whitespace-only input) makes `includes('')` true for every note, so one blank term silently turns the search into match-all. Reproduced: `['']` and `['   ']` both return all notes. Likely in practice once any caller splits user input on whitespace (`'milk  eggs'.split(' ')` yields `''`). Fix: skip empty needles after `normalize`.
3. **[should-fix · high]** test/core.test.js — no test covers `searchNotes`; the branch ships a new feature with zero verification of it, so `npm test` passing proves nothing about the change (it would also pass with findings 1-2 unfixed — as it currently does). Fix: add tests for multi-term ANY-match, dedupe across terms, case-insensitivity, and blank-term handling.
4. **[nit · medium]** src/search.js:10 — `normalize(note.text)` is recomputed for every term (O(terms×notes) normalizations). Fix: hoist note normalization into a single pre-pass. Bounded impact at this store's scale; advisory only.

**Open questions:** none — intent was sufficient to settle each concern.

**Verdict:** blocker 1 · should-fix 2 · nit 1 → **BLOCK**

Findings are hypotheses to verify independently; fix confirmed ones and reject false positives with evidence. Finding 1 must be fixed (or refuted) before merge; 2-3 should land with the fix.
