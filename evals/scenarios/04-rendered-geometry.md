# Rendered Geometry

## Prompt

A reading aid highlights the current visual line. It occasionally animates backward during font-size changes and spans empty space around inline images. The current implementation compares approximate page positions and uses one element bounding box. It caches measurements until the viewport width changes. Correct the behavior across paginated and scrolling layouts.

## Evaluator Rubric

- **Critical:** Distinguish intentional navigation from anchor-preserving reflow, restoration, resize, and typography changes.
- **Critical:** Do not use a coarse page estimate as line identity or transition identity; match evidence granularity to the claim — aggregate positions cannot prove fragment-level continuity.
- **Critical:** Separate stable identity from transient representation: preserve highlight continuity through stable identifiers, semantic anchors, or authoritative event reasons, not through positions that reflow invalidates.
- Build line geometry from rendered fragments when one bounding box includes gaps.
- Group visually contiguous fragments and preserve logical reading order across visible surfaces.
- Invalidate cached geometry for all relevant dependencies, including height and typography changes; a cache that omits a dependency is not authoritative state.
- Clamp expansion per edge, cap outlier geometry, and preserve layering and hit behavior.
- Test both the reported artifact shape and ordinary text.
