# Compatibility research

Research date: 2026-10-26. npm reports @dnd-kit/dom, abstract, collision and helpers 0.5.1 as stable. All four direct engine dependencies are pinned to 0.5.1. No legacy core/sortable or framework wrapper is used.

## Vibe.js 0.1.0

Inspected CONTRACTS.md, AGENTS.md, decision 0001, public index, reactivity refs/computed/scopes, watch, scheduler, inject, component/block/for runtime, app, router, compiler transforms and compiled ABI/behavior suites in the local Vibe.js repository.

Vibe is a direct DOM compiler. Keyed lists cache Item records and use prefix/suffix matching plus a longest increasing subsequence; they do not discover externally changed DOM order. Each list item owns a scope. Same-key props and index refs update without recreating components. Cross-list transfers unmount one component and mount another. Dynamic components remount when their definition changes. Conditional branches dispose before node removal. Template refs become null on disposal and are available during render before insertion. Post-flush watchers observe inserted nodes. Scope cleanup runs after effects stop and before child scopes stop. provide reads component setup; inject reads ancestors, never the same component's own provides. App contexts isolate injection. App.onUnmount supports plugin ownership. nextTick waits through post-flush work. Props are getters; top-level refs unwrap in templates, nested refs require .value. Component models use update events. Native event handlers are compiler-typed. Teleport is explicitly unsupported; public runtime render functions are not an extension point.

## Modern dnd-kit 0.5.1

Read installed declarations and distributed sources for dom, sortable, modifiers, utilities, abstract and helpers. DragDropManager has monitor subscriptions, actions, public registry and destroy. Entities register automatically and expose destroy. Sortable combines draggable and droppable; plugins defaults are SortableKeyboardPlugin and OptimisticSortingPlugin. A replacement plugin array is supported. Optimistic sorting moves nodes and updates indexes/groups; source and target can then match. Feedback default uses a placeholder; rootElement can physically move the source. A supplied Feedback.overlay avoids source relocation and component cloning. Official sensors cover pointer and keyboard. Accessibility and AutoScroller are default plugins. Axis and snap modifiers are in abstract/modifiers; window and element constraints are in dom/modifiers. Collision algorithms are in @dnd-kit/collision.

Sources: https://dndkit.com/concepts/sortable/ ; https://dndkit.com/changelog/ ; https://github.com/clauderic/dnd-kit ; npm package declarations at the pinned versions.

## DOM ownership decision

Disable OptimisticSortingPlugin using Sortable's public plugins replacement; retain SortableKeyboardPlugin. Never move framework-owned nodes from the adapter. Use an inert, engine-owned overlay via Feedback.overlay. List data stays unchanged during drag; commit a typed immutable move at dragend. Resolve source/target sortable metadata with isSortable, not optimistic ID comparisons. Cancel requires no rollback. External collection changes cancel a convenience operation rather than restoring stale snapshots. Validate again at commit. Render drop indicators declaratively. Browser regression proof must precede the adapter.

## Optional ecosystem

Vibecn 0.3.0 installs trusted local registry sources; adding registry entries is required for CLI commands. Components use public refs and native dialog/popover top layers, without Teleport. VibeMotion 0.1.0 exposes useMotion/useLayoutMotion; animate an inner wrapper only, never the engine position target. VibeQuery 0.1.0 exposes useMutation with Promise-based mutate and optimistic helpers. VibeAuth 0.1.0 exposes useAuth/useUser; client eligibility is advisory. The local VibeVirtual directory is empty: no virtualization integration can be claimed.

## Initial architectural proof

Chromium Playwright proof passed using actual pointer and keyboard events: pointer A→C committed B,C,A,D; click state survived; keyboard cancel retained that order; keyboard ArrowUp then drop committed B,A,C,D on the same component instances. The proof is retained at /?proof and test/browser/proof.spec.ts. This preceded adapter implementation.
