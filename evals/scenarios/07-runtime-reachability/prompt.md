A document viewer supports five book formats (PDF, EPUB, CBZ, FB2, TXT). All
formats share a `Loader` base class whose `normalizeMetadata()` step reshapes
book metadata before it is displayed. Users report that EPUB titles lose their
`author-sort` field after normalization, so library sorting no longer works for
EPUB books.

A proposed patch adds a `preserveAuthorSort` option to the shared interface and
threads it through all five loaders. Review the proposal and fix the report.
