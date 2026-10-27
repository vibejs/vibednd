# Pointer, touch and keyboard sensors

The default sensors are official PointerSensor and KeyboardSensor. Pointer events cover mouse, touch and pen. Defaults use a 5px pointer distance or a short delay, and a 250ms touch delay with 5px tolerance. Source inputs and interactive descendants retain normal behavior.

```ts
const context = useDnd({
  sensors: [
    PointerSensor.configure({
      activationConstraints: (event) =>
        event.pointerType === 'touch'
          ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })]
          : [new PointerActivationConstraints.Distance({ value: 6 })],
    }),
    KeyboardSensor,
  ],
});
```

A custom sensors array replaces defaults. Include KeyboardSensor to preserve keyboard access. Configure official preventActivation, activatorElements and keyboardCodes options when needed. VibeDND does not run a second pointer tracking system.

Set touch-action:none on dedicated handles, while leaving the rest of the card scrollable. A long press cannot compensate for a browser gesture already claimed for page scrolling. The engine handles pointer capture and cancellation; do not add competing document listeners.

Space or Enter picks up/drops, arrows navigate, Escape cancels. Keyboard focus restoration is tested across same-list and cross-container commits. Tab ends a keyboard operation according to the official sensor defaults.
