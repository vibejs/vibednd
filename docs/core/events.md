# Drag events and reactive state

useDndMonitor registers scoped onBeforeDragStart, onDragStart, onDragOver and onDragEnd handlers. context.monitor is the imperative equivalent and returns an unsubscribe function. Hooks called outside an active scope throw.

```ts
useDndMonitor(
  {
    onDragEnd(event) {
      if (event.canceled || !event.accepted) return;
      console.log(event.operation.source?.data, event.operation.target?.id);
    },
  },
  context,
);
```

DndEvent contains operation.source/target snapshots, canceled, accepted, nativeEvent when available, engine and preventDefault. Source/target views include id, data, type, element, sortable, index and group. Calling preventDefault affects preventable engine events; final drop uses explicit accepted checks and application-controlled commits.

context.active, context.over, context.isDragging and context.sourceData are readonly refs. useDragOperation returns a computed operation ref. These expose metadata at interaction boundaries, not a high-frequency position stream. Use engine.monitor directly for advanced motion telemetry and retain its unsubscribe function.

Source metadata is captured at drag start. Commit against current collections and revalidate business rules, especially when records can change during a drag.

## Callback errors

Monitor callbacks are isolated so a thrown error cannot interrupt engine cleanup or suppress later listeners. Rejected callback promises are reported too. A synchronous failure in onBeforeDragStart prevents activation. Register onError on the context to handle failures; otherwise they go to the browser's reportError API, or console.error in tooling environments. Reporting is deferred until the engine event dispatch returns. Low-level engine.monitor listeners remain the advanced caller's responsibility.

```ts
const context = useDnd({
  onError(error) {
    console.error('Drag interaction failed', error);
  },
});
```
