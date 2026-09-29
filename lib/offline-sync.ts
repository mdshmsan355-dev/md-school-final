import { deleteOutbox, getOutbox, type OfflineOutboxItem } from "./offline-store";

let syncing = false;

export async function syncOfflineQueue(userId: string) {
  if (syncing || typeof navigator === "undefined" || !navigator.onLine) return { synced: 0, failed: 0 };
  syncing = true;
  let synced = 0;
  let failed = 0;
  try {
    const items = await getOutbox(userId);
    for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
      if (item.id == null) continue;
      try {
        const headers = new Headers(item.headers);
        const response = await fetch(item.url, { method: item.method, headers, body: item.body });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await deleteOutbox(item.id);
        synced += 1;
      } catch {
        failed += 1;
        break;
      }
    }
  } finally {
    syncing = false;
  }
  return { synced, failed };
}

export function registerOfflineSync(userId: string, onSynced?: (result: { synced: number; failed: number }) => void) {
  const run = () => { void syncOfflineQueue(userId).then((result) => onSynced?.(result)); };
  window.addEventListener("online", run);
  if (navigator.onLine) run();
  return () => window.removeEventListener("online", run);
}
