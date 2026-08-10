# Catalog CLI

A command-line tool that exports book catalogs from JSON to a CSV artifact,
and imports CSV artifacts back into book objects.

## Commands

```sh
node src/cli.js export samples/books-small.json out.csv
node src/cli.js import out.csv
```

`export` reads a JSON file of the shape `{ "books": [ { "title", "author" } ] }`,
writes a CSV artifact, and prints `Exported N books to <path>`. `import` reads
a CSV artifact and prints `Imported N books`.

## Conventions

- The CSV artifact is `title,author` with one book per row and a trailing
  newline. The importer is the consumer contract: an artifact is only complete
  when the importer can read every exported book back.
- The exporter must not claim success (`ok: true`) unless every book made it
  into the artifact. A failed or truncated export must be reported, not
  silently swallowed.
- `export` must produce a complete artifact in one call; partial or interrupted
  writes leave residue that must be detectable by the importer.
- Sample catalogs live in `samples/`. There is no test suite, linter, or CI
  configuration.
