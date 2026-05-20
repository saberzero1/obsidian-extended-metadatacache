---
description: "All frontmatter keys with their file sets"
category: frontmatter
returns: "ReadonlyMap"
accepts: "none"
---
# getAllFrontmatterKeysWithFiles

```typescript
getAllFrontmatterKeysWithFiles(): ReadonlyMap<string, ReadonlySet<string>>
```

Returns a map of all frontmatter keys across the vault to their file sets.

## Returns

`ReadonlyMap<string, ReadonlySet<string>>` — lowercased key name → set of file paths.

## Related

- [[getFilesWithFrontmatterKey]] — query a specific key
- [[getFilesWithFrontmatterValue]] — query by key + value
