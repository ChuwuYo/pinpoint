# Pinpoint Domain Checklists

Load only the section(s) that match contracts reachable from your traced runtime path. Exclude unreachable domains rather than inventing hypothetical support. If a reachable check cannot be exercised in the current environment, record it under **Unverified**.

## Interaction and Accessibility

Check when the traced path touches UI controls, overlays, focus, keyboard navigation, selection, or touch targets:

- **Semantics and roles:** native elements preferred over ARIA simulations; roles, states, and labels reflect actual behavior.
- **DOM and reading order:** visual order matches DOM and screen-reader traversal order; avoid visual-only CSS reordering that scrambles keyboard or AT order.
- **Focus management:** modal/dialog/overlay opens move focus predictably, trap focus only when required, and restore focus to the trigger on close.
- **Keyboard and native selection:** Escape, Enter, Space, Tab, and arrow keys work without breaking native text selection or OS shortcuts.
- **Touch and pointer:** hit targets remain reachable without intercepting unrelated gestures.
- **Exit and state restoration:** closing, canceling, or leaving an in-place transition or overlay restores focus and view state to the true prior context rather than an orphaned intermediate state.
- **Verification limit:** static ARIA or accessibility-tree inspection does not prove VoiceOver, TalkBack, NVDA, or JAWS traversal; report real AT traversal as unverified when unavailable.

## Language and Content

Check when the traced path touches user-facing text, formatting, sorting, search, or localization:

- **Interface vs. content language:** UI chrome follows app locale while user/document content preserves its own language, `lang` attribute, and writing mode.
- **Unicode and scripts:** handle surrogate pairs, combining marks, grapheme clusters, CJK line breaking, RTL mirroring, and vertical text without corrupting offsets or truncation.
- **Punctuation and segmentation:** do not assume ASCII whitespace separates words; use locale-aware or explicit segmentation rules.
- **Expansion and overflow:** verify long translations do not clip, overlap, or break interactive controls.

## Data and Persistence

Check when the traced path touches storage, sync, caches, queues, migrations, or state transitions:

- **Authority and identity:** identify the single source of truth and use stable identifiers rather than transient array indexes or display strings.
- **Ordering and transactions:** check partial-write failure modes; a mid-operation error must not leave orphaned rows, half-applied updates, or corrupted state.
- **Idempotency and retries:** repeated delivery or retry must not duplicate records or side effects.
- **Migrations, reload, and re-entry:** verify behavior on cold reload, schema upgrade, empty state, and corrupted or truncated input.
- **Suspension, concurrency, and interleaving:** when an operation yields across I/O, locks, queues, callbacks, or async boundaries, verify whether concurrent work can mutate shared or environmental state before resumption; read fresh authoritative state after resumption and test interleaved transitions.
- **Sync and stale snapshots:** check whether offline/reconnect or event-bus payloads carry stale snapshots that overwrite newer authoritative state.

## External Protocols and Security

Check when the traced path touches OAuth, callbacks, redirects, webhooks, signatures, auth tokens, serialization, or external APIs:

- **Origin and redirect validation:** validate exact scheme, authority, port, and non-root path against documented protocol rules; relaxing one documented variant must never weaken unrelated checks.
- **State, nonce, PKCE, and replay:** keep per-request expected state, nonce, PKCE verifier, and replay protection intact across all accepted callback forms.
- **Signatures and serialization:** verify canonical encoding, byte-level comparison, and constant-time checks where applicable.
- **Upstream authority:** accept documented valid protocol forms without rewriting upstream behavior; normalize only at application ingress.

## UI and Geometry

Check when the traced path touches layout, measurement, positioning, canvas/SVG rendering, scrolling, or responsive styles:

- **Rendered fragments vs. aggregate boxes:** a single bounding rect does not prove every wrapped line, inline fragment, or clipped child.
- **Reflow identity:** verify elements retain stable identity and anchor position across resize, zoom, font load, and dynamic content changes.
- **Cache dependencies:** geometry caches must key on all inputs they depend on (dimensions, DPR/scale, fonts, writing direction, locale).
- **Clipping, layering, and hit targets:** verify `z-index`, stacking contexts, `overflow`, scroll containers, and pointer-events under real viewport constraints.
- **Verification limit:** screenshots alone do not prove exact coordinates or interaction; assert computed geometry programmatically where possible and note rendering-environment variance.

## Platform and Toolchain

Check when the traced path touches OS APIs, native bridges, build configs, compilers, or multi-runtime code:

- **Existing workarounds:** read why an existing platform workaround exists before removing or generalizing it.
- **Actual native mechanism:** verify how the target OS, browser engine, or runtime actually behaves rather than extrapolating from another platform.
- **Every touched toolchain:** compile and test every touched language or target runtime when available; mark unavailable native toolchains (e.g., iOS/macOS/Windows on Linux) as unverified gaps, never as passes.
