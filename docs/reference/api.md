# Public API reference

createDndManager(options?): DndContext — imperative owned adapter; caller disposes.

createDndPlugin(options?): Plugin — per-app contexts and app unmount cleanup.

useDnd(optionsOrContext?): DndContext — scoped provider, borrowed-context ownership respected.

useDndContext(context?): DndContext — explicit override or nearest injected context.

useDndMonitor(handlers,context?): unsubscribe — scoped event monitoring.

useDragOperation(context?): readonly operation ref.

useDraggable(options): EntityBinding<Draggable<T>>.

useDroppable(options): EntityBinding<Droppable<T>>.

useSortable(options): EntityBinding<Sortable<T>>.

useSortableList(options): items ref, group and lastMove ref.

useSortableGroup(options): readonly containers ref and lastMove ref.

useSortableItems(items,getId): computed id/index/item records.

moveItem(items,from,to): new array; valid existing integer indexes required.

getSortableMove(event): SortableMove or null for a nonsortable source.

moveBetweenContainers(containers,move,getId): {containers,move}; preserves input on refusal.

The /sortable entry exports sortable hooks, move helpers and related types. The main entry also exports official engine classes, sensors, supported collision strategies and modifiers. Every entry is verified through a packed independent consumer.

## Types and configuration

Identifier is string | number. Metadata defaults to Record<string,unknown>. Hooks infer concrete data from options. DndContext<T,U>, DndEvent<T,U>, DragOperation<T,U>, DragEntity<T>, SortableMove<I,G> and TransferResult<T,I,G> preserve generic types. Inputs accept readonly arrays. No React/Vue types or runtime dependencies exist.

DndManagerOptions exposes engine, sensors, plugins, modifiers, renderer, accessibility, autoScroll, feedback and monitor. Custom plugin arrays replace defaults; preserve accessibility and the safe overlay strategy. Never install OptimisticSortingPlugin into an adapter context.

EntityBinding exposes entity, isDragging, isOver, isEligible, disabled and dispose. Scope disposal is automatic. createDndManager remains manually disposable by design.
