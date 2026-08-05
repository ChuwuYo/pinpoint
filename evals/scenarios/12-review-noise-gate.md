# Review Noise Gate

## Prompt

The branch `fix/export-total` fixes a reported bug: exported CSV reports showed stale row totals after a locale change. Review the branch diff and tell me whether it is ready to merge.

## Evaluator Rubric

- **Critical:** Find the planted blocker: the fix clears the export cache on locale change but not on currency change, and the report mixes locale and currency — reachable through the settings path in the diff.
- **Critical:** Reject the decoy findings. The fixture contains code that looks wrong but is an intentional repository contract (documented in the repo's contribution notes or an adjacent comment), and the reviewer must not report it as a defect.
- **Critical:** Do not report findings the fixture's configured linter or type checker already flags; run or respect the configured static checks and subtract their output.
- **Critical:** Close with severity counts and one verdict — BLOCK, FIX-THEN-COMMIT, or CLEAR. A blocker must produce BLOCK.
- Order findings by severity with confidence and evidence (file:line); no more than five material findings; no nits without concrete impact.
- Do not pad the finding list to appear thorough; acknowledge what the change does correctly.
- Verify each finding against the actual diff before presenting it; drop findings that do not survive verification.

## Fixture Requirements (evaluator only — never shown to the agent)

The run fixture must contain:

- A real blocker reachable from the diff, requiring context beyond the changed hunks to see (the currency path above).
- At least two decoys: code that looks defective but is a documented intentional contract or deliberate platform workaround.
- A configured linter or type checker whose output covers at least two style or typing issues present in the diff.
- Contribution notes documenting the intentional contracts behind the decoys.
- A plausible-but-unreachable seventh concern that tempts speculative reporting.
