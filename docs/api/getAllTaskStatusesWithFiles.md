---
description: "All task statuses with their file sets"
category: tasks
returns: "ReadonlyMap"
accepts: "none"
---
# getAllTaskStatusesWithFiles

```typescript
getAllTaskStatusesWithFiles(): ReadonlyMap<string, ReadonlySet<string>>
```

Returns a map of all task status characters across the vault to their file sets.

## Returns

`ReadonlyMap<string, ReadonlySet<string>>` — status character → set of file paths.

## Example

```typescript
const allStatuses = cache.getAllTaskStatusesWithFiles();
for (const [status, files] of allStatuses) {
  console.log(`[${status}]: ${files.size} files`);
}
// [ ]: 42 files
// [x]: 15 files
// [/]: 3 files
```

## Related

- [[getFilesWithTaskStatus]] — query specific statuses
- [[Task Status Values]] — how Obsidian stores task status
