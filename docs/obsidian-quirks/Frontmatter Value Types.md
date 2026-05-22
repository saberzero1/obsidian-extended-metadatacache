# Frontmatter Value Types

## How Obsidian stores YAML values

`FrontMatterCache` is typed as `{ [key: string]: any }`[^frontmatter-api]. The actual runtime types depend on YAML parsing:

| YAML syntax | JavaScript type | Example |
|---|---|---|
| `key: hello` | `string` | `"hello"` |
| `key: 42` | `number` | `42` |
| `key: 3.14` | `number` | `3.14` |
| `key: true` | `boolean` | `true` (also `yes`, `on`) |
| `key: false` | `boolean` | `false` (also `no`, `off`) |
| `key: null` | `null` | (also `~` or empty) |
| `key: [a, b]` | `Array` | `["a", "b"]` |
| `key:\n  - a\n  - b` | `Array` | `["a", "b"]` |
| `key:\n  nested: val` | `Object` | `{ nested: "val" }` |
| `key: 2024-01-15` | `Date` | Native `Date` object |
| `key: "2024-01-15"` | `string` | `"2024-01-15"` (quoted = string) |
| `key: "[[Link]]"` | `string` | `"[[Link]]"` (raw string in frontmatter) |

## Date handling

Unquoted ISO 8601 dates like `2024-01-15` are parsed by YAML as **timestamp** types, producing native JavaScript `Date` objects — NOT strings, NOT Moment objects. This is confirmed by Dataview's `parseFrontmatter` function[^dataview-parse-fm], which explicitly checks `value instanceof Date`.

Quoted dates like `"2024-01-15"` remain strings.

Our library normalizes `Date` objects via `toISOString().toLowerCase()`. To query for a date, pass a `Date` object:

```typescript
cache.getFilesWithFrontmatterValue("created", new Date("2024-01-15"));
```

## Array handling

Arrays are indexed per-element. For `tags: [project, todo]`, both `"project"` and `"todo"` are indexed separately under the key `"tags"`.

```typescript
cache.getFilesWithFrontmatterValue("tags", "project");
// Matches files with tags: [project, ...] or tags: project
```

## Frontmatter links

`[[wikilinks]]` inside frontmatter values are stored as raw strings in `FrontMatterCache`. Separately, they're extracted into `CachedMetadata.frontmatterLinks` (since v1.4.0) as `FrontmatterLinkCache` entries with a `key` field.

See [[Links Body vs Frontmatter]] for how these links are handled in the backlink index.

## The `position` key

Obsidian adds a `position` key to `FrontMatterCache` with the document position of the frontmatter block. This library excludes it from indexing.

[^frontmatter-api]: [FrontMatterCache — Obsidian API (`obsidian.d.ts:3210`)](https://github.com/obsidianmd/obsidian-api/blob/8e116bf516c1/obsidian.d.ts#L3210) — the interface extends `CacheItem` and uses `[key: string]: any` for arbitrary YAML keys.
[^dataview-parse-fm]: [Dataview `markdown-file.ts:338` — parseFrontmatter](https://github.com/blacksmithgu/obsidian-dataview/blob/5ad0994ff384/src/data-import/markdown-file.ts#L338) — checks `value instanceof Date` to convert YAML timestamps to Luxon DateTime.
