# Droppable and eligibility

useDroppable accepts id, element, data, disabled, type, accept, collisionDetector, collisionPriority and context. For a sortable container zone it also accepts group and index; set index to its full array length so dropping on the container appends.

```ts
const drop = useDroppable({
  id: () => `zone:${props.id}`,
  element,
  group: () => props.id,
  index: () => props.items.length,
  accept: (source) => source.type === 'task' && canEdit.value,
  collisionPriority: 0,
});
```

accept is an engine acceptance function, a type, or an array of types. A function can close over reactive application permissions. disabled and detector options accept refs/getters. The engine filters collisions, and the adapter checks accepts again at final drop. Convenience state also checks canMove before writing data.

isEligible reports whether the active source is allowed, independently of hover. isOver identifies the engine's selected target. Style an ineligible zone explicitly; visual rejection must agree with the acceptance function. A null collision target results in no committed move.

A low collision priority lets nested item targets win over a containing zone. Empty containers need an actual measurable zone with a minimum height. No geometry is guessed for unmounted or display:none targets.
