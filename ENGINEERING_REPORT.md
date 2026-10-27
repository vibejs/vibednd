# VibeDND engineering delivery

VibeDND uses modern dnd-kit DOM **0.5.1** and Vibe.js **0.1.0**. The direct dom, abstract, collision and helpers dependencies are pinned to 0.5.1, the stable npm versions checked during compatibility research on 2026-10-26. No legacy dnd-kit, React or Vue runtime integration is used.

## Architecture and public API

The engine owns sensors, collision geometry, feedback transforms, keyboard navigation, accessibility and scrolling. The adapter owns Vibe scope/lifecycle integration, refs, application isolation, registration, typed events and disposal. Reusable patterns own immutable sortable operations and convenience state. Optional Vibecn registry compositions supply styled UI without becoming core dependencies.

The core exposes createDndManager, createDndPlugin, useDnd, useDndContext, useDndMonitor and useDragOperation. Element hooks are useDraggable, useDroppable and useSortable. State patterns are useSortableList, useSortableGroup and useSortableItems; moveItem, getSortableMove and moveBetweenContainers handle immutable commits. The main entry reexports the selected engine's supported sensors, collision strategies and modifiers. The sortable entry contains sorting hooks and helpers. The full API and ownership contracts are documented in docs/reference/api.md.

Metadata interfaces retain their types across contexts, list/group patterns, monitors, feedback labels and plugins. Nullable element refs, readonly collections and negative type assertions are checked. An injected generic context remains an application-level schema assertion; it is not runtime validation of arbitrary external payloads.

## DOM ownership and interactions

Vibe's keyed renderer caches item order and uses minimal DOM moves. VibeDND replaces Sortable's default plugin array with the official SortableKeyboardPlugin and excludes OptimisticSortingPlugin. No adapter code reorders or reparents Vibe-owned list nodes.

The application model stays canonical during dragging. Accepted drops commit new arrays; cancellation and rejection leave the current data intact. Membership/order changes during a convenience drag cancel it, protecting newer external state. Commits check the current source index, target identity, cancellation/acceptance flags and container identity. Ambiguous numeric/string aliases such as 1 and '1' are refused instead of duplicating an item.

Feedback is a separate inert, aria-hidden text element, controlled by the official Feedback plugin. It never clones interactive components or uses their innerHTML. Its box model matches the source; public DOMRectangle/dragOperation.shape APIs establish the initial geometry before top-layer presentation. This fixes WebKit initial-popover coordinates and keyboard target selection for content-box sources.

Draggable/droppable hooks support reactive IDs, metadata, refs, handles, disabled state, element replacement, eligibility and scoped cleanup. Managers remain stable and isolated. Borrowed engines are not destroyed automatically. One disconnection observer belongs to each context. Monitor failures are reported asynchronously through onError or the platform error reporter, allowing later listeners and engine cleanup to finish.

Sorting supports vertical/horizontal lists, grids, variable-content items, disabled items, declarative transitions, same-list reorders, cross-container transfers and empty zones. A cross-container transfer unmounts and remounts the item through Vibe's renderer; durable card state belongs in its model. Handle identity restores keyboard focus after a transfer.

Official pointer and keyboard sensors remain enabled by default. The library exposes engine activation constraints, collision priorities, pointer/shape/proximity detectors, axis/viewport/element constraints, snapping and AutoScroller. High-frequency positioning stays in dnd-kit; Vibe-facing refs change at interaction boundaries and target changes.

## Showcase, documentation and ecosystem

The .vibe Kanban showcase has five columns, task and column sorting, counts, priorities, avatars, descriptions, tags, due dates, search, priority/assignee filters, task creation/editing/deletion, empty states, device-local persistence and light/dark themes. Filtering disables card sorting to avoid ambiguous projected indexes. Its controls reuse Vibecn sources and retain their license notices.

The site also contains 14 mounted playgrounds and searchable documentation with copyable code. It uses the same Vibe runtime as the examples. Vibe compiler 0.1.0 has a virtual-module HMR edge case; the local site uses the public Vite hmr:false option and manual reload. Production compilation and runtime reactivity remain enabled.

The companion Vibecn repository adds optional sortable-list, sortable-grid, kanban-board, drag-handle and drop-zone entries, documented pages and demos. The built local CLI resolves and copies their actual source dependencies. DND dependencies are declared only for the selected registry patterns; the installer has no new runtime dependency. Local development uses the same catalog/relative sibling override convention already used for VibeForm and VibeTable. These additions are not advertised as available from the currently published CLI.

