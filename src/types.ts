import type { MaybeRefOrGetter, Ref } from '@usevibejs/ui';
import type { DragDropManager, Draggable, Droppable, FeedbackOptions } from '@dnd-kit/dom';
import type { Type, UniqueIdentifier } from '@dnd-kit/abstract';
export type Identifier = UniqueIdentifier;
export type Metadata = Record<string, unknown>;
export type Reactive<T> = MaybeRefOrGetter<T>;
export type ElementTarget = Reactive<Element | null | undefined>;
export type ReadonlyRef<T> = Readonly<Ref<T>>;
export interface DragEntity<T extends object = Metadata> {
  readonly id: Identifier;
  readonly data: T;
  readonly type: Type | undefined;
  readonly element: Element | undefined;
  readonly sortable?: boolean;
  readonly index: number | undefined;
  readonly group: Identifier | undefined;
}
export interface DragOperation<T extends object = Metadata, U extends object = T> {
  readonly source: DragEntity<T> | null;
  readonly target: DragEntity<U> | null;
}
export interface DndEvent<T extends object = Metadata, U extends object = T> {
  readonly operation: DragOperation<T, U>;
  readonly canceled: boolean;
  readonly accepted: boolean;
  readonly nativeEvent?: Event;
  readonly engine: DragDropManager;
  preventDefault(): void;
}
export interface DndMonitor<T extends object = Metadata, U extends object = T> {
  onBeforeDragStart?(event: DndEvent<T, U>): void;
  onDragStart?(event: DndEvent<T, U>): void;
  onDragOver?(event: DndEvent<T, U>): void;
  onDragEnd?(event: DndEvent<T, U>): void;
}
export type MoveReason =
  | 'accepted'
  | 'unchanged'
  | 'canceled'
  | 'rejected'
  | 'missing-source'
  | 'missing-target'
  | 'stale';
export interface SortableMove<
  I extends Identifier = Identifier,
  G extends Identifier = Identifier,
> {
  readonly itemId: I;
  readonly fromContainer: G | undefined;
  readonly toContainer: G | undefined;
  readonly fromIndex: number;
  /** Final index after removing the source. */
  readonly toIndex: number;
  readonly targetId: Identifier | null;
  readonly targetIsContainer?: boolean;
  readonly canceled: boolean;
  readonly accepted: boolean;
  readonly shouldCommit: boolean;
  readonly reason: MoveReason;
}
export interface TransferResult<
  T,
  I extends Identifier = Identifier,
  G extends Identifier = Identifier,
> {
  readonly containers: Readonly<Record<G, readonly T[]>>;
  readonly move: SortableMove<I, G>;
}
export type EngineEntity<T extends object = Metadata> = Draggable<T> | Droppable<T>;
/** Feedback is always rendered through a separate inert overlay. */
export type DragFeedbackOptions<T extends object = Metadata> = Pick<
  FeedbackOptions,
  'dropAnimation' | 'keyboardTransition'
> & {
  label?: (source: DragEntity<T>) => string;
  className?: string;
};
