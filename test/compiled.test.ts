import { afterEach, expect, it } from 'vitest';
import { createApp, nextTick } from '@usevibejs/ui';
import AdapterBoard from './fixtures/AdapterBoard.vibe';
import { type DndContext } from '../src/index.ts';
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((fn) => fn());
  document.body.replaceChildren();
});
it('compiled keyed components register after insertion and clean every engine entity on unmount', async () => {
  const el = document.createElement('div');
  document.body.append(el);
  const app = createApp(AdapterBoard);
  const state = app.mount(el);
  const context = state.context as DndContext;
  await nextTick();
  expect([...context.engine.registry.draggables]).toHaveLength(6);
  expect([...context.engine.registry.droppables]).toHaveLength(9);
  app.unmount();
  expect([...context.engine.registry.draggables]).toHaveLength(0);
  expect([...context.engine.registry.droppables]).toHaveLength(0);
  expect(context.disposed).toBe(true);
  expect(document.querySelector('[data-vibednd-overlay]')).toBe(null);
});

import ContextRoot from './fixtures/ContextRoot.vibe';
import ContextChild from './fixtures/ContextChild.vibe';
import { createDndManager, createDndPlugin } from '../src/index.ts';
it('isolates nested contexts and independent applications without a singleton', async () => {
  const first = document.createElement('div');
  const second = document.createElement('div');
  document.body.append(first, second);
  const a = createApp(ContextRoot);
  const b = createApp(ContextRoot);
  const stateA = a.mount(first);
  const stateB = b.mount(second);
  await nextTick();
  const root = stateA.context as DndContext;
  const child = stateA.child as { context: DndContext };
  const nested = stateA.nested as { context: DndContext };
  expect(child.context).toBe(root);
  expect(nested.context).not.toBe(root);
  expect(stateB.context).not.toBe(root);
  a.unmount();
  expect(root.disposed).toBe(true);
  expect(nested.context.disposed).toBe(true);
  expect((stateB.context as DndContext).disposed).toBe(false);
  b.unmount();
});
it('app plugins allocate per install and deliberately borrowed contexts survive unmount', () => {
  const plugin = createDndPlugin();
  const first = document.createElement('div');
  const second = document.createElement('div');
  document.body.append(first, second);
  const a = createApp(ContextChild).use(plugin);
  const b = createApp(ContextChild).use(plugin);
  const ca = a.mount(first).context as DndContext;
  const cb = b.mount(second).context as DndContext;
  expect(ca).not.toBe(cb);
  a.unmount();
  expect(ca.disposed).toBe(true);
  expect(cb.disposed).toBe(false);
  b.unmount();
  const borrowed = createDndManager();
  const c = createApp(ContextChild).use(createDndPlugin(borrowed));
  c.mount(first);
  c.unmount();
  expect(borrowed.disposed).toBe(false);
  borrowed.dispose();
});
it('repeated compiled mount/unmount leaves no engine registrations or feedback nodes', async () => {
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    document.body.append(el);
    const app = createApp(AdapterBoard);
    const state = app.mount(el);
    await nextTick();
    const context = state.context as DndContext;
    expect([...context.engine.registry.draggables]).toHaveLength(6);
    app.unmount();
    el.remove();
    expect([...context.engine.registry.draggables]).toHaveLength(0);
    expect([...context.engine.registry.droppables]).toHaveLength(0);
  }
  expect(document.querySelector('[data-vibednd-overlay]')).toBe(null);
  expect(document.querySelector('[aria-live]')).toBe(null);
});
