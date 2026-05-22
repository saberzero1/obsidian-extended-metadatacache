---
description: "Files with completed tasks"
category: tasks
returns: "ReadonlySet<string>"
accepts: "none"
---
# getFilesWithCompletedTasks

```typescript
getFilesWithCompletedTasks(): ReadonlySet<string>
```

Returns files containing completed tasks — any task whose status character is not a space.

Per Obsidian's official documentation[^listitem-docs]: *"The space character `' '` is interpreted as an incomplete task. Any other character is interpreted as completed task."*

This means `[x]`, `[X]`, `[/]`, `[-]`, `[>]`, `[!]`, and any other character all count as completed.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Note on "completed" semantics

Obsidian and Dataview define "completed" differently:

| Convention | "Completed" means |
|---|---|
| **Obsidian** (what we use) | Any non-space character |
| **Dataview** | Only `x` or `X` |

If you need Dataview-style semantics, use `getFilesWithTaskStatus(["x", "X"])` instead.

## Related

- [[getFilesWithOpenTasks]] — the inverse
- [[getFilesWithTaskStatus]] — custom status queries
- [[Task Status Values]] — full details

[^listitem-docs]: [ListItemCache — Obsidian Developer Docs](https://docs.obsidian.md/Reference/TypeScript+API/ListItemCache)
