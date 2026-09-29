import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ResultCard } from "@/components/results/ResultCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResultData } from "@/hooks/useResultData";
import { supabase } from "@/integrations/supabase/client";
import { downloadResultsPdf } from "@/lib/result-pdf";
import { type ResultTemplate } from "@/lib/result-templates";
import { ResultTemplatePicker } from "@/components/results/ResultTemplatePicker";

export const Route = createFileRoute("/_authenticated/_shell/issue-results")({ head: () => ({ meta: [{ title: "إصدار النتائج | Md School" }] }), component: IssueResultsPage });

function IssueResultsPage() {
  const data = useResultData();
  const [template, setTemplate] = useState<ResultTemplate>("formal_blue");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const gradeName = data.grades.find(g => g.id === data.gradeId)?.name ?? "";
  const sectionName = data.sections.find(s => s.id === data.sectionId)?.name ?? "كل الشعب";
  const periodName = data.period === "first" ? "النصف الأول" : data.period === "second" ? "النصف الثاني" : "النتيجة النهائية";

  useEffect(() => {
    void (async () => {
      if (!data.school || !data.gradeId) return;
      const { data: row } = await supabase.from("result_template_settings").select("template").eq("school_id", data.school.id).eq("grade_level_id", data.gradeId).eq("term", data.period).maybeSingle();
      setTemplate((row?.template as ResultTemplate | undefined) ?? "formal_blue");
    })();
  }, [data.school?.id, data.gradeId, data.period]);

  async function saveTemplate() {
    if (!data.gradeId) return;
    setSavingTemplate(true);
    const { error } = await supabase.rpc("save_result_template", { p_grade_id: data.gradeId, p_term: data.period, p_template: template });
    setSavingTemplate(false);
    if (error) toast.error(error.message); else toast.success("تم حفظ القالب لهذا الصف والفترة");
  }

  async function issue() {
    if (!data.school || !data.activeYear || !data.gradeId || !data.results.length) { toast.error("اختر الصف والفترة التي تحتوي على نتائج"); return; }
    if (data.results.some((result) => !result.complete)) { toast.error("لا يمكن إصدار النتيجة قبل اكتمال درجات جميع المواد للطلاب المحددين"); return; }
    try {
      const snapshot = {
        version: 1,
        issuedAt: new Date().toISOString(),
        schoolName: data.school.name,
        yearName: data.activeYear.name,
        gradeId: data.gradeId,
        gradeName,
        sectionId: data.sectionId || null,
        sectionName,
        period: data.period,
        template,
        results: data.results.map(r => ({
          student: r.student,
          subjectScores: r.subjectScores.map(x => ({ subject: x.subject, score: x.score, passed: x.passed, complete: x.complete })),
          total: r.total, maximum: r.maximum, percentage: r.percentage, passed: r.passed, complete: r.complete,
          rank: r.rank, repeatedRank: r.repeatedRank, isTopFive: r.isTopFive,
        })),
      };
      const { error: issueError } = await supabase.rpc("issue_result_snapshot", {
        p_academic_year_id: data.activeYear.id,
        p_grade_level_id: data.gradeId,
        p_section_id: data.sectionId || null,
        p_term: data.period,
        p_template: template,
        p_results_count: data.results.length,
        p_scope: data.sectionId ? "section" : "grade",
        p_snapshot: snapshot,
      });
      if (issueError) throw issueError;
      await downloadResultsPdf(data.results, { schoolName: data.school.name, gradeName, sectionName, yearName: data.activeYear.name, periodName, template });
      toast.success("تم إصدار النتيجة وحفظ نسخة رسمية ثابتة وإنشاء PDF");
    } catch (e) { toast.error(e instanceof Error ? e.message : "تعذر إصدار النتائج"); }
  }

  return <div className="space-y-6"><div className="print-hidden"><PageHeader title="إصدار النتائج" description="معاينة وإصدار وثائق النتائج الرسمية باسم المدرسة." actions={<Button onClick={() => void issue()}><FileDown className="size-4"/>إصدار وحفظ PDF</Button>}/><Card className="mt-6"><CardContent className="grid gap-3 pt-6 sm:grid-cols-5"><div className="sm:col-span-5"><ResultTemplatePicker value={template} onChange={setTemplate}/></div><Button variant="outline" onClick={()=>void saveTemplate()} disabled={!data.gradeId||savingTemplate}><Save className="size-4"/>{savingTemplate?"جارٍ الحفظ...":"حفظ القالب"}</Button><Select value={data.gradeId} onValueChange={data.setGradeId}><SelectTrigger><SelectValue placeholder="الصف"/></SelectTrigger><SelectContent>{data.activeGrades.map(g=><SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select><Select value={data.sectionId||"all"} onValueChange={v=>data.setSectionId(v==="all"?"":v)}><SelectTrigger><SelectValue placeholder="الشعبة"/></SelectTrigger><SelectContent><SelectItem value="all">كل الشعب</SelectItem>{data.sectionOptions.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><Select value={data.period} onValueChange={v=>data.setPeriod(v as "first"|"second"|"final")}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="first">النصف الأول</SelectItem><SelectItem value="second">النصف الثاني</SelectItem><SelectItem value="final">النهائي</SelectItem></SelectContent></Select></CardContent></Card></div><section className="results-print-sheet">{data.results.map(r=><ResultCard key={r.student.id} result={r} schoolName={data.school?.name??""} gradeName={gradeName} sectionName={sectionName} yearName={data.activeYear?.name??""} periodName={periodName} template={template}/>)}</section></div>;
}
