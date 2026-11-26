# Severity Calibration and Re-rank Rubric

Load this reference during aggregation when calibrating borderline findings, deduplicating multi-axis reports, or applying the second-pass re-rank gate.

## Severity Calibration Edge Cases

### Blocker vs. Should-Fix

1. **Sibling-path survivor (always `blocker`):** Judge the defect class by shared root cause, not by the single trigger named in the PR description. If the diff fixes a boundary, cache key, or predicate in one path and the exact same root cause remains reachable on a supported sibling path, the claim is contradicted for that path. Classify as `blocker`, regardless of perceived blast radius.
2. **Mid-operation partial writes (always `blocker`):** A failure that leaves persisted state inconsistent (partial writes, orphaned or missing rows, half-applied multi-step mutations) is a `blocker` even if it requires a mid-operation error to trigger. Never praise operation ordering without checking what state survives a failure between steps.
3. **Unsettled blast radius vs. verified defect:** If a defect is verified in code you read and reachable from the diff, keep it as a finding (not an open question) and assign severity by its consequence. Put the unsettled intent or blast-radius question in `Open questions` and reflect uncertainty in `confidence`, never by downgrading severity.
4. **Reachability boundary:** Judge reachability strictly against code in the repository under review, never against hypothetical external wrappers outside the diff.

### Should-Fix vs. Nit vs. Drop

- **should-fix:** Real behavioral, error-handling, maintainability, or test-coverage consequence with bounded blast radius outside the claimed contract.
- **nit:** Bounded improvement with concrete impact (e.g., clearer error message on a real failure path, removing a dead branch introduced by the diff). Stays in `Advisory nits` and never escalates `CLEAR`.
- **Drop completely:** Style preferences, formatting enforced by linters, speculative "what if someday" abstractions, or observations without concrete impact.

## Second-Pass Re-rank Gate (0 to 10)

Score each surviving candidate independently on two axes with a one-line justification:

- **Correctness (0-10):** Is the claim factually true of the code actually read in this diff? (`0` = factually wrong, misreads code, or unreachable; `10` = verified directly from read lines and reachable path).
- **Actionability (0-10):** Can the author act on it concretely? (`0` = vague complaint with no target or path forward; `7-10` = exact `file:line`, concrete fix direction or verification step, or explicit explanation of why the exact patch requires author input).

Drop any finding scoring `0` on either axis. Keep valid findings whose exact code patch is unknown as long as the defect is verified and a concrete diagnostic or decision step is given.

## Worked Good vs. Bad Finding Examples

- **Bad (speculative + ungrounded):** `[should-fix | high] src/billing.js - This might cause a race condition under load. Consider adding locks.`
- **Good (evidence-backed + actionable):** `[blocker | high] src/billing.js:34-41 - chargeAndRecord() updates balance in memory before awaiting db.insertLedger(), and catch() does not roll back balance on write failure - leaves in-memory balance diverged from persisted ledger on transient DB error - wrap both updates in a transaction or mutate balance only after db.insertLedger() resolves.`

- **Bad (duplicating static tooling):** `[nit | high] src/export.js:12 - Unused variable tempRows flagged by ESLint.`
- **Good (subtracted):** Omit from `Findings`; list ESLint under `Static checks` and its exit status under `Gate status`.
