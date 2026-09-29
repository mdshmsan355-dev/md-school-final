import { useState } from "react";
import { Menu, CalendarDays, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MdLockup, MdMark } from "@/components/brand/MdLogo";
import { SidebarNav } from "@/components/layout/AppSidebar";
import { useSchool } from "@/contexts/SchoolContext";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const { school, profile, activeYear } = useSchool();
  const navigate = useNavigate();

  return (
    <header className="app-shell-header sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/85 px-4 backdrop-blur md:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="القائمة">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="surface-navy w-72 border-sidebar-border p-0">
          <div className="px-6 py-7">
            <MdLockup variant="light" size="sm" />
          </div>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <MdMark variant="dark" size="sm" className="lg:hidden" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-label-sm text-foreground">{school?.name ?? "Md School"}</p>
        <p className="hidden text-support-xs text-muted-foreground sm:block">
          منصة إدارة النتائج المدرسية
        </p>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-support-xs text-secondary-foreground sm:flex">
        <CalendarDays className="size-4 text-brand-blue" />
        <span>العام الدراسي {activeYear?.name ?? "—"}</span>
      </div>

      <PwaInstallButton />

      <Button
        type="button"
        variant="outline"
        onClick={async () => { await supabase.auth.signOut(); await navigate({ to: "/" }); }}
        className="h-auto rounded-full px-2 py-1.5"
        aria-label="تسجيل الخروج"
      >
        <span className="brand-gradient flex size-8 items-center justify-center rounded-full text-label-sm text-primary-foreground">
          م
        </span>
        <span className="hidden text-right leading-tight sm:block">
          <span className="block text-label-sm">{profile?.full_name ?? "مدير المدرسة"}</span>
          <span className="block text-support-xs text-muted-foreground">
            مدير المدرسة
          </span>
        </span>
        <LogOut className="hidden size-4 text-muted-foreground sm:block" />
      </Button>
    </header>
  );
}
