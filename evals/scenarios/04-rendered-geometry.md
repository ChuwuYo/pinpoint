# Rendered Geometry

## Prompt

A reading aid highlights the current visual line. It occasionally animates backward during font-size changes and spans empty space around inline images. The current implementation compares approximate page positions and uses one element bounding box. It caches measurements until the viewport width changes. Correct the behavior across paginated and scrolling layouts.

## Evaluator Rubric

- **Critical:** Distinguish intentional navigation from anchor-preserving reflow, restoration, resize, and typography changes.
- **Critical:** Do not use a coarse page estimate as line identity or transition identity.
- Build line geometry from rendered fragments when one bounding box includes gaps.
- Group visually contiguous fragments and preserve logical reading order across visible surfaces.
- Use authoritative event reasons or stable anchors when available.
- Invalidate cached geometry for all relevant dependencies, including height and typography changes.
- Clamp expansion per edge, cap outlier geometry, and preserve layering and hit behavior.
- Test both the reported artifact shape and ordinary text.
