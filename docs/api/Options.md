---
description: "Configuration options: chunkSize, persist, flushDebounceMs, flushIntervalMs"
category: lifecycle
---
# Options

```typescript
interface ExtendedMetadataCacheOptions {
  chunkSize?: number;
  persist?: boolean;
  flushDebounceMs?: number;
  flushIntervalMs?: number;
}
```

Passed as the second argument to [[getAPI]] or [[createExtendedMetadataCache]].

## `chunkSize`

**Default: `500`**

Number of files to process per async chunk during the initial index build. Higher values build faster but may cause UI jank during startup.

## `persist`

**Default: `true`**

Enable IndexedDB persistence. When enabled, indexes are persisted across restarts and reconciled on next load. When disabled, a full in-memory rebuild happens every time.

Set to `false` for testing or when IndexedDB is unreliable.

See [[IndexedDB Persistence]] for details.

## `flushDebounceMs`

**Default: `2000`**

Milliseconds to wait after the last index change before flushing dirty entries to IndexedDB. Prevents excessive writes during rapid file edits.

## `flushIntervalMs`

**Default: `30000`**

Milliseconds between periodic flushes to IndexedDB, as a safety net against data loss.
