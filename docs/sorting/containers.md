# Multi-container sorting

useSortableGroup takes a writable ref of grouped readonly arrays, getId, context, optional canMove, onMove and controlled. Item IDs must be unique across every group. Container keys identify lists; maintain a separate array when container order matters.

```ts
const containers = shallowRef<Readonly<Record<string, readonly Task[]>>>({
  todo: tasks,
  done: [],
});
useSortableGroup({
  containers,
  getId: (task) => task.id,
  context,
  canMove: (move) => move.toContainer !== 'restricted',
  onMove: (move) => console.log(move.reason),
});
```

Render child item components with index and group getters. Add a useDroppable zone with the same group and an append index for empty and trailing areas. Card and column sorting can share a manager when types and accept rules isolate them.

SortableMove identifies itemId, fromContainer, toContainer, fromIndex, toIndex, targetId, targetIsContainer, canceled, accepted, shouldCommit and reason. toIndex is the final index after removing the source. No target, rejection or cancellation produces a commit. The helper refuses missing sources/containers and stale destination positions.

Cross-list transfers intentionally unmount the source component and mount a destination component through Vibe's renderer. Put durable card state in the item model. Keyboard focus follows a matching handle after the declarative transfer.
