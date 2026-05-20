# Changelog

## 0.2.1

### Changed

- Updated README with two-phase startup sequence documentation, normalization details (Date, nested objects, embed subpaths, canvas sources), and development/testing guide

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
