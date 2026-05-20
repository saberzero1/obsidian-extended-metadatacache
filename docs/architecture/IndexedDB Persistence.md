# IndexedDB Persistence

## Why persist?

On first startup, building inverse indexes requires iterating every file in the vault. For a 50k-file vault this takes ~500ms. IndexedDB persistence allows subsequent startups to load the cached indexes instantly and only reconcile changed files.

## What's stored

The library stores **per-file contribution records**, not the inverse maps themselves. Each record contains:

- `id` — numeric file ID
- `mtime` — last modification time (for delta detection)
- Per-index-type key sets (e.g., which tags, backlinks, headings this file contributes)

On load, inverse maps are rebuilt in memory from these contributions — a fast CPU-only operation.

## Database schema

- **DB name**: `inverse-metadatacache:{appId}` (one per vault)
- **Object stores**:
  - `meta` — schema version metadata
  - `intern` — path ↔ numeric ID mapping
  - `contrib` — per-file contribution records

## Startup reconciliation

1. Load all persisted intern + contribution records from IndexedDB
2. Rebuild in-memory inverse maps from contributions
3. Compare vault files + `mtime` against persisted state
4. Reindex only added/changed files; remove deleted files
5. Rebuild link indexes from live `resolvedLinks`/`unresolvedLinks`
6. Flush reconciliation results back to IndexedDB

## Write strategy

- **Debounced**: dirty entries coalesced and flushed after 2 seconds of inactivity
- **Periodic**: safety-net flush every 30 seconds
- **On destroy**: best-effort flush when the instance is destroyed

## Failure handling

If IndexedDB is unavailable (Apple Lockdown Mode, quota errors, corruption), the library:
1. Logs the failure
2. Disables persistence for the session
3. Falls back to a full in-memory rebuild
4. Continues functioning normally — just without persistence

## Schema migrations

If the database version doesn't match, object stores are dropped and recreated. The next startup does a full rebuild from MetadataCache.
