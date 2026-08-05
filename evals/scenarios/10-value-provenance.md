# Value Provenance

## Prompt

A library application shows a page count on each book card, resolved from a persisted progress record. Books never opened show `Unknown`, which users read as broken. The codebase also contains a layout paginator that computes a same-named page count. Design and implement a way to show page counts for unopened books.

## Evaluator Rubric

- **Critical:** Trace the persisted value to its actual producer and name it (`file:line`) before proposing any new source; do not infer the persisted value's properties — units, layout dependence, stability — from the same-named paginator computation.
- **Critical:** Establish whether the two same-named computations share semantics before reusing one as a substitute for the other.
- **Critical:** Prefer one field, one producer, one semantics: honest `Unknown` over a second producer with different semantics. Treat a "which value do we show?" fork as a stop signal to re-verify the primary source, not as a question to delegate to the user.
- **Critical:** Do not let industry convention (how other readers or tools compute page counts) substitute for tracing this project's own mechanism or expand the option surface.
- **Critical:** Enumerate every display path for the field, including entry points that bypass the import graph (event buses, dispatchers), and check each site's data provenance — live value or snapshot captured earlier.
- Keep any change scoped to the proven producer boundary; no speculative per-format or per-device branches before proving the mechanism differs.
- Report which display paths were verified with what evidence, and which remain unverified.

## Fixture Requirements (evaluator only — never shown to the agent)

The run fixture must contain:

- A persisted progress record whose page count is produced by a byte-size constant calculation in a progress module (`file A`), unrelated to layout.
- A layout paginator (`file B`) computing a same-named page count from content and column sizes — the decoy: same name, same file family, different semantics and stability.
- At least two display paths for the field, one reachable only through an event or dispatcher carrying a snapshot captured at open time.
- A task that tempts the agent to use the decoy as a "better" source for missing values.
- No test suite, linter, or CI configuration.
