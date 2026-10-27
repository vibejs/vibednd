# Auto-scrolling

The official AutoScroller plugin is enabled by default. It manages nested scroll ancestors and viewport scrolling. No adapter scroll loop runs alongside it.

```ts
useDnd({ autoScroll: { acceleration: 25, threshold: { x: 0.2, y: 0.2 } } });
```

Set autoScroll:false to remove the plugin. Use overflow:auto with a constrained height or width and real content overflow. Touch-action:none belongs on handles, not the entire scrolling region. The playground has a 60-item scrolling fixture; the Kanban has horizontal board overflow and per-column vertical overflow.

Keyboard sortable navigation uses the engine's scrollIntoView behavior. Drop and cancel stop scrolling. Real-browser scrolling and stop behavior are part of the browser suite; test your own nested scrolling layout because clipping, transforms and modal top layers affect geometry.
