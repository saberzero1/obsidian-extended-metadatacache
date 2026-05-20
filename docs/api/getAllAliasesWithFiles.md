---
description: "All aliases with their file sets"
category: aliases
returns: "ReadonlyMap"
accepts: "none"
---
# getAllAliasesWithFiles

```typescript
getAllAliasesWithFiles(): ReadonlyMap<string, ReadonlySet<string>>
```

Returns a map of all aliases across the vault to their file sets.

## Returns

`ReadonlyMap<string, ReadonlySet<string>>` — lowercased alias → set of file paths.

## Related

- [[getFilesWithAlias]] — query a specific alias
