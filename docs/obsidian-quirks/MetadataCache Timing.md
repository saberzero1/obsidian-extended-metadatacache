# MetadataCache Timing

## The event sequence on Obsidian startup

```
Plugin.onload()
  │
  ├─ Event listeners can be registered (synchronous)
  │
  ├─ onLayoutReady() fires (workspace rendered)
  │
  ├─ MetadataCache parses files asynchronously
  │   → 'changed' event fires per file
  │
  ├─ 'resolved' fires (#1) — file metadata parsed
  │   getFileCache() now works for all files
  │   resolvedLinks may still be empty!
  │
  ├─ 'resolve' fires per file — resolvedLinks populated incrementally
  │
  └─ 'resolved' fires (#2) — link graph complete
      resolvedLinks and unresolvedLinks fully populated
```

## Key facts

### `getFileCache(file)` is NOT safe in `onload()`

During startup, `getFileCache()` returns `null` for files that haven't been parsed yet. Most files haven't been parsed when `onload()` runs. You must wait for the `resolved` event.

### `resolvedLinks` is populated AFTER the first `resolved`

The first `resolved` event signals that file metadata is parsed, but link resolution happens in a second pass. The per-file `resolve` events fire during this pass, and a second `resolved` fires when all links are resolved.

### `resolved` fires multiple times

The Obsidian docs say: *"Called when all files has been resolved. This will be fired each time files get modified after the initial load."* It fires on initial load AND after each subsequent file change.

### The `changed` event is NOT fired on rename

From the Obsidian docs: *"Note: This is not called when a file is renamed for performance reasons. You must hook the vault rename event for those."*

## Recommended pattern

```typescript
// Subscribe to events immediately
this.registerEvent(app.metadataCache.on("changed", handler));
this.registerEvent(app.metadataCache.on("resolve", handler));

// But defer heavy initialization until resolved
app.metadataCache.on("resolved", () => {
  // Now getFileCache() and resolvedLinks are available
  this.buildIndex();
});
```

## How this library handles it

See [[Startup Sequence]] for the full two-phase initialization approach.

## Evidence

This behavior was confirmed by:
- Obsidian official documentation
- obsidian-tasks plugin source (uses `loadedAfterFirstResolve` flag)
- obsidian-dataview plugin source (defers to `onLayoutReady`, skips null caches)
- Direct E2E testing against Obsidian v1.12.7
