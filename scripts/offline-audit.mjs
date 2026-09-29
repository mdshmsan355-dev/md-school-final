import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const mustExist = [
  "src/lib/offline-store.ts",
  "src/lib/offline-sync.ts",
  "src/components/pwa/OfflineStatus.tsx",
  "public/sw.js",
  "public/manifest.webmanifest",
];
for (const file of mustExist) assert.ok(fs.existsSync(path.join(root, file)), `ملف Offline مفقود: ${file}`);
const client = fs.readFileSync(path.join(root, "src/integrations/supabase/client.ts"), "utf8");
assert.match(client, /cacheResponse/);
assert.match(client, /getCachedResponse/);
assert.match(client, /queueMutation/);
assert.match(client, /x-md-school-offline-queued/);
const rootRoute = fs.readFileSync(path.join(root, "src/routes/__root.tsx"), "utf8");
assert.match(rootRoute, /OfflineStatus/);
const authRoute = fs.readFileSync(path.join(root, "src/routes/_authenticated.tsx"), "utf8");
assert.match(authRoute, /getSession/);
const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
assert.match(sw, /md-school-shell-v2/);
console.log("Md School offline-first static audit: PASS");
console.log("IndexedDB cache + outbox, offline session fallback, PWA shell and reconnect sync are present.");
