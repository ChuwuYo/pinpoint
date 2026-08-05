---
name: pinpoint-review
description: Run evidence-based adversarial review of a diff, branch, or pull request using parallel concern-axis reviewers, a scored re-rank gate, and a strict noise budget. Use when reviewing code changes, auditing a fix or optimization before delivery, checking a diff for regressions, verifying claims against evidence, or when the pinpoint skill reaches its review stage. Read-only — never edits files.
---

# Pinpoint Review

Challenge a completed change the way a hostile reviewer would, then prove or discard each challenge with evidence. Review is read-only: never edit, stage, or clean anything. If the harness cannot guarantee read-only review, compare repository state before and after and report any mutation.

## Assemble the Review Packet

Every reviewer works from the same packet:

- the raw issue or requested change, unedited;
- repository rules that constrain the change;
- the diff against the authoritative base, with its scope stated exactly;
- reproduction and validation evidence for the claimed behavior;
- the intended-behavior claims: what the change asserts it does and preserves.

Never include the intended verdict, a defense of the change, or hints about what to find. A reviewer primed with the author's conclusion confirms it.

When invoked standalone, derive the packet: diff from the actual merge-base or requested range, the issue or request text from the user, and claims from the branch's commits and description. State any packet element you could not obtain.

## Run Static Checks First

Run the repository's configured formatter check, linter, type checker, and build for the touched scope. Subtract their output: never report a finding that configured tooling already enforces. The review's budget belongs to what static analysis cannot decide.

## Review by Concern Axis

Challenge the change along each axis that the diff can reach; exclude an axis rather than inventing hypothetical relevance:

1. **Intent and scope.** Does the diff actually address the reported issue? Quote the issue or spec line behind each gap. Flag behavior the request never asked for as scope creep.
2. **Ownership and root cause.** A wrong ownership or root-cause assumption; a fix at a boundary that does not own the transition.
3. **Blast radius.** A wider runtime blast radius than claimed — callers, dispatch, configuration gates, event buses, and concrete consumers not accounted for.
4. **Architecture and platform.** Divergence from established architecture or platform handling without justification.
5. **Reachable regressions.** Accessibility, language, platform, data, security, or persistence regressions the change can actually reach.
6. **Test quality.** Tests that imitate the implementation instead of the reported mechanism. For each new or changed test ask: would it fail if the code were broken?
7. **Claims versus evidence.** Unsupported or overstated claims — completion, preservation, performance, or coverage the packet's evidence does not prove.

When the harness provides subagents, spawn one independent read-only reviewer per reachable axis, each on a fresh context with the full packet. When subagents are unavailable, run the axes sequentially yourself and disclose that the review was single-reviewer.

## Aggregate Deterministically

The aggregating agent — not a reviewer — merges axis reports:

- Dedupe findings reported by more than one axis; keep the strongest formulation.
- Drop speculative findings: no evidence, not reachable from the diff, or already enforced by tooling.
- Never cross-rank axes. Report each axis's worst finding so a strong axis cannot mask a weak one.

Every surviving finding carries: severity (blocker, should-fix, nit), confidence (high, medium, low), evidence (file:line or artifact), and a one-line rationale. Order by severity, then confidence.

## Re-rank Gate

Before publishing, score every surviving finding in a second pass: correctness (is the claim factually true of this diff?) and actionability (can the author act on it concretely?), each 0–10 with a one-line justification. Drop findings scoring zero on either axis and re-rank the rest. This gate exists because raw reviewer output over-reports; filtering is where review quality comes from.

## Enforce the Noise Budget

- Cap material findings at five. Prefer missing a nit over burying a blocker.
- Ban nits without concrete impact on behavior, risk, or maintainability.
- Never pad the list to look thorough. When no material findings survive, say "no material issues" plainly — a clear review is a success, not a lack of diligence.
- Acknowledge what the change does correctly before listing findings; calibrate severity honestly — not everything is a blocker.

## Close with the Verdict

End every review with severity counts (blocker, should-fix, nit) and one verdict:

- **BLOCK** — a blocker finding stands.
- **FIX-THEN-COMMIT** — only should-fix or nit findings stand.
- **CLEAR** — no material findings.

Findings are hypotheses, not proof. The requester must verify each finding independently, fix confirmed ones, and reject false positives with evidence.
