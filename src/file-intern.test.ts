import { describe, it, expect, beforeEach } from "vitest";
import { FileIntern } from "./file-intern.js";

describe("FileIntern", () => {
  let intern: FileIntern;

  beforeEach(() => {
    intern = new FileIntern();
  });

  it("assigns sequential IDs starting from 0", () => {
    expect(intern.intern("a.md")).toBe(0);
    expect(intern.intern("b.md")).toBe(1);
    expect(intern.intern("c.md")).toBe(2);
  });

  it("returns the same ID for the same path", () => {
    const id = intern.intern("a.md");
    expect(intern.intern("a.md")).toBe(id);
  });

  it("getId returns undefined for unknown paths", () => {
    expect(intern.getId("unknown.md")).toBeUndefined();
  });

  it("getPath returns the path for a valid ID", () => {
    const id = intern.intern("notes/daily.md");
    expect(intern.getPath(id)).toBe("notes/daily.md");
  });

  it("getPath returns undefined for invalid IDs", () => {
    expect(intern.getPath(999)).toBeUndefined();
  });

  it("rename updates the path for an existing ID", () => {
    const id = intern.intern("old-name.md");
    intern.rename("old-name.md", "new-name.md");

    expect(intern.getId("old-name.md")).toBeUndefined();
    expect(intern.getId("new-name.md")).toBe(id);
    expect(intern.getPath(id)).toBe("new-name.md");
  });

  it("rename is a no-op for unknown paths", () => {
    intern.rename("nonexistent.md", "whatever.md");
    expect(intern.size).toBe(0);
  });

  it("has() works correctly", () => {
    expect(intern.has("a.md")).toBe(false);
    intern.intern("a.md");
    expect(intern.has("a.md")).toBe(true);
  });

  it("resolvePaths converts file IDs to paths", () => {
    intern.intern("a.md");
    intern.intern("b.md");
    intern.intern("c.md");

    const paths = intern.resolvePaths(new Set([0, 2]));
    expect(paths).toEqual(new Set(["a.md", "c.md"]));
  });

  it("resolvePaths skips invalid IDs", () => {
    intern.intern("a.md");
    const paths = intern.resolvePaths(new Set([0, 999]));
    expect(paths).toEqual(new Set(["a.md"]));
  });

  it("clear() resets all state", () => {
    intern.intern("a.md");
    intern.intern("b.md");
    intern.clear();

    expect(intern.size).toBe(0);
    expect(intern.has("a.md")).toBe(false);
    expect(intern.getPath(0)).toBeUndefined();
  });
});
