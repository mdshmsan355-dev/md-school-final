import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { MdLockup } from "@/components/brand/MdLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSection, Field } from "@/components/common/FormSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب مدرسة | Md School" },
      { name: "description", content: "أنشئ حساب مدرستك في Md School لإدارة الصفوف والشعب والطلاب والدرجات وإصدار النتائج." },
      { property: "og:title", content: "إنشاء حساب مدرسة | Md School" },
      { property: "og:description", content: "خطوة واحدة لتسجيل بيانات مدرستك والبدء في إدارة النتائج." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ schoolName: "", schoolType: "mixed", region: "", managerName: "", phone: "", username: "", email: "", password: "", academicYear: "1447 / 1448 هـ" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const username = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(username)) { toast.error("اسم المستخدم يجب أن يكون من 3 إلى 32 حرفًا: أحرف إنجليزية وأرقام وشرطة سفلية فقط"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username, school_name: form.schoolName, school_type: form.schoolType, region: form.region, manager_name: form.managerName, phone: form.phone, academic_year: form.academicYear },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) {
      await supabase.rpc("bootstrap_school_from_signup");
      try { await supabase.auth.registerPasskey(); } catch { /* passkey is optional during initial setup */ }
      toast.success("تم إنشاء حساب المدرسة");
      await navigate({ to: "/dashboard" });
      return;
    }
    toast.success("تم إنشاء الحساب. تحقق من بريد الاسترداد لتفعيل الحساب، ثم استخدم اسم المستخدم لتسجيل الدخول وتفعيل الدخول السريع.");
    await navigate({ to: "/" });
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="surface-navy px-4 py-10 md:px-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <MdLockup variant="light" size="sm" />
          <div className="space-y-2">
            <h1 className="text-page-title text-navy-foreground">إنشاء حساب مدرسة</h1>
            <p className="text-body-base text-brand-soft">أدخل بيانات المدرسة وبيانات مدير الحساب للبدء.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-6 max-w-3xl px-4 pb-16 md:px-10">
        <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-card md:p-9">
          <FormSection title="بيانات المدرسة" description="يظهر اسم المدرسة في الوثائق الرسمية التي تصدرها لاحقًا.">
            <Field label="اسم المدرسة" htmlFor="school-name" full><Input id="school-name" value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} required placeholder="مثال: مدرسة النهضة الأساسية" className="h-11" /></Field>
            <Field label="نوع المدرسة" htmlFor="school-type"><Select value={form.schoolType} onValueChange={(value) => update("schoolType", value)}><SelectTrigger id="school-type" className="h-11 w-full"><SelectValue placeholder="اختر النوع" /></SelectTrigger><SelectContent><SelectItem value="basic">أساسية</SelectItem><SelectItem value="secondary">ثانوية</SelectItem><SelectItem value="mixed">أساسية وثانوية</SelectItem></SelectContent></Select></Field>
            <Field label="المحافظة / المديرية" htmlFor="school-region"><Input id="school-region" value={form.region} onChange={(e) => update("region", e.target.value)} placeholder="مثال: صنعاء — الثورة" className="h-11" /></Field>
          </FormSection>

          <FormSection title="بيانات مدير الحساب" description="اسم المستخدم هو طريقة الدخول اليومية، وبريد الاسترداد يبقى مخصصًا لاستعادة الحساب.">
            <Field label="اسم المدير" htmlFor="manager-name"><Input id="manager-name" value={form.managerName} onChange={(e) => update("managerName", e.target.value)} required placeholder="الاسم الكامل" className="h-11" /></Field>
            <Field label="رقم الهاتف" htmlFor="manager-phone"><Input id="manager-phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="7XXXXXXXX" inputMode="tel" className="h-11" /></Field>
            <Field label="اسم المستخدم" htmlFor="manager-username" full><div className="relative"><UserRound className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="manager-username" value={form.username} onChange={(e) => update("username", e.target.value.toLowerCase())} required minLength={3} maxLength={32} pattern="[A-Za-z0-9_]{3,32}" autoComplete="username" placeholder="مثال: school_manager" className="h-11 pe-10" /></div><p className="mt-1 text-support-xs text-muted-foreground">أحرف إنجليزية صغيرة وأرقام و _ فقط.</p></Field>
            <Field label="كلمة المرور" htmlFor="manager-password" full><div className="relative"><Lock className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="manager-password" type={showPassword ? "text" : "password"} minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} required placeholder="ثمانية أحرف على الأقل" autoComplete="new-password" className="h-11 pe-10 ps-11" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></Field>
            <Field label="بريد الاسترداد" htmlFor="manager-email" full><div className="relative"><Mail className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="manager-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required placeholder="name@example.com" autoComplete="email" className="h-11 pe-10" /></div><p className="mt-1 text-support-xs text-muted-foreground">يُستخدم لتأكيد الحساب واستعادة كلمة المرور، ولا يظهر كطريقة الدخول اليومية.</p></Field>
          </FormSection>

          <FormSection title="العام الدراسي"><Field label="العام الدراسي" htmlFor="academic-year"><Input id="academic-year" value={form.academicYear} onChange={(e) => update("academicYear", e.target.value)} required className="h-11" /></Field></FormSection>

          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-label-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowRight className="size-4" />العودة لتسجيل الدخول</Link>
            <Button type="submit" disabled={loading} className="brand-gradient h-11 rounded-xl px-8 shadow-brand hover:opacity-95">{loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
