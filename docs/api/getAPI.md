---
description: "Acquire shared singleton instance"
category: lifecycle
returns: "ExtendedMetadataCacheHandle"
accepts: "App, options?"
---
# getAPI

```typescript
function getAPI(
  app: App,
  options?: ExtendedMetadataCacheOptions
): ExtendedMetadataCacheHandle
```

Acquires a shared `ExtendedMetadataCache` instance. If another plugin using the same API major version has already created one, that instance is reused. Returns a handle with a `release()` method.

## Parameters

- `app` — The Obsidian `App` instance (available as `this.app` in any plugin).
- `options` — Optional configuration. See [[Options]].

## Returns

`ExtendedMetadataCacheHandle` with:
- `api` — The `ExtendedMetadataCacheAPI` instance.
- `release()` — Call this on plugin unload to decrement the reference count.

## Example

```typescript
async onload() {
  const handle = getAPI(this.app);
  const cache = handle.api;
  // ... use cache ...
}

onunload() {
  handle.release();
}
```

## Related

- [[Singleton Pattern]] — how sharing works
- [[hasAPI]] — check without creating
- [[createExtendedMetadataCache]] — non-shared instance
- [[Options]] — configuration
