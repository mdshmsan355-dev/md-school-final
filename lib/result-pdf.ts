import type { CalculatedResult } from "./result-calculations";
import { isChildrenTemplate, templateAccent, type ResultTemplate } from "./result-templates";
import emblemUrl from "@/assets/yemen-emblem.png";

export type { ResultTemplate } from "./result-templates";
type PdfMeta = { schoolName: string; gradeName: string; sectionName: string; yearName: string; periodName: string; template: ResultTemplate };
const W = 1240, H = 1754;

function concat(...arrs: Uint8Array[]) { const n = arrs.reduce((s, a) => s + a.length, 0); const out = new Uint8Array(n); let p = 0; for (const a of arrs) { out.set(a, p); p += a.length; } return out; }
async function jpeg(canvas: HTMLCanvasElement) { return new Uint8Array(await (await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("تعذر إنشاء الصورة")), "image/jpeg", .95))).arrayBuffer()); }
function pdfFromJpegs(images: Uint8Array[]) { const enc = new TextEncoder(); const chunks: Uint8Array[] = [enc.encode("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n")]; let offset = chunks[0].length; const push = (x: Uint8Array) => { chunks.push(x); offset += x.length; }; let obj = 1; const catalog = obj++, pages = obj++; const imageIds = images.map(() => obj++), contentIds = images.map(() => obj++), pageIds = images.map(() => obj++); const objects: { id: number; data: Uint8Array }[] = []; objects.push({ id: catalog, data: enc.encode(`<< /Type /Catalog /Pages ${pages} 0 R >>`) }); objects.push({ id: pages, data: enc.encode(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${images.length} >>`) }); images.forEach((img, i) => { objects.push({ id: imageIds[i], data: concat(enc.encode(`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`), img, enc.encode("\nendstream")) }); const stream = enc.encode(`q\n${W} 0 0 ${H} 0 0 cm\n/Im${i + 1} Do\nQ\n`); objects.push({ id: contentIds[i], data: concat(enc.encode(`<< /Length ${stream.length} >>\nstream\n`), stream, enc.encode("endstream")) }); objects.push({ id: pageIds[i], data: enc.encode(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im${i + 1} ${imageIds[i]} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`) }); }); objects.sort((a, b) => a.id - b.id); const offsets: number[] = []; for (const o of objects) { offsets[o.id] = offset; push(enc.encode(`${o.id} 0 obj\n`)); push(o.data); push(enc.encode("\nendobj\n")); } const xref = offset; push(enc.encode(`xref\n0 ${obj}\n0000000000 65535 f \n`)); for (let i = 1; i < obj; i++) push(enc.encode(`${String(offsets[i] ?? 0).padStart(10, "0")} 00000 n \n`)); push(enc.encode(`trailer\n<< /Size ${obj} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`)); return concat(...chunks); }

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRound(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) { roundedRect(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
function strokeRound(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, stroke: string, width = 1) { roundedRect(ctx, x, y, w, h, r); ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
function loadImage(src: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("تعذر تحميل الشعار")); img.src = src; }); }

