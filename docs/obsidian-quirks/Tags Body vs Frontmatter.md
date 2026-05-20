# Tags: Body vs Frontmatter

## The two tag sources

Obsidian stores tags in two separate locations within `CachedMetadata`:

### `CachedMetadata.tags` — body tags only

`TagCache[]` — inline `#tag` occurrences in the note body. Each entry has:
- `tag: string` — WITH `#` prefix (e.g., `"#project"`)
- `position: Pos` — line/col/offset in the document

### `CachedMetadata.frontmatter.tags` — frontmatter tags only

The raw YAML value of the `tags` (or `tag`) key. WITHOUT `#` prefix (e.g., `"project"`). Can be a string or string array.

## `getAllTags(cache)` — the merger

Obsidian provides `getAllTags(cache)` which combines both sources into a single `string[]`. All tags get the `#` prefix. It does NOT deduplicate — if the same tag appears in both frontmatter and body, it's returned twice.

## `parseFrontMatterTags(frontmatter)` — frontmatter extraction

Returns frontmatter tags as `string[]` WITH `#` prefix added. Returns `null` if no tags.

## Evidence

From the obsidian-tasks plugin test data:

```json
// File with frontmatter tags AND body tags:
{
  "cachedMetadata": {
    "frontmatter": { "tags": ["value-1", "value-2"] },
    "tags": [{ "tag": "#task", "position": {...} }]
  },
  "getAllTags": ["#value-1", "#value-2", "#task"],
  "parseFrontMatterTags": ["#value-1", "#value-2"]
}
```

Key observations:
- `cache.tags` only has `#task` (body tag) — frontmatter tags are NOT here
- `getAllTags` merges both with `#` prefix
- `parseFrontMatterTags` returns only frontmatter tags with `#` added

## How this library handles it

- [[getFilesWithTag]] uses `getAllTags(cache)` — combined
- [[getFilesWithTagInBody]] reads `cache.tags` directly
- [[getFilesWithTagInFrontmatter]] uses `parseFrontMatterTags(cache.frontmatter)`

All three indexes are maintained separately and updated on every `changed` event.
