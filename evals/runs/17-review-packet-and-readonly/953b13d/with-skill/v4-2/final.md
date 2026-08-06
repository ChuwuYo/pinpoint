## Review report

**Scope:** `main...feat/search` (merge-base `b049f05` → `aa5fac4`, 1 commit, 1 file, +19) · **Packet gaps:** No external statement of intent exists — no issue, spec, or PR description. Intent reconstructed from the commit message `feat(search): multi-term search` and the in-code comment "Search notes matching ANY term. Matches are case-insensitive." (`src/search.js:5`). No validation evidence for the claimed behavior was supplied. Review was single-reviewer, run locally (diff is small enough for one pass).

**What holds up:**
- Case-insensitivity claim verified: `normalize` lowercases both needle and haystack (`src/search.js:10`, `src/util.js:4`); executed check `searchNotes(store, ['HELLO'])` → `[1]`.
- Reuses existing `normalize` from `src/util.js:3` rather than duplicating logic; style matches repo conventions (`'use strict'`, CommonJS exports, same shape as `src/notes.js`).
- Zero blast radius on existing behavior: new file, no existing module modified, nothing yet requires `src/search.js`; existing suite still passes 2/2.

**Static checks:** Only configured tooling is `npm test` (`node --test`) — passes, but neither test requires `src/search.js`, so it enforces nothing about the new code. No linter/formatter/typechecker configured. Nothing to subtract.

**Findings:**

1. **[blocker · high]** `src/search.js:7-14` — A note matching more than one term is pushed once per matching term, so multi-term search returns duplicates. Verified: with notes `[{id:1,text:'hello world'},{id:2,text:'goodbye'}]`, `searchNotes(store, ['hello','world'])` → ids `[1,1]`. This is the feature's primary path, not an edge case: "ANY term" implies a set of matching notes, and any consumer rendering results shows the same note twice. The commit's own claim ("multi-term search") is contradicted for the multi-term case. Fix direction: dedupe by note id (e.g., track matched ids in a `Set`), or break out of the term loop once a note matches.
2. **[should-fix · medium]** `src/search.js:8-10` — An empty or whitespace-only term normalizes to `""`, and `text.includes("")` is always true, so a blank term matches the entire store. Verified: `['']` and `['   ']` both → ids `[1,2]`. Combined with finding 1, `['hello','']` returns hello-matches plus every note. Fix direction: skip empty needles after `normalize` (`if (!needle) continue;`). Confidence is medium because the contract never states empty-term semantics — see open questions.
3. **[should-fix · high]** `test/core.test.js` (whole file) — The new feature has zero test coverage; no test requires `src/search.js`. The passing suite is evidence only for `notes.js`/`util.js`, so the packet's "tests pass" signal is false confidence for the claimed behavior — and indeed finding 1 slipped through. Fix direction: add tests for `searchNotes` covering multi-term dedupe, case-insensitivity, and empty-term handling.

**Re-rank gate:** Finding 1: correctness 10/10 (executed proof `[1,1]`), actionability 10/10. Finding 2: correctness 9/10 (mechanism proved; contract silent), actionability 8/10. Finding 3: correctness 10/10 (grep confirms no test loads the module), actionability 9/10. No drops.

**Open questions:**
- Is `searchNotes` intended to be wired into a caller in this change? Nothing requires it; with no external intent statement, I cannot tell whether shipping an unwired module is in scope or a gap.
- What are the intended semantics for empty/blank terms — match-all or ignore? (Mechanism verified; the desired behavior is the unsettled part of finding 2.)
- Is result ordering/ranking (e.g., notes matching more terms first) in scope? Unstated anywhere.

**Verdict:** blocker 1 · should-fix 2 · nit 0 → **BLOCK** — not ready to merge. The multi-term duplicate defect sits on the feature's primary path and contradicts the change's own claim; it needs a fix plus tests that would have caught it. Findings are hypotheses, not proof — verify each independently before acting.
