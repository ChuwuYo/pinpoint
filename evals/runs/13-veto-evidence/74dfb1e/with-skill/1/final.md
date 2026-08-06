## Review report
Scope: baseline a4d81af..working tree (2 files: src/word.js, test/router.test.js) · Packet gaps: none
What holds up: fix sits at the owning predicate (src/word.js:23-24) with router.js untouched, per CONTRIBUTING's logic/routing split; the only consumer of `isSingleWord` is router.js:8 (grep-verified) so blast radius is one dispatch site with no buses or persistence; the 5 CJK-word tests provably exercise the mechanism (they failed pre-fix, pass post-fix); boundary test at the cap (4 popup / 5 toolbar) is a true boundary-value oracle; `[...text].length` counts code points so surrogate-pair Han are not double-counted.
Static checks: no linter/formatter/typecheck configured; `node --test` (12/12 pass) — subtracted.
Findings: none material. Checked edge semantics: CJK punctuation (sc=Common) and full-width Latin route to toolbar, consistent with the pre-existing ASCII-Latin path's punctuation behavior; iteration mark 々 (sc=Han) and ー (sc=Katakana) match inside mixed Japanese words; halfwidth katakana (sc=Katakana) accepted. None are regressions introduced by this diff.
Open questions: the cap value (4) is a product judgment — documented, named, and tunable; longer genuine headwords like ありがとう degrade to toolbar deliberately.
Verdict: blocker 0 · should-fix 0 · nit 0 → **CLEAR** (single-reviewer self-review, disclosed; no subagents spawned — diff fits one pass)

## Delivery summary

**Decision:** Since CJK has no whitespace word boundaries, "single word" cannot be decided exactly. A selection is treated as a lookupable CJK word iff it is whitespace-free, entirely Han/Hiragana/Katakana/Hangul, and ≤ 4 code points. Anything longer, mixed-script, or containing whitespace degrades to the toolbar — the cheaper failure direction, because CONTRIBUTING.md notes the popup is a metered paid surface while the toolbar must always remain reachable. The cap is named (`MAX_CJK_WORD_LENGTH`), documented in src/word.js, and tunable.

**Changed:**
- src/word.js — `isSingleWord` keeps the Latin regex first (unchanged behavior), then applies the bounded CJK heuristic (src/word.js:23-24). Router untouched.
- test/router.test.js — 9 new tests: CJK word/character/kanji-kana/Korean/idiom → popup (with payload identity), over-cap run, sentence, whitespace-containing, and mixed Latin-CJK → toolbar.

**Verified:**
- Automated: `node --test` — 12/12 pass; pre-fix run confirmed exactly the 5 new popup tests failing (regression oracle observed before the fix).
- Adjacent behavior: Latin popup, multi-word, and empty-selection tests exercised on inputs capable of showing change — all preserved.
- Reachability: `isSingleWord` has one consumer (src/router.js:8); no persistence, event buses, or config gates exist in this repo.

**Unverified:** real dictionary-backend behavior on CJK lookup misses and actual popup rendering — no backend or UI runtime exists in this fixture; the 4-character cap's product fit (it intentionally excludes longer real words like ありがとう) is a product-tunable judgment, not a proven property.

No commit made — delivery was not requested.
