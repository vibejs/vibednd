import { afterEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, shallowRef } from "@usevibejs/ui";
import {
  createDndManager,
  useDraggable,
  useDroppable,
  useSortable,
  useDndContext,
} from "../src/index.ts";
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
  const element = shallowRef<Element | null>(document.createElement("div"));
  document.body.append(element.value!);
  return { context, scope, element };
}
describe("native runtime lifecycle", () => {
  it("updates options and refs, and destroys registrations when the scope stops", async () => {
    const { scope, context, element } = setup();
    const id = shallowRef("A");
    const disabled = shallowRef(false);
    const data = shallowRef({ title: "one" });
    const binding = scope.run(() => useDraggable({ id, element, disabled, data, context }))!;
    await nextTick();
    const first = binding.entity.value;
    expect(first?.data.title).toBe("one");
    expect(context.engine.registry.draggables.has("A")).toBe(true);
    disabled.value = true;
    data.value = { title: "two" };
    await nextTick();
    expect(binding.entity.value).toBe(first);
    expect(first?.disabled).toBe(true);
    expect(first?.data.title).toBe("two");
    id.value = "B";
    await nextTick();
    expect(context.engine.registry.draggables.has("A")).toBe(false);
    expect(context.engine.registry.draggables.has("B")).toBe(true);
    element.value = null;
    expect(context.engine.registry.draggables.has("B")).toBe(false);
    scope.stop();
    expect(binding.entity.value).toBe(null);
  });
  it("handles replacement, raw DOM removal and repeated disposal", async () => {
    const { scope, context, element } = setup();
    const binding = scope.run(() => useDroppable({ id: "D", element, context, accept: "task" }))!;
    await nextTick();
    const first = binding.entity.value;
    const replacement = document.createElement("div");
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
  it("has independent managers and explicit borrowed-engine ownership", () => {
    const a = createDndManager();
    const b = createDndManager();
    const destroy = vi.spyOn(a.engine, "destroy");
    const borrowed = createDndManager({ engine: a.engine, feedback: false });
    borrowed.dispose();
    expect(destroy).not.toHaveBeenCalled();
    expect(a.engine).not.toBe(b.engine);
    a.dispose();
    a.dispose();
    b.dispose();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
  it("sortables keep index and group reactive without the optimistic plugin", async () => {
    const { scope, context, element } = setup();
    const index = shallowRef(0);
    const group = shallowRef("one");
    const binding = scope.run(() => useSortable({ id: "S", index, group, element, context }))!;
    await nextTick();
    index.value = 3;
    group.value = "two";
    await nextTick();
    expect(binding.entity.value?.index).toBe(3);
    expect(binding.entity.value?.group).toBe("two");
    expect(context.engine.plugins.map((p) => p.constructor.name)).not.toContain(
      "OptimisticSortingPlugin",
    );
  });
  it("requires an explicit context and an owning scope", () => {
    expect(() => useDndContext()).toThrow("No drag context");
    expect(() => useDraggable({ id: "A", element: null })).toThrow("effect scope");
  });
});
