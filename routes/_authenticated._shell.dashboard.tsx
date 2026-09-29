import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Layers, Rows3, BookMarked, ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { MdMark } from "@/components/brand/MdLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | Md School" },
      {
        name: "description",
        content: "لوحة تحكم Md School: نظرة عامة على المدرسة والعام الدراسي والأقسام الرئيسية.",
      },
      { property: "og:title", content: "لوحة التحكم | Md School" },
      {
        property: "og:description",
        content: "نظرة عامة على المدرسة والعام الدراسي والأقسام الرئيسية.",
      },
    ],
  }),
  component: DashboardPage,
});

const quickLinks = [
  { label: "تسجيل الدرجات", to: "/grades" as const },
  { label: "النتائج", to: "/results" as const },
  { label: "إصدار النتائج", to: "/issue-results" as const },
  { label: "الإعدادات", to: "/settings" as const },
];

function DashboardPage() {
  const { school, profile, activeYear, grades } = useSchool();
  const [counts, setCounts] = useState({ students: 0, sections: 0, subjects: 0 });
  useEffect(() => {
    if (!school) return;
    void Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("sections").select("id", { count: "exact", head: true }),
      supabase.from("subjects").select("id", { count: "exact", head: true }),
    ]).then(([students, sections, subjects]) => setCounts({ students: students.count ?? 0, sections: sections.count ?? 0, subjects: subjects.count ?? 0 }));
  }, [school]);
  const summaryCards = [
    { label: "الطلاب", value: counts.students, icon: Users, to: "/students" as const },
    { label: "الصفوف", value: grades.filter((grade) => grade.academic_year_id === activeYear?.id).length, icon: Layers, to: "/classes" as const },
    { label: "الشعب", value: counts.sections, icon: Rows3, to: "/sections" as const },
    { label: "المواد", value: counts.subjects, icon: BookMarked, to: "/subjects" as const },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على مدرستك والعام الدراسي النشط."
        actions={<Badge variant="secondary">العام {activeYear?.name ?? "—"}</Badge>}
      />

      <section className="surface-navy relative overflow-hidden rounded-3xl px-6 py-7 shadow-panel md:px-9">
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-support-xs text-brand-soft">مرحباً بك</p>
            <h2 className="text-page-title text-navy-foreground">
              {profile?.full_name ?? "مدير المدرسة"}
            </h2>
            <p className="text-body-base text-brand-soft">
              {school?.name ?? "مدرستك"} — {activeYear?.name ?? "لا يوجد عام نشط"}
            </p>
          </div>
          <MdMark variant="light" size="lg" className="opacity-90" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-label-sm text-muted-foreground">{card.label}</CardTitle>
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-brand-blue">
                <card.icon className="size-[18px]" strokeWidth={1.8} />
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
              <Link
                to={card.to}
                className="inline-flex items-center gap-1 text-support-xs text-brand-blue hover:underline"
              >
                الانتقال للقسم
                <ArrowLeft className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-section-title">الانتقال السريع</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Button key={link.to} asChild variant="outline" className="rounded-xl">
              <Link to={link.to}>{link.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
