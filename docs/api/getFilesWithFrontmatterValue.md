---
description: "Files with key = value"
category: frontmatter
returns: "ReadonlySet<string>"
accepts: "string, unknown"
---
# getFilesWithFrontmatterValue

```typescript
getFilesWithFrontmatterValue(key: string, value: unknown): ReadonlySet<string>
```

Returns all files where the given frontmatter key has the given value.

## Parameters

- `key` — Frontmatter key name. Case-insensitive.
- `value` — The value to match. Supports strings, numbers, booleans, Date objects, and individual array elements.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Value matching

Values are normalized for comparison:

| YAML type | Normalization | Query example |
|---|---|---|
| String | Lowercased | `getFilesWithFrontmatterValue("status", "draft")` |
| Number | `String(n)` | `getFilesWithFrontmatterValue("priority", 42)` |
| Boolean | `String(b)` | `getFilesWithFrontmatterValue("published", true)` |
| Date (unquoted) | `toISOString()` | `getFilesWithFrontmatterValue("created", new Date("2024-01-15"))` |
| Array element | Each element indexed separately | `getFilesWithFrontmatterValue("tags", "project")` matches `tags: [project, todo]` |
| Nested object | `JSON.stringify().toLowerCase()` | Not recommended for querying |

See [[Frontmatter Value Types]] for how Obsidian stores different YAML types.

## Example

```typescript
// Find all draft files
const drafts = cache.getFilesWithFrontmatterValue("status", "draft");

// Find files with a specific tag in frontmatter
const tagged = cache.getFilesWithFrontmatterValue("tags", "project");

// Find files created on a specific date
const created = cache.getFilesWithFrontmatterValue("created", new Date("2024-01-15"));
```

## Related

- [[getFilesWithFrontmatterKey]] — check key presence only
- [[getAllFrontmatterKeysWithFiles]] — list all keys
- [[Frontmatter Value Types]] — YAML type handling details
