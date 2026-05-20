import { describe, it, expect, beforeEach } from "vitest";
import { InverseIndex, UniqueInverseIndex } from "./inverse-index.js";

describe("InverseIndex", () => {
  let index: InverseIndex;

  beforeEach(() => {
    index = new InverseIndex();
  });

  it("returns empty set for unknown keys", () => {
    expect(index.get("nonexistent").size).toBe(0);
  });

  it("adds and retrieves file IDs for a key", () => {
    index.add("tag1", 1);
    index.add("tag1", 2);
    index.add("tag2", 1);

    expect(index.get("tag1")).toEqual(new Set([1, 2]));
    expect(index.get("tag2")).toEqual(new Set([1]));
  });

  it("has() returns true only for populated keys", () => {
    expect(index.has("tag1")).toBe(false);
    index.add("tag1", 1);
    expect(index.has("tag1")).toBe(true);
  });

  it("removes a single file ID from a key", () => {
    index.add("tag1", 1);
    index.add("tag1", 2);
    index.remove("tag1", 1);

    expect(index.get("tag1")).toEqual(new Set([2]));
  });

  it("cleans up empty sets after removing last file ID", () => {
    index.add("tag1", 1);
    index.remove("tag1", 1);

    expect(index.has("tag1")).toBe(false);
    expect(index.size).toBe(0);
  });

  it("removeFromKeys removes a file ID from multiple keys", () => {
    index.add("tag1", 1);
    index.add("tag2", 1);
    index.add("tag3", 2);

    index.removeFromKeys(new Set(["tag1", "tag2"]), 1);

    expect(index.has("tag1")).toBe(false);
    expect(index.has("tag2")).toBe(false);
    expect(index.get("tag3")).toEqual(new Set([2]));
  });

  it("entries() exposes the full index", () => {
    index.add("a", 1);
    index.add("b", 2);

    const entries = index.entries();
    expect(entries.size).toBe(2);
    expect(entries.get("a")).toEqual(new Set([1]));
  });

  it("clear() empties the index", () => {
    index.add("tag1", 1);
    index.add("tag2", 2);
    index.clear();

    expect(index.size).toBe(0);
    expect(index.has("tag1")).toBe(false);
  });

  it("handles no-op remove gracefully", () => {
    index.remove("nonexistent", 1);
    expect(index.size).toBe(0);
  });

  it("deduplicates file IDs per key", () => {
    index.add("tag1", 1);
    index.add("tag1", 1);
    expect(index.get("tag1").size).toBe(1);
  });
});

describe("UniqueInverseIndex", () => {
  let index: UniqueInverseIndex;

  beforeEach(() => {
    index = new UniqueInverseIndex();
  });

  it("returns undefined for unknown keys", () => {
    expect(index.get("block-1")).toBeUndefined();
  });

  it("stores and retrieves a single file ID per key", () => {
    index.set("block-1", 5);
    expect(index.get("block-1")).toBe(5);
  });

  it("overwrites existing value for same key", () => {
    index.set("block-1", 5);
    index.set("block-1", 10);
    expect(index.get("block-1")).toBe(10);
  });

  it("removes a key", () => {
    index.set("block-1", 5);
    index.remove("block-1");
    expect(index.has("block-1")).toBe(false);
  });

  it("removeKeys removes multiple keys at once", () => {
    index.set("block-1", 1);
    index.set("block-2", 2);
    index.set("block-3", 3);

    index.removeKeys(new Set(["block-1", "block-2"]));

    expect(index.has("block-1")).toBe(false);
    expect(index.has("block-2")).toBe(false);
    expect(index.get("block-3")).toBe(3);
  });

  it("clear() empties the index", () => {
    index.set("block-1", 1);
    index.clear();
    expect(index.has("block-1")).toBe(false);
  });
});
