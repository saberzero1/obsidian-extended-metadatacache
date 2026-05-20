# API Overview

All methods are on the `ExtendedMetadataCacheAPI` interface, accessed via `getAPI(app).api`.

> [!tip] Interactive reference
> See the [[api/index|API Reference table]] for a filterable, sortable view of all methods.

## Tags

| Method | Returns | Description |
|---|---|---|
| [[getFilesWithTag]]\(`tag`) | `ReadonlySet<string>` | Files with tag (body + frontmatter) |
| [[getFilesWithTagInBody]]\(`tag`) | `ReadonlySet<string>` | Files with tag in note body only |
| [[getFilesWithTagInFrontmatter]]\(`tag`) | `ReadonlySet<string>` | Files with tag in YAML frontmatter only |
| [[getAllTagsWithFiles]]\() | `ReadonlyMap` | All tags → file sets |

See [[Tags Body vs Frontmatter]] for why the distinction matters.

## Backlinks

| Method | Returns | Description |
|---|---|---|
| [[getBacklinksForFile]]\(`file`) | `ReadonlySet<string>` | Files linking to target (combined) |
| [[getBacklinksFromBody]]\(`file`) | `ReadonlySet<string>` | Body `[[links]]` only |
| [[getBacklinksFromFrontmatter]]\(`file`) | `ReadonlySet<string>` | Frontmatter `[[links]]` only |
| [[getUnresolvedBacklinks]]\(`name`) | `ReadonlySet<string>` | Files with unresolved links |

See [[Links Body vs Frontmatter]] for how separation is determined.

## Embeds

| Method | Returns | Description |
|---|---|---|
| [[getFilesEmbedding]]\(`file`) | `ReadonlySet<string>` | Files that embed the target |

See [[Embed Subpaths]] for how heading and block embeds are handled.

## Headings

| Method | Returns | Description |
|---|---|---|
| [[getFilesWithHeading]]\(`heading`) | `ReadonlySet<string>` | Files containing a heading |
| [[getAllHeadingsWithFiles]]\() | `ReadonlyMap` | All headings → file sets |

## Frontmatter

| Method | Returns | Description |
|---|---|---|
| [[getFilesWithFrontmatterKey]]\(`key`) | `ReadonlySet<string>` | Files with a key present |
| [[getFilesWithFrontmatterValue]]\(`key`, `value`) | `ReadonlySet<string>` | Files with key = value |
| [[getAllFrontmatterKeysWithFiles]]\() | `ReadonlyMap` | All keys → file sets |

See [[Frontmatter Value Types]] for how different YAML types are handled.

## Aliases

| Method | Returns | Description |
|---|---|---|
| [[getFilesWithAlias]]\(`alias`) | `ReadonlySet<string>` | Files with a specific alias |
| [[getAllAliasesWithFiles]]\() | `ReadonlyMap` | All aliases → file sets |

## Blocks

| Method | Returns | Description |
|---|---|---|
| [[getFileWithBlockId]]\(`blockId`) | `TFile \| null` | File defining a block ID |

## Tasks

| Method | Returns | Description |
|---|---|---|
| [[getFilesWithTasks]]\() | `ReadonlySet<string>` | Files with any tasks |
| [[getFilesWithTaskStatus]]\(`status`) | `ReadonlySet<string>` | Files with specific status(es) |
| [[getAllTaskStatusesWithFiles]]\() | `ReadonlyMap` | All statuses → file sets |
| [[getFilesWithOpenTasks]]\() | `ReadonlySet<string>` | Files with `[ ]` tasks |
| [[getFilesWithCompletedTasks]]\() | `ReadonlySet<string>` | Files with non-space tasks |

See [[Task Status Values]] for how Obsidian stores checkbox characters.

## Lifecycle

| Function | Returns | Description |
|---|---|---|
| [[getAPI]]\(`app`, `options?`) | `ExtendedMetadataCacheHandle` | Acquire shared instance |
| [[hasAPI]]\() | `boolean` | Check if singleton exists |
| [[createExtendedMetadataCache]]\(`app`, `options?`) | `ExtendedMetadataCacheAPI` | Create isolated instance |