The optional sibling integration fixture compiles against VibeMotion, VibeQuery and VibeAuth public entries. Browser verification exercises final-move persistence, rollback after a deliberate failed save, reload reconciliation and a server-side 403 for a crafted unauthorized transfer. Motion animates a separate content wrapper. Authentication uses a deterministic local fixture session, not a production sign-in service. No production account or data is contacted.

## Verification

| Check                                            | Actual result                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| VibeDND unit and compiled-runtime tests          | 25 passed                                                                                      |
| Strict library, tooling and .vibe template types | Passed, including interface-based metadata regressions                                         |
| oxlint and formatting                            | Passed; .vibe formatting is checked too                                                        |
| Library and documentation/showcase builds        | Passed                                                                                         |
| Chromium, Firefox and WebKit browser suite       | 58 passed; 2 explicit touch skips                                                              |
| Chromium touch input                             | Long press, drag and cancellation passed using browser CDP input                               |
| Packed independent consumer                      | Installed tarball, strict type checks, real .vibe production build and keyboard reorder passed |
| Node module import                               | Passed without browser globals                                                                 |
| Tree shaking                                     | Helper-only consumer JavaScript: 1,009 bytes; unused engine/accessibility code absent          |
| Optional ecosystem fixture                       | Build, persistence, failure rollback, reload and server rejection passed                       |
| Vibecn unit/components                           | 355 passed; 100% measured statements, branches, functions and lines                            |
| Vibecn integration                               | 20 passed                                                                                      |
| Vibecn frozen install                            | Passed with the declared local development overrides                                           |

The browser regressions cover deferred DOM commits, cancellation, cross-container movement, empty zones, insertion/removal/replacement during drag, unmount, repeated operations, pointer-to-keyboard continuation, preserved click handlers, interactive inputs, disabled handles, live-region text, accessible names/focus, constraints, reduced motion, scrolling and callback failure recovery. A separate regression checks preview size and keyboard order for content-box sources.

## Measured performance

The committed benchmarks/results.json records a real Chromium 156.0.8078.4 run on an Apple M4 / macOS arm64. Registration includes development-page load and compilation. Gesture times include driver pacing, official activation delays and settling; they are not frame-rate or production-throughput claims. Results are a single local run, not a device certification.

| Items | Columns | Load/registration | First scripted drag | Five cancellations | Six transfers |
| ----- | ------- | ----------------- | ------------------- | ------------------ | ------------- |
| 100   | 1       | 541 ms            | 856 ms              | 3,643 ms           | —             |
| 500   | 1       | 1,291 ms          | 849 ms              | 3,981 ms           | —             |
| 1,000 | 1       | 2,204 ms          | 1,018 ms            | 4,252 ms           | —             |
| 1,000 | 20      | 2,145 ms          | 928 ms              | 4,408 ms           | 5,191 ms      |

All scenarios retained their item count. The one-column runs generated 144 engine move events and 12 active-ref updates over six operations. The 20-column run generated 288 moves and 24 active-ref updates over twelve operations. Target changes are measured separately in the JSON. Long-frame measurements include startup spikes up to approximately 1.9 seconds for the largest fixtures; large nonvirtual mount cost is a practical limitation, not an invented FPS success claim.

## Limitations and release status

Manual VoiceOver/NVDA/JAWS verification is still outstanding. Automated keyboard, focus, live-region and accessibility-tree assertions do not establish screen-reader compatibility. Touch dragging is verified in Chromium emulation, not on physical mobile devices or the other two engines.

VibeVirtual had no local implementation to integrate. Offscreen/virtualized sorting, SSR and hydration are not claimed. Overlays are inert text previews, and sibling order changes on drop rather than optimistic DOM sorting during hover. Framework-packaged provider/overlay components are intentionally absent because Vibe 0.1 has no stable public render-function/teleport packaging contract.

No npm publication, GitHub repository creation, push, deployment or production-data change occurred. The npm artifact is locally installable and tested. GitHub CI configuration exists but has not run remotely. Existing unrelated companion files and remote history were preserved.

## Local commits

- 7ac0bf4 — repository and architectural DOM-ownership proof.
- 64a2ec7 — native adapter foundation.
- 59b08c5 — callback cleanup, move-validation, metadata and overlay regressions fixed.
- 0647f10 — Kanban showcase, playgrounds, documentation and package checks.
- 853f406 in Vibecn — optional registry compositions and verification repairs.

The verification/report commit contains this document and the benchmark-output formatting fix. The runtime and showcase branches were fast-forwarded locally into main; no remote operation was performed.
