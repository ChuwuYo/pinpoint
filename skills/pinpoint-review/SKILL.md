---
name: pinpoint-review
description: Run evidence-based adversarial review of a diff, branch, or pull request using parallel concern-axis reviewers, a scored re-rank gate, and a strict noise budget. Use when reviewing code changes, auditing a fix or optimization before delivery, checking a diff for regressions, verifying claims against evidence, or when the pinpoint skill reaches its review stage. Read-only — never edits files.
---

# Pinpoint Review

Challenge a completed change the way a hostile reviewer would, then prove or discard each challenge with evidence. Review is read-only: never edit, stage, or clean anything. If the harness cannot guarantee read-only review, compare repository state before and after and report any mutation.

## Assemble the Review Packet

Every reviewer works from the same packet:

- the stated intent, unedited — whatever form it takes: an issue, a user request, a spec excerpt, or the change's own description;
- repository rules that constrain the change;
- the diff against the authoritative base, with its scope stated exactly;
- validation evidence for the claimed behavior — reproduction evidence when the change fixes a defect;
- the intended-behavior claims: what the change asserts it does and preserves.

Never include the intended verdict, a defense of the change, or hints about what to find. A reviewer primed with the author's conclusion confirms it.

When invoked standalone, derive the packet: diff from the actual merge-base or requested range, the intent as stated by the user, and claims from the branch's commits and description. Choose the smallest correct diff command: `git diff` for unstaged work, `git diff --cached` for staged work, both for mixed work, the requested range for an explicit comparison. When no external statement of intent exists, reconstruct it from the change itself and say so. State any packet element you could not obtain.

Before spawning any reviewer, confirm the base ref resolves and the diff is non-empty. Fail here, at the aggregating agent — not inside parallel reviewers each discovering the same dead end.

## Run Static Checks First

Run the repository's configured formatter check, linter, type checker, and build for the touched scope. Subtract their output: never report a finding that configured tooling already enforces. The review's budget belongs to what static analysis cannot decide.

## Review by Concern Axis

Challenge the change along each axis that the diff can reach; exclude an axis rather than inventing hypothetical relevance:

1. **Intent and scope.** Does the diff actually address the stated intent? Quote the intent source — issue, request, spec, or change description — behind each gap. Flag behavior the intent never asked for as scope creep. If the stated intent itself looks wrong — not merely unmet — say so explicitly.
2. **Ownership and root cause.** A wrong ownership or root-cause assumption; a fix at a boundary that does not own the transition.
3. **Blast radius.** A wider runtime blast radius than claimed — callers, dispatch, configuration gates, event buses, and concrete consumers not accounted for.
4. **Architecture and platform.** Divergence from established architecture or platform handling without justification.
5. **Reachable regressions.** Accessibility, language, platform, data, security, or persistence regressions the change can actually reach.
6. **Test quality.** Tests that imitate the implementation instead of the claimed mechanism. For each new or changed test ask: would it fail if the code were broken?
7. **Claims versus evidence.** Unsupported or overstated claims — completion, preservation, performance, or coverage the packet's evidence does not prove.

When the harness provides subagents and the diff is large enough that axes need independent deep reading, spawn one independent read-only reviewer per reachable axis, each on a fresh context. For a diff one pass can cover, review locally — parallel reviewers are a tool for depth, not a ritual.

Every axis reviewer gets the same brief, with only the axis differing:

```text
Review one axis of a change, read-only. Never edit, stage, or mutate anything.

Packet:
- Stated intent: <unedited>
- Repository rules: <paths or excerpts>
- Diff: <diff command or full diff>
- Validation evidence: <what was verified and how>
- Claims: <what the change asserts it does and preserves>

Your axis: <axis name and its challenge questions>

Report only code you actually read — cite the hunk, never infer from filenames
or hunk headers. For each finding give: file:line, what is wrong, why it
matters, fix direction, and confidence (high, medium, low). Skip anything the
static checks already enforce. If a concern may be real but the intent is
unclear, return it as an open question, not a finding. If nothing on your axis
is material, answer exactly: "no material findings on this axis".
Send findings to the aggregating agent only.
```

When subagents are unavailable, run the axes sequentially yourself and disclose that the review was single-reviewer.

## Aggregate Deterministically

The aggregating agent — not a reviewer — merges axis reports:

- Dedupe findings reported by more than one axis; keep the strongest formulation.
- Drop speculative findings: no evidence, not reachable from the diff, or already enforced by tooling.
- Keep open questions as questions — never promote one to a finding to look decisive.
- Never cross-rank axes. Report each axis's worst finding so a strong axis cannot mask a weak one.

Assign severity by consequence, not by how the finding sounds:

- **blocker:** a reachable defect, data loss, security exposure, or a claim the evidence contradicts.
- **should-fix:** a real consequence with a bounded blast radius — wrong failure handling, a test gap on the claimed mechanism, unjustified divergence from established handling.
- **nit:** a bounded improvement with concrete impact. Anything without concrete impact is not reported at all.

Not everything is a blocker; severity inflation is how noise budgets die. Every surviving finding carries: severity, confidence (high, medium, low), evidence (file:line or artifact), a one-line rationale, and a fix direction — or an explicit note why the fix is unknown. Order by severity, then confidence.

## Re-rank Gate

Before publishing, score every surviving finding in a second pass: correctness (is the claim factually true of this diff?) and actionability (can the author act on it concretely?), each 0–10 with a one-line justification. Drop findings scoring zero on either axis and re-rank the rest. This gate exists because raw reviewer output over-reports; filtering is where review quality comes from.

## Enforce the Noise Budget

- Cap material findings at five. Prefer missing a nit over burying a blocker.
- Ban nits without concrete impact on behavior, risk, or maintainability.
- Never pad the list to look thorough. When no material findings survive, say "no material issues" plainly — a clear review is a success, not a lack of diligence.
- Acknowledge what the change does correctly before listing findings, with the same evidence standard as findings. Praise without evidence is noise too.

## Report in a Fixed Shape

```text
## Review report
Scope: <base..head>   Packet gaps: <none | what could not be obtained>
What holds up: <what the change does correctly, with evidence>
Static checks: <what configured tooling already enforces — subtracted>
Findings:
  1. [blocker · high] file:line — what is wrong — why it matters — fix direction
Open questions: <concerns the intent could not settle — never promoted to findings>
Verdict: blocker N · should-fix N · nit N → BLOCK | FIX-THEN-COMMIT | CLEAR
```

A fixed shape keeps reviews comparable across runs: the requester can tell at a glance whether this review is stricter than the last, and why.

## Close with the Verdict

End every review with severity counts (blocker, should-fix, nit) and one verdict:

- **BLOCK** — a blocker finding stands.
- **FIX-THEN-COMMIT** — only should-fix or nit findings stand.
- **CLEAR** — no material findings.

Findings are hypotheses, not proof. The requester must verify each finding independently, fix confirmed ones, and reject false positives with evidence.
