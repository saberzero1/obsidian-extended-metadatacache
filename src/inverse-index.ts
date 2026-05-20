import type { FileId } from "./types.js";

/**
 * A memory-efficient inverse index that maps string keys to sets of
 * numeric file IDs. Supports O(1) lookups, insertions, and removals.
 *
 * This is the core data structure backing all inverse lookups.
 * File paths are interned to numeric IDs externally to reduce memory.
 */
export class InverseIndex {
  private readonly index = new Map<string, Set<FileId>>();

  /** Get the set of file IDs for a given key, or an empty set. */
  get(key: string): ReadonlySet<FileId> {
    return this.index.get(key) ?? EMPTY_SET;
  }

  /** Check whether a key exists in the index. */
  has(key: string): boolean {
    const set = this.index.get(key);
    return set !== undefined && set.size > 0;
  }

  /** Add a file ID to the set for the given key. */
  add(key: string, fileId: FileId): void {
    let set = this.index.get(key);
    if (set === undefined) {
      set = new Set();
      this.index.set(key, set);
    }
    set.add(fileId);
  }

  /** Remove a file ID from the set for the given key. Cleans up empty sets. */
  remove(key: string, fileId: FileId): void {
    const set = this.index.get(key);
    if (set === undefined) return;
    set.delete(fileId);
    if (set.size === 0) {
      this.index.delete(key);
    }
  }

  /** Remove a file ID from multiple keys at once. */
  removeFromKeys(keys: ReadonlySet<string>, fileId: FileId): void {
    for (const key of keys) {
      this.remove(key, fileId);
    }
  }

  /** Get the entire index map (read-only view). */
  entries(): ReadonlyMap<string, ReadonlySet<FileId>> {
    return this.index;
  }

  /** Get total number of keys in the index. */
  get size(): number {
    return this.index.size;
  }

  /** Clear all entries. */
  clear(): void {
    this.index.clear();
  }
}

/**
 * A specialized inverse index for block IDs where each key maps to
 * exactly one file (block IDs are unique within a vault).
 */
export class UniqueInverseIndex {
  private readonly index = new Map<string, FileId>();

  /** Get the file ID for a given key, or undefined. */
  get(key: string): FileId | undefined {
    return this.index.get(key);
  }

  /** Check whether a key exists. */
  has(key: string): boolean {
    return this.index.has(key);
  }

  /** Set the file ID for a key. */
  set(key: string, fileId: FileId): void {
    this.index.set(key, fileId);
  }

  /** Remove a key. */
  remove(key: string): void {
    this.index.delete(key);
  }

  /** Remove multiple keys at once. */
  removeKeys(keys: ReadonlySet<string>): void {
    for (const key of keys) {
      this.index.delete(key);
    }
  }

  /** Clear all entries. */
  clear(): void {
    this.index.clear();
  }
}

/** Shared empty set to avoid allocations for missing keys. */
const EMPTY_SET: ReadonlySet<FileId> = Object.freeze(new Set<FileId>());
