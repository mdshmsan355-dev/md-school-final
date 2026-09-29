import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, UserRound, Fingerprint } from "lucide-react";

import scenery from "@/assets/login-scenery.jpg";
import { MdLockup } from "@/components/brand/MdLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | Md School" },
      {
        name: "description",
        content:
          "سجّل الدخول إلى Md School، منصة إدارة الطلاب والصفوف والدرجات وإصدار النتائج المدرسية بالعربية.",
      },
      { property: "og:title", content: "تسجيل الدخول | Md School" },
      {
        property: "og:description",
        content: "منصة عربية لإدارة الطلاب والصفوف والدرجات وإصدار النتائج المدرسية.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fastLoading, setFastLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("login-by-username", {
      body: { username, password },
    });
    if (!error && data?.access_token && data?.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      setLoading(false);
      if (sessionError) { toast.error(sessionError.message); return; }
      await navigate({ to: "/dashboard" });
      return;
    }
    setLoading(false);
    toast.error(data?.error ?? error?.message ?? "اسم المستخدم أو كلمة المرور غير صحيحة");
  }

  async function handleFastLogin() {
    if (!window.isSecureContext) {
      toast.error("الدخول السريع يحتاج إلى اتصال آمن HTTPS أو localhost");
      return;
    }
    setFastLoading(true);
    const { error } = await supabase.auth.signInWithPasskey();
    setFastLoading(false);
    if (error) {
      toast.error("تعذر الدخول السريع. إذا لم تسجل هذا الجهاز بعد، استخدم اسم المستخدم وكلمة المرور أولًا.");
      return;
    }
    await navigate({ to: "/dashboard" });
  }

  async function handlePasswordReset() {
    const email = recoveryEmail.trim();
    if (!email) { toast.error("أدخل بريد الاسترداد"); return; }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setResetLoading(false);
    if (error) { toast.error(error.message); return; }
    setResetOpen(false);
    setRecoveryEmail("");
    toast.success("إذا كان البريد مسجلًا، ستصلك رسالة لاستعادة كلمة المرور");
  }

  return (
    <main className="relative min-h-svh w-full overflow-hidden">
      <img src={scenery} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-transparent" />

      <div className="relative z-10 flex min-h-svh items-center justify-center px-4 py-10">
        <section className="glass-panel w-full max-w-md rounded-[2.5rem] rounded-bl-[6rem] px-7 py-9 shadow-panel sm:px-10">
          <div className="flex flex-col items-center gap-6">
            <MdLockup variant="light" orientation="vertical" size="lg" showTagline />

            <form onSubmit={handleLogin} className="w-full space-y-4 pt-2">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-label-sm text-navy-foreground">اسم المستخدم</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-brand-soft" />
                  <Input id="username" type="text" placeholder="اسم المستخدم" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} required className="h-12 rounded-2xl border-white/15 bg-white/10 pe-10 text-navy-foreground placeholder:text-brand-soft/70" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-label-sm text-navy-foreground">كلمة المرور</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-brand-soft" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="أدخل كلمة المرور" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 rounded-2xl border-white/15 bg-white/10 pe-10 ps-11 text-navy-foreground placeholder:text-brand-soft/70" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute start-3 top-1/2 -translate-y-1/2 text-brand-soft transition-colors hover:text-navy-foreground">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button type="button" onClick={() => setResetOpen(true)} className="block w-full text-end text-support-xs text-brand-soft transition-colors hover:text-navy-foreground">نسيت كلمة المرور؟</button>

              <Button type="submit" disabled={loading} className="brand-gradient h-12 w-full rounded-2xl text-base shadow-brand hover:opacity-95">
                {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
              </Button>

              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-support-xs text-brand-soft">أو</span>
                <span className="h-px flex-1 bg-white/15" />
              </div>

              <Button type="button" variant="outline" onClick={handleFastLogin} disabled={fastLoading} className="h-12 w-full rounded-2xl border-white/20 bg-white/10 text-navy-foreground hover:bg-white/15 hover:text-navy-foreground">
                <Fingerprint className="size-5" />
                {fastLoading ? "جارٍ التحقق..." : "الدخول السريع"}
              </Button>
              <p className="-mt-2 text-center text-support-xs text-brand-soft/80">البصمة أو قفل الجهاز</p>

              <p className="pt-2 text-center text-support-xs text-brand-soft">
                ليس لديك حساب مدرسة؟{" "}
                <Link to="/register" className="font-semibold text-navy-foreground hover:underline">إنشاء حساب</Link>
              </p>
              <p className="text-center text-support-xs text-brand-soft/80"><Link to="/developer" className="hover:underline">معلومات المطور</Link></p>
            </form>
          </div>
        </section>
      </div>

      <footer className="relative z-10 pb-6 text-center text-support-xs text-brand-soft/80">Md School • Version 1.0</footer>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>استعادة كلمة المرور</DialogTitle>
            <DialogDescription>أدخل بريد الاسترداد الذي سجلت به المدرسة.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="recovery-email" className="text-label-sm">بريد الاسترداد</label>
            <Input id="recovery-email" type="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>إلغاء</Button>
            <Button onClick={handlePasswordReset} disabled={resetLoading}>{resetLoading ? "جارٍ الإرسال..." : "إرسال الرابط"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
