# Changelog

## 0.1.0

Initial release.

- Inverse indexes for tags, backlinks, unresolved backlinks, embeds, headings, frontmatter keys/values, aliases, and block IDs
- IndexedDB persistence with delta reconciliation on startup
- Singleton registry for cross-plugin cache sharing
- Incremental updates via MetadataCache and Vault events
- Async chunked initial build with `requestIdleCallback` yielding
