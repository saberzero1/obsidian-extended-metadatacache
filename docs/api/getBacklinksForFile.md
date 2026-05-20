---
description: "Files linking to target (combined)"
category: backlinks
returns: "ReadonlySet<string>"
accepts: "TFile | string"
---
# getBacklinksForFile

```typescript
getBacklinksForFile(file: TFile | string): ReadonlySet<string>
```

Returns all files that link TO the given file, combining body links and frontmatter links.

## Parameters

- `file` — Target file as `TFile` or vault-absolute path string.

## Returns

`ReadonlySet<string>` — vault-absolute paths of files that link to the target.

## How it works

Built from `MetadataCache.resolvedLinks`, which includes both body `[[links]]` and frontmatter `[[links]]`. Sources include non-markdown files like `.canvas` — see [[Canvas File Links]].

## Example

```typescript
const activeFile = this.app.workspace.getActiveFile();
if (activeFile) {
  const backlinks = cache.getBacklinksForFile(activeFile);
  console.log(`${backlinks.size} files link to this note`);
}
```

## Related

- [[getBacklinksFromBody]] — body-only variant
- [[getBacklinksFromFrontmatter]] — frontmatter-only variant
- [[getUnresolvedBacklinks]] — for broken links
- [[Links Body vs Frontmatter]] — how the separation works
