import type {
  FileContributions,
  FileId,
  IndexType,
  InternRecord,
  SerializedContribRecord,
} from "./types.js";

const DB_VERSION = 1;
const STORE_META = "meta";
const STORE_INTERN = "intern";
const STORE_CONTRIB = "contrib";

export class PersistenceStore {
  private db: IDBDatabase | null = null;
  private readonly dbName: string;

  constructor(appId: string) {
    this.dbName = `inverse-metadatacache:${appId}`;
  }

  async open(): Promise<boolean> {
    try {
      this.db = await openDB(this.dbName, DB_VERSION, (db) => {
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
        if (!db.objectStoreNames.contains(STORE_INTERN)) {
          db.createObjectStore(STORE_INTERN, { keyPath: "path" });
        }
        if (!db.objectStoreNames.contains(STORE_CONTRIB)) {
          db.createObjectStore(STORE_CONTRIB, { keyPath: "id" });
        }
      });
      return true;
    } catch {
      this.db = null;
      return false;
    }
  }

  get isOpen(): boolean {
    return this.db !== null;
  }

  async loadSnapshot(): Promise<{
    interns: InternRecord[];
    contribs: SerializedContribRecord[];
  } | null> {
    if (!this.db) return null;
    try {
      const tx = this.db.transaction([STORE_INTERN, STORE_CONTRIB], "readonly");
      const [interns, contribs] = await Promise.all([
        getAllFromStore<InternRecord>(tx.objectStore(STORE_INTERN)),
        getAllFromStore<SerializedContribRecord>(tx.objectStore(STORE_CONTRIB)),
      ]);
      return { interns, contribs };
    } catch {
      return null;
    }
  }

  async flush(
    dirtyInterns: InternRecord[],
    dirtyContribs: SerializedContribRecord[],
    deletedIds: FileId[],
    deletedPaths: string[],
  ): Promise<boolean> {
    if (!this.db) return false;
    try {
      const tx = this.db.transaction([STORE_INTERN, STORE_CONTRIB], "readwrite");
      const internStore = tx.objectStore(STORE_INTERN);
      const contribStore = tx.objectStore(STORE_CONTRIB);

      for (const record of dirtyInterns) {
        internStore.put(record);
      }
      for (const record of dirtyContribs) {
        contribStore.put(record);
      }
      for (const id of deletedIds) {
        contribStore.delete(id);
      }
      for (const path of deletedPaths) {
        internStore.delete(path);
      }

      await txComplete(tx);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction([STORE_META, STORE_INTERN, STORE_CONTRIB], "readwrite");
      tx.objectStore(STORE_META).clear();
      tx.objectStore(STORE_INTERN).clear();
      tx.objectStore(STORE_CONTRIB).clear();
      await txComplete(tx);
    } catch {
      // intentionally swallowed — clear is best-effort
    }
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }
}

export function serializeContributions(
  id: FileId,
  mtime: number,
  contrib: FileContributions,
): SerializedContribRecord {
  const record: SerializedContribRecord = { id, mtime };
  if (contrib.tags?.size) record.tags = [...contrib.tags];
  if (contrib.bodyTags?.size) record.bodyTags = [...contrib.bodyTags];
  if (contrib.frontmatterTags?.size) record.frontmatterTags = [...contrib.frontmatterTags];
  if (contrib.backlinks?.size) record.backlinks = [...contrib.backlinks];
  if (contrib.bodyBacklinks?.size) record.bodyBacklinks = [...contrib.bodyBacklinks];
  if (contrib.frontmatterBacklinks?.size)
    record.frontmatterBacklinks = [...contrib.frontmatterBacklinks];
  if (contrib.unresolvedBacklinks?.size)
    record.unresolvedBacklinks = [...contrib.unresolvedBacklinks];
  if (contrib.embeds?.size) record.embeds = [...contrib.embeds];
  if (contrib.headings?.size) record.headings = [...contrib.headings];
  if (contrib.frontmatterKeys?.size) record.frontmatterKeys = [...contrib.frontmatterKeys];
  if (contrib.frontmatterValues?.size) record.frontmatterValues = [...contrib.frontmatterValues];
  if (contrib.aliases?.size) record.aliases = [...contrib.aliases];
  if (contrib.blocks?.size) record.blocks = [...contrib.blocks];
  if (contrib.taskStatuses?.size) record.taskStatuses = [...contrib.taskStatuses];
  return record;
}

export function deserializeContributions(record: SerializedContribRecord): FileContributions {
  const contrib: FileContributions = {};
  if (record.tags?.length) contrib.tags = new Set(record.tags);
  if (record.bodyTags?.length) contrib.bodyTags = new Set(record.bodyTags);
  if (record.frontmatterTags?.length) contrib.frontmatterTags = new Set(record.frontmatterTags);
  if (record.backlinks?.length) contrib.backlinks = new Set(record.backlinks);
  if (record.bodyBacklinks?.length) contrib.bodyBacklinks = new Set(record.bodyBacklinks);
  if (record.frontmatterBacklinks?.length)
    contrib.frontmatterBacklinks = new Set(record.frontmatterBacklinks);
  if (record.unresolvedBacklinks?.length)
    contrib.unresolvedBacklinks = new Set(record.unresolvedBacklinks);
  if (record.embeds?.length) contrib.embeds = new Set(record.embeds);
  if (record.headings?.length) contrib.headings = new Set(record.headings);
  if (record.frontmatterKeys?.length) contrib.frontmatterKeys = new Set(record.frontmatterKeys);
  if (record.frontmatterValues?.length)
    contrib.frontmatterValues = new Set(record.frontmatterValues);
  if (record.aliases?.length) contrib.aliases = new Set(record.aliases);
  if (record.blocks?.length) contrib.blocks = new Set(record.blocks);
  if (record.taskStatuses?.length) contrib.taskStatuses = new Set(record.taskStatuses);
  return contrib;
}

const INDEX_TYPES_FOR_CONTRIB: IndexType[] = [
  "tags",
  "bodyTags",
  "frontmatterTags",
  "backlinks",
  "bodyBacklinks",
  "frontmatterBacklinks",
  "unresolvedBacklinks",
  "embeds",
  "headings",
  "frontmatterKeys",
  "frontmatterValues",
  "aliases",
  "blocks",
  "taskStatuses",
];

export function contribHasData(contrib: FileContributions): boolean {
  for (const type of INDEX_TYPES_FOR_CONTRIB) {
    const set = contrib[type];
    if (set && set.size > 0) return true;
  }
  return false;
}

function openDB(
  name: string,
  version: number,
  onUpgrade: (db: IDBDatabase) => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => onUpgrade(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
