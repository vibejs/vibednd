# Architecture and core concepts

Layer A is modern dnd-kit DOM: manager, entities, sensors, plugins, geometry and feedback. Layer B bridges real Vibe refs, scopes, injection and events. Layer C adds immutable sortable operations and local state conveniences. Layer D consists of optional copy-and-own Vibecn source components.

Vibe.js has no virtual DOM. Its compiled keyed lists cache item order and use minimal moves during reconciliation. External sorting of their nodes can invalidate that cache. VibeDND therefore replaces the Sortable plugin list with SortableKeyboardPlugin alone. OptimisticSortingPlugin is never allowed on a VibeDND context.

Feedback uses an engine-owned, inert, aria-hidden text element through Feedback.overlay. It does not clone a component or move a framework-owned source node. Dnd-kit owns feedback positioning; Vibe owns list nodes, scopes and order.

## State boundaries

Only drag start, target changes and drag end update application-facing refs. Pointer positions remain in dnd-kit. Advanced users can subscribe directly to context.engine.monitor when they need dragmove events. Avoid mirroring every pointer coordinate into a component tree.

Draggable and droppable metadata may use different generic types. The injected context's generic annotation is a caller assertion; share consistent schemas or use discriminated unions and runtime guards at application boundaries.

Vibe 0.1 is client-rendered. Node import safety is tested; SSR and hydration are not claimed. No public render-function ABI or packaged component wrappers are required by the adapter.
