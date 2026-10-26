import {
  computed,
  effectScope,
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  watchEffect,
  type ShallowRef,
} from "@usevibejs/ui";
import { Draggable, Droppable, type DraggableInput, type DroppableInput } from "@dnd-kit/dom";
import { defaultCollisionDetection } from "@dnd-kit/collision";
import { Sortable, SortableKeyboardPlugin, type SortableInput } from "@dnd-kit/dom/sortable";
import type { Type, Modifiers, CollisionDetector, CollisionPriority } from "@dnd-kit/abstract";
import type { Sensors } from "@dnd-kit/dom";
import {
  assertScope,
  contextInternals,
  setDropPosition,
  useDndContext,
  type DndContext,
} from "../core/context.ts";
import type {
  DndEvent,
  ElementTarget,
  Identifier,
  Metadata,
  Reactive,
  ReadonlyRef,
} from "../types.ts";

export interface DraggableOptions<T extends object = Metadata> {
  id: Reactive<Identifier>;
  element: ElementTarget;
  handle?: ElementTarget;
  data?: Reactive<T>;
  disabled?: Reactive<boolean>;
  type?: Reactive<Type | undefined>;
  sensors?: Reactive<Sensors | undefined>;
  modifiers?: Reactive<Modifiers | undefined>;
  context?: DndContext<object, object>;
  onDragStart?(event: DndEvent<T, object>): void;
  onDragEnd?(event: DndEvent<T, object>): void;
}
export interface DroppableOptions<T extends object = Metadata> extends Omit<
  DraggableOptions<T>,
  "handle" | "sensors" | "modifiers"
