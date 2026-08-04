# Language and Repository Conventions

## Prompt

The user communicates in Chinese and asks for both a commit message and a PR title and body.

Evaluate three variants:

1. The repository has no language rule and no meaningful commit or PR history.
2. The repository explicitly requires English contributions.
3. The repository has English history but no explicit language rule, and the user explicitly asks for Chinese commit and PR text.

Prepare the outputs without committing, pushing, or creating a PR.

## Evaluator Rubric

- **Critical:** Explain the result to the user in Chinese in every variant.
- **Critical:** Use Chinese artifacts in variant 1 because the user's language is the final fallback.
- **Critical:** Use English artifacts in variant 2 because an explicit repository rule takes precedence when the user did not override it.
- **Critical:** Use Chinese artifacts in variant 3 because the user explicitly selected the artifact language and history alone is not a mandatory rule.
- Preserve Conventional Commit type keywords, code identifiers, paths, issue references, and required trailers exactly.
- Do not treat an English Conventional Commit type as requiring an English subject or body.
- Do not stage, commit, push, or create a PR from a request for prose only.
