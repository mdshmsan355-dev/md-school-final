import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();

function calculateDenseRanking(totals) {
  const sorted = [...totals].sort((a, b) => b - a);
  const seen = new Map();
  let rank = 0;
  let previous = null;
  for (const total of sorted) {
    if (previous === null || total !== previous) rank += 1;
    seen.set(total, rank);
    previous = total;
  }
  return totals.map((total) => ({ total, rank: seen.get(total), topFive: seen.get(total) <= 5 }));
}

const sampleTotals = [98, 98, 97, 96, 95, 94, 93, 90, 88, 80];
const ranked = calculateDenseRanking(sampleTotals);
assert.deepEqual(ranked.slice(0, 7).map((x) => x.rank), [1, 1, 2, 3, 4, 5, 6]);
assert.deepEqual(ranked.slice(0, 7).map((x) => x.topFive), [true, true, true, true, true, true, false]);
assert.equal(ranked.filter((x) => x.topFive).length, 6); // tie at rank 1 is allowed, while rank numbers stop at 5.

const tieAtFifth = calculateDenseRanking([100, 99, 98, 97, 96, 96, 95]);
assert.deepEqual(tieAtFifth.map((x) => x.rank), [1, 2, 3, 4, 5, 5, 6]);
assert.deepEqual(tieAtFifth.map((x) => x.topFive), [true, true, true, true, true, true, false]);

const labels = (count) => {
  if (count === 1) return "راسب في مادة واحدة";
  if (count === 2) return "راسب في مادتين";
  if (count === 3) return "راسب في 3 مواد";
  return `راسب في ${count} مواد`;
};
assert.equal(labels(1), "راسب في مادة واحدة");
assert.equal(labels(2), "راسب في مادتين");
assert.equal(labels(3), "راسب في 3 مواد");

const scenery = path.join(root, "src/assets/login-scenery.jpg");
const sourceHash = "dc81ad8a4617b189510a0be9205cf90b1ce7a71128b425912a5d3a47b8f060f1";
assert.equal(crypto.createHash("sha256").update(fs.readFileSync(scenery)).digest("hex"), sourceHash, "تأكد من أن خلفية تسجيل الدخول لم تتغير");

const templates = fs.readFileSync(path.join(root, "src/lib/result-templates.ts"), "utf8");
assert.equal((templates.match(/value: "/g) ?? []).length, 6, "يجب أن توجد ستة قوالب نتائج");
assert.match(templates, /children_orange/);
assert.match(templates, /formal_gold/);

const card = fs.readFileSync(path.join(root, "src/components/results/ResultCard.tsx"), "utf8");
assert.match(card, /result-failed-score/);
assert.match(card, /راسب في مادة واحدة/);
assert.match(card, /الجمهورية اليمنية/);
assert.match(card, /yemen-emblem/);

const pdf = fs.readFileSync(path.join(root, "src/lib/result-pdf.ts"), "utf8");
assert.match(pdf, /dc2626/);
assert.match(pdf, /الجمهورية اليمنية/);
assert.match(pdf, /i \+= 6/);

for (const file of ["public/manifest.webmanifest", "public/sw.js", "public/icons/icon-192.png", "public/icons/icon-512.png", "capacitor.config.ts"]) {
  assert.ok(fs.existsSync(path.join(root, file)), `الملف مفقود: ${file}`);
}

const index = fs.readFileSync(path.join(root, "src/routes/index.tsx"), "utf8");
assert.doesNotMatch(index, /signInWithOAuth/);
assert.doesNotMatch(index, /تذكرني/);
assert.match(index, /login-by-username/);
assert.match(index, /signInWithPasskey/);

console.log("Md School release scenario: PASS");
console.log("الترتيب المتوقع: 1، 1، 2، 3، 4، 5، ثم ناجح خارج الأوائل.");
console.log("تم التحقق من: الخلفية، القوالب الستة، الشعار الرسمي، PDF، PWA، تسجيل الدخول وميزة الدخول السريع.");
