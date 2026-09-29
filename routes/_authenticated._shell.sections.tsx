import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Plus, Rows3, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlySupabaseError } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/_shell/sections")({
  head: () => ({
    meta: [
      { title: "الشعب | Md School" },
      { name: "description", content: "إدارة شعب كل صف داخل المدرسة في Md School." },
      { property: "og:title", content: "الشعب | Md School" },
      { property: "og:description", content: "إدارة شعب كل صف داخل المدرسة." },
    ],
  }),
  component: SectionsPage,
});

type SectionRow = { id: string; name: string; grade_level_id: string };
function SectionsPage() {
  const { school, grades, activeYear } = useSchool();
  const activeGrades = grades.filter((grade) => grade.academic_year_id === activeYear?.id);
  const [gradeId, setGradeId] = useState(""); const [name, setName] = useState(""); const [editId, setEditId] = useState(""); const [rows, setRows] = useState<SectionRow[]>([]);
  const visibleRows = rows.filter(row => activeGrades.some(grade => grade.id === row.grade_level_id));
  async function load() { const { data } = await supabase.from("sections").select("id,name,grade_level_id").order("created_at"); setRows(data ?? []); }
  useEffect(() => { void load(); }, []);
  async function save() { if (!school || !gradeId || !name.trim()) { toast.error("أكمل الصف واسم الشعبة"); return; } const payload={school_id:school.id,grade_level_id:gradeId,name:name.trim()}; const { error }=editId?await supabase.from("sections").update(payload).eq("id",editId):await supabase.from("sections").insert(payload); if (error) toast.error(friendlySupabaseError(error)); else { setName(""); setEditId(""); toast.success(editId?"تم تعديل الشعبة":"تمت إضافة الشعبة"); await load(); } }
  async function remove(id: string) { if (!window.confirm("هل أنت متأكد من حذف هذه الشعبة؟")) return; const { error } = await supabase.from("sections").delete().eq("id", id); if (error) toast.error(friendlySupabaseError(error)); else { toast.success("تم حذف الشعبة"); await load(); } }
  return <div className="space-y-6"><PageHeader title="الشعب" description="تنظيم شعب كل صف وتوزيع الطلاب عليها." />
    <Card><CardContent className="grid gap-3 pt-6 sm:grid-cols-[1fr_1fr_auto]"><Select value={gradeId} onValueChange={setGradeId}><SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger><SelectContent>{activeGrades.map((grade) => <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>)}</SelectContent></Select><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الشعبة، مثل: أ" /><Button onClick={save}><Plus className="size-4" />{editId?"حفظ التعديل":"إضافة"}</Button></CardContent></Card>
    <Card><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead className="text-right">الشعبة</TableHead><TableHead className="text-right">الصف</TableHead><TableHead /></TableRow></TableHeader><TableBody>{visibleRows.map((row) => <TableRow key={row.id}><TableCell className="font-medium">{row.name}</TableCell><TableCell>{grades.find((g) => g.id === row.grade_level_id)?.name ?? "—"}</TableCell><TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => { setEditId(row.id); setGradeId(row.grade_level_id); setName(row.name); }} aria-label="تعديل الشعبة"><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => void remove(row.id)} aria-label="حذف الشعبة"><Trash2 className="size-4" /></Button></TableCell></TableRow>)}</TableBody></Table>{visibleRows.length === 0 ? <div className="py-10 text-center text-muted-foreground"><Rows3 className="mx-auto mb-2 size-7" />لا توجد شعب بعد</div> : null}</CardContent></Card>
  </div>;
}
