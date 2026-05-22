---
description: "All embed targets with their embedding file sets"
category: embeds
returns: "ReadonlyMap"
accepts: "none"
---
# getAllEmbedsWithFiles

```typescript
getAllEmbedsWithFiles(): ReadonlyMap<string, ReadonlySet<string>>
```

Returns a map of all embed targets (destination file paths) to the sets of files that embed them.

## Returns

`ReadonlyMap<string, ReadonlySet<string>>` — dest path → set of embedding file paths.

## Example

```typescript
const allEmbeds = cache.getAllEmbedsWithFiles();
for (const [target, embedders] of allEmbeds) {
  console.log(`${target} is embedded by ${embedders.size} files`);
}
```

## Related

- [[getFilesEmbedding]] — query a specific target
- [[Embed Subpaths]] — how heading/block embeds are handled
