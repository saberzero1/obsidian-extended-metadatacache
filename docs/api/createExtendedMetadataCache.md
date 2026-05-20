---
description: "Create isolated instance"
category: lifecycle
returns: "ExtendedMetadataCacheAPI"
accepts: "App, options?"
---
# createExtendedMetadataCache

```typescript
function createExtendedMetadataCache(
  app: App,
  options?: ExtendedMetadataCacheOptions
): ExtendedMetadataCacheAPI
```

Creates an isolated (non-singleton) `ExtendedMetadataCache` instance. This instance is NOT shared with other plugins and has its own indexes.

## When to use

- **Testing** — create a fresh instance per test without singleton interference.
- **Isolated environments** — when you explicitly don't want cache sharing.

For normal plugin use, prefer [[getAPI]].

## Parameters

- `app` — The Obsidian `App` instance.
- `options` — Optional configuration. See [[Options]].

## Returns

`ExtendedMetadataCacheAPI` — a standalone instance. Call `destroy()` when done.

## Related

- [[getAPI]] — shared singleton (recommended for plugins)
