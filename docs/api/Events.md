---
description: "Cache lifecycle events: ready, file-updated, rebuild-progress"
category: lifecycle
---
# Events

The cache emits three events via Obsidian's `Events` system.

## `ready`

```typescript
cache.on("ready", () => { ... });
```

Fired when the initial index build completes and all data is available for querying. Always check `isReady` or wait for this event before making queries — see [[Startup Sequence]].

## `file-updated`

```typescript
cache.on("file-updated", (path: string) => { ... });
```

Fired when a file's inverse indexes have been updated (due to a `MetadataCache.changed`, `deleted`, or `resolve` event). The `path` is the vault-absolute path of the affected file.

## `rebuild-progress`

```typescript
cache.on("rebuild-progress", ({ processed, total }: BuildProgress) => { ... });
```

Fired during the initial index build and during reconciliation, reporting how many files have been processed out of the total.

## Unregistering

Use `off` or `offref` (same pattern as Obsidian's `Events`):

```typescript
const ref = cache.on("file-updated", handler);
// Later:
cache.offref(ref);
```
