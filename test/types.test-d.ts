import { shallowRef } from "@usevibejs/ui";
import {
  useDraggable,
  useDnd,
  useSortableGroup,
  moveItem,
  type SortableMove,
} from "../src/index.ts";
const context = useDnd<{ title: string }, { container: string }>();
const title: string | null = context.sourceData.value?.title ?? null;
const drag = useDraggable({
  id: "task",
  element: null,
  data: { title: "Task" },
  onDragStart(event) {
    const text: string | undefined = event.operation.source?.data.title;
    void text;
  },
});
const data: string | undefined = drag.entity.value?.data.title;
// @ts-expect-error typed draggable data is not erased
const wrong: number | undefined = drag.entity.value?.data.title;
// @ts-expect-error nullable element refs require an element
useDraggable({ id: "task", element: 42 });
// @ts-expect-error stable identifiers cannot be objects
useDraggable({ id: { key: "bad" }, element: null });
const rows = shallowRef<Readonly<Record<"todo" | "done", readonly { id: number; name: string }[]>>>(
  { todo: [], done: [] },
);
useSortableGroup({
  containers: rows,
  getId: (item) => item.id,
  onMove(move) {
    const id: number = move.itemId;
    const group: "todo" | "done" | undefined = move.toContainer;
    void id;
    void group;
  },
});
const readonlyItems = Object.freeze([{ id: 1 }, { id: 2 }]);
const moved: { id: number }[] = moveItem(readonlyItems, 0, 1);
// @ts-expect-error move operations preserve identifier type
const operation: SortableMove<number> = { itemId: "text" };
void [title, data, wrong, moved, operation];
