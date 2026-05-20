# Links: Body vs Frontmatter

## Three link-related properties

### `CachedMetadata.links` — body links only

`LinkCache[]` — wikilinks and markdown links in the note body. Does NOT include frontmatter links.

### `CachedMetadata.frontmatterLinks` — frontmatter links only (since v1.4.0)

`FrontmatterLinkCache[]` — `[[wikilinks]]` inside YAML frontmatter property values. Each entry has a `key` field identifying which frontmatter property contained the link.

### `MetadataCache.resolvedLinks` — both combined

`Record<string, Record<string, number>>` — the fully resolved link graph. **Includes both body AND frontmatter links.** The count includes all occurrences regardless of source.

## Evidence

From the obsidian-tasks plugin test vault:

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
