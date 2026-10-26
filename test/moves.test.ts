import { describe, expect, it } from "vitest";
import {
  getSortableMove,
  moveBetweenContainers,
  moveItem,
  type SortableMove,
} from "../src/index.ts";
const move: SortableMove<string, string> = {
  itemId: "A",
  fromContainer: "one",
  toContainer: "two",
  fromIndex: 0,
  toIndex: 0,
  targetId: "zone:two",
  accepted: true,
  canceled: false,
  shouldCommit: true,
  reason: "accepted",
};
describe("immutable moves", () => {
  it("reorders without mutating readonly input", () => {
    const input = Object.freeze(["A", "B", "C"]);
    expect(moveItem(input, 0, 2)).toEqual(["B", "C", "A"]);
    expect(input).toEqual(["A", "B", "C"]);
    expect(() => moveItem(input, -1, 0)).toThrow(RangeError);
  });
  it("transfers into an empty group and leaves untouched arrays stable", () => {
    const original = { one: ["A", "B"], two: [], three: ["C"] };
    const result = moveBetweenContainers(original, move, (id) => id);
    expect(result.containers).toEqual({ one: ["B"], two: ["A"], three: ["C"] });
    expect(result.containers.three).toBe(original.three);
    expect(original.one).toEqual(["A", "B"]);
  });
  it("reorders within a group using final indexes", () => {
    const result = moveBetweenContainers(
      { one: ["A", "B", "C"] },
      { ...move, toContainer: "one", targetId: "C", toIndex: 2 },
      (id) => id,
    );
    expect(result.containers.one).toEqual(["B", "C", "A"]);
  });
  it.each(["canceled", "rejected"] as const)("does not write %s operations", (reason) => {
    const input = { one: ["A"], two: [] };
    expect(
      moveBetweenContainers(input, { ...move, shouldCommit: false, reason }, (id) => id).containers,
    ).toBe(input);
  });
  it("rejects missing or stale source/target and duplicate IDs", () => {
    expect(moveBetweenContainers({ one: ["B", "A"], two: [] }, move, (id) => id).move.reason).toBe(
      "stale",
    );
    expect(moveBetweenContainers({ one: [], two: [] }, move, (id) => id).move.reason).toBe(
      "missing-source",
    );
    expect(() => moveBetweenContainers({ one: ["A"], two: ["A"] }, move, (id) => id)).toThrow(
      "Duplicate",
    );
  });
  it("accepts absent collisions and equal IDs deterministically", () => {
    const event = {
      operation: {
        source: { id: "A", data: {}, type: undefined, element: undefined, index: 0, group: "one" },
        target: null,
      },
      canceled: false,
      accepted: false,
      engine: null!,
      preventDefault() {},
    };
    expect(getSortableMove(event)?.reason).toBe("missing-target");
    expect(getSortableMove({ ...event, canceled: true })?.shouldCommit).toBe(false);
  });
});
