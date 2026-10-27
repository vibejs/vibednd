# Accessibility

The built-in Accessibility plugin provides instructions, drag handles' ARIA state and live region announcements. It is enabled alongside KeyboardSensor. Use descriptive native button handles and retain visible focus rings. The examples include forced-colors and reduced-motion styles.

```ts
useDnd({
  accessibility: {
    screenReaderInstructions: {
      draggable: 'Press Space to pick up, arrow keys to move, Space to drop, Escape to cancel.',
    },
    announcements: {
      dragstart: ({ operation }) => `Picked up ${operation.source?.id}.`,
      dragover: ({ operation }) =>
        operation.target ? `Over ${operation.target.id}.` : 'No valid destination.',
      dragend: ({ canceled, operation }) =>
        canceled ? 'Move canceled.' : `Dropped ${operation.source?.id}.`,
    },
  },
});
```

The browser suite asserts live-region pickup/target/cancellation text, accessible names, keyboard order and focus. These are DOM and browser accessibility-tree checks. Manual testing with VoiceOver, NVDA and JAWS has not been completed; screen-reader interoperability is not claimed solely from keyboard tests.

The upstream plugin still emits aria-grabbed, a deprecated ARIA drag state. It is upstream behavior, not a new VibeDND semantic requirement. Use native lists for item order and do not apply role=button to an entire card containing interactive descendants; put drag semantics on its dedicated handle.
