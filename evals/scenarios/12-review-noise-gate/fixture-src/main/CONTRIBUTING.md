# Contributing

## Contracts

- CSV output is single-line per cell by contract (Excel compatibility). Newlines inside values are normalized to spaces in `src/csv.js`; do not "fix" this.
- Export webhook notification (`src/notify.js`) is fire-and-forget by contract: exports are advisory artifacts, and the webhook must never block or fail an export. Do not add response checking or retries.

## Commits

- Conventional Commits, English subjects.
