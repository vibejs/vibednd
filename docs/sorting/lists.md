# Sortable lists and grids

useSortable binds the real dnd-kit Sortable to a Vibe element. It adds index, group, transition and independently disabled draggable/droppable options to registration. index must be a non-negative integer. Pass getters for props so reused keyed components update in place.

```ts
useSortable({
  id: () => props.item.id,
  element,
  handle,
  index: () => props.index,
  group: 'tasks',
  type: 'task',
  accept: 'task',
  disabled: () => ({ draggable: props.locked, droppable: false }),
  transition: { duration: 160, idle: true },
});
```

CSS determines vertical, horizontal or grid layout. Variable item sizes use real engine measurements. SortableKeyboardPlugin navigates measured targets by direction. Stable keys and IDs are required; array indexes must not be item identifiers.

useSortableList({items,getId,group?,context?,onMove?}) manages a shallow local array. Pass model instead of items to use a caller-owned writable ref. items is the initial snapshot for local mode. No input array is mutated in place. useSortableItems derives typed id/index/item records and diagnoses duplicates.

Give simultaneous lists distinct group IDs. The default local group is list. The playground includes vertical, horizontal, variable-content, grid, dashboard, disabled and scrolling examples.
