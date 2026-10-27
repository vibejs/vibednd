# VibeMotion, VibeQuery and VibeAuth

These libraries are optional and are not runtime dependencies of VibeDND. Their local public APIs were inspected. The independent ecosystem fixture can be built when the sibling repositories are available; scripts/ecosystem.ts documents its verification path.

## VibeMotion

Animate an inner content wrapper with useMotion, for example opacity or background. Let dnd-kit own its overlay and active source positioning. Avoid useDrag or layout transforms on the same active element. Reduced motion must apply to both libraries.

## VibeQuery persistence

Use useMutation to send a final accepted move, never pointer movements. Include a server revision and stable item/container IDs. Cancel in-flight refreshes before an optimistic write. Serialize mutations or attach operation IDs; roll back only if the failed operation still owns the current local version. Reconcile a newer background response deliberately. A stale snapshot must not replace newer local or server state.

The general VibeQuery optimisticMutation helper restores a snapshot on error. Overlapping drag mutations need additional sequencing/version checks. Do not apply that helper blindly to a concurrently edited board.

## VibeAuth permissions

useUser/useAuth can supply client eligibility through accept or canMove. This controls feedback only. The backend must validate the current session, project membership, target permissions, item membership and revision for every move. A crafted SortableMove is untrusted input. A 403 or 409 must leave authoritative state intact and trigger reconciliation.
