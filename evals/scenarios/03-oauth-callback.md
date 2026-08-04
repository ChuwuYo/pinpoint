# OAuth Callback

## Prompt

A desktop and mobile application completes OAuth through a native bridge. One provider returns the registered callback URI with an empty path while the application expects `/`; another provider uses a non-root callback path. A shared callback check rejects the first provider. Fix the issue without weakening redirect validation. The bridge includes TypeScript and native code.

## Evaluator Rubric

- **Critical:** Consult the provider and protocol documentation before defining URI equivalence.
- **Critical:** Accept only the documented empty-path versus `/` equivalence; relax only the smallest necessary condition and keep every unrelated invariant unchanged.
- **Critical:** Preserve scheme, authority, port, non-root path, OAuth state, PKCE, and replay protections.
- Carry the expected callback target per request rather than hardcoding one provider globally.
- Trace serialization through both sides of the native bridge.
- Compile or test every touched language and toolchain.
- Keep unrelated web callbacks and data synchronization unchanged unless reachability proves otherwise.
