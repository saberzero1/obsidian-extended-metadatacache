import type { App } from "obsidian";
import { ExtendedMetadataCache } from "./extended-metadata-cache.js";
import type {
  ExtendedMetadataCacheAPI,
  ExtendedMetadataCacheHandle,
  ExtendedMetadataCacheOptions,
  GlobalRegistry,
} from "./types.js";

const API_MAJOR = 0;
const API_MINOR = 1;
const VERSION = "0.5.1";

const REGISTRY_SYMBOL = Symbol.for("obsidian-extended-metadatacache/registry");

function getGlobalRegistry(): GlobalRegistry {
  const win = globalThis as unknown as Record<symbol, unknown>;
  let registry = win[REGISTRY_SYMBOL] as GlobalRegistry | undefined;
  if (!registry) {
    registry = { majors: new Map() };
    win[REGISTRY_SYMBOL] = registry;
  }
  return registry;
}

/**
 * Acquire a shared ExtendedMetadataCache instance. If another plugin
 * using the same API major version has already created one, that
 * instance is reused. Returns a handle with a release() method.
 */
export function getAPI(
  app: App,
  options?: ExtendedMetadataCacheOptions,
): ExtendedMetadataCacheHandle {
  const registry = getGlobalRegistry();
  const existing = registry.majors.get(API_MAJOR);

  const needsNew = !existing || existing.instance.isDestroyed;
  const entry = needsNew
    ? (() => {
        const instance = new ExtendedMetadataCache(app, options);
        const created = {
          instance,
          version: VERSION,
          apiMajor: API_MAJOR,
          apiMinor: API_MINOR,
          acquireCount: 0,
        };
        registry.majors.set(API_MAJOR, created);
        return created;
      })()
    : existing;

  entry.acquireCount++;
  const capturedEntry = entry;

  let released = false;
  return {
    api: capturedEntry.instance,
    release() {
      if (released) return;
      released = true;
      capturedEntry.acquireCount--;
    },
  };
}

/**
 * Check if a shared instance exists for the current API major version
 * without creating one.
 */
export function hasAPI(): boolean {
  const registry = getGlobalRegistry();
  const entry = registry.majors.get(API_MAJOR);
  return entry !== undefined && entry.acquireCount > 0;
}

/**
 * Create an isolated (non-singleton) ExtendedMetadataCache instance.
 * Useful for testing or when singleton behavior is not desired.
 */
export function createExtendedMetadataCache(
  app: App,
  options?: ExtendedMetadataCacheOptions,
): ExtendedMetadataCacheAPI {
  return new ExtendedMetadataCache(app, options);
}

/** Current API version info for feature detection. */
export const apiVersion = {
  major: API_MAJOR,
  minor: API_MINOR,
  version: VERSION,
} as const;
