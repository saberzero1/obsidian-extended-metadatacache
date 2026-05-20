---
description: "Files with a specific alias"
category: aliases
returns: "ReadonlySet<string>"
accepts: "string"
---
# getFilesWithAlias

```typescript
getFilesWithAlias(alias: string): ReadonlySet<string>
```

Returns all files that have the given alias in their YAML frontmatter.

## Parameters

- `alias` — Alias text. Case-insensitive.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Example

```typescript
const files = cache.getFilesWithAlias("home");
// Finds files with aliases: [Home] or aliases: [home, start]
```

## Related

- [[getAllAliasesWithFiles]] — list all aliases
