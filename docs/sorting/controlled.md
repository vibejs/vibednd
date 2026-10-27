# Controlled state and concurrent updates

Controlled mode emits a typed move without writing the caller's ref. Apply it to the latest arrays using moveBetweenContainers. moveItem returns a fresh same-list array and throws on invalid indexes. Readonly input arrays are accepted.

```ts
useSortableGroup({
  containers,
  getId: (task) => task.id,
  context,
  controlled: true,
  onMove(move) {
    const result = moveBetweenContainers(containers.value, move, (task) => task.id);
    if (result.move.shouldCommit) containers.value = result.containers;
  },
});
```

Convenience state snapshots source identity and origin at pickup. Item membership, order or container membership changes during a drag cancel it. Metadata changes that leave IDs/order intact can survive. No old array snapshot is restored on cancellation. The commit helper rechecks the current source index and target identity to avoid overwriting concurrent ordering.

A controlled handler is the authority for commits. Low-level useSortable does not write arrays. For delayed server commits, validate a revision and current membership again; the operation is intent, not permission to restore an old board.

## Optimistic sorting

VibeDND disables dnd-kit's OptimisticSortingPlugin because it physically moves Vibe-owned nodes. The library supports optimistic application persistence after a final accepted drop, not DOM mutation during hover. Cancellation requires no array rollback because arrays remain canonical throughout the drag. isSortable and metadata are used instead of assuming unequal source/target IDs.

The immutable commit helper rechecks canceled and accepted flags even when shouldCommit is supplied by a caller. Inconsistent operations never write arrays. Record container keys coerce numbers to strings: a move between the ambiguous IDs 1 and '1' is refused as stale. Use a consistent identifier type for each container; transfers between distinct numeric IDs remain supported.
