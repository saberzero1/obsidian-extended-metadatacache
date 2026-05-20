---
description: "All tags with their file sets"
category: tags
returns: "ReadonlyMap"
accepts: "none"
---
# getAllTagsWithFiles

```typescript
getAllTagsWithFiles(): ReadonlyMap<string, ReadonlySet<string>>
```

Returns a map of all tags across the vault to their file sets. Uses the combined index (body + frontmatter).

## Returns

`ReadonlyMap<string, ReadonlySet<string>>` — tag → set of file paths.

## Example

```typescript
const allTags = cache.getAllTagsWithFiles();
for (const [tag, files] of allTags) {
  console.log(`${tag}: ${files.size} files`);
}
```

## Related

- [[getFilesWithTag]] — query a specific tag
