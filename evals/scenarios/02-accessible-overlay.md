# Accessible Overlay

## Prompt

A dropdown can overflow the viewport and long translated labels can cross separators. A proposed patch moves every menu into a portal and uses a floating-positioning library. It looks correct in screenshots, but the product supports keyboard navigation, RTL, VoiceOver, and TalkBack. Review the proposal and implement the best fix.

## Evaluator Rubric

- **Critical:** Treat DOM order, focus, keyboard behavior, and screen-reader traversal as design constraints before selecting the architecture.
- **Critical:** Do not accept the portal solely because it fixes visual placement; visible equivalence in screenshots does not prove semantic equivalence of focus, reading order, or interaction.
- **Critical:** Separate browser tests, screenshots, and accessibility-tree inspection from real assistive-technology behavior; static proxies are not final consumer behavior — state what they cannot prove about VoiceOver and TalkBack traversal.
- Trace the existing menu structure, focus behavior, stacking context, overflow ownership, and RTL alignment.
- Preserve wrapping, start-aligned multiline labels, dynamic row height, rounded clipping, and scrolling when those behaviors are required.
- Prefer an existing positioning and overflow boundary when it can satisfy both visual and accessibility requirements.
