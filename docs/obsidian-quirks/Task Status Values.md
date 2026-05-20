# Task Status Values

## How Obsidian stores task status

`ListItemCache.task` contains the literal character between `[` and `]` in a checkbox list item. Obsidian does NOT normalize this value.

| Markdown | `task` value | Obsidian interpretation |
|---|---|---|
| `- regular bullet` | `undefined` | Not a task |
| `- [ ]` | `" "` (space) | Incomplete |
| `- [x]` | `"x"` | Complete |
| `- [X]` | `"X"` | Complete |
| `- [/]` | `"/"` | Complete (any non-space) |
| `- [-]` | `"-"` | Complete (any non-space) |
| `- [>]` | `">"` | Complete (any non-space) |
| `- [!]` | `"!"` | Complete (any non-space) |

## Obsidian's binary view

From the official docs: *"The space character `' '` is interpreted as an incomplete task. Any other character is interpreted as completed task."*

Obsidian only applies strikethrough styling to `x` and `X`. All other non-space characters render as "checked" (filled checkbox) without strikethrough.

## Obsidian vs Dataview semantics

| Concept | Obsidian | Dataview |
|---|---|---|
| Checked | Any non-space | Any non-space |
| Completed/Done | Any non-space | Only `x` or `X` |

Our [[getFilesWithCompletedTasks]] follows **Obsidian's semantics** (any non-space = completed). For Dataview-style "only x/X", use `getFilesWithTaskStatus(["x", "X"])`.

## Custom status characters

Themes and plugins like obsidian-tasks define custom meanings for status characters:

| Character | Common meaning |
|---|---|
| `/` | In progress |
| `-` | Cancelled |
| `>` | Deferred/scheduled |
| `!` | Important |
| `?` | Question |
| `R` | Under review |

These are community conventions, not Obsidian standards. The raw character is always available via [[getFilesWithTaskStatus]] and [[getAllTaskStatusesWithFiles]].
