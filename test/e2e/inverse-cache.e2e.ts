import { browser, expect } from "@wdio/globals";

describe("Extended MetadataCache E2E", function () {
  before(async function () {
    await browser.reloadObsidian({ vault: "./test/vault" });

    await browser.waitUntil(
      async () =>
        browser.executeObsidian(({ app }) => {
          const handle = (window as any).extendedMetadataCache;
          return handle?.api?.isReady === true;
        }),
      {
        timeout: 30_000,
        timeoutMsg: "ExtendedMetadataCache did not become ready within 30s",
      },
    );
  });

  describe("tags", () => {
    it("should match native tag index exactly", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        const handle = (window as any).extendedMetadataCache;
        const api = handle.api;
        const ourTags = api.getAllTagsWithFiles();

        const nativeTags = new Map<string, Set<string>>();
        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache) continue;
          const tags = (obsidian as any).getAllTags(cache) as string[] | null;
          if (!tags) continue;
          for (const tag of tags) {
            const normalized = tag.toLowerCase();
            let set = nativeTags.get(normalized);
            if (!set) {
              set = new Set();
              nativeTags.set(normalized, set);
            }
            set.add(file.path);
          }
        }

        const mismatches: string[] = [];
        const allKeys = new Set([...ourTags.keys(), ...nativeTags.keys()]);
        for (const key of allKeys) {
          const ours = ourTags.get(key) ?? new Set<string>();
          const native = nativeTags.get(key) ?? new Set<string>();
          if (ours.size !== native.size || ![...ours].every((v) => native.has(v))) {
            mismatches.push(`${key}: ours=${ours.size} native=${native.size}`);
          }
        }
        return { total: allKeys.size, mismatches };
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.mismatches).toEqual([]);
    });

    it("should find files with a specific tag", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        const api = (window as any).extendedMetadataCache.api;
        const ours = [...api.getFilesWithTag("#shared-tag")].sort();

        const native: string[] = [];
        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache) continue;
          const tags = (obsidian as any).getAllTags(cache) as string[] | null;
          if (tags?.some((t: string) => t.toLowerCase() === "#shared-tag")) {
            native.push(file.path);
          }
        }
        native.sort();

        return {
          ours,
          native,
          match: JSON.stringify(ours) === JSON.stringify(native),
        };
      });

      expect(result.match).toBe(true);
      expect(result.ours.length).toBeGreaterThan(0);
    });
  });

  describe("headings", () => {
    it("should match native heading index exactly", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        const api = (window as any).extendedMetadataCache.api;
        const ourHeadings = api.getAllHeadingsWithFiles();

        const nativeHeadings = new Map<string, Set<string>>();
        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache?.headings) continue;
          for (const h of cache.headings) {
            const normalized = h.heading.toLowerCase();
            let set = nativeHeadings.get(normalized);
            if (!set) {
              set = new Set();
              nativeHeadings.set(normalized, set);
            }
            set.add(file.path);
          }
        }

        const mismatches: string[] = [];
        const allKeys = new Set([...ourHeadings.keys(), ...nativeHeadings.keys()]);
        for (const key of allKeys) {
          const ours = ourHeadings.get(key) ?? new Set<string>();
          const native = nativeHeadings.get(key) ?? new Set<string>();
          if (ours.size !== native.size || ![...ours].every((v) => native.has(v))) {
            mismatches.push(`"${key}": ours=${ours.size} native=${native.size}`);
          }
        }
        return { total: allKeys.size, mismatches };
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.mismatches).toEqual([]);
    });

    it("should find shared headings across files", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithHeading("shared heading")].sort();
      });

      expect(result).toContain("headings-test.md");
      expect(result).toContain("frontmatter-test.md");
    });
  });

  describe("frontmatter keys", () => {
    it("should match native frontmatter key index exactly", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        const api = (window as any).extendedMetadataCache.api;
        const ourKeys = api.getAllFrontmatterKeysWithFiles();

        const nativeKeys = new Map<string, Set<string>>();
        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache?.frontmatter) continue;
          for (const key of Object.keys(cache.frontmatter)) {
            if (key === "position") continue;
            const normalized = key.toLowerCase();
            let set = nativeKeys.get(normalized);
            if (!set) {
              set = new Set();
              nativeKeys.set(normalized, set);
            }
            set.add(file.path);
          }
        }

        const mismatches: string[] = [];
        const allKeyNames = new Set([...ourKeys.keys(), ...nativeKeys.keys()]);
        for (const key of allKeyNames) {
          const ours = ourKeys.get(key) ?? new Set<string>();
          const native = nativeKeys.get(key) ?? new Set<string>();
          if (ours.size !== native.size || ![...ours].every((v) => native.has(v))) {
            mismatches.push(`${key}: ours=${ours.size} native=${native.size}`);
          }
        }
        return { total: allKeyNames.size, mismatches };
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.mismatches).toEqual([]);
    });

    it("should find files by frontmatter value", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("status", "published")].sort();
      });

      expect(result).toContain("index.md");
      expect(result).toContain("blocks-test.md");
    });
  });

  describe("aliases", () => {
    it("should match native alias index exactly", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        const api = (window as any).extendedMetadataCache.api;
        const ourAliases = api.getAllAliasesWithFiles();

        const nativeAliases = new Map<string, Set<string>>();
        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          const aliases = (obsidian as any).parseFrontMatterAliases(cache?.frontmatter ?? null) as
            | string[]
            | null;
          if (!aliases) continue;
          for (const alias of aliases) {
            const normalized = alias.toLowerCase();
            let set = nativeAliases.get(normalized);
            if (!set) {
              set = new Set();
              nativeAliases.set(normalized, set);
            }
            set.add(file.path);
          }
        }

        const mismatches: string[] = [];
        const allKeys = new Set([...ourAliases.keys(), ...nativeAliases.keys()]);
        for (const key of allKeys) {
          const ours = ourAliases.get(key) ?? new Set<string>();
          const native = nativeAliases.get(key) ?? new Set<string>();
          if (ours.size !== native.size || ![...ours].every((v) => native.has(v))) {
            mismatches.push(`"${key}": ours=${ours.size} native=${native.size}`);
          }
        }
        return { total: allKeys.size, mismatches };
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.mismatches).toEqual([]);
    });

    it("should find files by alias", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithAlias("home")];
      });

      expect(result).toContain("index.md");
    });
  });

  describe("backlinks", () => {
    it("should match native resolved backlinks exactly", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        const api = (window as any).extendedMetadataCache.api;
        const resolved = app.metadataCache.resolvedLinks;

        const nativeBacklinks = new Map<string, Set<string>>();
        for (const src of Object.keys(resolved)) {
          const dests = resolved[src];
          if (!dests) continue;
          for (const dest of Object.keys(dests)) {
            let set = nativeBacklinks.get(dest);
            if (!set) {
              set = new Set();
              nativeBacklinks.set(dest, set);
            }
            set.add(src);
          }
        }

        const mismatches: string[] = [];
        const allTargets = new Set([...nativeBacklinks.keys()]);
        for (const file of app.vault.getMarkdownFiles()) allTargets.add(file.path);

        for (const target of allTargets) {
          const ours = api.getBacklinksForFile(target);
          const native = nativeBacklinks.get(target) ?? new Set<string>();
          if (ours.size === 0 && native.size === 0) continue;
          if (ours.size !== native.size || ![...ours].every((v: string) => native.has(v))) {
            mismatches.push(`${target}: ours=${ours.size} native=${native.size}`);
          }
        }
        return { targets: nativeBacklinks.size, mismatches };
      });

      expect(result.targets).toBeGreaterThan(0);
      expect(result.mismatches).toEqual([]);
    });

    it("should find backlinks for a specific file", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getBacklinksForFile("backlinks-target.md")].sort();
      });

      expect(result).toContain("index.md");
      expect(result).toContain("backlinks-source.md");
      expect(result).toContain("subfolder/nested-note.md");
    });

    it("should accept TFile as parameter", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        const api = (window as any).extendedMetadataCache.api;
        const file = app.vault.getFileByPath("backlinks-target.md");
        if (!file) return [];
        return [...api.getBacklinksForFile(file)].sort();
      });

      expect(result).toContain("index.md");
      expect(result).toContain("backlinks-source.md");
    });
  });

  describe("unresolved backlinks", () => {
    it("should match native unresolved backlinks exactly", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        const api = (window as any).extendedMetadataCache.api;
        const unresolved = app.metadataCache.unresolvedLinks;

        const nativeUnresolved = new Map<string, Set<string>>();
        for (const src of Object.keys(unresolved)) {
          const dests = unresolved[src];
          if (!dests) continue;
          for (const dest of Object.keys(dests)) {
            let set = nativeUnresolved.get(dest);
            if (!set) {
              set = new Set();
              nativeUnresolved.set(dest, set);
            }
            set.add(src);
          }
        }

        const mismatches: string[] = [];
        for (const [target, native] of nativeUnresolved) {
          const ours = api.getUnresolvedBacklinks(target);
          if (ours.size !== native.size || ![...ours].every((v: string) => native.has(v))) {
            mismatches.push(`"${target}": ours=${ours.size} native=${native.size}`);
          }
        }
        return { targets: nativeUnresolved.size, mismatches };
      });

      expect(result.targets).toBeGreaterThan(0);
      expect(result.mismatches).toEqual([]);
    });
  });

  describe("embeds", () => {
    it("should match native embed index exactly", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        const api = (window as any).extendedMetadataCache.api;

        const nativeEmbeds = new Map<string, Set<string>>();
        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache?.embeds) continue;
          for (const embed of cache.embeds) {
            const linkpath = (obsidian as any).getLinkpath(embed.link) as string;
            const dest = app.metadataCache.getFirstLinkpathDest(linkpath, file.path);
            const destPath = dest?.path ?? linkpath;
            let set = nativeEmbeds.get(destPath);
            if (!set) {
              set = new Set();
              nativeEmbeds.set(destPath, set);
            }
            set.add(file.path);
          }
        }

        const mismatches: string[] = [];
        const allTargets = new Set([...nativeEmbeds.keys()]);
        for (const file of app.vault.getFiles()) allTargets.add(file.path);

        for (const target of allTargets) {
          const ours = api.getFilesEmbedding(target);
          const native = nativeEmbeds.get(target) ?? new Set<string>();
          if (ours.size === 0 && native.size === 0) continue;
          if (ours.size !== native.size || ![...ours].every((v: string) => native.has(v))) {
            mismatches.push(`${target}: ours=${ours.size} native=${native.size}`);
          }
        }
        return { targets: nativeEmbeds.size, mismatches };
      });

      expect(result.targets).toBeGreaterThan(0);
      expect(result.mismatches).toEqual([]);
    });
  });

  describe("blocks", () => {
    it("should match native block index exactly", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        const api = (window as any).extendedMetadataCache.api;

        const mismatches: string[] = [];
        let total = 0;

        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache?.blocks) continue;
          for (const blockId of Object.keys(cache.blocks)) {
            total++;
            const ourFile = api.getFileWithBlockId(blockId);
            const ourPath = ourFile?.path ?? null;
            if (ourPath !== file.path) {
              mismatches.push(`^${blockId}: ours=${ourPath} native=${file.path}`);
            }
          }
        }
        return { total, mismatches };
      });

      expect(result.total).toBeGreaterThan(0);
      expect(result.mismatches).toEqual([]);
    });
  });

  describe("frontmatter values", () => {
    it("should find files by string value", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("status", "draft")];
      });

      expect(result).toContain("frontmatter-test.md");
    });

    it("should find files by numeric value (integer)", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("numbers", 42)];
      });

      expect(result).toContain("frontmatter-test.md");
    });

    it("should find files by numeric value (float)", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("number-val", 3.14)];
      });

      expect(result).toContain("frontmatter-values-test.md");
    });

    it("should find files by boolean true", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("flag", true)];
      });

      expect(result).toContain("frontmatter-test.md");
    });

    it("should find files by boolean false", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("bool-false", false)];
      });

      expect(result).toContain("frontmatter-values-test.md");
    });

    it("should find files by array element", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("list", "alpha")];
      });

      expect(result).toContain("frontmatter-test.md");
    });

    it("should find files by date value (using native stored type)", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        const api = (window as any).extendedMetadataCache.api;
        const file = app.vault.getAbstractFileByPath("frontmatter-values-test.md");
        if (!file) return { files: [] as string[], storedType: "file-not-found" };
        const cache = app.metadataCache.getFileCache(
          file as unknown as InstanceType<typeof obsidian.TFile>,
        );
        const raw = cache?.frontmatter?.["date-val"];
        const files = [...api.getFilesWithFrontmatterValue("date-val", raw)];
        return {
          files,
          storedType: raw instanceof Date ? "Date" : typeof raw,
          storedValue: String(raw),
        };
      });

      expect(result.files).toContain("frontmatter-values-test.md");
    });

    it("should find files by cssclasses array element", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("cssclasses", "wide")];
      });

      expect(result).toContain("frontmatter-values-test.md");
    });

    it("should find files with same status across files", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithFrontmatterValue("status", "published")].sort();
      });

      expect(result).toContain("index.md");
      expect(result).toContain("blocks-test.md");
      expect(result).toContain("frontmatter-values-test.md");
    });

    it("should cross-verify all frontmatter values against native cache", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        const api = (window as any).extendedMetadataCache.api;
        const mismatches: string[] = [];

        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache?.frontmatter) continue;

          for (const [key, value] of Object.entries(cache.frontmatter)) {
            if (key === "position") continue;

            const filesWithKey = api.getFilesWithFrontmatterKey(key);
            if (!filesWithKey.has(file.path)) {
              mismatches.push(`${file.path}: key "${key}" not found in our index`);
              continue;
            }

            if (Array.isArray(value)) {
              for (const elem of value) {
                const filesWithVal = api.getFilesWithFrontmatterValue(key, elem);
                if (!filesWithVal.has(file.path)) {
                  mismatches.push(`${file.path}: ${key}=[...${String(elem)}...] not found`);
                }
              }
            } else {
              const filesWithVal = api.getFilesWithFrontmatterValue(key, value);
              if (!filesWithVal.has(file.path)) {
                mismatches.push(
                  `${file.path}: ${key}=${String(value)} (${typeof value}) not found`,
                );
              }
            }
          }
        }

        return { mismatches };
      });

      expect(result.mismatches).toEqual([]);
    });
  });

  describe("separated tags", () => {
    it("should distinguish body tags from frontmatter tags", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        const api = (window as any).extendedMetadataCache.api;
        const mismatches: string[] = [];

        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache) continue;

          const nativeBodyTags = new Set<string>();
          if (cache.tags) {
            for (const t of cache.tags) nativeBodyTags.add(t.tag.toLowerCase());
          }

          const nativeFmTags = new Set<string>();
          const fmTags = (obsidian as any).parseFrontMatterTags(cache.frontmatter ?? null) as
            | string[]
            | null;
          if (fmTags) {
            for (const t of fmTags) nativeFmTags.add(t.toLowerCase());
          }

          for (const tag of nativeBodyTags) {
            if (!api.getFilesWithTagInBody(tag).has(file.path)) {
              mismatches.push(`${file.path}: body tag ${tag} missing from getFilesWithTagInBody`);
            }
          }
          for (const tag of nativeFmTags) {
            if (!api.getFilesWithTagInFrontmatter(tag).has(file.path)) {
              mismatches.push(
                `${file.path}: fm tag ${tag} missing from getFilesWithTagInFrontmatter`,
              );
            }
          }
        }
        return { mismatches };
      });

      expect(result.mismatches).toEqual([]);
    });

    it("should return body-only tag file only from getFilesWithTagInBody", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return {
          body: [...api.getFilesWithTagInBody("#body-only-tag")],
          fm: [...api.getFilesWithTagInFrontmatter("#body-only-tag")],
        };
      });

      expect(result.body).toContain("body-only-tags.md");
      expect(result.fm).not.toContain("body-only-tags.md");
    });

    it("should return frontmatter-only tag file only from getFilesWithTagInFrontmatter", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return {
          body: [...api.getFilesWithTagInBody("#fm-only-tag")],
          fm: [...api.getFilesWithTagInFrontmatter("#fm-only-tag")],
        };
      });

      expect(result.body).not.toContain("frontmatter-only-tags.md");
      expect(result.fm).toContain("frontmatter-only-tags.md");
    });
  });

  describe("separated backlinks", () => {
    it("should distinguish body backlinks from frontmatter backlinks", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return {
          combined: [...api.getBacklinksForFile("backlinks-target.md")].sort(),
          body: [...api.getBacklinksFromBody("backlinks-target.md")].sort(),
          fm: [...api.getBacklinksFromFrontmatter("backlinks-target.md")].sort(),
        };
      });

      expect(result.combined.length).toBeGreaterThan(0);
      expect(result.combined).toContain("index.md");
      expect(result.body).toContain("index.md");
      expect(result.fm).toContain("index.md");
    });
  });

  describe("tasks", () => {
    it("should find files with tasks", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithTasks()];
      });

      expect(result).toContain("tasks-test.md");
    });

    it("should find files with open tasks", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithOpenTasks()];
      });

      expect(result).toContain("tasks-test.md");
    });

    it("should find files with completed tasks (any non-space)", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithCompletedTasks()];
      });

      expect(result).toContain("tasks-test.md");
    });

    it("should find files by specific task status", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithTaskStatus("/")];
      });

      expect(result).toContain("tasks-test.md");
    });

    it("should accept array of statuses", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return [...api.getFilesWithTaskStatus(["/", "-", ">"])];
      });

      expect(result).toContain("tasks-test.md");
    });

    it("should return all task statuses with files", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        const all = api.getAllTaskStatusesWithFiles();
        const statuses: string[] = [];
        for (const key of all.keys()) statuses.push(key);
        return statuses.sort();
      });

      expect(result).toContain(" ");
      expect(result).toContain("x");
    });

    it("should cross-verify task statuses against native cache", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        const api = (window as any).extendedMetadataCache.api;
        const mismatches: string[] = [];

        for (const file of app.vault.getMarkdownFiles()) {
          const cache = app.metadataCache.getFileCache(file);
          if (!cache?.listItems) continue;

          const nativeStatuses = new Set<string>();
          for (const item of cache.listItems) {
            if (item.task !== undefined) nativeStatuses.add(item.task);
          }

          for (const status of nativeStatuses) {
            const files = api.getFilesWithTaskStatus(status);
            if (!files.has(file.path)) {
              mismatches.push(`${file.path}: status "${status}" not in index`);
            }
          }
        }
        return { mismatches };
      });

      expect(result.mismatches).toEqual([]);
    });
  });

  describe("bulk listing methods", () => {
    it("getAllBacklinksWithFiles should return non-empty map", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        const all = api.getAllBacklinksWithFiles();
        return { size: all.size, hasBacklinksTarget: all.has("backlinks-target.md") };
      });

      expect(result.size).toBeGreaterThan(0);
      expect(result.hasBacklinksTarget).toBe(true);
    });

    it("getAllEmbedsWithFiles should return non-empty map", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        const all = api.getAllEmbedsWithFiles();
        return { size: all.size };
      });

      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe("incremental updates", () => {
    it("should update indexes when a file is modified", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        return new Promise<{ before: number; after: number }>((resolve) => {
          const api = (window as any).extendedMetadataCache.api;
          const before = api.getFilesWithTag("#dynamic-test-tag").size;

          const file = app.vault.getFileByPath("tags-test.md");
          if (!file) {
            resolve({ before, after: -1 });
            return;
          }

          api.on("file-updated", (path: string) => {
            if (path === "tags-test.md") {
              const after = api.getFilesWithTag("#dynamic-test-tag").size;
              app.vault
                .process(file as any, (content: string) =>
                  content.replace("\n#dynamic-test-tag", ""),
                )
                .then(() => {
                  resolve({ before, after });
                });
            }
          });

          app.vault.process(file as any, (content: string) => content + "\n#dynamic-test-tag");
        });
      });

      expect(result.before).toBe(0);
      expect(result.after).toBe(1);
    });

    it("should update indexes when a file is deleted and recreated", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        return new Promise<{ existed: boolean; afterDelete: number; afterRecreate: number }>(
          (resolve) => {
            const api = (window as any).extendedMetadataCache.api;

            app.vault
              .create("_temp-delete-test.md", "---\ntags:\n  - delete-test\n---\n# Temp\n")
              .then((file) => {
                const checkAfterIndex = () => {
                  const existed = api.getFilesWithTag("#delete-test").size > 0;

                  api.on("file-updated", (path: string) => {
                    if (path === "_temp-delete-test.md") {
                      const afterDelete = api.getFilesWithTag("#delete-test").size;
                      resolve({ existed, afterDelete, afterRecreate: -1 });
                    }
                  });

                  app.vault.delete(file);
                };

                setTimeout(checkAfterIndex, 500);
              });
          },
        );
      });

      expect(result.existed).toBe(true);
      expect(result.afterDelete).toBe(0);
    });

    it("should update indexes when a file is renamed", async () => {
      const result = await browser.executeObsidian(({ app }) => {
        return new Promise<{ beforePath: boolean; afterOldPath: boolean; afterNewPath: boolean }>(
          (resolve) => {
            const api = (window as any).extendedMetadataCache.api;

            app.vault
              .create("_temp-rename-src.md", "---\ntags:\n  - rename-test\n---\n# Rename\n")
              .then((file) => {
                setTimeout(() => {
                  const beforePath = api.getFilesWithTag("#rename-test").has("_temp-rename-src.md");

                  app.vault.rename(file, "_temp-rename-dst.md").then(() => {
                    setTimeout(() => {
                      const afterOldPath = api
                        .getFilesWithTag("#rename-test")
                        .has("_temp-rename-src.md");
                      const afterNewPath = api
                        .getFilesWithTag("#rename-test")
                        .has("_temp-rename-dst.md");

                      app.vault.delete(app.vault.getFileByPath("_temp-rename-dst.md")!).then(() => {
                        resolve({ beforePath, afterOldPath, afterNewPath });
                      });
                    }, 500);
                  });
                }, 500);
              });
          },
        );
      });

      expect(result.beforePath).toBe(true);
      expect(result.afterOldPath).toBe(false);
      expect(result.afterNewPath).toBe(true);
    });
  });

  describe("nested frontmatter values", () => {
    it("should index nested object values via JSON stringify", async () => {
      const result = await browser.executeObsidian(({ app, obsidian }) => {
        const api = (window as any).extendedMetadataCache.api;
        const file = app.vault.getFileByPath("frontmatter-values-test.md");
        if (!file) return { found: false };
        const cache = app.metadataCache.getFileCache(file as any);
        const nested = cache?.frontmatter?.["nested"];
        if (!nested || typeof nested !== "object") return { found: false, type: typeof nested };

        const files = [...api.getFilesWithFrontmatterValue("nested", nested)];
        return { found: true, files, type: typeof nested };
      });

      expect(result.found).toBe(true);
      expect(result.files).toContain("frontmatter-values-test.md");
    });
  });

  describe("isDestroyed", () => {
    it("should report isDestroyed as false for active instance", async () => {
      const result = await browser.executeObsidian(() => {
        const api = (window as any).extendedMetadataCache.api;
        return api.isDestroyed;
      });

      expect(result).toBe(false);
    });
  });
});
