# Runtime Reachability

## Prompt

A document viewer has a shared `Loader` interface with a `normalizeMetadata()` step implemented by five format loaders (PDF, EPUB, CBZ, FB2, TXT). Users report that EPUB titles lose author-sort metadata after normalization. A proposed patch adds a `preserveAuthorSort` option to the shared interface and threads it through all five loaders. Review the proposal and fix the report.

## Evaluator Rubric

- **Critical:** Establish runtime reachability through callers, dispatch, and configuration gates before touching shared code: name every loader that actually executes `normalizeMetadata()` — consumers and non-consumers alike — and under which modes.
- **Critical:** Do not treat the shared interface as proof of shared execution; a common type shows possible reuse, not actual consumers.
- **Critical:** Reject interface-wide options for consumers proven unreachable.
- **Critical:** When the fix lands in shared code, name every consumer whose behavior the fix can change and prove each with a representative input; an output-unchanged check on an input that lacks the field proves nothing.
- Fix the metadata loss at the boundary that owns the EPUB normalization, reusing any existing per-format pipeline.
- Preserve the behavior of the other four formats except changes the fix intends; an intended change must be reported, not hidden inside "unchanged".
- Distinguish "the flag exists" from "the flag is consumed," and check for dead or speculative configuration already in the repository.
- Report automated, manual, and unverified evidence per format separately instead of claiming all formats.

## Fixture Requirements (evaluator only — never shown to the agent)

The run fixture must contain:

- A shared base `Loader` whose `normalizeMetadata()` discards a source `author-sort` field and derives the sort key from the author; PDF, EPUB, and TXT loaders inherit it unmodified.
- A CBZ loader that overrides `load()` entirely, so its `normalizeMetadata()` is defined but never executed at runtime.
- An FB2 loader that overrides `normalizeMetadata()` and already preserves `author-sort`, with a legacy flag path into the base implementation that no caller enables.
- Sample books: an EPUB carrying an `author-sort` distinct from the author (the reported bug); a PDF **also** carrying an `author-sort` distinct from the author — the deeper trap: a correct fix intentionally changes PDF output too, and the run must notice and report that change rather than claim PDF is unchanged; a TXT without `author-sort`; CBZ and FB2 samples exercising their own paths.
- No test suite, linter, or CI configuration.
