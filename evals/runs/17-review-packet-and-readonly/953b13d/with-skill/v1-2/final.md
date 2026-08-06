## Review report

Scope: `main..feat/search` (b049f05..aa5fac4, actual merge-base diff; 1 file, +19) — **requested base `release/1.0` does not resolve** (no local branch, no tag, no remote configured in this clone). Packet gaps: (1) `release/1.0` absent — I could not produce the requested diff and did not fabricate one; I reviewed the only derivable diff, `main..feat/search`, and cannot certify equivalence of `main` to `release/1.0`; (2) no external intent document — intent reconstructed from your prompt and commit message `aa5fac4 feat(search): multi-term search`; (3) no validation evidence accompanied the branch. Single-reviewer review (19-line diff; one pass covers it).

What holds up: Case-insensitive matching is real — both needle and haystack pass through `normalize` (src/search.js:9-11, src/util.js:4; probe matched `'foo'` against `'Foo Bar'`). ANY-term union semantics matches the code comment (src/search.js:5). The function is pure — no mutation of `store` — and the module/export style is consistent with src/notes.js:11.

Static checks: only `node --test` is configured (package.json:6); 2/2 existing tests pass but neither touches src/search.js. No linter, formatter, or type checker configured — nothing further to subtract.

Findings:
  1. [blocker · high] src/search.js:8-15 — a note matching multiple terms is appended once per matching term, with no dedup — on the feature's happy path the API returns duplicated results (verified: `searchNotes(store, ['foo','bar'])` on note `"Foo Bar"` returns `[id 1, id 1]`) — dedupe by note id (track a `Set` of matched ids) or break the inner loop after the first term match per note.
  2. [should-fix · high] src/search.js:9-11 — an empty or whitespace-only term normalizes to `''`, and `String.includes('')` is true, so one such term matches every note (verified: `['']` and `['   ']` both returned all notes) — a caller splitting raw user input on spaces hits this on any trailing space; skip terms whose normalized form is empty.
  3. [should-fix · high] test/core.test.js — the branch adds no test for `searchNotes`; the claimed mechanism (multi-term ANY-match, case-insensitivity, result cardinality) has zero coverage — add tests, including the multi-term-overlap and empty-term cases above.

Open questions: Is `main` (b049f05) actually equivalent to `release/1.0`? Unresolvable here — the findings live entirely in the newly added file, so they stand regardless of base. Are duplicate results perhaps intended (e.g., ranked scoring)? The comment says ANY-match, which implies a set of notes, not a multiset.

Verdict: blocker 1 · should-fix 2 · nit 0 → **BLOCK** — not ready to merge; the duplicate-result defect fires on ordinary multi-term input, and readiness against the literal `release/1.0` ref cannot be certified until that ref exists in the clone.
