---
description: "Files containing any tasks"
category: tasks
returns: "ReadonlySet<string>"
accepts: "none"
---
# getFilesWithTasks

```typescript
getFilesWithTasks(): ReadonlySet<string>
```

Returns all files that contain at least one task (any checkbox list item `- [.]`).

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Notes

Non-task list items (regular `- bullet` without `[ ]`) are not included.

## Related

- [[getFilesWithOpenTasks]] — incomplete tasks only
- [[getFilesWithCompletedTasks]] — completed tasks only
- [[getFilesWithTaskStatus]] — specific status characters
- [[Task Status Values]] — how Obsidian stores task status
