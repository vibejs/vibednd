# Draggable and drag handles

useDraggable accepts id, element, handle, data, disabled, type, sensors, modifiers, context, onDragStart and onDragEnd. Reactive options accept values, refs or zero-argument getters. element and handle accept null before render.

```ts
const drag = useDraggable({
  id: () => props.task.id,
  element,
  handle,
  data: () => props.task,
  type: 'task',
  disabled: () => props.locked,
});
```

The returned entity ref exposes the real Draggable. isDragging, isOver, disabled and isEligible are readonly computed refs. Nested properties are not automatically unwrapped by Vibe templates: write drag.isDragging.value.

Use a native button handle with a descriptive aria-label and touch-action:none. Keep the source card's normal controls interactive. Without a handle, the official pointer sensor rejects interactive descendants, while the keyboard sensor activates only the source element. Ensure a non-button source has a sensible role and name; a button handle is preferred.

A disconnected/null/replaced element unregisters. Changes to an ID replace the registration safely. Duplicate IDs throw a clear diagnostic through Vibe's error reporting. Keep IDs globally unique within each context's draggable namespace.
