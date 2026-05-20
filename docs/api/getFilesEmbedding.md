---
description: "Files that embed the target"
category: embeds
returns: "ReadonlySet<string>"
accepts: "TFile | string"
---
# getFilesEmbedding

```typescript
getFilesEmbedding(file: TFile | string): ReadonlySet<string>
```

Returns all files that embed the given file using `![[file]]` syntax.

## Parameters

- `file` — Target file as `TFile` or vault-absolute path string.

## Returns

`ReadonlySet<string>` — vault-absolute paths of files that embed the target.

## Notes

- Heading embeds (`![[note#Heading]]`) and block embeds (`![[note#^block-id]]`) are resolved to the target file — the subpath is stripped. See [[Embed Subpaths]].
- The embed index maps to the target file, not the specific heading or block.

## Related

- [[Embed Subpaths]] — how heading/block embeds are handled
