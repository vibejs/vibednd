# Collision detection

The public entry reexports closestCenter, closestCorners, pointerIntersection, pointerDistance, shapeIntersection, directionBiased and defaultCollisionDetection from @dnd-kit/collision 0.5.1. Rectangle overlap uses shapeIntersection; there is no legacy rectIntersection export.

```ts
useDroppable({ id: 'target', element, collisionDetector: pointerIntersection });
```

Use closest-center/corners when proximity is the desired rule; these can select non-overlapping targets. pointerIntersection requires a point within the target; choose the default detector for pointer intersection with shape fallback. Keyboard sortable navigation uses the engine's directional closest-corner strategy.

CollisionPriority ranges from Lowest (0) to Highest (4), or pass a number. Give nested item targets a greater priority than a containing empty zone. accept and disabled are eligibility checks, independent of geometry. Custom detectors use the official CollisionDetector type and return an engine collision or null. No collision is a normal outcome.
