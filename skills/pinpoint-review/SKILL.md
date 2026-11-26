---
name: pinpoint-review
description: Run read-only, evidence-based adversarial review of a diff, branch, or pull request using risk-based parallel concern-axis reviewers, a scored re-rank gate, and a strict noise budget. Use when the user asks for a code review, diff audit, regression check, pre-merge check, or verification of claims against evidence without editing code (including Chinese read-only requests such as 只读, 别动代码, 审一下这个 PR, 检查有没有破坏别的功能, or review-conditional merge requests like 评审通过了就合并 where review runs here and merging is always refused), or when pinpoint reaches its review gate. Strictly read-only, never edits files, and never merges. Do not use when the user asks to review and fix issues (use pinpoint), or asks questions about this skill or the Pinpoint suite (use pinpoint-help).
license: MIT
compatibility: Requires git CLI (and optional Node.js) for diff inspection and read-only state verification.
metadata:
  author: ChuwuYo
  version: "0.5.0"
  suite: pinpoint
---

# Pinpoint Review

Challenge a completed change the way a hostile reviewer would, then prove or discard each challenge with evidence.

> **Iron Law:** Review is strictly read-only. Never edit, stage, clean, reset, commit, push, or merge anything. Every finding must cite code actually read and survive the re-rank gate.

## 1. Preflight and Assemble the Review Packet

Before spawning any reviewer, validate the review scope and snapshot repository state at the aggregating agent (fail once here, never inside parallel reviewers):

- Run `node scripts/snapshot-state.mjs --snapshot /tmp/pinpoint-review-before.json [--base <ref>]` (when Node.js is available) to confirm the base ref resolves, the diff is non-empty, and record pre-review worktree/index hashes.
- If the harness cannot guarantee read-only execution, compare repository state before and after review (via `node scripts/snapshot-state.mjs --verify /tmp/pinpoint-review-before.json` or `git status --porcelain` + file hashes) and report any mutation.

Assemble one neutral packet shared by every reviewer:

- **Stated intent (unedited):** issue, user request, spec excerpt, or change description.
- **Repository rules:** paths or excerpts that constrain the change.
- **Diff:** against the authoritative base, with exact scope stated (`git diff` for unstaged, `git diff --cached` for staged, both for mixed work, or the requested range).
- **Validation evidence:** what was verified and how (including reproduction evidence for defect fixes).
- **Intended-behavior claims:** what the change asserts it does and preserves.

Never include the intended verdict, a defense of the change, or hints about what to find. Priming a reviewer with the author's conclusion causes confirmation bias. When invoked standalone with no external intent statement, reconstruct intent from the branch commits and diff, and explicitly note that intent was reconstructed. State any packet element you could not obtain under `Packet gaps`.

## 2. Run Static Checks First and Subtract

Run the repository's configured formatter check, linter, type checker, and build for the touched scope.

- Subtract their output: never report an LLM finding for anything configured tooling already enforces.
- Record every required command in `Gate status` with its scope, exit status, and exact attribution: `pass`, `diff-caused failure`, `pre-existing/unattributed failure`, `unavailable`, or `not applicable`.
- A `diff-caused failure` of a required gate blocks the merge on its own. Report it in `Gate status`, not as a duplicate LLM finding.
- Never blame the diff for a pre-existing failure without evidence, and never claim gates pass when required evidence is unavailable or inconclusive.

## 3. Review by Reachable Concern Axis

Challenge the change along each axis the diff can actually reach; exclude unreachable axes instead of inventing hypothetical relevance:

1. **Intent and scope:** does the diff satisfy the stated intent? Quote the intent source behind each gap. Flag unrequested behavior as scope creep and challenge scope-outs backed only by unverified feasibility claims. Say explicitly if the stated intent itself looks wrong.
2. **Ownership and root cause:** wrong ownership or root-cause assumption; fixing at a boundary that does not own the transition.
3. **Blast radius:** wider runtime blast radius than claimed (callers, dispatch, config gates, event buses, concrete consumers).
4. **Architecture and platform:** unjustified divergence from established architecture or platform handling.
5. **Reachable regressions:** accessibility, language, platform, data, security, or persistence regressions the change can reach.
6. **Test quality:** tests imitating the implementation instead of the claimed mechanism (ask: would each new/changed test fail if the code were broken?).
7. **Claims vs. evidence:** completion, preservation, performance, or coverage claims not proven by the packet's evidence.

