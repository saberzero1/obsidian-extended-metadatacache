---
description: "Body-only backlinks"
category: backlinks
returns: "ReadonlySet<string>"
accepts: "TFile | string"
---
# getBacklinksFromBody

```typescript
getBacklinksFromBody(file: TFile | string): ReadonlySet<string>
```

Returns files that link to the target from their note body (not from frontmatter properties).

## Parameters

- `file` — Target file as `TFile` or vault-absolute path string.

## Returns

`ReadonlySet<string>` — vault-absolute paths of source files.

## How it works

Since `resolvedLinks` doesn't distinguish link sources, this method compares the total link count in `resolvedLinks` against the count of frontmatter links (from `CachedMetadata.frontmatterLinks`). If the total count exceeds the frontmatter link count, at least one link comes from the body.

A link that appears in both body and frontmatter will appear in both [[getBacklinksFromBody]] and [[getBacklinksFromFrontmatter]].

See [[Links Body vs Frontmatter]] for the full explanation.

## Related

- [[getBacklinksForFile]] — combined variant
- [[getBacklinksFromFrontmatter]] — frontmatter-only variant
