# Normalization Rules

All index keys are normalized before storage and lookup to ensure consistent matching.

## Tags

- **Lowercased**: `"#Project"` → `"#project"`
- **`#` prefix**: ensured. Querying `"project"` or `"#project"` both work.
- **Sources**: `getAllTags(cache)` for combined, `cache.tags` for body, `parseFrontMatterTags()` for frontmatter.

## Headings

- **Lowercased**: `"My Heading"` → `"my heading"`
- Heading level is not part of the key. `# Foo` and `## Foo` produce the same key.

## Frontmatter keys

- **Lowercased**: `"Status"` → `"status"`
- The `position` key from Obsidian's internal `FrontMatterCache` is excluded.

## Frontmatter values

| YAML type | Normalization |
|---|---|
| String | Lowercased |
| Number | `String(n)` — e.g., `42` → `"42"` |
| Boolean | `String(b)` — `true` → `"true"` |
| Date (unquoted ISO) | `toISOString().toLowerCase()` |
| Array | Each element indexed separately |
| Nested object | `JSON.stringify().toLowerCase()` |
| null/undefined | Empty string `""` |

Composite key format: `key\0normalizedValue` (null byte separator).

See [[Frontmatter Value Types]] for how Obsidian stores different YAML types.

## Aliases

- **Lowercased**: `"Home Page"` → `"home page"`

## Backlinks

- **Not lowercased**: file paths are case-sensitive (matching `TFile.path`).
- Sources include non-markdown files (e.g., `.canvas`) from `resolvedLinks`.

## Unresolved backlinks

- **Lowercased**: the raw link name is lowercased.

## Embeds

- **Subpaths stripped**: `"note#Heading"` → resolved to `"note.md"` via `getLinkpath()` + `getFirstLinkpathDest()`.
- See [[Embed Subpaths]].

## Block IDs

- **No normalization**: stored as-is. `"myBlock"` and `"myblock"` are distinct.

## Task statuses

- **No normalization**: the raw character from `ListItemCache.task` is stored as-is. `"x"` and `"X"` are distinct.
