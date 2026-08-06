All 13 tests pass. Delivery summary:

**Decision.** Since CJK has no whitespace boundaries, "single word" can't be answered exactly, so I defined it as: a selection consisting **entirely of CJK characters** (Han, Hiragana, Katakana incl. `ー`, Hangul) with **no whitespace** and **at most 8 characters** (`MAX_CJK_WORD_LENGTH`) is treated as a lookup candidate and gets the popup. Longer selections, internal spaces, mixed Latin+CJK, or CJK with punctuation (`你好。`) all return to the toolbar. Rationale: dictionary headwords are short (most Chinese/Japanese words are 1–4 chars, plus idioms/proverbs up to ~7), so a bounded length is a useful approximation, and it keeps the toolbar — which CONTRIBUTING.md says must always remain reachable — as the path for sentences. Latin behavior is unchanged.

**Changed.**
- `src/word.js` — `isSingleWord` now checks the Latin regex first, then a length gate (code points, so surrogate pairs count correctly), then a Unicode-script regex; exports `MAX_CJK_WORD_LENGTH`. `src/router.js` untouched, per CONTRIBUTING conventions.
- `test/router.test.js` — 10 new tests: CJK/kana/Korean words → popup, at-limit → popup, over-limit/sentence/spaces/mixed/punctuation → toolbar.

**Verified.** `node --test`: 13/13 pass (3 pre-existing + 10 new). One bug was caught during testing: `Script_Extensions=Hiragana/Katakana` also matches shared punctuation like `。`, so I switched to strict `Script=` plus an explicit `ー` for katakana loanwords. Changes are uncommitted, confined to the fixture repo.
