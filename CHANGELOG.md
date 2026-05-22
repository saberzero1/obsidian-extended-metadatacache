# Changelog

## 0.5.0

### Added

- **`getAllBacklinksWithFiles()`** and **`getAllEmbedsWithFiles()`** — bulk listing methods completing the API symmetry across all index types
- **`isDestroyed`** property on `ExtendedMetadataCacheAPI` — check if an instance has been destroyed
- Unit tests for persistence serialization round-trip (9 tests)
- E2E tests for incremental file edit, file deletion, file rename, nested frontmatter values, bulk listing methods, isDestroyed

### Fixed

- Singleton registry now detects destroyed instances and creates a fresh one on next `getAPI()` call, preventing stale instance reuse
- Removed dead `indexFileLinks` / `indexBacklinks` methods that were no-ops during cold start (link indexes are built by `rebuildAllLinkIndexes` after `resolved`)

## 0.4.0

### Added

- **Task indexing**: `getFilesWithTasks()`, `getFilesWithTaskStatus(status)`, `getAllTaskStatusesWithFiles()`, `getFilesWithOpenTasks()`, `getFilesWithCompletedTasks()` — index `ListItemCache.task` status characters with support for single or array queries
- **Separated tag lookups**: `getFilesWithTagInBody(tag)` and `getFilesWithTagInFrontmatter(tag)` — distinguish inline `#tag` in note body from `tags:` in YAML frontmatter
- **Separated backlink lookups**: `getBacklinksFromBody(file)` and `getBacklinksFromFrontmatter(file)` — distinguish `[[links]]` in note body from `[[links]]` in YAML property values, determined by cross-referencing `CachedMetadata.frontmatterLinks`

### Fixed

- Race condition where `buildInitialIndex` (async, yields to main) could interleave with `finalizeLinks`, causing the `resolve` event handler to overwrite separated backlink contributions. Fixed with a completion gate that waits for both `initializeAndWaitForLinks` and the second `resolved` event.

### Added

- Comprehensive documentation site (42+ pages) deployed via Quartz v5 to GitHub Pages — API reference, architecture decisions, Obsidian quirks, canvas diagrams, Bases API reference table
- CI workflow for automatic docs deployment on push to `docs/`
- Prettier configuration for consistent code formatting

### Changed

- IndexedDB persistence schema now includes `bodyTags`, `frontmatterTags`, `bodyBacklinks`, `frontmatterBacklinks`, and `taskStatuses` contribution fields

## 0.3.0

### Breaking Changes

- **`getBacklinksForFile(file)`** and **`getFilesEmbedding(file)`** now accept `TFile | string` instead of only `string`. Existing code passing strings continues to work.
- **`getFileWithBlockId(blockId)`** now returns `TFile | null` instead of `string | null`. Consumers that used the string return value to look up files can now use the returned `TFile` directly.
- Minimum Obsidian version bumped from `>=1.4.0` to `>=1.5.7` (required for `Vault.getFileByPath()`).

### Changed

- Updated README with API signature changes, TFile usage example, and updated interface documentation

## 0.2.0

### Fixed

- **Cold start timing**: Deferred initialization until MetadataCache `resolved` event fires, fixing empty indexes when plugin loads during Obsidian startup
- **Backlinks/unresolved empty on startup**: Added two-phase initialization — cache-based indexes build on first `resolved`, link indexes rebuild on second `resolved` when `resolvedLinks` is fully populated
- **Embed subpath resolution**: Use `getLinkpath()` to strip heading (`#heading`) and block (`#^block-id`) subpaths before resolving embed targets via `getFirstLinkpathDest`
- **Canvas file support**: Non-markdown files (`.canvas`, etc.) that appear in `resolvedLinks`/`unresolvedLinks` are now interned and tracked as backlink/unresolved sources
- **Date frontmatter values**: `Date` objects from YAML timestamp parsing are now normalized via `toISOString()` instead of falling through to `JSON.stringify`

### Added

- E2E test suite using `wdio-obsidian-service` — runs a real Obsidian instance against a test vault and cross-verifies every index type against native MetadataCache
- NixOS `flake.nix` for local development with E2E support
- CI workflow for E2E tests on Ubuntu with Xvfb

## 0.1.0

Initial release.

- Inverse indexes for tags, backlinks, unresolved backlinks, embeds, headings, frontmatter keys/values, aliases, and block IDs
- IndexedDB persistence with delta reconciliation on startup
- Singleton registry for cross-plugin cache sharing
- Incremental updates via MetadataCache and Vault events
- Async chunked initial build with `requestIdleCallback` yielding
