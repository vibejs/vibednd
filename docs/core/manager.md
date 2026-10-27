# Manager and contexts

createDndManager(options) creates an imperative DndContext. Call dispose when finished. useDnd(options) creates and provides a scope-owned context. useDnd(existingContext) provides a borrowed context without destroying it. useDndContext(override?) reads the nearest ancestor or app context.

createDndPlugin(options) creates one context for each app.install call. app.onUnmount disposes it. Passing an existing context deliberately shares it and keeps disposal with the caller. Passing options.engine wraps an externally owned DragDropManager; adapter disposal removes adapter registrations and subscriptions but does not destroy that engine.

```ts
import { createApp } from '@usevibejs/ui';
import { createDndPlugin } from '@usevibejs/dnd';
import App from './App.vibe';
createApp(App).use(createDndPlugin()).mount('#app');
```

Separate contexts isolate IDs, sensors and collision targets. Nested contexts create independent interaction areas; they do not exchange entities. A single context should span containers that exchange items. Provide/inject reads ancestors, so pass context explicitly in its creator's own setup.

The underlying engine is context.engine. Engine configuration is stable for the life of the manager. Entity options are reactive. Dispose is idempotent. Complete app unmount removes live regions, feedback, observers, sensors and registrations.
