import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_shell/grades")({
  head: () => ({ meta: [{ title: "تسجيل الدرجات | Md School" }, { name: "description", content: "إدخال درجات الطلاب لكل مادة وفترة دراسية." }, { property: "og:title", content: "تسجيل الدرجات | Md School" }, { property: "og:description", content: "إدخال درجات الطلاب لكل مادة وفترة دراسية." }] }),
  component: GradesPage,
});

type SectionRow = { id: string; name: string; grade_level_id: string };
type StudentRow = { id: string; full_name: string; student_number: number };
type SubjectRow = { id: string; name: string; sort_order: number };
type ScoreValue = { exam: number | null; coursework: number | null };

function GradesPage() {
  const { school, activeYear, grades } = useSchool();
  const activeGrades = grades.filter((grade) => grade.academic_year_id === activeYear?.id);
  const [gradeId, setGradeId] = useState(""); const [sectionId, setSectionId] = useState(""); const [term, setTerm] = useState<"first" | "second">("first");
  const [sections, setSections] = useState<SectionRow[]>([]); const [students, setStudents] = useState<StudentRow[]>([]); const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [values, setValues] = useState<Record<string, ScoreValue>>({}); const [saving, setSaving] = useState(false);
  useEffect(() => { void supabase.from("sections").select("id,name,grade_level_id").then(({ data }) => setSections(data ?? [])); }, []);
  useEffect(() => {
    setSectionId(""); setStudents([]); setValues({});
    if (!gradeId) { setSubjects([]); return; }
    void supabase.from("subjects").select("id,name,sort_order").eq("grade_level_id", gradeId).order("sort_order").then(({ data }) => setSubjects(data ?? []));
  }, [gradeId]);
  useEffect(() => {
    if (!sectionId || !activeYear) { setStudents([]); return; }
    void supabase.from("student_enrollments").select("students(id,full_name,student_number)").eq("academic_year_id", activeYear.id).eq("section_id", sectionId).then(({ data }) => {
      setStudents((data ?? []).flatMap((row) => { const item = Array.isArray(row.students) ? row.students[0] : row.students; return item ? [{ ...item, student_number: Number(item.student_number) }] : []; }));
    });
  }, [sectionId, activeYear?.id]);
  useEffect(() => {
    if (!activeYear || students.length === 0 || subjects.length === 0) { setValues({}); return; }
    void supabase.from("scores").select("student_id,subject_id,exam_score,coursework_score").eq("academic_year_id", activeYear.id).eq("term", term).in("student_id", students.map((s) => s.id)).then(({ data }) => {
      const next: Record<string, ScoreValue> = {};
      for (const score of data ?? []) next[`${score.student_id}:${score.subject_id}`] = { exam: score.exam_score === null ? null : Number(score.exam_score), coursework: score.coursework_score === null ? null : Number(score.coursework_score) };
      setValues(next);
    });
  }, [students, subjects, term, activeYear?.id]);
  const sectionOptions = useMemo(() => sections.filter((section) => section.grade_level_id === gradeId), [sections, gradeId]);
  function update(studentId: string, subjectId: string, part: keyof ScoreValue, raw: string) { const value = raw === "" ? null : Number(raw); setValues((current) => ({ ...current, [`${studentId}:${subjectId}`]: { exam: current[`${studentId}:${subjectId}`]?.exam ?? null, coursework: current[`${studentId}:${subjectId}`]?.coursework ?? null, [part]: value } })); }
  async function save() {
    if (!school || !activeYear || students.length === 0 || subjects.length === 0) return;
    for (const value of Object.values(values)) {
      if (value.exam !== null && (!Number.isFinite(value.exam) || value.exam < 0 || value.exam > school.exam_max)) { toast.error(`درجة الاختبار يجب أن تكون بين 0 و${school.exam_max}`); return; }
      if (value.coursework !== null && (!Number.isFinite(value.coursework) || value.coursework < 0 || value.coursework > school.coursework_max)) { toast.error(`درجة المحصلة يجب أن تكون بين 0 و${school.coursework_max}`); return; }
    }
    setSaving(true);
    const rows = students.flatMap((student) => subjects.map((subject) => ({ school_id: school.id, academic_year_id: activeYear.id, student_id: student.id, subject_id: subject.id, term, exam_score: values[`${student.id}:${subject.id}`]?.exam ?? null, coursework_score: values[`${student.id}:${subject.id}`]?.coursework ?? null })));
    const { error } = await supabase.from("scores").upsert(rows, { onConflict: "academic_year_id,student_id,subject_id,term" });
    setSaving(false); if (error) toast.error(error.message); else toast.success("تم حفظ الدرجات");
  }
  return <div className="space-y-6"><PageHeader title="تسجيل الدرجات" description={`الاختبار من ${school?.exam_max ?? 30}، والمحصلة من ${school?.coursework_max ?? 20}. ${activeYear?.is_closed ? "العام مغلق — لا يمكن تعديل الدرجات." : "الخانة الفارغة تعني أن الدرجة لم تُدخل بعد."}`} actions={<Button onClick={save} disabled={saving || students.length === 0 || !!activeYear?.is_closed}><Save className="size-4" />{saving ? "جارٍ الحفظ..." : "حفظ الدرجات"}</Button>} />
    <Card><CardContent className="grid gap-3 pt-6 sm:grid-cols-3"><Select value={gradeId} onValueChange={setGradeId}><SelectTrigger><SelectValue placeholder="الصف" /></SelectTrigger><SelectContent>{activeGrades.map((grade) => <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>)}</SelectContent></Select><Select value={sectionId} onValueChange={setSectionId}><SelectTrigger><SelectValue placeholder="الشعبة" /></SelectTrigger><SelectContent>{sectionOptions.map((section) => <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>)}</SelectContent></Select><Select value={term} onValueChange={(value) => setTerm(value as "first" | "second")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="first">النصف الأول</SelectItem><SelectItem value="second">النصف الثاني</SelectItem></SelectContent></Select></CardContent></Card>
    <Card><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead className="sticky right-0 min-w-40 bg-card text-right">الطالب</TableHead>{subjects.map((subject) => <TableHead key={subject.id} className="min-w-36 text-center">{subject.name}<span className="block text-support-xs">اختبار / محصلة</span></TableHead>)}</TableRow></TableHeader><TableBody>{students.map((student) => <TableRow key={student.id}><TableCell className="sticky right-0 bg-card font-medium">{student.full_name}</TableCell>{subjects.map((subject) => { const key = `${student.id}:${subject.id}`; return <TableCell key={subject.id}><div className="grid grid-cols-2 gap-1"><Input aria-label={`اختبار ${subject.name} للطالب ${student.full_name}`} type="number" min={0} max={school?.exam_max ?? 30} value={values[key]?.exam ?? ""} onChange={(e) => update(student.id, subject.id, "exam", e.target.value)} className="text-center" /><Input aria-label={`محصلة ${subject.name} للطالب ${student.full_name}`} type="number" min={0} max={school?.coursework_max ?? 20} value={values[key]?.coursework ?? ""} onChange={(e) => update(student.id, subject.id, "coursework", e.target.value)} className="text-center" /></div></TableCell>; })}</TableRow>)}</TableBody></Table>{sectionId && students.length === 0 ? <p className="py-10 text-center text-muted-foreground">لا يوجد طلاب في هذه الشعبة.</p> : null}{!sectionId ? <p className="py-10 text-center text-muted-foreground">اختر الصف والشعبة لعرض شبكة الدرجات.</p> : null}</CardContent></Card>
  </div>;
}