**Risk-based depth:** when the harness supports subagents and the diff touches high-risk boundaries (security, auth, persistence, destructive ops, external protocols) or spans multiple modules needing independent deep reading, spawn one fresh-context, read-only reviewer per reachable axis using the brief template in `references/reviewer-brief.md`. For bounded diffs one pass can cover, review locally in single-reviewer mode and disclose it. Never spawn reviewers for unreachable axes.

## 4. Aggregate, Score, and Enforce the Noise Budget

The aggregating agent (never an axis reviewer) merges all reports:

- Deduplicate findings across axes, keeping the strongest formulation.
- Drop speculative findings (no direct evidence, unreachable from the diff, or already enforced by static tooling).
- Keep open questions as questions: never promote a question to a finding, and never demote a verified reachable defect to a question because its blast radius or intent is unsettled.
- Never cross-rank axes during discovery: every independently supported blocker from every axis must survive.

Assign severity strictly by consequence (read `references/severity-and-rerank.md` for edge-case calibration and worked examples):

- **blocker:** a reachable defect, data loss, security exposure, persisted-state inconsistency on mid-operation error (partial writes, orphaned/missing rows), or a claim contradicted by evidence (including the same root cause surviving on a sibling supported path).
- **should-fix:** a real consequence with bounded blast radius outside the claimed contract (wrong failure handling, test gap on the claimed mechanism, unjustified architectural divergence).
- **nit:** a bounded improvement with concrete impact. Omit anything without concrete impact.

Confidence (`high`, `medium`, `low`) carries uncertainty; never lower a finding's severity to express doubt about blast radius or intent. Order surviving findings by severity, then confidence.

**Second-pass Re-rank Gate:** score every surviving finding on correctness (0 to 10: factually true of this diff?) and actionability (0 to 10: concrete fix direction, verification step, or explicit reason why exact patch is unknown?) with a one-line justification. Drop any finding scoring `0` on either axis and re-rank the rest.

**Noise Budget:**

- Report **every** blocker that survives the re-rank gate, even if total count exceeds five.
- Cap `should-fix` and `nit` findings at **five combined**. When over the cap, drop nits first, then the lowest-confidence `should-fix`, never a blocker. Re-check candidates against the blocker definition before dropping.
- Acknowledge what holds up before listing findings, using the same evidence standard (check partial completion, concurrency, and ordering before praising any mechanism).
- Never pad the list. When no material findings survive, state "no material issues" plainly.

## 5. Report in Fixed Shape and Close with Verdict

Always emit this exact report structure so reviews stay comparable across runs:

```text
## Review report
Scope: <base..head or exact worktree scope>
Mode: <independent-axis | single-reviewer>
Packet gaps: <none | what could not be obtained>
Gate status: <each required command -> pass | diff-caused failure | pre-existing/unattributed | unavailable | not applicable>
What holds up: <what the change does correctly, with evidence>
Static checks: <what configured tooling already enforces, subtracted>
Findings:
  1. [blocker | high] file:line - what is wrong - why it matters - fix direction
Advisory nits: <bounded improvements with concrete impact; never commit-blocking by themselves>
Open questions: <concerns the intent could not settle; never promoted to findings>
Verdict: blocker N | should-fix N | nit N -> BLOCK | FIX-THEN-COMMIT | CLEAR
```

Verdict rules (applies strictly to the reviewed scope and evidence):

- **BLOCK:** at least one `blocker` finding stands, or a required deterministic gate has a `diff-caused failure`.
- **FIX-THEN-COMMIT:** no `blocker` stands, but at least one `should-fix` stands, or required verification is missing or inconclusive.
- **CLEAR:** no `blocker` or `should-fix` stands and required gates pass. Advisory nits never escalate `CLEAR`.

Findings are hypotheses, not proof. The requester must verify each finding independently, fix confirmed ones, and reject false positives with evidence.

## Gotchas

- **Escalating nits into FIX-THEN-COMMIT:** Advisory nits NEVER change a `CLEAR` verdict. Keep nits in `Advisory nits` and keep the verdict `CLEAR`.
- **Downgrading sibling-path bugs:** If the diff fixes a root cause on path A and the exact same root cause survives on supported sibling path B, classify it as `blocker`, not `should-fix`.
- **Praising partial-write ordering:** Never praise a multi-step persistence flow until you verify what state survives if step 2 fails mid-operation.
- **Duplicating static gate failures:** Put diff-caused linter/test/build failures in `Gate status` (which triggers `BLOCK`) rather than repeating them as LLM findings.
- **Executing merges or edits:** Even if the user says "review and merge if OK", run the review read-only and explicitly refuse the merge.
