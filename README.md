# VibeDND

**Powerful Drag & Drop for Vibe.js**

A headless, native Vibe.js integration for modern dnd-kit DOM. Pointer, touch and keyboard dragging; typed metadata; droppable eligibility; sortable lists/grids; multi-container transfers; handles, feedback, constraints and auto-scrolling.

```sh
pnpm add @usevibejs/dnd @usevibejs/ui
```

This local repository has not been published. To try it before release, run `pnpm build && pnpm pack` and install the generated tarball in a Vibe application.

```ts
import { useTemplateRef } from '@usevibejs/ui';
import { useSortable } from '@usevibejs/dnd';

const element = useTemplateRef<HTMLElement>('element');
const handle = useTemplateRef<HTMLButtonElement>('handle');
const drag = useSortable({
  id: () => props.item.id,
  index: () => props.index,
  group: 'tasks',
  element,
  handle,
});
```

Create an ancestor context with `useDnd()` or install `createDndPlugin()`. Use `useSortableList()` for local arrays and `useSortableGroup()` for grouped arrays; controlled mode emits moves for the application to commit.

Vibe.js owns keyed DOM order. VibeDND disables optimistic DOM sorting, uses an inert engine-owned text overlay, and commits immutable application data on accepted drop. Cancellations preserve canonical state. Concurrent membership/order changes cancel the active convenience operation instead of restoring stale snapshots.

Read [Getting started](docs/getting-started.md), [Architecture](docs/architecture.md), [Public API](docs/reference/api.md) and [Known limitations](docs/reference/limitations.md). Run `pnpm dev` for the Kanban showcase, searchable docs and 14 playgrounds. Optional Vibecn compositions live in the companion Vibecn repository; no UI framework is a dependency of this package.

```sh
pnpm install
pnpm check          # formatting, strict types, lint, unit tests, library and site builds
pnpm test:browser   # Chromium, Firefox, WebKit; Chromium touch input
pnpm test:package   # packed independent consumer, Node import and tree shaking
pnpm bench         # measured real-browser workloads
```

Modern `@dnd-kit/dom`, `abstract`, `collision` and `helpers` are pinned to **0.5.1**, the npm stable version verified on 2026-10-26. No legacy dnd-kit, React or Vue runtime is used. Requires Vibe.js 0.1 and Node 24.15+ or 26+ for tooling. ESM, declarations and source maps are included.

MIT. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
