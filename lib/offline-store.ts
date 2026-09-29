const DB_NAME = "md-school-offline-v1";
const DB_VERSION = 1;
const CACHE_STORE = "http_cache";
const OUTBOX_STORE = "outbox";

export type OfflineStatus = "online" | "offline" | "syncing";
export type OfflineOutboxItem = {
  id?: number;
  userId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  createdAt: number;
};

type CachedResponse = { key: string; status: number; headers: Record<string, string>; body: string; savedAt: number };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB غير متاح"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CACHE_STORE)) db.createObjectStore(CACHE_STORE, { keyPath: "key" });
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const store = db.createObjectStore(OUTBOX_STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("userId", "userId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("تعذر فتح قاعدة البيانات المحلية"));
  });
  return dbPromise;
}

function requestToPromise<T = unknown>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("فشل التخزين المحلي"));
  });
}

export async function cacheResponse(key: string, response: Response) {
  if (typeof indexedDB === "undefined" || !response.ok) return;
  const body = await response.clone().text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, name) => { headers[name] = value; });
  const db = await openDb();
  const tx = db.transaction(CACHE_STORE, "readwrite");
  tx.objectStore(CACHE_STORE).put({ key, status: response.status, headers, body, savedAt: Date.now() } satisfies CachedResponse);
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}

export async function getCachedResponse(key: string) {
  try {
    const db = await openDb();
    const row = await requestToPromise<CachedResponse | undefined>(db.transaction(CACHE_STORE).objectStore(CACHE_STORE).get(key));
    if (!row) return null;
    const headers = new Headers(row.headers);
    return new Response(row.body, { status: row.status, headers });
  } catch {
    return null;
  }
}

export async function queueMutation(item: OfflineOutboxItem) {
  const db = await openDb();
  const tx = db.transaction(OUTBOX_STORE, "readwrite");
  tx.objectStore(OUTBOX_STORE).add(item);
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}

export async function getOutbox(userId: string) {
  const db = await openDb();
  const index = db.transaction(OUTBOX_STORE).objectStore(OUTBOX_STORE).index("userId");
  return requestToPromise<OfflineOutboxItem[]>(index.getAll(userId));
}

export async function deleteOutbox(id: number) {
  const db = await openDb();
  const tx = db.transaction(OUTBOX_STORE, "readwrite");
  tx.objectStore(OUTBOX_STORE).delete(id);
  await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
}

export async function clearOfflineDataForUser(userId: string) {
  const items = await getOutbox(userId);
  for (const item of items) if (item.id != null) await deleteOutbox(item.id);
}

export function getCurrentUserIdFromJwt() {
  try {
    const raw = localStorage.getItem("md-school-offline-user");
    return raw || "anonymous";
  } catch { return "anonymous"; }
}

export function setOfflineUserId(userId: string | null) {
  try {
    if (userId) localStorage.setItem("md-school-offline-user", userId);
    else localStorage.removeItem("md-school-offline-user");
  } catch { /* storage can be unavailable */ }
}

export function isOffline() { return typeof navigator !== "undefined" && navigator.onLine === false; }
