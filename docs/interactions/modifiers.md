# Modifiers and constraints

VibeDND reexports the actual modern modifier APIs: AxisModifier, RestrictToHorizontalAxis, RestrictToVerticalAxis, SnapModifier, RestrictToWindow and RestrictToElement. They are passed to a manager or draggable's modifiers option.

```ts
useDraggable({
  id: 'tile',
  element,
  modifiers: [
    RestrictToHorizontalAxis,
    RestrictToElement.configure({ element: container.value }),
    SnapModifier.configure({ size: 24 }),
  ],
});
```

Use a reactive getter when a container ref is initially null. Element constraints and viewport constraints use engine geometry. Modifier composition order matters: snap after bounds may project onto a nearby grid point beyond the last cell, so choose an ordering appropriate to your layout.

Extend the official Modifier class for custom movement constraints. The core has no additional geometry implementation. Do not apply CSS translate/transform from a separate motion system to the active engine positioning element.
