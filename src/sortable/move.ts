import { arrayMove } from "@dnd-kit/helpers";
import type { DndEvent, Identifier, SortableMove, TransferResult } from "../types.ts";
/** Returns a fresh array; invalid indexes are programmer errors. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    from >= items.length ||
    to < 0 ||
    to >= items.length
  )
    throw new RangeError("[VibeDND] Move indexes must refer to existing items.");
  return arrayMove([...items], from, to);
}
/** Interpret non-optimistic sortable metadata. Source and target IDs may match. */
export function getSortableMove(event: DndEvent): SortableMove | null {
  const { source, target } = event.operation;
  if (!source || source.index === undefined) return null;
  const destinationIndex =
    target && target.sortable === false && source.group === target.group
      ? Math.max(0, (target.index ?? 0) - 1)
      : (target?.index ?? 0);
  const same = source.id === target?.id && source.group === target?.group;
  const changed = !same && (source.group !== target?.group || source.index !== destinationIndex);
  const reason = event.canceled
    ? "canceled"
    : !target
      ? "missing-target"
      : !event.accepted
        ? "rejected"
        : !changed
          ? "unchanged"
          : "accepted";
  return {
    itemId: source.id,
    fromContainer: source.group,
    toContainer: target?.group,
    fromIndex: source.index,
    toIndex: destinationIndex,
    targetId: target?.id ?? null,
    canceled: event.canceled,
    accepted: event.accepted,
    shouldCommit: reason === "accepted",
    reason,
  };
}
/** Applies a validated move to current data. A stale source/target refuses the commit. */
export function moveBetweenContainers<T, I extends Identifier, G extends Identifier>(
  containers: Readonly<Record<G, readonly T[]>>,
  move: SortableMove<I, G>,
  getId: (item: T) => I,
): TransferResult<T, I, G> {
  const fail = (reason: SortableMove<I, G>["reason"]): TransferResult<T, I, G> => ({
    containers,
    move: { ...move, shouldCommit: false, reason },
  });
  if (!move.shouldCommit) return { containers, move };
  const { fromContainer: from, toContainer: to } = move;
  if (
    from === undefined ||
    to === undefined ||
    !Object.hasOwn(containers, from) ||
    !Object.hasOwn(containers, to)
  )
    return fail("missing-target");
  const seen = new Set<I>();
  for (const list of Object.values(containers) as (readonly T[])[])
    for (const item of list) {
      const id = getId(item);
      if (seen.has(id))
        throw new Error(`[VibeDND] Duplicate item identifier "${id}" across containers.`);
      seen.add(id);
    }
  const source = containers[from];
  const target = containers[to];
  const actual = source.findIndex((item) => getId(item) === move.itemId);
  if (actual < 0) return fail("missing-source");
  // Refuse to overwrite newer ordering; retain unrelated metadata updates.
  if (actual !== move.fromIndex) return fail("stale");
  if (
    move.toIndex < 0 ||
    !Number.isInteger(move.toIndex) ||
    move.toIndex > target.length - (from === to ? 1 : 0)
  )
    return fail("stale");
  if (
    move.targetId !== null &&
    move.targetId !== move.itemId &&
    target.some((item) => getId(item) === move.targetId) &&
    getId(target[move.toIndex]!) !== move.targetId
  )
    return fail("stale");
  const origin = [...source];
  const [item] = origin.splice(actual, 1);
  if (from === to) {
    origin.splice(move.toIndex, 0, item!);
    return { containers: { ...containers, [from]: origin }, move };
  }
  const destination = [...target];
  destination.splice(move.toIndex, 0, item!);
  return { containers: { ...containers, [from]: origin, [to]: destination }, move };
}
