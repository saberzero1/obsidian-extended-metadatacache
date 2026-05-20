# Canvas File Links

## MetadataCache does NOT index canvas files

Obsidian's MetadataCache has a hard-coded `"md" === file.extension` check in its internal `computeFileMetadataAsync` method. This means:

- `getFileCache("file.canvas")` returns `null`
- `getMarkdownFiles()` does not include `.canvas` files
- Tags, links, headings, and other markdown content inside canvas text cards are **invisible** to MetadataCache

This was confirmed by WhiteNoise (Obsidian Team): *"We currently do not process #tags (and other things) contained in canvas cards."*

## What DOES work: file node references in resolvedLinks

Canvas files contain different node types (defined in `obsidian/canvas`):

| Node type | Content | In resolvedLinks? |
|---|---|---|
| `text` | Markdown string with `#tags`, `[[links]]`, headings | ❌ Not indexed |
| `file` | Reference to a vault file (`file: "note.md"`) | ✅ Creates entries |
| `link` | External URL | ❌ |
| `group` | Visual container | ❌ |

When a canvas has a **file card** pointing to `note.md`, Obsidian creates an entry in `resolvedLinks["canvas.canvas"]["note.md"]`. Edge connections between cards do NOT appear in `resolvedLinks`.

## How we handle it

In `rebuildAllLinkIndexes`, we iterate `Object.keys(resolvedLinks)` directly (which includes all file types) and use `files.intern(sourcePath)` to intern any source path on demand — including `.canvas` files, PDFs, or any other file type.

This ensures the backlink index is a complete complement to `resolvedLinks`.

## Example

If `my-board.canvas` has a file card pointing to `notes/project.md`, then:

```typescript
cache.getBacklinksForFile("notes/project.md");
// Includes "my-board.canvas" in the result
```

## What we DON'T index from canvas

Since MetadataCache doesn't expose canvas content, this library cannot index:

- Tags inside canvas text cards
- Wikilinks inside canvas text cards
- Headings inside canvas text cards
- Frontmatter inside canvas text cards (Obsidian removes it from text cards anyway)
- Edge connections between canvas cards

This is **complete parity with what Obsidian exposes**. Plugins that need canvas content metadata (like Advanced Canvas) must parse the `.canvas` JSON manually or monkey-patch MetadataCache — both approaches are outside the scope of this library.

## The canvas file format

Canvas files use the JSON Canvas format (open spec at [jsoncanvas.org](https://jsoncanvas.org)). Type definitions are available from `obsidian/canvas`:

```typescript
import type { CanvasData, CanvasTextData, CanvasFileData } from "obsidian/canvas";
```
