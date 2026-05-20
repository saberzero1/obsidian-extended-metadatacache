import type {
  App,
  CachedMetadata,
  EventRef,
  TAbstractFile,
  TFile,
} from "obsidian";
import { Events, getAllTags, parseFrontMatterAliases } from "obsidian";
import { FileIntern } from "./file-intern.js";
import { InverseIndex, UniqueInverseIndex } from "./inverse-index.js";
import {
  PersistenceStore,
  deserializeContributions,
  serializeContributions,
} from "./persistence.js";
import type {
  BuildProgress,
  ExtendedMetadataCacheAPI,
  ExtendedMetadataCacheOptions,
  FileContributions,
  FileId,
  InternRecord,
  SerializedContribRecord,
} from "./types.js";

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_FLUSH_DEBOUNCE_MS = 2000;
const DEFAULT_FLUSH_INTERVAL_MS = 30000;

const EMPTY_PATH_SET: ReadonlySet<string> = Object.freeze(new Set<string>());
const EMPTY_PATH_MAP: ReadonlyMap<string, ReadonlySet<string>> = Object.freeze(
  new Map<string, ReadonlySet<string>>(),
);

export class ExtendedMetadataCache
  extends Events
  implements ExtendedMetadataCacheAPI
{
  private readonly app: App;
  private readonly files: FileIntern;
  private readonly contributions = new Map<FileId, FileContributions>();
  private readonly mtimes = new Map<FileId, number>();
  private readonly chunkSize: number;

  private readonly tagIndex = new InverseIndex();
  private readonly backlinkIndex = new InverseIndex();
  private readonly unresolvedBacklinkIndex = new InverseIndex();
  private readonly embedIndex = new InverseIndex();
  private readonly headingIndex = new InverseIndex();
  private readonly frontmatterKeyIndex = new InverseIndex();
  private readonly frontmatterValueIndex = new InverseIndex();
  private readonly aliasIndex = new InverseIndex();
  private readonly blockIndex = new UniqueInverseIndex();

  private readonly eventRefs: EventRef[] = [];
  private _isReady = false;
  private _destroyed = false;

  private store: PersistenceStore | null = null;
  private persistEnabled: boolean;
  private readonly dirtyFileIds = new Set<FileId>();
  private readonly deletedFileIds = new Set<FileId>();
  private readonly deletedPaths = new Set<string>();
  private readonly dirtyInternPaths = new Set<string>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private readonly flushDebounceMs: number;
  private readonly flushIntervalMs: number;

  get isReady(): boolean {
    return this._isReady;
  }

  on(name: "ready", callback: () => void, ctx?: unknown): EventRef;
  on(
    name: "file-updated",
    callback: (path: string) => void,
    ctx?: unknown,
  ): EventRef;
  on(
    name: "rebuild-progress",
    callback: (progress: BuildProgress) => void,
    ctx?: unknown,
  ): EventRef;
  on(name: string, callback: (...data: any[]) => any, ctx?: unknown): EventRef;
  on(name: string, callback: (...data: any[]) => any, ctx?: unknown): EventRef {
    return super.on(name, callback, ctx);
  }

  constructor(app: App, options?: ExtendedMetadataCacheOptions) {
    super();
    this.app = app;
    this.files = new FileIntern();
    this.chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
    this.persistEnabled = options?.persist !== false;
    this.flushDebounceMs =
      options?.flushDebounceMs ?? DEFAULT_FLUSH_DEBOUNCE_MS;
    this.flushIntervalMs =
      options?.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
    this.registerEvents();
    this.initialize();
  }

  private registerEvents(): void {
    const mc = this.app.metadataCache;
    const vault = this.app.vault;

    this.eventRefs.push(
      mc.on("changed", (file: TFile, _data: string, cache: CachedMetadata) => {
        this.updateFileFromCache(file.path, cache, file.stat.mtime);
      }),
    );

    this.eventRefs.push(
      mc.on("deleted", (file: TFile, _prevCache: CachedMetadata | null) => {
        this.removeFile(file.path);
      }),
    );

    this.eventRefs.push(
      mc.on("resolve", (file: TFile) => {
        this.updateFileLinks(file.path);
      }),
    );

    this.eventRefs.push(
      vault.on("rename", (file: TAbstractFile, oldPath: string) => {
        this.handleRename(oldPath, file.path);
      }),
    );
  }

  private async initialize(): Promise<void> {
    let loadedFromDb = false;

    if (this.persistEnabled) {
      loadedFromDb = await this.tryLoadFromDb();
    }

    if (loadedFromDb) {
      await this.reconcileWithVault();
    } else {
      await this.buildInitialIndex();
    }

    if (this.persistEnabled && this.store?.isOpen) {
      this.startPeriodicFlush();
    }

    this._isReady = true;
    this.trigger("ready");
  }

  private async tryLoadFromDb(): Promise<boolean> {
    try {
      const appId = (this.app as any).appId as string | undefined;
      this.store = new PersistenceStore(appId ?? "default");
      const opened = await this.store.open();
      if (!opened) {
        this.disablePersistence();
        return false;
      }

      const snapshot = await this.store.loadSnapshot();
      if (!snapshot || snapshot.interns.length === 0) {
        return false;
      }

      this.restoreFromSnapshot(snapshot.interns, snapshot.contribs);
      return true;
    } catch {
      this.disablePersistence();
      return false;
    }
  }

  private restoreFromSnapshot(
    interns: InternRecord[],
    contribs: SerializedContribRecord[],
  ): void {
    for (const { path, id } of interns) {
      this.files.internWithId(path, id);
    }

    for (const record of contribs) {
      const contrib = deserializeContributions(record);
      this.contributions.set(record.id, contrib);
      this.mtimes.set(record.id, record.mtime);
      this.rebuildIndexesFromContributions(record.id, contrib);
    }
  }

  private rebuildIndexesFromContributions(
    fileId: FileId,
    contrib: FileContributions,
  ): void {
    if (contrib.tags) {
      for (const key of contrib.tags) this.tagIndex.add(key, fileId);
    }
    if (contrib.backlinks) {
      for (const key of contrib.backlinks) this.backlinkIndex.add(key, fileId);
    }
    if (contrib.unresolvedBacklinks) {
      for (const key of contrib.unresolvedBacklinks)
        this.unresolvedBacklinkIndex.add(key, fileId);
    }
    if (contrib.embeds) {
      for (const key of contrib.embeds) this.embedIndex.add(key, fileId);
    }
    if (contrib.headings) {
      for (const key of contrib.headings) this.headingIndex.add(key, fileId);
    }
    if (contrib.frontmatterKeys) {
      for (const key of contrib.frontmatterKeys)
        this.frontmatterKeyIndex.add(key, fileId);
    }
    if (contrib.frontmatterValues) {
      for (const key of contrib.frontmatterValues)
        this.frontmatterValueIndex.add(key, fileId);
    }
    if (contrib.aliases) {
      for (const key of contrib.aliases) this.aliasIndex.add(key, fileId);
    }
    if (contrib.blocks) {
      for (const key of contrib.blocks) this.blockIndex.set(key, fileId);
    }
  }

  private async reconcileWithVault(): Promise<void> {
    const vaultFiles = this.app.vault.getMarkdownFiles();
    const vaultPaths = new Set<string>();
    const toReindex: TFile[] = [];

    for (const file of vaultFiles) {
      vaultPaths.add(file.path);
      const existingId = this.files.getId(file.path);

      if (existingId === undefined) {
        toReindex.push(file);
      } else {
        const storedMtime = this.mtimes.get(existingId);
        if (storedMtime !== file.stat.mtime) {
          toReindex.push(file);
        }
      }
    }

    const internedPaths = this.files.allPaths();
    for (const path of internedPaths) {
      if (!vaultPaths.has(path)) {
        this.removeFile(path);
      }
    }

    const total = toReindex.length;
    let processed = 0;

    for (let i = 0; i < total; i += this.chunkSize) {
      if (this._destroyed) return;

      const chunk = toReindex.slice(i, i + this.chunkSize);
      for (const file of chunk) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache) {
          this.reindexFile(file.path, cache, file.stat.mtime);
        }
        this.reindexFileLinks(file.path);
      }

      processed = Math.min(i + this.chunkSize, total);
      this.trigger("rebuild-progress", {
        processed,
        total,
      } satisfies BuildProgress);

      if (i + this.chunkSize < total) {
        await yieldToMain();
      }
    }
  }

  private reindexFile(
    path: string,
    cache: CachedMetadata,
    mtime: number,
  ): void {
    const fileId = this.files.intern(path);
    this.removeCacheContributions(fileId);
    const contrib = this.getOrCreateContributions(fileId);

    this.indexTags(fileId, cache, contrib);
    this.indexEmbeds(fileId, cache, contrib);
    this.indexHeadings(fileId, cache, contrib);
    this.indexFrontmatter(fileId, cache, contrib);
    this.indexAliases(fileId, cache, contrib);
    this.indexBlocks(fileId, cache, contrib);
    this.mtimes.set(fileId, mtime);
    this.markDirty(fileId, path);
  }

  private reindexFileLinks(path: string): void {
    const fileId = this.files.intern(path);
    this.removeLinkContributions(fileId);
    const contrib = this.getOrCreateContributions(fileId);

    this.indexBacklinks(fileId, path, contrib);
    this.indexUnresolvedBacklinks(fileId, path, contrib);
    this.markDirty(fileId, path);
  }

  private async buildInitialIndex(): Promise<void> {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    const total = markdownFiles.length;
    let processed = 0;

    for (let i = 0; i < total; i += this.chunkSize) {
      if (this._destroyed) return;

      const chunk = markdownFiles.slice(i, i + this.chunkSize);
      for (const file of chunk) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache) {
          this.indexFileFromCache(file.path, cache);
        }
        this.indexFileLinks(file.path);
        this.mtimes.set(this.files.intern(file.path), file.stat.mtime);
        this.markDirty(this.files.intern(file.path), file.path);
      }

      processed = Math.min(i + this.chunkSize, total);
      this.trigger("rebuild-progress", {
        processed,
        total,
      } satisfies BuildProgress);

      if (i + this.chunkSize < total) {
        await yieldToMain();
      }
    }

    if (this.persistEnabled) {
      await this.flushToDb();
    }
  }

  private indexFileFromCache(path: string, cache: CachedMetadata): void {
    const fileId = this.files.intern(path);
    const contrib = this.getOrCreateContributions(fileId);

    this.indexTags(fileId, cache, contrib);
    this.indexEmbeds(fileId, cache, contrib);
    this.indexHeadings(fileId, cache, contrib);
    this.indexFrontmatter(fileId, cache, contrib);
    this.indexAliases(fileId, cache, contrib);
    this.indexBlocks(fileId, cache, contrib);
  }

  private indexFileLinks(path: string): void {
    const fileId = this.files.intern(path);
    const contrib = this.getOrCreateContributions(fileId);

    this.indexBacklinks(fileId, path, contrib);
    this.indexUnresolvedBacklinks(fileId, path, contrib);
  }

  private indexTags(
    fileId: FileId,
    cache: CachedMetadata,
    contrib: FileContributions,
  ): void {
    const tags = getAllTags(cache);
    if (!tags) return;

    const tagKeys = new Set<string>();
    for (const tag of tags) {
      const normalized = tag.toLowerCase();
      tagKeys.add(normalized);
      this.tagIndex.add(normalized, fileId);
    }
    contrib.tags = tagKeys;
  }

  private indexEmbeds(
    fileId: FileId,
    cache: CachedMetadata,
    contrib: FileContributions,
  ): void {
    if (!cache.embeds) return;

    const embedKeys = new Set<string>();
    for (const embed of cache.embeds) {
      const dest = this.app.metadataCache.getFirstLinkpathDest(
        embed.link,
        this.files.getPath(fileId) ?? "",
      );
      const destPath = dest?.path ?? embed.link;
      embedKeys.add(destPath);
      this.embedIndex.add(destPath, fileId);
    }
    contrib.embeds = embedKeys;
  }

  private indexHeadings(
    fileId: FileId,
    cache: CachedMetadata,
    contrib: FileContributions,
  ): void {
    if (!cache.headings) return;

    const headingKeys = new Set<string>();
    for (const heading of cache.headings) {
      const normalized = heading.heading.toLowerCase();
      headingKeys.add(normalized);
      this.headingIndex.add(normalized, fileId);
    }
    contrib.headings = headingKeys;
  }

  private indexFrontmatter(
    fileId: FileId,
    cache: CachedMetadata,
    contrib: FileContributions,
  ): void {
    if (!cache.frontmatter) return;

    const fmKeys = new Set<string>();
    const fmValues = new Set<string>();

    for (const [key, value] of Object.entries(cache.frontmatter)) {
      if (key === "position") continue;

      const normalizedKey = key.toLowerCase();
      fmKeys.add(normalizedKey);
      this.frontmatterKeyIndex.add(normalizedKey, fileId);

      const valueKeys = normalizeFrontmatterValue(normalizedKey, value);
      for (const vk of valueKeys) {
        fmValues.add(vk);
        this.frontmatterValueIndex.add(vk, fileId);
      }
    }
    contrib.frontmatterKeys = fmKeys;
    contrib.frontmatterValues = fmValues;
  }

  private indexAliases(
    fileId: FileId,
    cache: CachedMetadata,
    contrib: FileContributions,
  ): void {
    const aliases = parseFrontMatterAliases(cache.frontmatter ?? null);
    if (!aliases) return;

    const aliasKeys = new Set<string>();
    for (const alias of aliases) {
      const normalized = alias.toLowerCase();
      aliasKeys.add(normalized);
      this.aliasIndex.add(normalized, fileId);
    }
    contrib.aliases = aliasKeys;
  }

  private indexBlocks(
    fileId: FileId,
    cache: CachedMetadata,
    contrib: FileContributions,
  ): void {
    if (!cache.blocks) return;

    const blockKeys = new Set<string>();
    for (const blockId of Object.keys(cache.blocks)) {
      blockKeys.add(blockId);
      this.blockIndex.set(blockId, fileId);
    }
    contrib.blocks = blockKeys;
  }

  private indexBacklinks(
    fileId: FileId,
    sourcePath: string,
    contrib: FileContributions,
  ): void {
    const resolvedDests = this.app.metadataCache.resolvedLinks[sourcePath];
    if (!resolvedDests) return;

    const backlinkKeys = new Set<string>();
    for (const destPath of Object.keys(resolvedDests)) {
      backlinkKeys.add(destPath);
      this.backlinkIndex.add(destPath, fileId);
    }
    contrib.backlinks = backlinkKeys;
  }

  private indexUnresolvedBacklinks(
    fileId: FileId,
    sourcePath: string,
    contrib: FileContributions,
  ): void {
    const unresolvedDests = this.app.metadataCache.unresolvedLinks[sourcePath];
    if (!unresolvedDests) return;

    const unresolvedKeys = new Set<string>();
    for (const destName of Object.keys(unresolvedDests)) {
      const normalized = destName.toLowerCase();
      unresolvedKeys.add(normalized);
      this.unresolvedBacklinkIndex.add(normalized, fileId);
    }
    contrib.unresolvedBacklinks = unresolvedKeys;
  }

  private updateFileFromCache(
    path: string,
    cache: CachedMetadata,
    mtime: number,
  ): void {
    const fileId = this.files.intern(path);
    this.removeCacheContributions(fileId);
    const contrib = this.getOrCreateContributions(fileId);

    this.indexTags(fileId, cache, contrib);
    this.indexEmbeds(fileId, cache, contrib);
    this.indexHeadings(fileId, cache, contrib);
    this.indexFrontmatter(fileId, cache, contrib);
    this.indexAliases(fileId, cache, contrib);
    this.indexBlocks(fileId, cache, contrib);
    this.mtimes.set(fileId, mtime);
    this.markDirty(fileId, path);

    this.trigger("file-updated", path);
  }

  private updateFileLinks(path: string): void {
    const fileId = this.files.getId(path);
    if (fileId === undefined) return;

    this.removeLinkContributions(fileId);
    const contrib = this.getOrCreateContributions(fileId);

    this.indexBacklinks(fileId, path, contrib);
    this.indexUnresolvedBacklinks(fileId, path, contrib);
    this.markDirty(fileId, path);

    this.trigger("file-updated", path);
  }

  private removeFile(path: string): void {
    const fileId = this.files.getId(path);
    if (fileId === undefined) return;

    this.removeAllContributions(fileId);
    this.contributions.delete(fileId);
    this.mtimes.delete(fileId);

    this.deletedFileIds.add(fileId);
    this.deletedPaths.add(path);
    this.dirtyFileIds.delete(fileId);
    this.scheduleDebouncedFlush();

    this.trigger("file-updated", path);
  }

  private handleRename(oldPath: string, newPath: string): void {
    this.files.rename(oldPath, newPath);

    const fileId = this.files.getId(newPath);
    if (fileId === undefined) return;

    const contrib = this.contributions.get(fileId);
    if (!contrib) return;

    if (contrib.backlinks) {
      this.backlinkIndex.removeFromKeys(contrib.backlinks, fileId);
      contrib.backlinks = undefined;
    }
    if (contrib.unresolvedBacklinks) {
      this.unresolvedBacklinkIndex.removeFromKeys(
        contrib.unresolvedBacklinks,
        fileId,
      );
      contrib.unresolvedBacklinks = undefined;
    }

    this.deletedPaths.add(oldPath);
    this.markDirty(fileId, newPath);

    this.trigger("file-updated", newPath);
  }

  private removeCacheContributions(fileId: FileId): void {
    const contrib = this.contributions.get(fileId);
    if (!contrib) return;

    if (contrib.tags) this.tagIndex.removeFromKeys(contrib.tags, fileId);
    if (contrib.embeds) this.embedIndex.removeFromKeys(contrib.embeds, fileId);
    if (contrib.headings)
      this.headingIndex.removeFromKeys(contrib.headings, fileId);
    if (contrib.frontmatterKeys)
      this.frontmatterKeyIndex.removeFromKeys(contrib.frontmatterKeys, fileId);
    if (contrib.frontmatterValues)
      this.frontmatterValueIndex.removeFromKeys(
        contrib.frontmatterValues,
        fileId,
      );
    if (contrib.aliases)
      this.aliasIndex.removeFromKeys(contrib.aliases, fileId);
    if (contrib.blocks) this.blockIndex.removeKeys(contrib.blocks);

    contrib.tags = undefined;
    contrib.embeds = undefined;
    contrib.headings = undefined;
    contrib.frontmatterKeys = undefined;
    contrib.frontmatterValues = undefined;
    contrib.aliases = undefined;
    contrib.blocks = undefined;
  }

  private removeLinkContributions(fileId: FileId): void {
    const contrib = this.contributions.get(fileId);
    if (!contrib) return;

    if (contrib.backlinks)
      this.backlinkIndex.removeFromKeys(contrib.backlinks, fileId);
    if (contrib.unresolvedBacklinks)
      this.unresolvedBacklinkIndex.removeFromKeys(
        contrib.unresolvedBacklinks,
        fileId,
      );

    contrib.backlinks = undefined;
    contrib.unresolvedBacklinks = undefined;
  }

  private removeAllContributions(fileId: FileId): void {
    this.removeCacheContributions(fileId);
    this.removeLinkContributions(fileId);
  }

  private getOrCreateContributions(fileId: FileId): FileContributions {
    let contrib = this.contributions.get(fileId);
    if (!contrib) {
      contrib = {};
      this.contributions.set(fileId, contrib);
    }
    return contrib;
  }

  private markDirty(fileId: FileId, path: string): void {
    this.dirtyFileIds.add(fileId);
    this.dirtyInternPaths.add(path);
    this.scheduleDebouncedFlush();
  }

  private scheduleDebouncedFlush(): void {
    if (!this.persistEnabled || !this.store?.isOpen) return;
    if (this.flushTimer !== null) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushToDb();
    }, this.flushDebounceMs);
  }

  private startPeriodicFlush(): void {
    this.flushIntervalTimer = setInterval(() => {
      this.flushToDb();
    }, this.flushIntervalMs);
  }

  private async flushToDb(): Promise<void> {
    if (!this.store?.isOpen) return;
    if (this.dirtyFileIds.size === 0 && this.deletedFileIds.size === 0) return;

    const dirtyInterns: InternRecord[] = [];
    for (const path of this.dirtyInternPaths) {
      const id = this.files.getId(path);
      if (id !== undefined) {
        dirtyInterns.push({ path, id });
      }
    }

    const dirtyContribs: SerializedContribRecord[] = [];
    for (const fileId of this.dirtyFileIds) {
      const contrib = this.contributions.get(fileId);
      const mtime = this.mtimes.get(fileId) ?? 0;
      if (contrib) {
        dirtyContribs.push(serializeContributions(fileId, mtime, contrib));
      }
    }

    const deletedIds = [...this.deletedFileIds];
    const deletedPathsArr = [...this.deletedPaths];

    this.dirtyFileIds.clear();
    this.dirtyInternPaths.clear();
    this.deletedFileIds.clear();
    this.deletedPaths.clear();

    const ok = await this.store.flush(
      dirtyInterns,
      dirtyContribs,
      deletedIds,
      deletedPathsArr,
    );
    if (!ok) {
      this.disablePersistence();
    }
  }

  private disablePersistence(): void {
    this.persistEnabled = false;
    this.store?.close();
    this.store = null;
  }

  private resolveIndex(index: InverseIndex, key: string): ReadonlySet<string> {
    const ids = index.get(key);
    if (ids.size === 0) return EMPTY_PATH_SET;
    return this.files.resolvePaths(ids);
  }

  private resolveFullIndex(
    index: InverseIndex,
  ): ReadonlyMap<string, ReadonlySet<string>> {
    const entries = index.entries();
    if (entries.size === 0) return EMPTY_PATH_MAP;

    const result = new Map<string, ReadonlySet<string>>();
    for (const [key, ids] of entries) {
      result.set(key, this.files.resolvePaths(ids));
    }
    return result;
  }

  getFilesWithTag(tag: string): ReadonlySet<string> {
    const normalized = tag.startsWith("#")
      ? tag.toLowerCase()
      : `#${tag.toLowerCase()}`;
    return this.resolveIndex(this.tagIndex, normalized);
  }

  getAllTagsWithFiles(): ReadonlyMap<string, ReadonlySet<string>> {
    return this.resolveFullIndex(this.tagIndex);
  }

  getBacklinksForFile(destPath: string): ReadonlySet<string> {
    return this.resolveIndex(this.backlinkIndex, destPath);
  }

  getUnresolvedBacklinks(destName: string): ReadonlySet<string> {
    return this.resolveIndex(
      this.unresolvedBacklinkIndex,
      destName.toLowerCase(),
    );
  }

  getFilesEmbedding(destPath: string): ReadonlySet<string> {
    return this.resolveIndex(this.embedIndex, destPath);
  }

  getFilesWithHeading(heading: string): ReadonlySet<string> {
    return this.resolveIndex(this.headingIndex, heading.toLowerCase());
  }

  getAllHeadingsWithFiles(): ReadonlyMap<string, ReadonlySet<string>> {
    return this.resolveFullIndex(this.headingIndex);
  }

  getFilesWithFrontmatterKey(key: string): ReadonlySet<string> {
    return this.resolveIndex(this.frontmatterKeyIndex, key.toLowerCase());
  }

  getFilesWithFrontmatterValue(
    key: string,
    value: unknown,
  ): ReadonlySet<string> {
    const compositeKey = composeFrontmatterValueKey(key.toLowerCase(), value);
    return this.resolveIndex(this.frontmatterValueIndex, compositeKey);
  }

  getAllFrontmatterKeysWithFiles(): ReadonlyMap<string, ReadonlySet<string>> {
    return this.resolveFullIndex(this.frontmatterKeyIndex);
  }

  getFilesWithAlias(alias: string): ReadonlySet<string> {
    return this.resolveIndex(this.aliasIndex, alias.toLowerCase());
  }

  getAllAliasesWithFiles(): ReadonlyMap<string, ReadonlySet<string>> {
    return this.resolveFullIndex(this.aliasIndex);
  }

  getFileWithBlockId(blockId: string): string | null {
    const fileId = this.blockIndex.get(blockId);
    if (fileId === undefined) return null;
    return this.files.getPath(fileId) ?? null;
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.flushIntervalTimer !== null) {
      clearInterval(this.flushIntervalTimer);
      this.flushIntervalTimer = null;
    }

    this.flushToDb();

    for (const ref of this.eventRefs) {
      this.app.metadataCache.offref(ref);
      this.app.vault.offref(ref);
    }
    this.eventRefs.length = 0;

    this.store?.close();
    this.store = null;

    this.tagIndex.clear();
    this.backlinkIndex.clear();
    this.unresolvedBacklinkIndex.clear();
    this.embedIndex.clear();
    this.headingIndex.clear();
    this.frontmatterKeyIndex.clear();
    this.frontmatterValueIndex.clear();
    this.aliasIndex.clear();
    this.blockIndex.clear();
    this.contributions.clear();
    this.mtimes.clear();
    this.files.clear();
  }
}

function composeFrontmatterValueKey(key: string, value: unknown): string {
  return `${key}\0${normalizePrimitive(value)}`;
}

function normalizeFrontmatterValue(key: string, value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => composeFrontmatterValueKey(key, v));
  }
  return [composeFrontmatterValueKey(key, value)];
}

function normalizePrimitive(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value).toLowerCase();
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}
