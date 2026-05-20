---
description: "Files with a frontmatter key"
category: frontmatter
returns: "ReadonlySet<string>"
accepts: "string"
---
# getFilesWithFrontmatterKey

```typescript
getFilesWithFrontmatterKey(key: string): ReadonlySet<string>
```

Returns all files that have the given key in their YAML frontmatter, regardless of the value.

## Parameters

- `key` — Frontmatter key name. Case-insensitive.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Example

```typescript
const filesWithStatus = cache.getFilesWithFrontmatterKey("status");
// All files that have a "status" property in their frontmatter
```

## Related

- [[getFilesWithFrontmatterValue]] — filter by value
- [[getAllFrontmatterKeysWithFiles]] — list all keys
