import {
  computed,
  getCurrentScope,
  hasInjectionContext,
  inject,
  onScopeDispose,
  nextTick,
  provide,
  shallowRef,
  type InjectionKey,
  type Plugin,
} from '@usevibejs/ui';
import {
  Accessibility,
  AutoScroller,
  DragDropManager,
  Draggable,
  Feedback,
  KeyboardSensor,
  PointerSensor,
  type DragDropManagerInput,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/dom';
import type { DragDropEventMap, DragDropEventHandlers } from '@dnd-kit/abstract';
import type { Droppable } from '@dnd-kit/dom';
import { DOMRectangle } from '@dnd-kit/dom/utilities';
import { isSortable, OptimisticSortingPlugin } from '@dnd-kit/dom/sortable';
import type {
  DndEvent,
  DndMonitor,
  DragEntity,
  DragFeedbackOptions,
  DragOperation,
  Identifier,
  Metadata,
  ReadonlyRef,
} from '../types.ts';

type AccessibilityOptions = ConstructorParameters<typeof Accessibility>[1];
export interface DndManagerOptions<T extends object = Metadata, U extends object = T> extends Omit<
  DragDropManagerInput,
  'plugins'
> {
  /** External engines remain caller-owned. Do not use optimistic DOM sorting. */
  engine?: DragDropManager;
  accessibility?: AccessibilityOptions;
  autoScroll?: ConstructorParameters<typeof AutoScroller>[1] | false;
  feedback?: DragFeedbackOptions<T> | false;
  plugins?: DragDropManagerInput['plugins'];
  monitor?: DndMonitor<T, U>;
  /** Receives callback failures after dispatch; engine cleanup is allowed to finish. */
  onError?: (error: unknown) => void;
}
export interface DndContext<T extends object = Metadata, U extends object = T> {
  readonly engine: DragDropManager;
  readonly active: ReadonlyRef<DragEntity<T> | null>;
  readonly over: ReadonlyRef<DragEntity<U> | null>;
  readonly isDragging: ReadonlyRef<boolean>;
  readonly sourceData: ReadonlyRef<T | null>;
  readonly operation: ReadonlyRef<DragOperation<T, U>>;
  readonly ownsEngine: boolean;
  readonly disposed: boolean;
  monitor(handlers: DndMonitor<T, U>): () => void;
  cancel(): void;
  dispose(): void;
}
interface Registration {
  element: Element;
  dispose(): void;
}
interface ContextInternals {
  register(
    kind: 'draggable' | 'droppable' | 'sortable',
    id: Identifier,
    registration: Registration,
  ): () => void;
  onDispose(cleanup: () => void): () => void;
}
const internals = new WeakMap<object, ContextInternals>();
const positions = new WeakMap<
  object,
  { index: number | undefined; group: Identifier | undefined }
>();
export function setDropPosition(
  entity: object,
  index: number | undefined,
  group: Identifier | undefined,
): void {
  positions.set(entity, { index, group });
}
export const dndContextKey: InjectionKey<DndContext<object, object>> = Symbol('vibednd.context');
export function assertScope(name: string): void {
  if (!getCurrentScope())
    throw new Error(`[VibeDND] ${name} must run in component setup or an active effect scope.`);
}
export function contextInternals(context: DndContext<object, object>): ContextInternals {
  const value = internals.get(context);
  if (!value) throw new Error('[VibeDND] Invalid context. Use createDndManager().');
  return value;
}
function snapshot<T extends object>(
  entity: import('../types.ts').EngineEntity | null,
): DragEntity<T> | null {
  if (!entity) return null;
  const sortable =
    entity instanceof Draggable
      ? isSortable(entity)
        ? entity
        : null
      : isSortable(entity)
        ? entity
        : null;
  return {
    sortable: !!sortable,
    id: entity.id,
    data: entity.data as T,
    type: entity.type,
    element: entity.element,
    index: sortable ? sortable.index : positions.get(entity)?.index,
    group: sortable ? sortable.group : positions.get(entity)?.group,
  };
}
/** Creates an explicitly disposable manager. No global singleton is installed. */
export function createDndManager<T extends object = Metadata, U extends object = T>(
  options: DndManagerOptions<T, U> = {},
): DndContext<T, U> {
  const engine =
    options.engine ??
    new DragDropManager({
      ...options,
      sensors: options.sensors ?? [PointerSensor, KeyboardSensor],
      plugins:
        options.plugins ??
        ((defaults) =>
          defaults
            .filter(
              (plugin) =>
                plugin !== Feedback &&
                plugin !== Accessibility &&
                (options.autoScroll !== false || plugin !== AutoScroller),
            )
            .map((plugin) =>
              plugin === AutoScroller ? AutoScroller.configure(options.autoScroll || {}) : plugin,
            )
            .concat([
              Accessibility.configure(options.accessibility ?? {}),
              Feedback.configure({
                dropAnimation: null,
                ...(options.feedback === false ? {} : options.feedback),
                feedback: options.feedback === false ? 'none' : 'default',
              }),
            ])),
    });
  const active = shallowRef<DragEntity<T> | null>(null);
  const over = shallowRef<DragEntity<U> | null>(null);
  const dragging = shallowRef(false);
  const handlers = new Set<DndMonitor<T, U>>();
  if (options.monitor) handlers.add(options.monitor);
  const registrations = new Map<Registration, { kind: string; id: Identifier }>();
  const cleanupHooks = new Set<() => void>();
  let observer: MutationObserver | undefined;
  let overlay: HTMLElement | undefined;
  let feedbackFrame: number | undefined;
  const finishFeedback = () => {
    if (disposed || !overlay) return;
    if (engine.dragOperation.status.idle) {
      overlay.hidden = true;
      feedbackFrame = undefined;
      return;
    }
    feedbackFrame = overlay.ownerDocument.defaultView?.requestAnimationFrame(finishFeedback);
  };
  let disposed = false;
  let ending = false;
  let restoreFocus: { document: Document; id: string | null; element: HTMLElement } | undefined;
  const update = (event: DragStartEvent | DragOverEvent | DragEndEvent): DndEvent<T, U> => {
    const { source, target } = event.operation;
    const accepted =
      !!source &&
      !!target &&
      !target.disabled &&
      !!target.element?.isConnected &&
      !!source.element?.isConnected &&
      target.accepts(source);
    return {
      operation: { source: snapshot<T>(source), target: snapshot<U>(target) },
      accepted,
      canceled: 'canceled' in event && event.canceled,
      nativeEvent: 'nativeEvent' in event ? event.nativeEvent : undefined,
      engine,
      preventDefault() {
        if ('preventDefault' in event) event.preventDefault();
      },
    };
  };
  const fallbackError = (error: unknown) => {
    if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
    else console.error('[VibeDND] Drag callback failed:', error);
  };
  const report = (error: unknown) => {
    queueMicrotask(() => {
      if (!options.onError) {
        fallbackError(error);
        return;
      }
      try {
        const result: unknown = options.onError(error);
        if (result && typeof (result as { then?: unknown }).then === 'function')
          void Promise.resolve(result).catch(fallbackError);
      } catch (reportingError) {
        fallbackError(reportingError);
      }
    });
  };
  const emit = (key: keyof DndMonitor<T, U>, event: DndEvent<T, U>) => {
    for (const handler of Array.from(handlers)) {
      try {
        const result: unknown = handler[key]?.(event);
        if (result && typeof (result as { then?: unknown }).then === 'function')
          void Promise.resolve(result).catch(report);
      } catch (error) {
        if (key === 'onBeforeDragStart') event.preventDefault();
        report(error);
      }
    }
  };
  type EngineEvents = DragDropEventMap<Draggable, Droppable, DragDropManager>;
  type EngineHandlers = DragDropEventHandlers<Draggable, Droppable, DragDropManager>;
  const listen = <K extends keyof EngineEvents>(
    name: K,
    handler: (event: EngineEvents[K]) => void,
  ) => {
    const listener = (event: EngineEvents[K]) => {
      try {
        handler(event);
      } catch (error) {
        if ('preventDefault' in event) event.preventDefault();
        report(error);
      }
    };
    // The event map and handler map share K; TypeScript otherwise intersects all handler overloads.
    return engine.monitor.addEventListener(name, listener as unknown as EngineHandlers[K]);
  };
  const unsubscribers = [
    listen('beforedragstart', (event) => {
      if (disposed) {
        event.preventDefault();
        return;
      }
      emit('onBeforeDragStart', update(event));
      if (options.feedback !== false && !event.defaultPrevented) {
        const source = event.operation.source;
        if (source?.element) {
          const feedback = engine.registry.plugins.get(Feedback);
          if (!feedback) return;
          if (feedback.overlay && feedback.overlay !== overlay)
            throw new Error('[VibeDND] External Feedback.overlay is already in use.');
          const doc = source.element.ownerDocument;
          // Establish source geometry before the overlay enters the top layer. WebKit can
          // report a new popover at (0,0) during the engine's first measurement.
          const sourceShape = new DOMRectangle(source.element);
          engine.dragOperation.shape = sourceShape;
          const bounds = sourceShape.boundingRectangle;
          overlay ??= doc.createElement('div');
          overlay.hidden = false;
          overlay.setAttribute('data-vibednd-overlay', '');
          overlay.setAttribute('aria-hidden', 'true');
          overlay.inert = true;
          overlay.className = options.feedback?.className ?? '';
          overlay.textContent =
            options.feedback?.label?.(snapshot<T>(source)!) ??
            source.element.getAttribute('aria-label') ??
            source.element.textContent?.trim().slice(0, 120) ??
            String(source.id);
          // Engine-owned plain text: no duplicated controls, component scopes or IDs.
          overlay.style.cssText = `position:fixed;margin:0;top:${bounds.top}px;left:${bounds.left}px;width:${bounds.width}px;height:${bounds.height}px;pointer-events:none;box-sizing:border-box;padding:12px 16px;border:1px solid currentColor;border-radius:8px;background:Canvas;color:CanvasText;box-shadow:0 12px 36px #0003;`;
          // Feedback derives content dimensions from the source. Match its box model so
          // a content-box source and border-box preview do not produce different shapes.
          const sourceStyles = doc.defaultView?.getComputedStyle(source.element);
          if (sourceStyles) {
            overlay.style.boxSizing = sourceStyles.boxSizing;
            overlay.style.padding = sourceStyles.padding;
            overlay.style.borderWidth = sourceStyles.borderWidth;
            overlay.style.borderStyle = sourceStyles.borderStyle;
            overlay.style.width = sourceStyles.width;
            overlay.style.height = sourceStyles.height;
            overlay.style.outline = '1px solid currentColor';
          }
          doc.body.append(overlay);
          feedback.overlay = overlay;
          if (doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches)
            feedback.dropAnimation = null;
        }
      }
    }),
    listen('dragstart', (event) => {
      const adapted = update(event);
      active.value = adapted.operation.source;
      over.value = adapted.operation.target;
      dragging.value = true;
      const source = event.operation.source;
      const activator = source?.handle ?? source?.element;
      if (event.operation.activatorEvent?.type === 'keydown' && activator instanceof HTMLElement)
        restoreFocus = {
          document: activator.ownerDocument,
          id: activator.getAttribute('data-vibednd-handle'),
          element: activator,
        };
      emit('onDragStart', adapted);
    }),
    listen('dragover', (event) => {
      const adapted = update(event);
      over.value = adapted.operation.target;
      emit('onDragOver', adapted);
    }),
    listen('dragend', (event) => {
      ending = true;
      try {
        emit('onDragEnd', update(event));
      } finally {
        active.value = null;
        over.value = null;
        dragging.value = false;
        // Keep feedback alive until the engine has completed its drop animation.
        const focus = restoreFocus;
        restoreFocus = undefined;
        if (focus)
          void nextTick().then(() => {
            if (disposed) return;
            const replacement = focus.id
              ? [...focus.document.querySelectorAll<HTMLElement>('[data-vibednd-handle]')].find(
                  (el) => el.getAttribute('data-vibednd-handle') === focus.id,
                )
              : undefined;
            (focus.element.isConnected ? focus.element : replacement)?.focus({
              preventScroll: true,
            });
          });
        if (overlay && feedbackFrame === undefined)
          feedbackFrame = overlay.ownerDocument.defaultView?.requestAnimationFrame(finishFeedback);
        ending = false;
      }
    }),
  ];
  const context: DndContext<T, U> = {
    engine,
    active,
    over,
    isDragging: dragging,
    sourceData: computed(() => active.value?.data ?? null),
    operation: computed(() => ({ source: active.value, target: over.value })),
    ownsEngine: !options.engine,
    get disposed() {
      return disposed;
    },
    monitor(listeners) {
      if (disposed) throw new Error('[VibeDND] Context is disposed.');
      handlers.add(listeners);
      return () => handlers.delete(listeners);
    },
    cancel() {
      if (!ending) engine.actions.stop({ canceled: true });
    },
    dispose() {
      if (disposed) return;
      context.cancel();
      disposed = true;
      for (const hook of Array.from(cleanupHooks)) hook();
      cleanupHooks.clear();
      for (const registration of Array.from(registrations.keys())) registration.dispose();
      registrations.clear();
      observer?.disconnect();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      handlers.clear();
      if (context.ownsEngine) engine.destroy();
      const feedback = engine.registry.plugins.get(Feedback);
      if (feedback && feedback.overlay === overlay) feedback.overlay = undefined;
      if (feedbackFrame !== undefined)
        overlay?.ownerDocument.defaultView?.cancelAnimationFrame(feedbackFrame);
      overlay?.remove();
      active.value = null;
      over.value = null;
      dragging.value = false;
    },
  };
  internals.set(context, {
    register(kind, id, registration) {
      if (disposed) throw new Error('[VibeDND] Cannot register with a disposed context.');
      if (engine.registry.plugins.get(OptimisticSortingPlugin))
        throw new Error(
          '[VibeDND] OptimisticSortingPlugin conflicts with Vibe keyed DOM ownership. Use a separate engine without it.',
        );
      const drag = engine.registry.draggables.has(id);
      const drop = engine.registry.droppables.has(id);
      if ((kind !== 'droppable' && drag) || (kind !== 'draggable' && drop))
        throw new Error(`[VibeDND] Duplicate ${kind} identifier "${id}" in this context.`);
      registrations.set(registration, { kind, id });
      if (!observer) {
        const ViewObserver = registration.element.ownerDocument.defaultView?.MutationObserver;
        if (ViewObserver) {
          observer = new ViewObserver(() => {
            for (const entry of Array.from(registrations.keys()))
              if (!entry.element.isConnected) entry.dispose();
          });
          observer.observe(registration.element.ownerDocument, { childList: true, subtree: true });
        }
      }
      return () => registrations.delete(registration);
    },
    onDispose(cleanup) {
      cleanupHooks.add(cleanup);
      return () => cleanupHooks.delete(cleanup);
    },
  });
  return context;
}
/** Creates/provides a context owned by this scope, or provides a borrowed context. */
export function useDnd<T extends object = Metadata, U extends object = T>(
  options: DndManagerOptions<T, U> | DndContext<T, U> = {},
): DndContext<T, U> {
  assertScope('useDnd');
  const borrowed = 'monitor' in options && 'dispose' in options;
  const context = borrowed
    ? (options as DndContext<T, U>)
    : createDndManager(options as DndManagerOptions<T, U>);
  if (!borrowed) onScopeDispose(() => context.dispose());
  if (hasInjectionContext()) provide(dndContextKey, context as DndContext<object, object>);
  return context;
}
export function useDndContext<T extends object = Metadata, U extends object = T>(
  override?: DndContext<T, U>,
): DndContext<T, U> {
  if (override) return override;
  const context = hasInjectionContext() ? inject(dndContextKey, undefined) : undefined;
  if (!context)
    throw new Error(
      '[VibeDND] No drag context. Call useDnd() in an ancestor, install createDndPlugin(), or pass context explicitly.',
    );
  return context as unknown as DndContext<T, U>;
}
export function useDndMonitor<T extends object = Metadata, U extends object = T>(
  handlers: DndMonitor<T, U>,
  override?: DndContext<T, U>,
): () => void {
  assertScope('useDndMonitor');
  const stop = useDndContext(override).monitor(handlers);
  onScopeDispose(stop);
  return stop;
}
export function useDragOperation<T extends object = Metadata, U extends object = T>(
  override?: DndContext<T, U>,
): ReadonlyRef<DragOperation<T, U>> {
  return useDndContext(override).operation;
}
/** Per-install ownership gives each app its own engine unless a context is deliberately shared. */
export function createDndPlugin<T extends object = Metadata, U extends object = T>(
  options: DndManagerOptions<T, U> | DndContext<T, U> = {},
): Plugin {
  return {
    install(app) {
      const borrowed = 'dispose' in options;
      const context = borrowed ? options : createDndManager(options);
      app.provide(dndContextKey, context);
      if (!borrowed) app.onUnmount(() => context.dispose());
    },
  };
}
