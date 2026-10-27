# Drag feedback and drop indicators

By default, a separate inert text overlay follows the pointer. It uses the source's accessible label or text content, never innerHTML or component cloning. Native controls are not duplicated. Feedback positioning, top-layer popover handling and transitions belong to the official Feedback plugin.

```ts
useDnd({
  feedback: {
    label: (source) => String(source.data.title ?? source.id),
    className: 'my-drag-preview',
    dropAnimation: { duration: 160, easing: 'ease-out' },
  },
});
```

feedback:false disables visual feedback. Style data-vibednd-overlay or the supplied class. Reduced-motion preference disables drop animations and the examples disable CSS transitions. A rejected or canceled move preserves the canonical source location.

Render drop indicators declaratively from isOver and isEligible, using borders or positioned noninteractive elements. Do not append a placeholder into a keyed component block. Packaged DragOverlay/DropIndicator components are intentionally absent: Vibe 0.1 has no supported teleport or public render-function packaging ABI. Use refs and the safe built-in overlay.

The preview preserves the source's box sizing, padding and border widths. This keeps its collision shape identical for content-box and border-box sources, including keyboard activation. Customize color, shadow and radius freely; overriding its geometry with important CSS rules can change collision behavior.
