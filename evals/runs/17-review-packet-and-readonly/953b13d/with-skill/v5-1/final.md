## Review report
Scope: `main...feat/search` (merge-base b049f05; 2 files, +34)   Packet gaps: none — no repository rules file exists; intent taken from the user prompt and commit `83c012a feat(search): multi-term search with tests`; in-code claims from src/search.js:5 ("matching ANY term… case-insensitive") and the test name ("without duplicates"). Single-reviewer review (diff small enough for one pass).

What holds up:
- Case-insensitive matching is real: both needle and note text pass through `normalize` (src/search.js:9, src/search.js:11; src/util.js:4), verified by code read.
- The new test is a genuine mechanism test, not an implementation mirror: it fails when the code is broken — proven, it fails right now against the shipped implementation.
- Module style (CommonJS, `'use strict'`, store-first signature, store shape `{ notes: [] }`) matches src/notes.js exactly; no blast radius on existing code — both files are new, and the two pre-existing core tests still pass.

Static checks: only configured tooling is `npm test` (`node --test`, package.json:6). Result: 2 pass, 1 fail — `searchNotes matches any term without duplicates` (test/search.test.js:14, `3 !== 2`). Attribution: **diff-caused** — both files are introduced by this branch; the pre-existing suite passes. No linter/formatter/typecheck configured.

Findings:
1. **[blocker · high] src/search.js:8-13** — `searchNotes` pushes a note once per matching term with no dedupe, so a note matching multiple terms appears multiple times. Directly contradicts the branch's own stated behavior ("without duplicates"); the branch's own test fails (`3 !== 2`: 'alpha beta gamma' matches both 'alpha' and 'beta' → pushed twice; reproduced read-only: `searchNotes(s,['alpha','beta'])` → ids `[1,1]`). Required gate `npm test` fails because of the diff. Fix direction: dedupe by note identity — `if (!matches.includes(note)) matches.push(note)`, track seen ids in a `Set`, or invert the loops (notes outer, terms inner, `break` on first match).
2. **[should-fix · medium] src/search.js:9** — a term that normalizes to `''` (empty or whitespace-only) matches every note, since `''.includes('')` semantics make `normalize(note.text).includes('')` true for all; verified: `searchNotes(s,['  '])` returned 2/2 notes. Any caller splitting a raw query on spaces (double/leading spaces → empty tokens) silently returns the entire store. Fix direction: skip the term when `needle === ''` after normalize.

Open questions: none — OR ("ANY term") semantics are settled by the in-code comment and test name; only the dedupe defect is unsettled in code.

Verdict: blocker 1 · should-fix 1 · nit 0 → **BLOCK** — not ready to merge; the branch fails its own test suite on the exact behavior it claims to add. Findings are hypotheses — verify independently before fixing.
