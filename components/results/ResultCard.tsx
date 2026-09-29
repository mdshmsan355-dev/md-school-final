import type { CalculatedResult } from "@/lib/result-calculations";
import { cn } from "@/lib/utils";
import { isChildrenTemplate, type ResultTemplate } from "@/lib/result-templates";
import emblem from "@/assets/yemen-emblem.png";

const templateClasses: Record<ResultTemplate, string> = {
  children_blue: "result-template-children result-template-children-blue",
  children_green: "result-template-children result-template-children-green",
  children_orange: "result-template-children result-template-children-orange",
  formal_blue: "result-template-formal result-template-formal-blue",
  formal_green: "result-template-formal result-template-formal-green",
  formal_gold: "result-template-formal result-template-formal-gold",
};

const periodLabels: Record<string, string> = {
  "النصف الأول": "النصف الأول",
  "النصف الثاني": "النصف الثاني",
  "النتيجة النهائية": "النتيجة النهائية",
};

function failedSubjectsLabel(count: number) {
  if (count <= 0) return "";
  if (count === 1) return "راسب في مادة واحدة";
  if (count === 2) return "راسب في مادتين";
  if (count === 3) return "راسب في 3 مواد";
  if (count === 10) return "راسب في 10 مواد";
  if (count >= 11 && count <= 99) return `راسب في ${count} مادة`;
  return `راسب في ${count} مواد`;
}

export function ResultCard({ result, schoolName, gradeName, sectionName, yearName, periodName, template }: { result: CalculatedResult; schoolName: string; gradeName: string; sectionName: string; yearName: string; periodName: string; template: ResultTemplate }) {
  const children = isChildrenTemplate(template);
  const isFirstTerm = periodName === "النصف الأول";
  const status = result.complete ? (result.passed ? "ناجح" : "راسب") : "غير مكتمل";
  const statusDetail = result.complete && !result.passed ? failedSubjectsLabel(result.failedSubjectCount) : result.complete && result.passed ? "مبارك لك هذا النجاح والتفوق" : "لم تكتمل درجات جميع المواد";
  return (
    <article className={cn("official-result-card", templateClasses[template])} dir="rtl">
      {children && <div className="result-decor result-decor-top" aria-hidden="true"><span>✦</span><span>☀</span><span>✦</span></div>}
      <header className="result-official-header">
        <div className="result-government"><strong>الجمهورية اليمنية</strong><span>وزارة التربية والتعليم</span></div>
        <img src={emblem} alt="شعار الجمهورية اليمنية" className="result-emblem" />
        <div className="result-header-side">{children ? "بالعلم نبني المستقبل" : "التعليم نحو مستقبل أفضل"}</div>
      </header>

      <div className="result-school-heading">
        <h2>{schoolName}</h2>
        <p>{children ? "تعليم نوعي .. لبناء جيل مبدع" : "بطاقة نتائج الطالب"}</p>
        <div className="result-title-pill">بطاقة نتائج الطالب</div>
        <span className="result-academic-badge">{periodLabels[periodName] ?? periodName} — العام الدراسي {yearName}</span>
      </div>

      <section className="result-student-info" aria-label="بيانات الطالب">
        <div><b>اسم الطالب</b><span>{result.student.full_name}</span></div>
        <div><b>رقم الطالب</b><span>{result.student.student_number}</span></div>
        <div><b>الصف</b><span>{gradeName}</span></div>
        <div><b>الشعبة</b><span>{result.student.section_name || sectionName}</span></div>
      </section>

      <table className="result-scores">
        <thead><tr><th>م</th><th>المادة</th><th>الدرجة العظمى</th><th>درجة الطالب</th><th>النسبة المئوية</th></tr></thead>
        <tbody>
          {result.subjectScores.map((item, index) => {
            const maximum = result.maximum / Math.max(1, result.subjectScores.length);
            const percentage = item.complete && maximum ? (item.score / maximum) * 100 : null;
            return <tr key={item.subject.id} className={item.complete && !item.passed ? "result-failed-subject" : undefined}>
              <td>{index + 1}</td><td>{item.subject.name}</td><td>{maximum % 1 === 0 ? maximum : maximum.toFixed(1)}</td>
              <td>{item.complete ? <span className={item.passed ? undefined : "result-failed-score"}>{item.score}</span> : "—"}</td>
              <td>{percentage === null ? "—" : <span className={item.passed ? undefined : "result-failed-score result-failed-percentage"}>{percentage.toFixed(0)}%</span>}</td>
            </tr>;
          })}
        </tbody>
        <tfoot><tr><th colSpan={2}>المجموع الكلي</th><th>{result.maximum}</th><th>{result.total}</th><th>{result.percentage.toFixed(0)}%</th></tr></tfoot>
      </table>

      <section className="result-summary-grid">
        <div className="result-average-ring" style={{ "--result-level": `${Math.round(Math.max(0, Math.min(100, result.percentage)) * 3.6)}deg` } as React.CSSProperties}><span>{result.percentage.toFixed(0)}%</span><small>المعدل العام</small></div>
        <div className={cn("result-summary-box result-summary-status", result.complete && !result.passed && "result-summary-failed")}><b>النتيجة</b><strong>{status}</strong><small>{statusDetail}</small></div>
        <div className="result-summary-box"><b>الترتيب</b><strong>{isFirstTerm && result.complete && result.passed && result.isTopFive ? result.rank : "—"}</strong><small>{isFirstTerm && result.complete && result.passed && result.isTopFive ? (result.repeatedRank ? "مكرر" : "ضمن الأوائل") : ""}</small></div>
        <div className="result-summary-box"><b>المجموع الكلي</b><strong>{result.total} / {result.maximum}</strong><small>النسبة المئوية {result.percentage.toFixed(0)}%</small></div>
      </section>

      <footer className="result-signatures">
        <div><span>مدير المدرسة</span><b>________________</b></div>
        <div className="result-seal"><span>الختم الرسمي</span><b>◯</b></div>
        <div><span>معلم الصف</span><b>________________</b></div>
      </footer>
      {children && <div className="result-decor result-decor-bottom" aria-hidden="true"><span>✦</span><span>📚</span><span>✦</span></div>}
    </article>
  );
}
