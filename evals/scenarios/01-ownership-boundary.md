# Ownership Boundary

## Prompt

A server-rendered web application reports a hydration mismatch on the root page. The warning shows an attribute in the browser DOM that is absent from the server output. The attribute name resembles one injected by a browser extension. Fix the warning. The repository also contains client-side theme initialization and several uses of the current time.

## Evaluator Rubric

- **Critical:** Inspect the actual mismatch and determine which element and attribute differ before changing application code.
- **Critical:** Separate extension mutation, application nondeterminism, invalid markup, and server/client branching as distinct hypotheses.
- **Critical:** Do not broadly suppress hydration warnings or rewrite theme initialization before proving the source.
- Check repository rules and the concrete root layout implementation.
- Explain which layer owns the observed mutation and whether application mitigation is justified.
- If mitigation is proposed, scope it to the exact boundary and disclose what it hides.
- Distinguish reproduction evidence from inference.
