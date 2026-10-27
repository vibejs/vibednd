# Troubleshooting

No context: useDndContext injects from ancestors. Pass the new context explicitly to hooks called beside useDnd in the same setup.

No drag activation: check the template ref type, disabled state, handle availability and touch-action. The element must be connected. A component ref exposes only defineExpose values, not its root DOM node automatically.

No empty-container drop: give a measured useDroppable element a min-height, group and append index. Check accept types and disabled state.

DOM/data mismatch: never enable OptimisticSortingPlugin or move framework-owned nodes manually. Render with stable item keys. Use data as canonical order; DOM order is not a persistence payload.

Canceled after list refresh: convenience state cancels membership/order changes during a drag to protect current data. It does not restore the pickup array.

Wrong index with filters: use canonical indexes and explicit controlled projection logic, or disable sorting while filtered, as the showcase does.

Lost card-local state across containers: Vibe intentionally unmounts/remounts between independent keyed lists. Store durable state by ID in the model.

Missing screen-reader announcements: retain Accessibility and KeyboardSensor if replacing manager plugins/sensors. Verify handle names, description IDs and live-region text in the actual browser.
