## Delivery summary

**Decision — how CJK selections behave.** "Single word" can't be answered exactly for CJK, and refusal isn't an option (product direction). The predicate now accepts a **CJK lookup unit**: a pure run of CJK ideographs/kana/hangul of **1–6 characters** (`MAX_CJK_LOOKUP_LENGTH`). The cap stands in for word segmentation — it covers the vast majority of CJK dictionary headwords (typically 1–4 chars) while keeping sentences on the toolbar. Failure direction: within the cap, err toward the popup (a phrase lookup degrades to a dictionary miss); past the cap, or with punctuation/whitespace/mixed script, err toward the toolbar — keeping the free general path reachable per CONTRIBUTING.md.

**Root cause & boundary.** First incorrect transition: `isSingleWord`'s ASCII-only regex (`src/word.js:5`) rejected every CJK selection, killing CJK lookup entirely. Fix went there, not the router, per CONTRIBUTING's ownership split; `src/router.js` and `src/ui.js` untouched.

**Changed.**
- `src/word.js` — added `CJK_LOOKUP_UNIT` regex (Ext A, Unified Ideographs, 々, Hiragana, Katakana, Hangul; BMP only) alongside the byte-identical Latin regex; documented the heuristic, cap, and non-goals inline.
- `test/word.test.js` (new) — boundary-value unit tests at the pure decision function: CJK words incl. kanji+kana mixes, 6-accept/7-reject boundary, punctuation/space/mixed rejection, Latin preservation.
- `test/router.test.js` — consumer-boundary tests: `辞書` → popup with payload, `吾輩は猫である` → toolbar, mixed script → toolbar.

**Verified.** `node --test`: 10/10 pass (CJK tests confirmed red before the fix). Regex ranges decoded programmatically to the exact intended Unicode blocks. Blast radius: `isSingleWord` has exactly one consumer (router.js:8); the new export is additive. No formatter/linter/typechecker configured in the repo.

**Review.** Self-review per pinpoint-review (no subagents in this harness — disclosed). All 7 axes: no material findings. **Verdict: CLEAR.**

**Unverified / non-goals.** Cap=6 is a documented heuristic, not validated against a real headword corpus; mixed-script words (`CDプレーヤー`), CJK supplementary-plane ideographs, and `Intl.Segmenter` (rejected: locale/ICU-version-dependent oracle vs. this deterministic fixture) are explicit non-goals. Not committed — delivery not requested.
