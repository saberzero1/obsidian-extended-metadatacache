---
description: "Files with tag (body + frontmatter combined)"
category: tags
returns: "ReadonlySet<string>"
accepts: "string"
---
# getFilesWithTag

```typescript
getFilesWithTag(tag: string): ReadonlySet<string>
```

Returns all files that contain the given tag, combining both inline body tags and frontmatter tags.

## Parameters

- `tag` — Tag string. The `#` prefix is optional: both `"#project"` and `"project"` work.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Normalization

Tags are lowercased. `getFilesWithTag("#Project")` and `getFilesWithTag("#project")` return the same results.

## Example

```typescript
const files = cache.getFilesWithTag("#project");
for (const path of files) {
  console.log(path); // "notes/my-project.md"
}
```

## Related

- [[getFilesWithTagInBody]] — body-only variant
- [[getFilesWithTagInFrontmatter]] — frontmatter-only variant
- [[getAllTagsWithFiles]] — list all tags
- [[Tags Body vs Frontmatter]] — how Obsidian stores tags in two places
