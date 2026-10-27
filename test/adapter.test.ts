import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, shallowRef } from '@usevibejs/ui';
import {
  createDndManager,
  useDraggable,
  useDroppable,
  useSortable,
  useDndContext,
} from '../src/index.ts';
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((stop) => stop());
  document.body.replaceChildren();
});
function setup() {
  const context = createDndManager({ feedback: false });
  cleanups.push(() => context.dispose());
  const scope = effectScope();
  cleanups.push(() => scope.stop());
  const element = shallowRef<Element | null>(document.createElement('div'));
  document.body.append(element.value!);
  return { context, scope, element };
}
describe('native runtime lifecycle', () => {
  it('updates options and refs, and destroys registrations when the scope stops', async () => {
    const { scope, context, element } = setup();
    const id = shallowRef('A');
    const disabled = shallowRef(false);
    const data = shallowRef({ title: 'one' });
    const binding = scope.run(() => useDraggable({ id, element, disabled, data, context }))!;
    await nextTick();
    const first = binding.entity.value;
    expect(first?.data.title).toBe('one');
    expect(context.engine.registry.draggables.has('A')).toBe(true);
    disabled.value = true;
    data.value = { title: 'two' };
    await nextTick();
    expect(binding.entity.value).toBe(first);
    expect(first?.disabled).toBe(true);
    expect(first?.data.title).toBe('two');
    id.value = 'B';
    await nextTick();
    expect(context.engine.registry.draggables.has('A')).toBe(false);
    expect(context.engine.registry.draggables.has('B')).toBe(true);
    element.value = null;
    expect(context.engine.registry.draggables.has('B')).toBe(false);
    scope.stop();
    expect(binding.entity.value).toBe(null);
  });
  it('handles replacement, raw DOM removal and repeated disposal', async () => {
    const { scope, context, element } = setup();
    const binding = scope.run(() => useDroppable({ id: 'D', element, context, accept: 'task' }))!;
    await nextTick();
    const first = binding.entity.value;
    const replacement = document.createElement('div');
    document.body.append(replacement);
    element.value = replacement;
    await nextTick();
    expect(first).not.toBe(binding.entity.value);
    replacement.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(binding.entity.value).toBe(null);
    binding.dispose();
    binding.dispose();
  });
  it('has independent managers and explicit borrowed-engine ownership', () => {
    const a = createDndManager();
    const b = createDndManager();
    const destroy = vi.spyOn(a.engine, 'destroy');
    const borrowed = createDndManager({ engine: a.engine, feedback: false });
    borrowed.dispose();
    expect(destroy).not.toHaveBeenCalled();
    expect(a.engine).not.toBe(b.engine);
    a.dispose();
    a.dispose();
    b.dispose();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
  it('sortables keep index and group reactive without the optimistic plugin', async () => {
    const { scope, context, element } = setup();
    const index = shallowRef(0);
    const group = shallowRef('one');
    const binding = scope.run(() => useSortable({ id: 'S', index, group, element, context }))!;
    await nextTick();
    index.value = 3;
    group.value = 'two';
    await nextTick();
    expect(binding.entity.value?.index).toBe(3);
    expect(binding.entity.value?.group).toBe('two');
    expect(context.engine.plugins.map((p) => p.constructor.name)).not.toContain(
      'OptimisticSortingPlugin',
    );
  });
  it('requires an explicit context and an owning scope', () => {
    expect(() => useDndContext()).toThrow('No drag context');
    expect(() => useDraggable({ id: 'A', element: null })).toThrow('effect scope');
  });
});

it('preserves handle attributes through replacement and cleanup', async () => {
  const { scope, context, element } = setup();
  const first = document.createElement('button');
  const second = document.createElement('button');
  first.setAttribute('data-vibednd-handle', 'user-value');
  document.body.append(first, second);
  const handle = shallowRef<Element | null>(first);
  const binding = scope.run(() => useDraggable({ id: 1, element, handle, context }))!;
  await nextTick();
  expect(first.getAttribute('data-vibednd-handle')).toBe('number:1');
  handle.value = second;
  await nextTick();
  expect(first.getAttribute('data-vibednd-handle')).toBe('user-value');
  expect(second.getAttribute('data-vibednd-handle')).toBe('number:1');
  binding.dispose();
  expect(second.hasAttribute('data-vibednd-handle')).toBe(false);
});

it('isolates synchronous and asynchronous monitor failures and reports them', async () => {
  const error = new Error('consumer callback failed');
  const asyncError = new Error('async consumer failed');
  const onError = vi.fn();
  const context = createDndManager({ feedback: false, onError });
  cleanups.push(() => context.dispose());
  const next = vi.fn();
  context.monitor({
    onDragEnd() {
      throw error;
    },
  });
  context.monitor({
    onDragEnd: async () => {
      throw asyncError;
    },
  });
  context.monitor({ onDragEnd: next });
  expect(() =>
    context.engine.monitor.dispatch('dragend', {
      operation: context.engine.dragOperation,
      canceled: true,
      suspend: () => ({ resume() {}, abort() {} }),
    }),
  ).not.toThrow();
  expect(next).toHaveBeenCalledOnce();
  await vi.waitFor(() => expect(onError).toHaveBeenCalledTimes(2));
  expect(onError).toHaveBeenCalledWith(error);
  expect(onError).toHaveBeenCalledWith(asyncError);
});
