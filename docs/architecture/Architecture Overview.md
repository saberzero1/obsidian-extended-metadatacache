# Architecture Overview

![[Architecture Diagram.canvas]]
## Core concept

The library maintains **inverse indexes** — `Map<Key, Set<FileId>>` structures that answer "which files have this metadata?" instead of "what metadata does this file have?".

## Data flow

```
Obsidian MetadataCache events
        │
        ▼
  ┌─────────────────┐
  │  Event handlers  │  changed, deleted, resolve, rename
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Contribution    │  Per-file: "this file contributes these keys to these indexes"
  │  tracking        │  Enables O(contributions) removal on update
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Inverse indexes │  Map<Key, Set<FileId>> per index type
  │  (in memory)     │  Tags, backlinks, headings, frontmatter, etc.
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  IndexedDB       │  Per-file contribution records persisted
  │  persistence     │  Delta reconciliation on restart
  └─────────────────┘
```

## Key design choices

- **Inverse-only** — we don't duplicate forward indexes since `MetadataCache` already provides those
- **Numeric file IDs** — paths are interned to integers to reduce memory in `Set<number>` across all indexes
- **Per-file contributions** — each file tracks which keys it contributes to each index, enabling efficient removal without scanning
- **IndexedDB stores contributions, not indexes** — on load, inverse maps are rebuilt in memory from contributions (fast CPU-only), then delta-reconciled against the live vault

See also:
- [[Singleton Pattern]]
- [[IndexedDB Persistence]]
- [[Startup Sequence]]
- [[Normalization Rules]]