async function drawCard(ctx: CanvasRenderingContext2D, emblem: HTMLImageElement, r: CalculatedResult, x: number, y: number, w: number, h: number, meta: PdfMeta) {
  const accent = templateAccent(meta.template), dark = accent, soft = meta.template === "children_blue" ? "#e9f6ff" : meta.template === "children_green" ? "#eaf9ef" : meta.template === "children_orange" ? "#fff5e5" : meta.template === "formal_green" ? "#edf8f1" : meta.template === "formal_gold" ? "#fff6e7" : "#edf5fc";
  const children = isChildrenTemplate(meta.template);
  ctx.save(); ctx.direction = "rtl";
  fillRound(ctx, x, y, w, h, children ? 28 : 16, "#ffffff");
  ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(x + 30, y + h - 18, 100, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x + w - 25, y + 22, 90, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  strokeRound(ctx, x, y, w, h, children ? 28 : 16, accent, children ? 4 : 3);
  if (children) { ctx.fillStyle = accent; for (const [dx, dy, s] of [[22, 20, 7], [w - 26, 28, 5], [34, h - 28, 6], [w - 38, h - 25, 7]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, s, 0, Math.PI * 2); ctx.fill(); } }

  const headerY = y + 22;
  ctx.textAlign = "right"; ctx.fillStyle = dark; ctx.font = "700 16px Arial"; ctx.fillText("الجمهورية اليمنية", x + w - 18, headerY + 12); ctx.font = "600 12px Arial"; ctx.fillText("وزارة التربية والتعليم", x + w - 18, headerY + 28);
  ctx.drawImage(emblem, x + w / 2 - 34, headerY - 3, 68, 55);
  ctx.textAlign = "left"; ctx.font = "700 12px Arial"; ctx.fillText(children ? "بالعلم نبني المستقبل" : "التعليم نحو مستقبل أفضل", x + 18, headerY + 18);

  ctx.textAlign = "center"; ctx.fillStyle = dark; ctx.font = "700 22px Arial"; ctx.fillText(meta.schoolName, x + w / 2, y + 91); ctx.font = "600 11px Arial"; ctx.fillText(children ? "تعليم نوعي .. لبناء جيل مبدع" : "بطاقة نتائج الطالب", x + w / 2, y + 108);
  fillRound(ctx, x + w / 2 - 78, y + 116, 156, 28, 14, accent); ctx.fillStyle = "#fff"; ctx.font = "700 15px Arial"; ctx.fillText("بطاقة نتائج الطالب", x + w / 2, y + 135);
  fillRound(ctx, x + w / 2 - 92, y + 150, 184, 21, 8, soft); ctx.fillStyle = dark; ctx.font = "700 9px Arial"; ctx.fillText(`${meta.periodName} — العام الدراسي ${meta.yearName}`, x + w / 2, y + 164);

  const infoY = y + 179, infoH = 30, gap = 5, infoW = (w - 36 - gap * 3) / 4;
  const infos = [["اسم الطالب", r.student.full_name], ["رقم الطالب", String(r.student.student_number)], ["الصف", meta.gradeName], ["الشعبة", r.student.section_name || meta.sectionName]];
  infos.forEach((item, i) => { const xx = x + 18 + i * (infoW + gap); fillRound(ctx, xx, infoY, infoW, infoH, 7, soft); strokeRound(ctx, xx, infoY, infoW, infoH, 7, accent, 1); ctx.textAlign = "right"; ctx.fillStyle = dark; ctx.font = "700 8px Arial"; ctx.fillText(item[0], xx + infoW - 6, infoY + 11); ctx.font = "600 8px Arial"; ctx.fillText(item[1], xx + infoW - 6, infoY + 23); });

  const tableX = x + 16, tableY = y + 217, tableW = w - 32, footerY = y + h - 78, available = footerY - tableY - 8, rowH = Math.max(10, Math.min(23, available / (r.subjectScores.length + 1)));
  const col = [0.07, 0.40, 0.17, 0.18, 0.18];
  fillRound(ctx, tableX, tableY, tableW, rowH, 5, accent);
  const headers = ["م", "المادة", "الدرجة العظمى", "درجة الطالب", "النسبة المئوية"];
  let cursor = tableX;
  ctx.font = `700 ${Math.max(7, Math.min(10, rowH * .45))}px Arial`; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  headers.forEach((head, i) => { const cw = tableW * col[i]; ctx.fillText(head, cursor + cw / 2, tableY + rowH * .65); cursor += cw; });
  const maximumPerSubject = r.subjectScores.length ? r.maximum / r.subjectScores.length : 0;
  r.subjectScores.forEach((item, index) => {
    const yy = tableY + rowH * (index + 1); if (index % 2 === 0) { ctx.fillStyle = soft; ctx.fillRect(tableX, yy, tableW, rowH); }
    const percentage = item.complete && maximumPerSubject ? item.score / maximumPerSubject * 100 : null;
    const vals = [String(index + 1), item.subject.name, String(maximumPerSubject % 1 === 0 ? maximumPerSubject : maximumPerSubject.toFixed(1)), item.complete ? String(item.score) : "—", percentage === null ? "—" : `${percentage.toFixed(0)}%`];
    cursor = tableX; ctx.font = `${Math.max(7, Math.min(10, rowH * .43))}px Arial`; vals.forEach((value, i) => { const cw = tableW * col[i]; ctx.fillStyle = i === 1 ? "#23405d" : "#34526d"; ctx.textAlign = "center"; ctx.fillText(value, cursor + cw / 2, yy + rowH * .65); if (i === 3 && item.complete && !item.passed) { ctx.save(); ctx.strokeStyle = "#dc2626"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cursor + cw / 2, yy + rowH * .56, Math.min(cw * .32, rowH * .38), rowH * .38, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } cursor += cw; });
    ctx.strokeStyle = "#dbe4ec"; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(tableX, yy + rowH); ctx.lineTo(tableX + tableW, yy + rowH); ctx.stroke();
  });
  const totalY = tableY + rowH * (r.subjectScores.length + 1); ctx.fillStyle = dark; ctx.fillRect(tableX, totalY, tableW, rowH); ctx.fillStyle = "#fff"; ctx.font = `700 ${Math.max(8, Math.min(11, rowH * .45))}px Arial`; ctx.textAlign = "center"; ctx.fillText("المجموع الكلي", tableX + tableW * .235, totalY + rowH * .65); ctx.fillText(String(r.maximum), tableX + tableW * .555, totalY + rowH * .65); ctx.fillText(String(r.total), tableX + tableW * .73, totalY + rowH * .65); ctx.fillText(`${r.percentage.toFixed(0)}%`, tableX + tableW * .91, totalY + rowH * .65);

  const summaryY = footerY - 4, boxH = 49, boxGap = 6, boxW = (tableW - boxGap * 3) / 4;
  const isFirstTerm = meta.periodName === "النصف الأول";
  const rank = isFirstTerm && r.complete && r.passed && r.isTopFive ? `${r.rank}${r.repeatedRank ? " مكرر" : ""}` : "—";
  const failedSubjectsLabel = (count: number) => count === 1 ? "راسب في مادة واحدة" : count === 2 ? "راسب في مادتين" : count === 3 ? "راسب في 3 مواد" : count === 10 ? "راسب في 10 مواد" : count >= 11 && count <= 99 ? `راسب في ${count} مادة` : `راسب في ${count} مواد`;
  const statusDetail = r.complete && !r.passed ? failedSubjectsLabel(r.failedSubjectCount) : r.complete && r.passed ? "مبارك لك هذا النجاح والتفوق" : "لم تكتمل درجات جميع المواد";
  const boxes = [["المعدل العام", `${r.percentage.toFixed(0)}%`], ["النتيجة", r.complete ? (r.passed ? "ناجح" : "راسب") : "غير مكتمل"], ["الترتيب", rank], ["المجموع الكلي", `${r.total} / ${r.maximum}`]];
  boxes.forEach((box, i) => { const xx = tableX + i * (boxW + boxGap); const failed = i === 1 && r.complete && !r.passed; fillRound(ctx, xx, summaryY, boxW, boxH, 8, failed ? "#fff6f6" : soft); strokeRound(ctx, xx, summaryY, boxW, boxH, 8, failed ? "#dc2626" : accent, 1.2); ctx.textAlign = "center"; ctx.fillStyle = failed ? "#b91c1c" : dark; ctx.font = "700 8px Arial"; ctx.fillText(box[0], xx + boxW / 2, summaryY + 13); ctx.font = `700 ${i === 1 ? 16 : 13}px Arial`; ctx.fillText(box[1], xx + boxW / 2, summaryY + 31); ctx.font = "600 7px Arial"; ctx.fillStyle = failed ? "#b91c1c" : "#5c7288"; ctx.fillText(i === 1 ? statusDetail : i === 2 && rank !== "—" ? (r.repeatedRank ? "مكرر" : "ضمن الأوائل") : "", xx + boxW / 2, summaryY + 42); });

  const signY = y + h - 18; ctx.fillStyle = dark; ctx.font = "600 8px Arial"; ctx.textAlign = "center"; ctx.fillText("مدير المدرسة", x + 100, signY); ctx.fillText("الختم الرسمي", x + w / 2, signY); ctx.fillText("معلم الصف", x + w - 100, signY); ctx.restore();
}

export async function downloadResultsPdf(results: CalculatedResult[], meta: PdfMeta) {
  if (!results.length) throw new Error("لا توجد نتائج لإنشاء PDF");
  const pages: CalculatedResult[][] = []; for (let i = 0; i < results.length; i += 6) pages.push(results.slice(i, i + 6));
  const emblem = await loadImage(emblemUrl); const imgs: Uint8Array[] = [];
  for (const batch of pages) { const c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d"); if (!ctx) throw new Error("تعذر إنشاء صفحة PDF"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); const cw = 580, ch = 548; for (let i = 0; i < batch.length; i++) await drawCard(ctx, emblem, batch[i], 40 + (i % 2) * 620, 35 + Math.floor(i / 2) * 570, cw, ch, meta); imgs.push(await jpeg(c)); }
  const bytes = pdfFromJpegs(imgs); const blob = new Blob([bytes], { type: "application/pdf" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `نتائج-${meta.gradeName}-${meta.periodName}.pdf`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
