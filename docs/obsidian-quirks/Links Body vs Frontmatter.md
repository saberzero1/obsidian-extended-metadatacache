# Links: Body vs Frontmatter

## Three link-related properties

### `CachedMetadata.links` — body links only

`LinkCache[]` — wikilinks and markdown links in the note body. Does NOT include frontmatter links.

### `CachedMetadata.frontmatterLinks` — frontmatter links only (since v1.4.0)

`FrontmatterLinkCache[]` — `[[wikilinks]]` inside YAML frontmatter property values[^fm-links-api]. Each entry has a `key` field identifying which frontmatter property contained the link.

The Dataview PR that added frontmatter link support explicitly documents: *"These links are not added to the `.links` property in `CachedMetadata`. Instead they are added as a new and separate property called `.frontmatterLinks`."*[^dataview-fm-links]

### `MetadataCache.resolvedLinks` — both combined

`Record<string, Record<string, number>>` — the fully resolved link graph. **Includes both body AND frontmatter links.** The count includes all occurrences regardless of source.

## Evidence

From the obsidian-tasks plugin test vault[^tasks-link-yaml][^tasks-link-body][^tasks-resolved]:

```json
// link_in_yaml.md — has ONLY a frontmatter link
// frontmatterLinks: [{ link: "yaml_tags_is_empty", key: "test-link" }]
// links: (not present)
// resolvedLinks: { "Test Data/yaml_tags_is_empty.md": 1 } ← INCLUDED

// link_in_file_body.md — has ONLY a body link
// links: [{ link: "yaml_tags_is_empty" }]
// frontmatterLinks: (not present)
// resolvedLinks: { "Test Data/yaml_tags_is_empty.md": 1 } ← INCLUDED
```

Both appear in `resolvedLinks`, but they're in different `CachedMetadata` properties.

## How backlink separation works

Since `resolvedLinks` doesn't distinguish sources, we determine provenance by:

1. For each source in `resolvedLinks`, resolve its `CachedMetadata.frontmatterLinks` to destination paths
2. Count how many frontmatter links point to each destination
3. Compare against the total count in `resolvedLinks`:
   - If `totalCount > fmCount` → the link also comes from the body
   - If `fmCount > 0` → the link comes from frontmatter
   - A link in both body and frontmatter appears in both [[getBacklinksFromBody]] and [[getBacklinksFromFrontmatter]]

## Edge case: dual frontmatter links

If `related: "[[target]]"` and `see-also: "[[target]]"` both exist in the same file, `resolvedLinks` reports `count: 2` and `fmCount: 2`. Since `totalCount === fmCount`, the link is correctly classified as frontmatter-only.

[^fm-links-api]: [FrontmatterLinkCache — Obsidian Developer Docs](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Reference/TypeScript%20API/FrontmatterLinkCache.md)
[^dataview-fm-links]: [Dataview PR #2030 — Add support for frontmatter links](https://github.com/blacksmithgu/obsidian-dataview/pull/2030)
[^tasks-link-yaml]: [obsidian-tasks test data — link_in_yaml.json](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/main/tests/Obsidian/__test_data__/link_in_yaml.json)
[^tasks-link-body]: [obsidian-tasks test data — link_in_file_body.json](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/main/tests/Obsidian/__test_data__/link_in_file_body.json)
[^tasks-resolved]: [obsidian-tasks test data — resolvedLinks.json](https://github.com/obsidian-tasks-group/obsidian-tasks/blob/main/tests/Obsidian/__test_data__/metadataCache/resolvedLinks.json)
