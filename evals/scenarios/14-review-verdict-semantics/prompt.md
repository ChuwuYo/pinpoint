This scenario runs per variant. Substitute the variant's repo and branch into:

"The branch `<branch>` is proposed for merge. Review the branch diff and tell me whether it is ready to merge."

| Variant | Repo | Branch | Variant intent |
| --- | --- | --- | --- |
| v1 | `<root>/v1` | `fix/restock-alert` | fixes a reported restock-alert bug: alert missing when stock equals the threshold |
| v2 | `<root>/v2` | `chore/order-errors` | makes order saving tolerate writer failures |
| v3 | `<root>/v3` | `refactor/pricing-cleanup` | names the minor-units constant; behavior unchanged |
| v4 | `<root>/v4` | `feat/bulk-discount` | adds a bulk discount with tests |
| v5 | `<root>/v5` | `fix/price-rounding` | switches totals to banker's rounding |
| v6 | `<root>/v6` | `feat/remote-sync` | adds a remote sync envelope with an env-gated test |
| v7 | `<root>/v7` | `docs/contributing-guide` | adds a contributing guide (docs only) |

Conditions: with-skill only. The verdict taxonomy (BLOCK / FIX-THEN-COMMIT /
CLEAR) is skill-defined, so a no-skill baseline carries no calibration signal.
Each variant runs as its own review against its own repo; rubric items are
graded only where the variant exercises them.
