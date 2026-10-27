# Vibecn integration

The companion Vibecn branch adds five optional registry compositions: sortable-list, sortable-grid, kanban-board, drag-handle and drop-zone. They use the actual trusted registry and installer conventions. The compositions depend on public VibeDND composables, native handles, Card, Badge and Empty; the core package does not depend on Vibecn.

The registry CLI copies source and reports required dependencies. It does not install packages itself. Only DND registry entries declare @usevibejs/dnd. The current published Vibecn release does not yet contain this local work, so do not use an @latest command expecting these additions.

After building the companion CLI locally, its add sortable-list and add kanban-board commands install the verified source sets. Supply v-model arrays of {id,label,disabled?} entries, or columns of {id,title,items}. SortableList creates its own context; SortableItem and DropZone consume one from their ancestor. KanbanBoard owns card transfers, while the primary showcase additionally demonstrates independent column ordering and full task editing.

The showcase's UI sources are copied from Vibecn with their license notices intact. No second design system or UI runtime is introduced.
