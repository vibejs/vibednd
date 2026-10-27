# Known limitations

Vibe 0.1 has no stable public render-function or teleport ABI. The package ships composables rather than provider/list/overlay components. Optional Vibecn source components are compiled by the consumer.

Sorting is deferred until accepted drop. It shows feedback and target indicators without optimistic sibling DOM movement. Native Sortable transitions apply to declarative commits. No claim of full spring-driven hover reflow is made.

Cross-container transfer remounts item components, matching Vibe keyed-list ownership. Keyboard focus is restored by handle identity; durable local state belongs in application data.

Virtualized/offscreen sorting is not supported. No VibeVirtual public implementation existed locally. SSR and hydration are not claimed. Node module import is verified.

Automated accessibility checks cover keyboard, focus, accessible tree and announcement DOM; manual screen-reader compatibility is unverified. Touch browser emulation is not a physical-device certification. Browser coverage and any failing or skipped checks are recorded in the delivery report.

The documentation and demos are local applications. No package publication, remote repository creation, push or deployment occurs in this workflow. Before publishing, review API stability, browser coverage and the independent ecosystem's release coordination.

The Vibe compiler 0.1.0 HMR hook can encounter virtual Vite modules without an id. The local site disables HMR and uses manual reload as a supported Vite configuration; production builds and runtime reactivity remain enabled. No Vibe runtime or compiler implementation is patched.

The overlay's initial geometry is seeded through the public DOMRectangle and dragOperation.shape APIs. This prevents a WebKit first-popover measurement at (0,0) from shifting constrained feedback. The adapter still delegates measurements and transforms during movement to dnd-kit.
