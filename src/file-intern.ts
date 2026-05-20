import type { FileId } from "./types.js";

/**
 * Interns file paths to numeric IDs for memory-efficient storage in
 * inverse index Sets. Maintains a bidirectional mapping.
 */
export class FileIntern {
  private readonly pathToId = new Map<string, FileId>();
  private readonly idToPath: string[] = [];

  /** Get or create a numeric ID for the given path. */
  intern(path: string): FileId {
    const existing = this.pathToId.get(path);
    if (existing !== undefined) return existing;

    const id = this.idToPath.length;
    this.pathToId.set(path, id);
    this.idToPath.push(path);
    return id;
  }

  /** Get the numeric ID for a path, or undefined if not interned. */
  getId(path: string): FileId | undefined {
    return this.pathToId.get(path);
  }

  /** Get the path for a numeric ID, or undefined if invalid. */
  getPath(id: FileId): string | undefined {
    return this.idToPath[id];
  }

  /** Handle a file rename: update the path for an existing ID. */
  rename(oldPath: string, newPath: string): void {
    const id = this.pathToId.get(oldPath);
    if (id === undefined) return;

    this.pathToId.delete(oldPath);
    this.pathToId.set(newPath, id);
    this.idToPath[id] = newPath;
  }

  internWithId(path: string, id: FileId): void {
    this.pathToId.set(path, id);
    while (this.idToPath.length <= id) {
      this.idToPath.push(undefined as unknown as string);
    }
    this.idToPath[id] = path;
  }

  allPaths(): Iterable<string> {
    return this.pathToId.keys();
  }

  /** Check if a path is interned. */
  has(path: string): boolean {
    return this.pathToId.has(path);
  }

  /** Total number of interned paths. */
  get size(): number {
    return this.pathToId.size;
  }

  /** Resolve a set of file IDs to their paths. */
  resolvePaths(ids: ReadonlySet<FileId>): ReadonlySet<string> {
    const paths = new Set<string>();
    for (const id of ids) {
      const path = this.idToPath[id];
      if (path !== undefined) {
        paths.add(path);
      }
    }
    return paths;
  }

  /** Clear all interned data. */
  clear(): void {
    this.pathToId.clear();
    this.idToPath.length = 0;
  }
}
