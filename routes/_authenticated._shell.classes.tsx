import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { friendlySupabaseError } from "@/lib/supabase-errors";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_shell/classes")({ head: () => ({ meta: [{ title: "إدارة الصفوف | Md School" }] }), component: ClassesPage });
type Grade = { id:string; name:string; code:string; stage:"basic"|"secondary"; sort_order:number; academic_year_id:string };
function ClassesPage(){
 const {school,years,activeYear,refresh}=useSchool(); const [rows,setRows]=useState<Grade[]>([]); const [yearId,setYearId]=useState(""); const [name,setName]=useState(""); const [code,setCode]=useState(""); const [stage,setStage]=useState<"basic"|"secondary">("basic"); const [editId,setEditId]=useState("");
 async function load(){ if(!school)return; const {data}=await supabase.from("grade_levels").select("id,name,code,stage,sort_order,academic_year_id").eq("school_id",school.id).order("sort_order"); setRows((data??[]) as Grade[]); }
 useEffect(()=>{setYearId(activeYear?.id??""); void load()},[activeYear?.id,school?.id]);
 const visible=rows.filter(r=>r.academic_year_id===yearId);
 function reset(){setEditId("");setName("");setCode("");setStage("basic")}
 async function save(){ if(!school||!yearId||!name.trim()||!code.trim()){toast.error("أكمل العام واسم الصف ورمز الصف");return}; const payload={name:name.trim(),code:code.trim().toLowerCase(),stage,academic_year_id:yearId,school_id:school.id,sort_order:editId?(rows.find(r=>r.id===editId)?.sort_order??1):visible.length+1}; const {error}=editId?await supabase.from("grade_levels").update(payload).eq("id",editId):await supabase.from("grade_levels").insert(payload); if(error)toast.error(friendlySupabaseError(error));else{toast.success(editId?"تم تعديل الصف":"تمت إضافة الصف");reset();await load();await refresh()}}
 async function remove(id:string){if(!window.confirm("هل أنت متأكد من حذف هذا الصف؟"))return;const {error}=await supabase.rpc("delete_grade_safely",{p_grade_id:id});if(error)toast.error(friendlySupabaseError(error));else{toast.success("تم حذف الصف");await load();await refresh()}}
 return <div className="space-y-6"><PageHeader title="إدارة الصفوف" description="إضافة وتعديل وحذف الصفوف لكل عام دراسي."/>
 <Card><CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"><Select value={yearId} onValueChange={v=>{setYearId(v);reset()}}><SelectTrigger><SelectValue placeholder="العام الدراسي"/></SelectTrigger><SelectContent>{years.map(y=><SelectItem key={y.id} value={y.id}>{y.name}{y.is_active?" — نشط":""}</SelectItem>)}</SelectContent></Select><Input value={code} onChange={e=>setCode(e.target.value)} placeholder="رمز الصف"/><Input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم الصف"/><Select value={stage} onValueChange={v=>setStage(v as "basic"|"secondary")}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="basic">أساسي</SelectItem><SelectItem value="secondary">ثانوي</SelectItem></SelectContent></Select><Button onClick={save}><Plus className="size-4"/>{editId?"حفظ التعديل":"إضافة"}</Button></CardContent></Card>
 <Card><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead>الترتيب</TableHead><TableHead>الرمز</TableHead><TableHead>الصف</TableHead><TableHead>المرحلة</TableHead><TableHead/></TableRow></TableHeader><TableBody>{visible.map(r=><TableRow key={r.id}><TableCell>{r.sort_order}</TableCell><TableCell>{r.code}</TableCell><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.stage==="basic"?"أساسي":"ثانوي"}</TableCell><TableCell className="text-left"><Button variant="ghost" size="icon" onClick={()=>{setEditId(r.id);setName(r.name);setCode(r.code);setStage(r.stage)}}><Pencil className="size-4"/></Button><Button variant="ghost" size="icon" onClick={()=>void remove(r.id)}><Trash2 className="size-4"/></Button></TableCell></TableRow>)}</TableBody></Table>{visible.length===0&&<p className="py-10 text-center text-muted-foreground"><Layers className="mx-auto mb-2 size-7"/>لا توجد صفوف لهذا العام.</p>}</CardContent></Card></div>
}
