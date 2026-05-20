---
description: "Files containing a heading"
category: headings
returns: "ReadonlySet<string>"
accepts: "string"
---
# getFilesWithHeading

```typescript
getFilesWithHeading(heading: string): ReadonlySet<string>
```

Returns all files containing a heading matching the given text.

## Parameters

- `heading` — Heading text (without `#` markdown prefix). Case-insensitive.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Example

```typescript
const files = cache.getFilesWithHeading("Introduction");
// Matches "# Introduction", "## Introduction", "### introduction", etc.
```

## Related

- [[getAllHeadingsWithFiles]] — list all headings
