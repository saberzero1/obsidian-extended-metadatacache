---
description: "File defining a block ID"
category: blocks
returns: "TFile | null"
accepts: "string"
---
# getFileWithBlockId

```typescript
getFileWithBlockId(blockId: string): TFile | null
```

Returns the file that defines the given block ID, or null if not found.

## Parameters

- `blockId` — Block ID without the `^` prefix. Case-sensitive (matching Obsidian behavior).

## Returns

`TFile | null` — the file object, or null.

## Notes

- Block IDs are unique within a vault.
- This is the only query method that returns `TFile` instead of `ReadonlySet<string>`, since each block ID maps to exactly one file.
- Block IDs are stored as-is (no normalization). `"myBlock"` and `"myblock"` are different IDs.

## Example

```typescript
const file = cache.getFileWithBlockId("important-note");
if (file) {
  console.log(`Block ^important-note is in ${file.path}`);
}
```
