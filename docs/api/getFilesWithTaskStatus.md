---
description: "Files with tasks of specific status(es)"
category: tasks
returns: "ReadonlySet<string>"
accepts: "string | string[]"
---
# getFilesWithTaskStatus

```typescript
getFilesWithTaskStatus(status: string | string[]): ReadonlySet<string>
```

Returns files containing tasks with the given status character(s).

## Parameters

- `status` — A single status character or an array of characters. The character is the literal content between `[` and `]` in the task checkbox.

## Returns

`ReadonlySet<string>` — vault-absolute file paths.

## Common status characters

| Character | Markdown | Meaning |
|---|---|---|
| `" "` (space) | `- [ ]` | Incomplete |
| `"x"` | `- [x]` | Done (lowercase) |
| `"X"` | `- [X]` | Done (uppercase) |
| `"/"` | `- [/]` | In progress |
| `"-"` | `- [-]` | Cancelled |
| `">"` | `- [>]` | Deferred |
| `"!"` | `- [!]` | Important |

See [[Task Status Values]] for details on how Obsidian stores these.

## Example

```typescript
// Single status
const inProgress = cache.getFilesWithTaskStatus("/");

// Multiple statuses
const activeWork = cache.getFilesWithTaskStatus(["/", "!", ">"]);

// Specifically done (Dataview-style)
const done = cache.getFilesWithTaskStatus(["x", "X"]);
```

## Related

- [[getFilesWithTasks]] — any task
- [[getFilesWithOpenTasks]] — convenience for `" "`
- [[getFilesWithCompletedTasks]] — convenience for any non-space
- [[getAllTaskStatusesWithFiles]] — list all statuses
