# Startup Sequence

![[Startup Sequence.canvas]]

## The problem

When Obsidian starts with a plugin already enabled, `plugin.onload()` fires before MetadataCache has finished indexing files. At this point:
- `getFileCache(file)` returns `null` for most files
- `resolvedLinks` is empty
- `unresolvedLinks` is empty

If we build indexes immediately, everything will be empty.

## The solution: two-phase initialization

The library waits for Obsidian's MetadataCache to signal readiness through the `resolved` event, which fires multiple times during startup:

### Phase 1: First `resolved` event

File metadata is parsed. `getFileCache()` returns data for all files. But `resolvedLinks` may not be fully populated yet.

On this event:
1. Build cache-based indexes: tags (with body/frontmatter separation), headings, frontmatter, aliases, block IDs, tasks
2. Persist to IndexedDB if enabled

### Phase 2: Second `resolved` event

Link resolution is complete. `resolvedLinks` and `unresolvedLinks` are fully populated.

On this event:
1. Rebuild all link indexes: backlinks (with body/frontmatter separation), unresolved backlinks, embeds
2. Fire the `ready` event

### Completion gating

`finalizeLinks()` only runs after BOTH conditions are met:
- `initializeAndWaitForLinks()` has completed (async, may yield to main thread)
- The second `resolved` event has fired

This prevents a race condition where `buildInitialIndex` (which yields via `requestIdleCallback`) is still running when `finalizeLinks` fires, which would cause the `resolve` event handler to overwrite separated backlink contributions.

## Late activation

If the plugin is enabled after Obsidian has already started, `resolvedLinks` is already populated. The library detects this and runs a single-pass initialization immediately.

## Why two `resolved` events?

See [[MetadataCache Timing]] for the full explanation of Obsidian's event lifecycle.
