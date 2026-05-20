# obsidian-extended-metadatacache

Inverse lookup complement to Obsidian's `MetadataCache`. Where `MetadataCache` answers "what metadata does this file have?", this library answers "which files have this metadata?".

## What it provides

Obsidian's `MetadataCache` only offers file → metadata lookups. This library builds and maintains the inverse indexes:

| Query                                          | Method                                     |
| ---------------------------------------------- | ------------------------------------------ |
| Which files have `#tag`?                       | `getFilesWithTag(tag)`                     |
| Which files link to `path`?                    | `getBacklinksForFile(destPath)`            |
| Which files have unresolved links to `name`?   | `getUnresolvedBacklinks(destName)`         |
| Which files embed `path`?                      | `getFilesEmbedding(destPath)`              |
| Which files have heading `text`?               | `getFilesWithHeading(heading)`             |
| Which files have frontmatter key `key`?        | `getFilesWithFrontmatterKey(key)`          |
| Which files have `key = value` in frontmatter? | `getFilesWithFrontmatterValue(key, value)` |
| Which files have alias `name`?                 | `getFilesWithAlias(alias)`                 |
| Which file defines block `^id`?                | `getFileWithBlockId(blockId)`              |

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
import type {
  ExtendedMetadataCacheAPI,
  ExtendedMetadataCacheHandle,
} from "obsidian-extended-metadatacache";

export default class MyPlugin extends Plugin {
  private cacheHandle: ExtendedMetadataCacheHandle | null = null;

  async onload() {
    this.cacheHandle = getAPI(this.app);
    const cache = this.cacheHandle.api;

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
  getFilesWithFrontmatterValue(
    key: string,
    value: unknown,
  ): ReadonlySet<string>;
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
  // Initial index build complete — safe to query
});

cache.on("file-updated", (path: string) => {
  // Inverse indexes for this file were updated
});

cache.on("rebuild-progress", ({ processed, total }) => {
  // Progress during initial build or reconciliation
});
```

### Options

```typescript
getAPI(app, {
  chunkSize: 500, // Files per async chunk during initial build (default: 500)
  persist: true, // Enable IndexedDB persistence (default: true)
  flushDebounceMs: 2000, // Debounce before writing to IndexedDB (default: 2000)
  flushIntervalMs: 30000, // Periodic flush interval (default: 30000)
});
```

## How it works

### Startup sequence

The library waits for Obsidian's MetadataCache to be fully populated before building indexes:

1. **Wait for `resolved`**: The constructor defers initialization until MetadataCache fires its `resolved` event, which signals that all file metadata has been parsed.
2. **Build cache-based indexes**: Tags, headings, frontmatter, aliases, and block IDs are indexed from `getFileCache()` for each file.
3. **Wait for link resolution**: A second `resolved` event fires after `resolvedLinks` and `unresolvedLinks` are fully populated.
4. **Build link indexes**: Backlinks, unresolved backlinks, and embeds are rebuilt from the authoritative `resolvedLinks`/`unresolvedLinks` objects.
5. **Fire `ready`**: The `ready` event fires only after all indexes are complete.

If the plugin is activated after Obsidian has already started (late activation), all data is immediately available and initialization runs in a single pass.

### IndexedDB persistence

On first run, inverse indexes are built from MetadataCache and persisted to a separate IndexedDB (one per vault, keyed by `appId`). On subsequent startups, the persisted state is loaded and only changed files (detected via `mtime` comparison) are reconciled — skipping unchanged files entirely.

The library stores **per-file contribution records** — not the inverse maps themselves. On startup:

1. Load all persisted intern + contribution records from IndexedDB
2. Rebuild in-memory inverse maps from contributions (fast, CPU only)
3. Compare vault files + mtimes against persisted state
4. Reindex only added/changed files; remove deleted files
5. Rebuild link indexes from live `resolvedLinks`/`unresolvedLinks`
6. Flush reconciliation results back to IndexedDB

Writes are batched: dirty entries are coalesced and flushed every 2 seconds (debounced) with a periodic 30-second flush as a safety net. A best-effort flush also runs on `destroy()`.

If IndexedDB is unavailable (Apple Lockdown Mode, quota errors, corruption), the library falls back to a full in-memory rebuild and disables persistence for the session.

### Incremental updates

After initialization, the library hooks MetadataCache events (`changed`, `deleted`, `resolve`) and the Vault `rename` event. On each change, the file's old index contributions are removed and rebuilt from the new cache.

### Memory efficiency

File paths are interned to numeric IDs. All index maps store `Set<number>` internally, resolving to paths only at query time.

### Singleton

A global registry (`Symbol.for`) keyed by API major version ensures plugins sharing the same major get the same instance. Different majors coexist independently.

## Normalization

- **Tags**: Lowercased. `"#Project"` and `"#project"` return the same results. Tags from both inline content and frontmatter are included.
- **Headings**: Lowercased for lookup.
- **Frontmatter keys**: Lowercased.
- **Frontmatter values**: Strings are lowercased. Numbers and booleans are stringified. Arrays are indexed per-element. Date objects (from unquoted YAML dates) are normalized via `toISOString()`. Nested objects are JSON-stringified.
- **Aliases**: Lowercased.
- **Backlinks**: Use the exact resolved file path (not lowercased — paths are case-sensitive). Sources include non-markdown files (e.g., `.canvas`) that appear in `resolvedLinks`.
- **Embeds**: Heading subpaths (`#Heading`) and block subpaths (`#^block-id`) are stripped before resolution — the embed index maps to the target file, not the subpath.
- **Block IDs**: Stored as-is (case-sensitive, matching Obsidian behavior).

## Development

```bash
npm install
npm run build        # Build the library
npm run test         # Run unit tests (vitest)
npm run test:e2e     # Run E2E tests against real Obsidian (requires display)
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
```

### E2E tests

The E2E test suite uses [`wdio-obsidian-service`](https://www.npmjs.com/package/wdio-obsidian-service) to launch a real Obsidian instance, load a test host plugin that wraps this library, and cross-verify every index type against Obsidian's native MetadataCache.

On NixOS, use `nix develop` to enter a dev shell with the required system libraries for the Electron chromedriver.

### Release flow

```bash
npm run version-bump -- 0.3.0   # Bumps package.json + src/registry.ts
# Update CHANGELOG.md
# Commit, push, create GitHub release → publish.yml publishes to NPM
```

## License

[Unlicense](LICENSE) — public domain.
