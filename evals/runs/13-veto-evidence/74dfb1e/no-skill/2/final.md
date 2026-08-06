All 8 tests pass. Delivery summary:

**Decision:** "Single word" is decidable only per-script. Pure-ASCII selections keep the exact existing behavior (regex, so contractions/hyphenated words still pop up). Non-ASCII selections defer to ICU word segmentation via `Intl.Segmenter` (word granularity): the popup shows only when the selection is exactly one word-like segment and nothing else. Anything ambiguous — CJK phrases, whitespace-separated terms, mixed-script, trailing punctuation — conservatively returns to the toolbar, honoring the CONTRIBUTING note that the toolbar (free path) must always remain reachable.

**Changed:**
- `src/word.js:7-19` — ASCII fast path (original regex) + `Intl.Segmenter`-based single-word check for non-ASCII; router/UI untouched.
- `test/router.test.js` — 5 new cases: single CJK word → popup; CJK phrase, whitespace-separated, mixed latin-CJK, and trailing-punctuation selections → toolbar.

**Verified:** `npm test` (`node --test`) — 8/8 pass on Node v26.5.0; also pre-validated ICU segmentation behavior (`你好`→1 word, `我喜欢猫`→3, `猫、`→word+punct) before choosing test fixtures.
