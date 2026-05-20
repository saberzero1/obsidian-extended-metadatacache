---
description: "Files with unresolved links to a name"
category: backlinks
returns: "ReadonlySet<string>"
accepts: "string"
---
# getUnresolvedBacklinks

```typescript
getUnresolvedBacklinks(destName: string): ReadonlySet<string>
```

Returns files that contain unresolved links (links to files that don't exist) matching the given name.

## Parameters

- `destName` — The unresolved link target name (e.g., `"non-existent-page"`). Lowercased automatically.

## Returns

`ReadonlySet<string>` — vault-absolute paths of files containing the broken link.

## Notes

- `destName` is the raw link text from `unresolvedLinks`, not a vault path.
- Obsidian's `unresolvedLinks` may include external link display text (e.g., `"Markdown"` from `[Markdown](https://...)`). This is an Obsidian behavior, not a library issue.
- Sources include non-markdown files (e.g., `.canvas`).

## Example

```typescript
const sources = cache.getUnresolvedBacklinks("non-existent-page");
// Returns files that have [[non-existent-page]] as a broken link
```

## Related

- [[getBacklinksForFile]] — for resolved links
