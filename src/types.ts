import type { EventRef, TFile } from "obsidian";

/**
 * Internal numeric file identifier. File paths are interned to integers
 * to reduce memory usage across all inverse index maps.
 */
export type FileId = number;

/** Category keys for the different inverse index types. */
export type IndexType =
  | "tags"
  | "bodyTags"
  | "frontmatterTags"
  | "backlinks"
  | "bodyBacklinks"
  | "frontmatterBacklinks"
  | "unresolvedBacklinks"
  | "embeds"
  | "headings"
  | "frontmatterKeys"
  | "frontmatterValues"
  | "aliases"
  | "blocks"
  | "taskStatuses";

/**
 * Per-file record of the keys this file contributes to each index.
 * Used for efficient removal during incremental updates — we iterate
 * the contribution set instead of scanning the whole index.
 */
export type FileContributions = {
  [K in IndexType]?: Set<string>;
};

/** Progress info emitted during initial index build. */
export interface BuildProgress {
  processed: number;
  total: number;
}

/** Options for creating an ExtendedMetadataCache instance. */
export interface ExtendedMetadataCacheOptions {
  /**
   * Number of files to process per async chunk during initial build.
   * Higher values build faster but may cause UI jank.
   * @default 500
   */
  chunkSize?: number;

  /**
   * Enable IndexedDB persistence. When enabled, inverse indexes are
   * persisted across restarts and reconciled against the live
   * MetadataCache on load. Falls back to in-memory rebuild on failure.
   * @default true
   */
  persist?: boolean;

  /**
   * Milliseconds to debounce before flushing dirty entries to IndexedDB.
   * @default 2000
   */
  flushDebounceMs?: number;

  /**
   * Milliseconds between periodic flushes to IndexedDB.
   * @default 30000
   */
  flushIntervalMs?: number;
}

/** @internal Serialized form of FileContributions for IndexedDB storage. */
export interface SerializedContribRecord {
  id: FileId;
  mtime: number;
  tags?: string[];
  bodyTags?: string[];
  frontmatterTags?: string[];
  backlinks?: string[];
  bodyBacklinks?: string[];
  frontmatterBacklinks?: string[];
  unresolvedBacklinks?: string[];
  embeds?: string[];
  headings?: string[];
  frontmatterKeys?: string[];
  frontmatterValues?: string[];
  aliases?: string[];
  blocks?: string[];
  taskStatuses?: string[];
}

/** @internal Intern record for IndexedDB storage. */
export interface InternRecord {
  path: string;
  id: FileId;
}

/**
 * The public query API exposed by ExtendedMetadataCache.
 *
 * Every method returns file paths (vault-absolute, matching TFile.path)
 * as a ReadonlySet or ReadonlyArray for zero-copy reads.
 */
export interface ExtendedMetadataCacheAPI {
  /**
   * Whether the initial index build has completed.
   * Query results before this is true may be incomplete.
   */
  readonly isReady: boolean;

  /** Get all files that contain the given tag (body + frontmatter combined). */
  getFilesWithTag(tag: string): ReadonlySet<string>;
  /** Get all files that contain the given tag in the note body only. */
  getFilesWithTagInBody(tag: string): ReadonlySet<string>;
  /** Get all files that contain the given tag in frontmatter only. */
  getFilesWithTagInFrontmatter(tag: string): ReadonlySet<string>;
  /** Get all tags across the vault with their file sets (combined). */
  getAllTagsWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  /** Get all files that link TO the given file (body + frontmatter combined). */
  getBacklinksForFile(file: TFile | string): ReadonlySet<string>;
  /** Get all files that link TO the given file from note body only. */
  getBacklinksFromBody(file: TFile | string): ReadonlySet<string>;
  /** Get all files that link TO the given file from frontmatter only. */
  getBacklinksFromFrontmatter(file: TFile | string): ReadonlySet<string>;

  /** Get all backlink targets with their source file sets. */
  getAllBacklinksWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  /** Get all files with unresolved links matching the given name. */
  getUnresolvedBacklinks(destName: string): ReadonlySet<string>;

  /** Get all files that embed the given file. Accepts TFile or vault-absolute path. */
  getFilesEmbedding(file: TFile | string): ReadonlySet<string>;
  /** Get all embed targets with their embedding file sets. */
  getAllEmbedsWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  /** Get all files that contain a heading matching the given text (case-insensitive). */
  getFilesWithHeading(heading: string): ReadonlySet<string>;
  /** Get all headings across the vault with their file sets. */
  getAllHeadingsWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  /** Get all files that have the given frontmatter key (regardless of value). */
  getFilesWithFrontmatterKey(key: string): ReadonlySet<string>;
  /** Get all files where frontmatter[key] equals the given value. */
  getFilesWithFrontmatterValue(key: string, value: unknown): ReadonlySet<string>;
  /** Get all frontmatter keys across the vault with their file sets. */
  getAllFrontmatterKeysWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  /** Get all files that have the given alias. */
  getFilesWithAlias(alias: string): ReadonlySet<string>;
  /** Get all aliases across the vault with their file sets. */
  getAllAliasesWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;

  /** Get the file that defines the given block ID, or null. */
  getFileWithBlockId(blockId: string): TFile | null;

  /** Get all files that contain any tasks. */
  getFilesWithTasks(): ReadonlySet<string>;
  /** Get files with tasks matching the given status character(s). */
  getFilesWithTaskStatus(status: string | string[]): ReadonlySet<string>;
  /** Get all task status characters across the vault with their file sets. */
  getAllTaskStatusesWithFiles(): ReadonlyMap<string, ReadonlySet<string>>;
  /** Get files with incomplete tasks (status === " "). */
  getFilesWithOpenTasks(): ReadonlySet<string>;
  /** Get files with completed tasks (any non-space status per Obsidian semantics). */
  getFilesWithCompletedTasks(): ReadonlySet<string>;

  on(name: "ready", callback: () => void, ctx?: unknown): EventRef;
  on(name: "file-updated", callback: (path: string) => void, ctx?: unknown): EventRef;
  on(
    name: "rebuild-progress",
    callback: (progress: BuildProgress) => void,
    ctx?: unknown,
  ): EventRef;
  on(name: string, callback: (...data: any[]) => any, ctx?: unknown): EventRef;

  off(name: string, callback: (...data: any[]) => any): void;
  offref(ref: EventRef): void;

  /** Whether this instance has been destroyed. */
  readonly isDestroyed: boolean;

  /** Destroy this instance and unsubscribe from all Obsidian events. */
  destroy(): void;
}

/**
 * Shape stored in the global singleton registry.
 * @internal
 */
export interface RegistryEntry {
  instance: ExtendedMetadataCacheAPI;
  version: string;
  apiMajor: number;
  apiMinor: number;
  acquireCount: number;
}

/**
 * Global registry stored on window via Symbol.for.
 * @internal
 */
export interface GlobalRegistry {
  majors: Map<number, RegistryEntry>;
}

/**
 * Handle returned by getAPI / acquire. Wraps the shared API with
 * a release() method for refcount management.
 */
export interface ExtendedMetadataCacheHandle {
  api: ExtendedMetadataCacheAPI;
  /**
   * Release this handle. When all handles are released, the instance
   * may be garbage collected (but is kept alive for the session by default).
   */
  release(): void;
}
