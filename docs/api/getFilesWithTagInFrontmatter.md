---
description: "Files with tag in frontmatter only"
category: tags
returns: "ReadonlySet<string>"
accepts: "string"
---
# getFilesWithTagInFrontmatter

```typescript
getFilesWithTagInFrontmatter(tag: string): ReadonlySet<string>
```

Returns files that contain the given tag in their YAML frontmatter `tags` property. Does not include inline `#tag` occurrences in the note body.

## Parameters

- `tag` — Tag string. The `#` prefix is optional.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## How it works

This reads from a separate index built using `parseFrontMatterTags(cache.frontmatter)`, which extracts tags from the `tags` and `tag` YAML keys and normalizes them with a `#` prefix. See [[Tags Body vs Frontmatter]] for details.

## Related

- [[getFilesWithTag]] — combined variant
- [[getFilesWithTagInBody]] — body-only variant
