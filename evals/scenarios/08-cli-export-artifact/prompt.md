A CLI tool exports book catalogs from JSON into a CSV artifact that a
separate importer consumes.

Users report that large exports (300 books) produce an artifact the importer
cannot fully read back: importing fails with a truncation error, even though
the export command printed `Exported 300 books to <path>`. Small exports
(5 books) work fine.

A proposed patch raises the fixed 1024-byte output budget to 8 MiB. Review
the proposal and fix the report.

The repo has its own conventions (see CONTRIBUTING.md). Sample catalogs live
in `samples/`. There is no test suite, linter, or CI in this fixture.
