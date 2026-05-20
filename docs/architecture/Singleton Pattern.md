# Singleton Pattern

## Problem

Multiple Obsidian plugins may depend on this library. Each plugin bundles the library into its own `main.js` (this is how esbuild works for Obsidian plugins). Without coordination, each plugin would create its own cache instance — wasting memory and doing redundant work.

## Solution

A global registry stored on `window` via `Symbol.for("obsidian-extended-metadatacache/registry")`. The registry is keyed by API major version.

When [[getAPI]] is called:
1. Check the global registry for an existing instance with the same API major version
2. If found: reuse it, increment reference count
3. If not found: create a new instance, register it

When `release()` is called on the handle:
- Decrement the reference count

## Version compatibility

- **Same major version** (e.g., v0.3.x and v0.4.x both have major 0): share one instance. The first plugin to call `getAPI` creates it; others reuse.
- **Different major versions**: would get separate instances (no cross-major sharing). This hasn't happened yet since we're pre-1.0.

## Why `Symbol.for`?

`Symbol.for` creates a global symbol that's shared across all JavaScript code in the same realm. Unlike a string key on `window`, it doesn't collide with other properties and isn't enumerable.

## Why not a dedicated host plugin?

Requiring a host plugin would add friction — every consumer would need to ensure the host is installed and enabled. The library-level singleton avoids this. The first plugin to load wins.

## Reference counting

The handle's `release()` method decrements the count. The instance stays alive even when count reaches zero (kept for the session) to avoid destroying and rebuilding if another plugin loads later.
