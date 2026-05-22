# Embed Subpaths

## The problem

Embed syntax in Obsidian can include subpaths:

- `![[note]]` — embed entire file
- `![[note#Heading]]` — embed a specific heading section
- `![[note#^block-id]]` — embed a specific block

In `CachedMetadata.embeds`, the `link` field contains the full text: `"note#Heading"` or `"note#^block-id"`.

When resolving via `getFirstLinkpathDest(link, sourcePath)`[^linkpath-docs], passing the full subpath fails to resolve because `getFirstLinkpathDest` expects just the file path portion.

## The fix

Use `getLinkpath(embed.link)` to strip the subpath before resolving:

```typescript
import { getLinkpath } from "obsidian";

const linkpath = getLinkpath(embed.link);
// "note#Heading" → "note"
// "note#^block-id" → "note"
// "note" → "note"

const dest = app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath);
```

## What this means for the embed index

The [[getFilesEmbedding]] method maps to the **target file**, not the specific heading or block. If `note-a.md` embeds `![[note-b#Heading]]`, then `getFilesEmbedding("note-b.md")` returns `note-a.md`.

There is currently no "which files embed heading X of file Y" query — only "which files embed file Y".

[^linkpath-docs]: [MetadataCache.getFirstLinkpathDest — Obsidian Developer Docs](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Reference/TypeScript%20API/MetadataCache/getFirstLinkpathDest.md) — the `linkpath` parameter is the path portion of a linktext, without subpath or display text.
