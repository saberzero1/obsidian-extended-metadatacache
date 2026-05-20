---
description: "Files with tag in note body only"
category: tags
returns: "ReadonlySet<string>"
accepts: "string"
---
# getFilesWithTagInBody

```typescript
getFilesWithTagInBody(tag: string): ReadonlySet<string>
```

Returns files that contain the given tag as an inline `#tag` in the note body. Does not include tags from YAML frontmatter.

## Parameters

- `tag` — Tag string. The `#` prefix is optional.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## How it works

This reads from a separate index built from `CachedMetadata.tags` (the `TagCache[]` array), which only contains inline body tags. See [[Tags Body vs Frontmatter]] for details.

## Example

```typescript
// File has #project in the body but not in frontmatter
cache.getFilesWithTagInBody("#project"); // includes the file

// File has tags: [project] in frontmatter but no #project in body
cache.getFilesWithTagInBody("#project"); // does NOT include the file
```

## Related

- [[getFilesWithTag]] — combined variant
- [[getFilesWithTagInFrontmatter]] — frontmatter-only variant
