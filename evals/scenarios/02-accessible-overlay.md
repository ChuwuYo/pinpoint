# Accessible Overlay

## Prompt

A dropdown can overflow the viewport and long translated labels can cross separators. A proposed patch moves every menu into a portal and uses a floating-positioning library. It looks correct in screenshots, but the product supports keyboard navigation, RTL, VoiceOver, and TalkBack. Review the proposal and implement the best fix.

## Evaluator Rubric

- **Critical:** Treat DOM order, focus, keyboard behavior, and screen-reader traversal as design constraints before selecting the architecture.
- **Critical:** Do not accept the portal solely because it fixes visual placement.
- Trace the existing menu structure, focus behavior, stacking context, overflow ownership, and RTL alignment.
- Preserve wrapping, start-aligned multiline labels, dynamic row height, rounded clipping, and scrolling when those behaviors are required.
- Prefer an existing positioning and overflow boundary when it can satisfy both visual and accessibility requirements.
- Separate browser tests, screenshots, accessibility-tree inspection, and real assistive-technology verification.
- State any unverified VoiceOver or TalkBack behavior.
