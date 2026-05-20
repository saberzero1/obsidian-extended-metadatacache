---
description: "Files with incomplete tasks"
category: tasks
returns: "ReadonlySet<string>"
accepts: "none"
---
# getFilesWithOpenTasks

```typescript
getFilesWithOpenTasks(): ReadonlySet<string>
```

Returns files containing incomplete tasks (`- [ ]`).

Equivalent to `getFilesWithTaskStatus(" ")`.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Related

- [[getFilesWithCompletedTasks]] — the inverse
- [[getFilesWithTaskStatus]] — custom status queries
