---
description: "All backlink targets with their source file sets"
category: backlinks
returns: "ReadonlyMap"
accepts: "none"
---
# getAllBacklinksWithFiles

```typescript
getAllBacklinksWithFiles(): ReadonlyMap<string, ReadonlySet<string>>
```

Returns a map of all backlink targets (destination file paths) to the sets of files that link to them. Uses the combined index (body + frontmatter).

## Returns

`ReadonlyMap<string, ReadonlySet<string>>` — dest path → set of source paths.

## Example

```typescript
const allBacklinks = cache.getAllBacklinksWithFiles();
for (const [target, sources] of allBacklinks) {
  console.log(`${target} is linked from ${sources.size} files`);
}
```

## Related

- [[getBacklinksForFile]] — query a specific target
- [[getBacklinksFromBody]] — body-only variant
- [[getBacklinksFromFrontmatter]] — frontmatter-only variant
