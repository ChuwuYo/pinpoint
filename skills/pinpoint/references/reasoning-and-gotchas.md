# Transferable Reasoning and Worked Examples

Load this reference when debugging subtle ownership, equivalence, caching, provenance, or heuristic-bounding problems.

## Core Transferable Principles

1. **Validate at the real consumer boundary.** Intermediate state and static checks are proxies, not final behavior. An accessibility tree does not prove screen-reader navigation, and a `200 OK` response does not prove persistence. When only a proxy is available, state explicitly what it cannot prove.
2. **Match evidence granularity to the claim.** Aggregate evidence cannot prove local continuity, order, or identity. An average cannot establish tail latency, and one bounding box cannot establish every rendered fragment. An unchanged result on an input that cannot exhibit the behavior proves nothing about preservation.
3. **Distinguish visible equivalence from semantic equivalence.** Compare identity, order, lifecycle, side effects, and security as well as output. A retried request may duplicate work; a visually identical UI may break focus or reading order.
4. **Preserve upstream authority.** If a protocol returns a documented valid form or an OS provides intentional native behavior, normalize only what crosses into application ownership rather than rewriting the authority itself.
5. **Prove impact through runtime reachability.** A shared type or common helper shows possible reuse, not actual execution. Establish affected formats, platforms, providers, and modes through callers, dispatch, configuration gates, and concrete consumers. Enumerate event buses, dispatchers, and registries by event or channel name and verify data provenance (live value vs. stale snapshot).
6. **Separate stable identity from transient representation.** A reordered list changes indexes without changing records; a reconnect replaces a socket without replacing the business session. Preserve continuity with stable IDs, semantic anchors, or authoritative event reasons.
7. **Make cached results express all dependencies.** An API cache may depend on permissions and locale; a geometry cache may depend on dimensions, DPR, and fonts. A cache missing a dependency is not authoritative state.
8. **Relax only the smallest necessary condition.** Accepting another documented OAuth callback form must preserve state and PKCE validation; accepting another file extension must preserve content and size checks. Define the new equivalence precisely and keep unrelated invariants unchanged.
9. **Keep one user-facing field on one producer with one semantics.** Prefer honest absence (an explicit unknown state) over a second producer with different semantics. A fallback chain that creates a "which value do we show?" fork is a stop signal: re-verify the primary producer's properties instead of delegating ambiguity to the user.
10. **Bound approximations by their failure cost.** When an exact decision is impossible and refusal is not an option (e.g., a routing gate or language heuristic), choose the cheaper failure direction: degrade to the general path rather than suppressing the capability. Name what the heuristic stands in for, cap it, and document its bounds. When absence is an option, honest absence outranks approximation.
11. **Find the load-bearing safety fact and look past symbol search.** Most risky changes are safe (or unsafe) because of one or two load-bearing facts. Identify them and push each as far down the proof ladder as is cheap, checking what symbol search misses: serialization/wire formats, schemas, dependency source/patches, and multi-hop downstream consumers.
12. **Attack the shared premise and revert refuted hypotheses.** When repeated fixes fail the same gate, stop iterating on the same assumption—write the premise down and falsify it directly. Never leave speculative "just-in-case" guards behind from disproven hypotheses.
13. **Amplify cumulative signals and summarize before drilling down.** For leaks, drift, or intermittent failures, capture a baseline, repeat the trigger to amplify signal, and return to baseline to verify cleanup. For large logs, profiles, snapshots, or diffs, inspect aggregate summaries before drilling into raw entries.
14. **Keep diffs surgical and evidence fresh.** Clean up only orphans your own change created (leave pre-existing dead code untouched unless asked), never weaken safe code merely to silence a false-positive static warning, and never cite pre-edit or pre-compaction outputs from memory as current proof.

## Worked Good vs. Bad Examples

### Producer Provenance (Same-Named Decoy)

- **Bad:** Sees `doc.pageCount` on a sibling view model, assumes it matches `reader.totalPages`, and falls back `reader.totalPages ?? doc.pageCount ?? 0`.
- **Good:** Traces `doc.pageCount` to `src/metadata.js:42` (raw PDF page count) and `reader.totalPages` to `src/layout.js:118` (reflowed viewport pages). Recognizes incompatible semantics, does not mix them, and renders an explicit unknown state until the authoritative producer resolves.

### Runtime Reachability vs. Shared Interface

- **Bad:** Changes `BaseLoader.load()` and claims "fixed for all 5 formats (epub, pdf, cbz, fb2, txt)" because all five implement `BaseLoader`.
- **Good:** Traces dispatch in `src/loader.js`: only `cbz` and `fb2` enter the affected normalization branch; `epub`, `pdf`, and `txt` bypass it. States exact reachable scope (`cbz`, `fb2`) and tests both real paths plus one unaffected control path.

### Downstream Consumer Oracle

- **Bad:** Asserts `exportCli()` exits with code `0` and `output.csv` exists, then claims export is fixed.
- **Good:** Feeds the generated `output.csv` into the real `importer.js` consumer (including empty cells, quotes, and large datasets) and verifies row count, field fidelity, and error handling on truncated input.

### Veto Evidence Burden

- **Bad:** Declares "no reliable predicate can distinguish route A from route B, so we must drop this requirement" without measuring failure cases.
- **Good:** Tests candidate predicates against concrete inputs, bounds the failure cost (degrading to the safe general path on ambiguity), or presents concrete counterexamples proving why the contract cannot be satisfied as written.

### Lifecycle Closure Beyond Entry

- **Bad:** Reuses an existing state-transition consumer, verifies the new state activates, and stops—leaving teardown, undo, cancel, or exit stranded on a stale history, focus, or resource entry.
- **Good:** Traces all shared, stacked, and persistent state mutated by the reused consumer, separates in-place replacement from additive transitions, and verifies the inverse/exit path closes cleanly.

### State Freshness Across Suspension or Concurrency

- **Bad:** Captures mutable state before an I/O, lock, callback, or async suspension boundary, branches on that stale snapshot afterward, and tests only pre-settled state.
- **Good:** Re-reads authoritative state after resumption (or validates a version/epoch guard) and adds a test that mutates state during the suspension window to catch interleaving races.
