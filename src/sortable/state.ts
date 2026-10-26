import { computed, onScopeDispose, shallowRef, toValue, watch, type Ref } from "@usevibejs/ui";
import { assertScope, useDndContext, useDndMonitor, type DndContext } from "../core/context.ts";
import { getSortableMove, moveBetweenContainers } from "./move.ts";
import type { Identifier, Reactive, SortableMove } from "../types.ts";
export interface SortableGroupOptions<T, I extends Identifier, G extends Identifier> {
  containers: Ref<Readonly<Record<G, readonly T[]>>>;
  getId(item: T): I;
  context?: DndContext;
  onMove?(move: SortableMove<I, G>): void;
  canMove?(move: SortableMove<I, G>): boolean;
  /** Controlled mode emits operations without writing the ref. Default false. */
  controlled?: boolean;
}
export function useSortableGroup<T, I extends Identifier, G extends Identifier>(
  options: SortableGroupOptions<T, I, G>,
) {
  assertScope("useSortableGroup");
  const context = useDndContext(options.context);
  let snapshot: Map<I, { container: G; index: number }> | undefined;
  const lastMove = shallowRef<SortableMove<I, G> | null>(null);
  const version = () =>
    JSON.stringify(
      (Object.entries(options.containers.value) as [G, readonly T[]][]).map(([group, items]) => [
        group,
        ...items.map(options.getId),
      ]),
    );
  const stop = watch(
    version,
    () => {
      if (snapshot && context.isDragging.value) context.cancel();
    },
    { flush: "sync" },
  );
  useDndMonitor(
    {
      onDragStart(event) {
        snapshot = new Map();
        const source = event.operation.source;
        if (source?.group === undefined) return;
        const items = options.containers.value[source.group as G];
        items?.forEach((item, index) =>
          snapshot!.set(options.getId(item), { container: source.group as G, index }),
        );
      },
      onDragEnd(event) {
        const raw = getSortableMove(event);
        if (!raw) return;
        const start = snapshot?.get(raw.itemId as I);
        snapshot = undefined;
        if (!start) return;
        let move = {
          ...raw,
          fromContainer: start.container,
          fromIndex: start.index,
        } as SortableMove<I, G>;
        if (options.canMove && !options.canMove(move))
          move = { ...move, accepted: false, shouldCommit: false, reason: "rejected" };
        const result = moveBetweenContainers(options.containers.value, move, options.getId);
        lastMove.value = result.move;
        if (result.move.shouldCommit && !options.controlled)
          options.containers.value = result.containers;
        options.onMove?.(result.move);
      },
    },
    context,
  );
  onScopeDispose(stop);
  return { containers: computed(() => options.containers.value), lastMove };
}
export interface SortableListOptions<T, I extends Identifier> {
  items?: readonly T[];
  model?: Ref<readonly T[]>;
  getId(item: T): I;
  group?: Identifier;
  context?: DndContext;
  controlled?: boolean;
  onMove?(move: SortableMove<I>): void;
}
export function useSortableList<T, I extends Identifier>(options: SortableListOptions<T, I>) {
  assertScope("useSortableList");
  const items = options.model ?? shallowRef<readonly T[]>([...(options.items ?? [])]);
  const group = options.group ?? "list";
  const containers = computed({
    get: () => ({ [group]: items.value }),
    set: (value: Readonly<Record<Identifier, readonly T[]>>) => {
      items.value = value[group] ?? [];
    },
  });
  const state = useSortableGroup({
    containers,
    getId: options.getId,
    context: options.context,
    controlled: options.controlled,
    onMove: options.onMove,
  });
  return { items, lastMove: state.lastMove, group };
}
/** Derived IDs/indexes for controlled rendering; no array is mutated. */
export function useSortableItems<T, I extends Identifier>(
  items: Reactive<readonly T[]>,
  getId: (item: T) => I,
) {
  return computed(() => {
    const seen = new Set<I>();
    return toValue(items).map((item, index) => {
      const id = getId(item);
      if (seen.has(id)) throw new Error(`[VibeDND] Duplicate item identifier "${id}".`);
      seen.add(id);
      return { id, index, item };
    });
  });
}
