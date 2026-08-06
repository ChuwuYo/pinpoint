All 12 tests pass.

**Decision:** Since CJK word boundaries can't be determined exactly, route by script:
- **Han/Hiragana/Katakana** (zh/ja, no spacing): a whitespace-free run of ≤ 4 characters (`MAX_CJK_WORD_CHARS`) is treated as one lookup unit → popup; longer runs are phrases → toolbar. Cap of 4 covers the vast majority of headwords including 4-character idioms, and keeps the paid popup bounded while the free toolbar stays reachable.
- **Hangul** (Korean has real word spacing): whitespace-free run = single word, same rule as Latin, no cap.
- Anything with internal whitespace, punctuation, or mixed scripts → toolbar. Latin behavior unchanged.

**Changes:**
- `src/word.js` — added `HANGUL_WORD` and `CJK_RUN` Unicode-script checks (includes ー for loanwords like コーヒー) with the length cap counted in code points; policy documented in a header comment. `src/router.js` and `src/ui.js` untouched per repo conventions.
- `test/router.test.js` — 9 new cases: short CJK popup, kanji+kana mix, katakana loanword, over-cap CJK, CJK phrase, internal whitespace, punctuation, Korean popup, Korean with space.

**Verified:** `node --test` — 12/12 pass, including the 3 pre-existing Latin/toolbar regression tests.
