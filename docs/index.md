---
title: Extended MetadataCache
description: Inverse lookup complement to Obsidian's `MetadataCache`. Where `MetadataCache` answers "what metadata does this file have?", this library answers "which files have this metadata?".
---

Inverse lookup complement to Obsidian's `MetadataCache`. Where `MetadataCache` answers "what metadata does this file have?", this library answers "which files have this metadata?".

## Quick links

- [[Getting Started]] — installation, basic usage, singleton pattern
- [[API Overview]] — summary of all query methods
- [[Architecture Overview]] — how the library works under the hood

## API Reference

### Tags
- [[getFilesWithTag]] — files with a tag (body + frontmatter combined)
- [[getFilesWithTagInBody]] — files with a tag in the note body only
- [[getFilesWithTagInFrontmatter]] — files with a tag in frontmatter only
- [[getAllTagsWithFiles]] — all tags with their file sets

### Backlinks
- [[getBacklinksForFile]] — files linking to a target (combined)
- [[getBacklinksFromBody]] — body-only backlinks
- [[getBacklinksFromFrontmatter]] — frontmatter-only backlinks
- [[getAllBacklinksWithFiles]] — all backlink targets with their source sets
- [[getUnresolvedBacklinks]] — files with unresolved links to a name

### Embeds
- [[getFilesEmbedding]] — files that embed a target
- [[getAllEmbedsWithFiles]] — all embed targets with their embedding file sets

### Headings
- [[getFilesWithHeading]] — files containing a heading
- [[getAllHeadingsWithFiles]] — all headings with their file sets

### Frontmatter
- [[getFilesWithFrontmatterKey]] — files with a frontmatter key
- [[getFilesWithFrontmatterValue]] — files with a specific key-value pair
- [[getAllFrontmatterKeysWithFiles]] — all frontmatter keys with their file sets

### Aliases
- [[getFilesWithAlias]] — files with a specific alias
- [[getAllAliasesWithFiles]] — all aliases with their file sets

### Blocks
- [[getFileWithBlockId]] — file defining a block ID

### Tasks
- [[getFilesWithTasks]] — files containing any tasks
- [[getFilesWithTaskStatus]] — files with tasks of specific status(es)
- [[getAllTaskStatusesWithFiles]] — all task statuses with their file sets
- [[getFilesWithOpenTasks]] — files with incomplete tasks
- [[getFilesWithCompletedTasks]] — files with completed tasks

### Lifecycle
- [[getAPI]] — acquire a shared singleton instance
- [[hasAPI]] — check if a singleton exists
- [[createExtendedMetadataCache]] — create an isolated instance
- [[Events]] — ready, file-updated, rebuild-progress
- [[Options]] — configuration options

## Design Decisions
- [[Singleton Pattern]] — why and how multiple plugins share one cache
- [[IndexedDB Persistence]] — how indexes survive restarts
- [[Startup Sequence]] — the two-phase resolved event dance
- [[Normalization Rules]] — how tags, headings, values are normalized

## Obsidian API Quirks
- [[MetadataCache Timing]] — when getFileCache and resolvedLinks are populated
- [[Tags Body vs Frontmatter]] — CachedMetadata.tags vs frontmatter.tags
- [[Links Body vs Frontmatter]] — CachedMetadata.links vs frontmatterLinks vs resolvedLinks
- [[Task Status Values]] — how ListItemCache.task stores checkbox characters
- [[Embed Subpaths]] — heading and block embeds need getLinkpath stripping
- [[Canvas File Links]] — non-markdown files in resolvedLinks
- [[Frontmatter Value Types]] — Date objects, arrays, nested objects in YAML
