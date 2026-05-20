---
description: "All headings with their file sets"
category: headings
returns: "ReadonlyMap"
accepts: "none"
---
# getAllHeadingsWithFiles

```typescript
getAllHeadingsWithFiles(): ReadonlyMap<string, ReadonlySet<string>>
```

Returns a map of all headings across the vault to their file sets.

## Returns

`ReadonlyMap<string, ReadonlySet<string>>` — lowercased heading text → set of file paths.

## Related

- [[getFilesWithHeading]] — query a specific heading
