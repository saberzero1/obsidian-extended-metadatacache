---
description: "Frontmatter-only backlinks"
category: backlinks
returns: "ReadonlySet<string>"
accepts: "TFile | string"
---
# getBacklinksFromFrontmatter

```typescript
getBacklinksFromFrontmatter(file: TFile | string): ReadonlySet<string>
```

Returns files that link to the target from their YAML frontmatter properties (e.g., `related: "[[target]]"`).

## Parameters

- `file` — Target file as `TFile` or vault-absolute path string.

## Returns

`ReadonlySet<string>` — vault-absolute paths of source files.

## How it works

This resolves each source file's `CachedMetadata.frontmatterLinks` to determine which resolved links originate from frontmatter. Each `FrontmatterLinkCache` entry includes a `key` field identifying the frontmatter property that contained the link.

See [[Links Body vs Frontmatter]] for the full explanation.

## Related

- [[getBacklinksForFile]] — combined variant
- [[getBacklinksFromBody]] — body-only variant
