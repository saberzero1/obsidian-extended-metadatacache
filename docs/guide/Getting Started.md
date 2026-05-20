# Getting Started

## Installation

```bash
npm install obsidian-extended-metadatacache
```

Requires Obsidian ≥ 1.5.7. The `obsidian` package must be available as a peer dependency (it already is in any Obsidian plugin project).

## Basic Usage

### Acquiring the cache

Use `getAPI` to get a shared cache instance. Multiple plugins using the same major version of this library share one cache — see [[Singleton Pattern]] for details.

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

### Waiting for ready

The library defers initialization until Obsidian's MetadataCache is fully populated. This means `isReady` may be `false` when your plugin first loads. Always check `isReady` or listen for the `ready` event before querying — see [[Startup Sequence]] for why.

### File parameters

Methods that accept a file reference take `TFile | string`. You can pass a TFile object directly or a vault-absolute path string:

```typescript
const activeFile = this.app.workspace.getActiveFile();
if (activeFile) {
  // Both work:
  cache.getBacklinksForFile(activeFile);
  cache.getBacklinksForFile("path/to/file.md");
}
```

### Return types

Most query methods return `ReadonlySet<string>` containing vault-absolute file paths (matching `TFile.path`). The exception is [[getFileWithBlockId]] which returns `TFile | null`.

Bulk listing methods (`getAllTagsWithFiles`, etc.) return `ReadonlyMap<string, ReadonlySet<string>>`.

## Next steps

- [[API Overview]] for a summary of all methods
- [[Options]] for configuration
- [[Events]] for reactive updates
