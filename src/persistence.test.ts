import { describe, it, expect } from "vitest";
import { serializeContributions, deserializeContributions } from "./persistence.js";
import type { FileContributions } from "./types.js";

describe("persistence serialization round-trip", () => {
  it("round-trips empty contributions", () => {
    const contrib: FileContributions = {};
    const serialized = serializeContributions(0, 1000, contrib);
    const deserialized = deserializeContributions(serialized);

    expect(serialized.id).toBe(0);
    expect(serialized.mtime).toBe(1000);
    expect(deserialized).toEqual({});
  });

  it("round-trips tags", () => {
    const contrib: FileContributions = {
      tags: new Set(["#tag1", "#tag2"]),
    };
    const serialized = serializeContributions(1, 2000, contrib);
    const deserialized = deserializeContributions(serialized);

    expect(deserialized.tags).toEqual(new Set(["#tag1", "#tag2"]));
  });

  it("round-trips bodyTags and frontmatterTags separately", () => {
    const contrib: FileContributions = {
      bodyTags: new Set(["#inline"]),
      frontmatterTags: new Set(["#fm"]),
    };
    const serialized = serializeContributions(2, 3000, contrib);
    const deserialized = deserializeContributions(serialized);

    expect(deserialized.bodyTags).toEqual(new Set(["#inline"]));
    expect(deserialized.frontmatterTags).toEqual(new Set(["#fm"]));
    expect(deserialized.tags).toBeUndefined();
  });

  it("round-trips backlinks with body/frontmatter separation", () => {
    const contrib: FileContributions = {
      backlinks: new Set(["a.md", "b.md"]),
      bodyBacklinks: new Set(["a.md"]),
      frontmatterBacklinks: new Set(["b.md"]),
    };
    const serialized = serializeContributions(3, 4000, contrib);
    const deserialized = deserializeContributions(serialized);

    expect(deserialized.backlinks).toEqual(new Set(["a.md", "b.md"]));
    expect(deserialized.bodyBacklinks).toEqual(new Set(["a.md"]));
    expect(deserialized.frontmatterBacklinks).toEqual(new Set(["b.md"]));
  });

  it("round-trips taskStatuses", () => {
    const contrib: FileContributions = {
      taskStatuses: new Set([" ", "x", "/", "-"]),
    };
    const serialized = serializeContributions(4, 5000, contrib);
    const deserialized = deserializeContributions(serialized);

    expect(deserialized.taskStatuses).toEqual(new Set([" ", "x", "/", "-"]));
  });

  it("round-trips all fields together", () => {
    const contrib: FileContributions = {
      tags: new Set(["#a"]),
      bodyTags: new Set(["#a"]),
      frontmatterTags: new Set(["#b"]),
      backlinks: new Set(["x.md"]),
      bodyBacklinks: new Set(["x.md"]),
      frontmatterBacklinks: new Set(),
      unresolvedBacklinks: new Set(["missing"]),
      embeds: new Set(["img.png"]),
      headings: new Set(["intro"]),
      frontmatterKeys: new Set(["status"]),
      frontmatterValues: new Set(["status\0draft"]),
      aliases: new Set(["home"]),
      blocks: new Set(["block-1"]),
      taskStatuses: new Set([" ", "x"]),
    };
    const serialized = serializeContributions(99, 99999, contrib);
    const deserialized = deserializeContributions(serialized);

    expect(deserialized.tags).toEqual(contrib.tags);
    expect(deserialized.bodyTags).toEqual(contrib.bodyTags);
    expect(deserialized.frontmatterTags).toEqual(contrib.frontmatterTags);
    expect(deserialized.backlinks).toEqual(contrib.backlinks);
    expect(deserialized.bodyBacklinks).toEqual(contrib.bodyBacklinks);
    expect(deserialized.unresolvedBacklinks).toEqual(contrib.unresolvedBacklinks);
    expect(deserialized.embeds).toEqual(contrib.embeds);
    expect(deserialized.headings).toEqual(contrib.headings);
    expect(deserialized.frontmatterKeys).toEqual(contrib.frontmatterKeys);
    expect(deserialized.frontmatterValues).toEqual(contrib.frontmatterValues);
    expect(deserialized.aliases).toEqual(contrib.aliases);
    expect(deserialized.blocks).toEqual(contrib.blocks);
    expect(deserialized.taskStatuses).toEqual(contrib.taskStatuses);
  });

  it("omits empty sets from serialized output", () => {
    const contrib: FileContributions = {
      tags: new Set(),
      backlinks: new Set(["a.md"]),
    };
    const serialized = serializeContributions(5, 6000, contrib);

    expect(serialized.tags).toBeUndefined();
    expect(serialized.backlinks).toEqual(["a.md"]);
  });

  it("skips empty arrays during deserialization", () => {
    const deserialized = deserializeContributions({
      id: 0,
      mtime: 0,
      tags: [],
      backlinks: ["a.md"],
    });

    expect(deserialized.tags).toBeUndefined();
    expect(deserialized.backlinks).toEqual(new Set(["a.md"]));
  });

  it("preserves frontmatterBacklinks as empty set when empty", () => {
    const contrib: FileContributions = {
      frontmatterBacklinks: new Set(),
    };
    const serialized = serializeContributions(6, 7000, contrib);
    expect(serialized.frontmatterBacklinks).toBeUndefined();
  });
});
