import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock } from "lucide-react";
import { MdLockup } from "@/components/brand/MdLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "استعادة كلمة المرور | Md School" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) setReady(Boolean(data.session)); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) { toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
    if (password !== confirm) { toast.error("كلمتا المرور غير متطابقتين"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تحديث كلمة المرور");
    await supabase.auth.signOut();
    await navigate({ to: "/" });
  }

  return <main className="min-h-svh bg-background"><div className="surface-navy px-4 py-10"><div className="mx-auto max-w-md"><MdLockup variant="light" size="sm" /></div></div><div className="mx-auto max-w-md px-4 py-10"><div className="rounded-3xl border border-border bg-card p-6 shadow-card"><h1 className="text-page-title">تعيين كلمة مرور جديدة</h1><p className="mt-2 text-body-base text-muted-foreground">{ready ? "أدخل كلمة المرور الجديدة لحساب المدير." : "افتح رابط الاستعادة من بريدك الإلكتروني لإكمال العملية."}</p>{ready ? <form onSubmit={submit} className="mt-6 space-y-4"><div className="space-y-2"><label htmlFor="new-password" className="text-label-sm">كلمة المرور الجديدة</label><div className="relative"><Lock className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pe-10 ps-11" autoComplete="new-password" minLength={8} required /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div><div className="space-y-2"><label htmlFor="confirm-password" className="text-label-sm">تأكيد كلمة المرور</label><Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" autoComplete="new-password" minLength={8} required /></div><Button type="submit" disabled={loading} className="h-11 w-full">{loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}</Button></form> : <Link to="/" className="mt-6 inline-flex text-label-sm text-primary hover:underline">العودة لتسجيل الدخول</Link>}</div></div></main>;
}
