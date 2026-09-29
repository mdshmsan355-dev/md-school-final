import { useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { MdLockup } from "@/components/brand/MdLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export function SchoolOnboarding({ onComplete }: { onComplete: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ schoolName: "", schoolType: "mixed", region: "", managerName: "", phone: "", academicYear: "1447 / 1448 هـ" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!form.schoolName.trim() || !form.managerName.trim()) return;
    setLoading(true);
    const { error: metadataError } = await supabase.auth.updateUser({ data: { school_name: form.schoolName, school_type: form.schoolType, region: form.region, manager_name: form.managerName, phone: form.phone, academic_year: form.academicYear } });
    if (metadataError) { setLoading(false); toast.error(metadataError.message); return; }
    const { error } = await supabase.rpc("bootstrap_school_from_signup");
    if (error) { setLoading(false); toast.error(error.message); return; }
    await onComplete(); setLoading(false); toast.success("تم إعداد المدرسة بنجاح");
  }
  return <main className="surface-navy flex min-h-svh items-center justify-center p-4"><Card className="w-full max-w-2xl"><CardHeader className="items-center text-center"><MdLockup variant="dark" size="sm" /><span className="mt-4 flex size-11 items-center justify-center rounded-lg bg-secondary text-brand-blue"><Building2 className="size-5" /></span><CardTitle className="text-page-title">إعداد المدرسة</CardTitle><p className="text-body-base text-muted-foreground">أكمل هذه الخطوة مرة واحدة لإنشاء مساحة مدرستك.</p></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><Input value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} required placeholder="اسم المدرسة الرسمي" className="sm:col-span-2" /><Input value={form.managerName} onChange={(e) => update("managerName", e.target.value)} required placeholder="اسم مدير المدرسة" /><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="رقم الهاتف" /><Select value={form.schoolType} onValueChange={(value) => update("schoolType", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="basic">أساسية</SelectItem><SelectItem value="secondary">ثانوية</SelectItem><SelectItem value="mixed">أساسية وثانوية</SelectItem></SelectContent></Select><Input value={form.region} onChange={(e) => update("region", e.target.value)} placeholder="المحافظة / المديرية" /><Input value={form.academicYear} onChange={(e) => update("academicYear", e.target.value)} placeholder="العام الدراسي" className="sm:col-span-2" /><Button disabled={loading} className="sm:col-span-2">{loading ? "جارٍ الإعداد..." : "بدء استخدام المدرسة"}</Button></form></CardContent></Card></main>;
}