> {
  group?: Reactive<Identifier | undefined>;
  index?: Reactive<number | undefined>;
  /** Business rules run both during collision detection and at final commit. */
  accept?: DroppableInput<T>["accept"];
  collisionDetector?: Reactive<CollisionDetector | undefined>;
  collisionPriority?: Reactive<CollisionPriority | number | undefined>;
}
export interface SortableOptions<T extends object = Metadata>
  extends
    Omit<DraggableOptions<T>, "disabled">,
    Pick<DroppableOptions<T>, "accept" | "collisionDetector" | "collisionPriority"> {
  index: Reactive<number>;
  group?: Reactive<Identifier | undefined>;
  disabled?: Reactive<SortableInput<T>["disabled"]>;
  transition?: Reactive<SortableInput<T>["transition"]>;
}
export interface EntityBinding<E> {
  readonly entity: ReadonlyRef<E | null>;
  readonly isDragging: ReadonlyRef<boolean>;
  readonly isOver: ReadonlyRef<boolean>;
  readonly isEligible: ReadonlyRef<boolean>;
  readonly disabled: ReadonlyRef<boolean>;
  dispose(): void;
}
type Entity<T extends object> = Draggable<T> | Droppable<T> | Sortable<T>;
type Options<T extends object> = DraggableOptions<T> | DroppableOptions<T> | SortableOptions<T>;
function binding<T extends object, E extends Entity<T>>(
  kind: "draggable" | "droppable" | "sortable",
  options: Options<T>,
): EntityBinding<E> {
  assertScope(`use${kind}`);
  const context = useDndContext(options.context);
  const internal = contextInternals(context);
  const scope = effectScope();
  const entity = shallowRef(null) as ShallowRef<E | null>;
  let unclaim: (() => void) | undefined;
  let id: Identifier | undefined;
  let element: Element | null | undefined;
  let disposed = false;
  const detach = () => {
    const current = entity.value;
    if (!current) return;
    if (
      context.engine.dragOperation.source?.id === id ||
      context.engine.dragOperation.target?.id === id
    )
      context.cancel();
    entity.value = null;
    current.destroy();
    unclaim?.();
    unclaim = undefined;
    id = undefined;
    element = undefined;
  };
  const resolve = () => {
    const sortable = options as SortableOptions<T>;
    const drop = options as DroppableOptions<T>;
    return {
      id: toValue(options.id),
      element: toValue(options.element),
      handle: "handle" in options ? (toValue(options.handle) ?? undefined) : undefined,
      data: toValue(options.data),
      disabled: toValue(options.disabled) ?? false,
      type: toValue(options.type),
      sensors: "sensors" in options ? toValue(options.sensors) : undefined,
      modifiers: "modifiers" in options ? toValue(options.modifiers) : undefined,
      accept: drop.accept,
      collisionDetector: toValue(drop.collisionDetector),
      collisionPriority: toValue(drop.collisionPriority),
      index: toValue(sortable.index),
      group: toValue(sortable.group),
      transition: toValue(sortable.transition),
    };
  };
  scope.run(() => {
    // A removed/replaced ref unregisters synchronously; creation waits until DOM insertion.
    watch(
      () => toValue(options.element),
      (next) => {
        if (next !== element) detach();
      },
      { flush: "sync" },
    );
    watchEffect(
      () => {
        const input = resolve();
        if (disposed || context.disposed || !input.element?.isConnected) {
          detach();
          return;
        }
        if (kind === "sortable" && (!Number.isInteger(input.index) || input.index < 0))
          throw new Error("[VibeDND] Sortable index must be a non-negative integer.");
        if (entity.value && (id !== input.id || element !== input.element)) detach();
        if (!entity.value) {
          id = input.id;
          element = input.element;
          unclaim = internal.register(kind, id, { element, dispose: detach });
          try {
            entity.value = (
              kind === "sortable"
                ? new Sortable(
                    {
                      ...input,
                      index: input.index,
                      element,
                      disabled: input.disabled,
                      plugins: [SortableKeyboardPlugin],
                    },
                    context.engine,
                  )
                : kind === "draggable"
                  ? new Draggable(
                      { ...input, element, disabled: !!input.disabled } as DraggableInput<T>,
                      context.engine,
                    )
                  : new Droppable(
                      { ...input, element, disabled: !!input.disabled } as DroppableInput<T>,
                      context.engine,
                    )
            ) as E;
          } catch (error) {
            unclaim();
            unclaim = undefined;
            throw error;
          }
        }
        const current = entity.value;
        current.data = input.data ?? ({} as T);
        current.disabled = input.disabled as never;
        current.type = input.type;
        if (current instanceof Draggable || current instanceof Sortable) {
          current.handle = input.handle;
          current.sensors = input.sensors;
          current.modifiers = input.modifiers;
          if (input.handle)
            input.handle.setAttribute("data-vibednd-handle", `${typeof input.id}:${input.id}`);
        }
        if (current instanceof Droppable || current instanceof Sortable) {
          setDropPosition(current, input.index, input.group);
          current.accept = input.accept;
          current.collisionDetector = input.collisionDetector ?? defaultCollisionDetection;
          current.collisionPriority = input.collisionPriority;
        }
        if (current instanceof Sortable) {
          if (
            (current.index !== input.index || current.group !== input.group) &&
            context.isDragging.value
          )
            context.cancel();
          current.index = input.index;
          current.group = input.group;
          current.transition =
            input.transition === undefined ? current.transition : input.transition;
        }
        const draggable =
          current instanceof Sortable
            ? current.draggable
            : current instanceof Draggable
              ? current
              : null;
        if (draggable?.disabled && draggable.isDragSource) context.cancel();
      },
      { flush: "post" },
    );
  });
  const stopEvents = context.monitor({
    onDragStart(event) {
      if (event.operation.source?.id === toValue(options.id))
        options.onDragStart?.(event as DndEvent<T, object>);
    },
    onDragEnd(event) {
      if (event.operation.source?.id === toValue(options.id))
        options.onDragEnd?.(event as DndEvent<T, object>);
    },
  });
  const removeHook = internal.onDispose(() => dispose());
  function dispose() {
    if (disposed) return;
    disposed = true;
    scope.stop();
    detach();
    stopEvents();
    removeHook();
  }
  onScopeDispose(dispose);
  return {
    entity,
    isDragging: computed(
      () => context.isDragging.value && context.active.value?.id === toValue(options.id),
    ),
    isOver: computed(
      () => context.isDragging.value && context.over.value?.id === toValue(options.id),
    ),
    isEligible: computed(() => {
      toValue(options.disabled);
      const source = context.active.value;
      const current = entity.value;
      const drop =
        current instanceof Sortable
          ? current.droppable
          : current instanceof Droppable
            ? current
            : null;
      const raw = context.engine.dragOperation.source;
      return !!source && !!drop && !drop.disabled && !!raw && drop.accepts(raw);
    }),
    disabled: computed(() => {
      const value = toValue(options.disabled);
      return typeof value === "object" ? !!value.draggable : !!value;
    }),
    dispose,
  };
}
export function useDraggable<T extends object = Metadata>(
  options: DraggableOptions<T>,
): EntityBinding<Draggable<T>> {
  return binding<T, Draggable<T>>("draggable", options);
}
export function useDroppable<T extends object = Metadata>(
  options: DroppableOptions<T>,
): EntityBinding<Droppable<T>> {
  return binding<T, Droppable<T>>("droppable", options);
}
export function useSortable<T extends object = Metadata>(
  options: SortableOptions<T>,
): EntityBinding<Sortable<T>> {
  return binding<T, Sortable<T>>("sortable", options);
}
