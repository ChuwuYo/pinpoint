# Axis Reviewer Subagent Brief Template

Use this exact brief when spawning fresh-context, read-only axis reviewers. Vary only the `Your axis` block so every reviewer works from identical neutral evidence.

```text
Review one axis of a change, read-only. Never edit, stage, clean, reset, or mutate anything.

Packet:
- Stated intent: <unedited>
- Repository rules: <paths or excerpts>
- Diff: <diff command or full diff>
- Validation evidence: <what was verified and how>
- Claims: <what the change asserts it does and preserves>

Your axis: <axis name and its challenge questions>

Rules:
1. Report only code you actually read. Cite the exact file:line and hunk; never infer from filenames or hunk headers.
2. For each finding provide: file:line, what is wrong, why it matters, fix direction (or why the exact fix is unknown), and confidence (high, medium, low).
3. Skip anything configured static checks already enforce.
4. If a concern may be real but intent is unclear, return it as an open question, not a finding.
5. If you verified a reachable defect in code you read, report it as a finding even when intent or blast radius is unsettled; put the defect in the finding and the unsettled part in an open question.
6. Use confidence to express uncertainty. Never lower a finding's severity to express doubt about blast radius or scope; severity follows consequence definitions.
7. If nothing on your axis is material, reply exactly: "no material findings on this axis".
8. Send findings to the aggregating agent only.
```

## Axis Challenge Prompts

1. **Intent and scope:** Does every requirement in the stated intent have a corresponding verified implementation? Quote the intent source for each gap. Is any behavior added that was never requested? Are any scoped-out items backed only by unverified feasibility claims?
2. **Ownership and root cause:** Does the fix live at the boundary that first transitions from correct to incorrect, or does it mask a symptom downstream or rewrite upstream authority?
3. **Blast radius:** What load-bearing fact does this change's safety depend on, and what can break where symbol search stops (callers, dispatch paths, config gates, event buses, registries, wire/serialization formats, schemas, dependency behavior, shared/stacked state, or multi-hop consumers)?
4. **Architecture and platform:** Does the diff diverge from established repository pipelines, adapters, or platform workarounds without evidence?
5. **Reachable regressions:** What concrete regressions in accessibility, teardown/inverse lifecycle, language/i18n, data/persistence, concurrent/interleaved state transitions, external protocols/security, UI geometry, or platform behavior can this diff actually trigger?
6. **Test quality:** For each added or modified test, would it actually fail if the production bug were reintroduced, or does it merely imitate the patch shape?
7. **Claims vs. evidence:** Which claims of completion, preservation, speedup, or platform/format coverage lack direct proof in the validation evidence?
