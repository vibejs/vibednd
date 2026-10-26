import { afterEach, expect, it } from "vitest";
import { createApp, nextTick } from "@usevibejs/ui";
import AdapterBoard from "./fixtures/AdapterBoard.vibe";
import { type DndContext } from "../src/index.ts";
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((fn) => fn());
  document.body.replaceChildren();
});
it("compiled keyed components register after insertion and clean every engine entity on unmount", async () => {
  const el = document.createElement("div");
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
  expect(document.querySelector("[data-vibednd-overlay]")).toBe(null);
});
