# Nested interfaces and overlays

A card can contain inputs, action buttons, dropdown menus and expandable content. Prefer a dedicated drag handle; the official sensors preserve interaction with other controls. Nested sortable groups in one context need distinct IDs/groups and type acceptance to avoid selecting an enclosing panel as a card target.

Separate nested managers isolate drag areas completely. They do not transfer items across context boundaries. A dialog may have its own manager or participate in the ancestor's context, depending on the intended transfer behavior.

Vibecn uses native modal dialog and popover top layers. Feedback.overlay uses the official plugin's popover support. No Teleport directive is available in Vibe 0.1. Test focus and stacking inside your modal; disable drag before opening an editor or context menu that changes an active item's structure.

Cross-container rendering creates a new destination component, so store edits, expanded state and network status by item ID outside ephemeral card setup.
