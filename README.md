# obsidian-extended-metadatacache

Inverse lookup complement to Obsidian's `MetadataCache`. Where `MetadataCache` answers "what metadata does this file have?", this library answers "which files have this metadata?".

## What it provides

Obsidian's `MetadataCache` only offers file → metadata lookups. This library builds and maintains the inverse indexes:

| Query | Method |
|---|---|
| Which files have `#tag`? | `getFilesWithTag(tag)` |
| Which files link to `path`? | `getBacklinksForFile(destPath)` |
| Which files have unresolved links to `name`? | `getUnresolvedBacklinks(destName)` |
| Which files embed `path`? | `getFilesEmbedding(destPath)` |
| Which files have heading `text`? | `getFilesWithHeading(heading)` |
| Which files have frontmatter key `key`? | `getFilesWithFrontmatterKey(key)` |
| Which files have `key = value` in frontmatter? | `getFilesWithFrontmatterValue(key, value)` |
| Which files have alias `name`? | `getFilesWithAlias(alias)` |
| Which file defines block `^id`? | `getFileWithBlockId(blockId)` |

All indexes update incrementally via `MetadataCache` events. No full rescans.

## Install

```bash
npm install obsidian-extended-metadatacache
```

The `obsidian` package must be available as a peer dependency (it already is in any Obsidian plugin project).

## Usage

### Shared singleton (recommended)

When multiple plugins use this library, they share a single cache instance via a global registry keyed by API major version. Call `getAPI` in your plugin's `onload` and `release` on `onunload`:

```typescript
import { getAPI } from "obsidian-extended-metadatacache";
import type { ExtendedMetadataCacheHandle } from "obsidian-extended-metadatacache";

export default class MyPlugin extends Plugin {
  private cacheHandle: ExtendedMetadataCacheHandle | null = null;

  async onload() {
    this.cacheHandle = getAPI(this.app);
    const cache = this.cacheHandle.api;

    // Wait for initial index build if needed
    if (!cache.isReady) {
      cache.on("ready", () => this.onCacheReady(cache));
    } else {
      this.onCacheReady(cache);
    }
  }

  onunload() {
    this.cacheHandle?.release();
  }

  private onCacheReady(cache: ExtendedMetadataCacheAPI) {
    const files = cache.getFilesWithTag("#project");
    console.log("Files tagged #project:", [...files]);
  }
}
```

### Isolated instance (for testing)

```typescript
import { createExtendedMetadataCache } from "obsidian-extended-metadatacache";

const cache = createExtendedMetadataCache(app);
// This instance is not shared — it has its own indexes.
```

### Check if a singleton already exists

```typescript
import { hasAPI } from "obsidian-extended-metadatacache";

if (hasAPI()) {
  // Another plugin already initialized the cache
}
```

## API

### Query methods

All query methods return `ReadonlySet<string>` containing vault-absolute file paths (matching `TFile.path`).

```typescript
interface ExtendedMetadataCacheAPI {
  readonly isReady: boolean;

  getFilesWithTag(tag: string): ReadonlySet<string>;
  getAllTagsWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  getBacklinksForFile(destPath: string): ReadonlySet<string>;
  getUnresolvedBacklinks(destName: string): ReadonlySet<string>;

  getFilesEmbedding(destPath: string): ReadonlySet<string>;

  getFilesWithHeading(heading: string): ReadonlySet<string>;
  getAllHeadingsWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  getFilesWithFrontmatterKey(key: string): ReadonlySet<string>;
  getFilesWithFrontmatterValue(key: string, value: unknown): ReadonlySet<string>;
  getAllFrontmatterKeysWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  getFilesWithAlias(alias: string): ReadonlySet<string>;
  getAllAliasesWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  getFileWithBlockId(blockId: string): string | null;

  destroy(): void;
}
```

### Events

```typescript
cache.on("ready", () => {
  // Initial index build complete
});

cache.on("file-updated", (path: string) => {
  // Inverse indexes for this file were updated
});

cache.on("rebuild-progress", ({ processed, total }) => {
  // Progress during initial build
});
```

### Options

```typescript
getAPI(app, {
  chunkSize: 500,        // Files per async chunk during initial build (default: 500)
  persist: true,          // Enable IndexedDB persistence (default: true)
  flushDebounceMs: 2000,  // Debounce before writing to IndexedDB (default: 2000)
  flushIntervalMs: 30000, // Periodic flush interval (default: 30000)
});
```

## How it works

1. **IndexedDB persistence**: On first run, inverse indexes are built from MetadataCache and persisted to a separate IndexedDB (per vault). On subsequent startups, the persisted state is loaded instantly and only changed files (detected via `mtime` comparison) are reconciled — no full rebuild needed.
2. **Incremental updates**: Hooks `MetadataCache` events (`changed`, `deleted`, `resolve`) and the `Vault` `rename` event. On each change, the file's old index contributions are removed and rebuilt from the new cache. Changes are flushed to IndexedDB on a debounced schedule.
3. **Graceful fallback**: If IndexedDB is unavailable (Apple Lockdown Mode, quota errors, corruption), the library falls back to a full in-memory rebuild from MetadataCache and disables persistence for the session.
4. **Memory efficiency**: File paths are interned to numeric IDs. All index maps store `Set<number>` internally, resolving to paths only at query time.
5. **Singleton**: A global registry (`Symbol.for`) keyed by API major version ensures plugins sharing the same major get the same instance. Different majors coexist independently.

### Persistence details

The library stores **per-file contribution records** in IndexedDB — not the inverse maps themselves. On startup:

1. Load all persisted records from IndexedDB
2. Rebuild in-memory inverse maps from contributions (fast, CPU only)
3. Compare vault files + mtimes against persisted state
4. Reindex only added/changed files; remove deleted files
5. Flush reconciliation results back to IndexedDB

Writes are batched: dirty entries are coalesced and flushed every 2 seconds (debounced) with a periodic 30-second flush as a safety net. A best-effort flush also runs on `destroy()`.

## Normalization

- **Tags**: Lowercased. Querying `"#Project"` and `"#project"` returns the same results. Tags from both inline content and frontmatter are included.
- **Headings**: Lowercased for lookup.
- **Frontmatter keys**: Lowercased.
- **Frontmatter values**: Primitives are stringified and lowercased. Arrays are indexed per-element.
- **Aliases**: Lowercased.
- **Backlinks**: Use the exact resolved file path (not lowercased — paths are case-sensitive).
- **Block IDs**: Stored as-is (case-sensitive, matching Obsidian behavior).

## License

[Unlicense](LICENSE) — public domain.
