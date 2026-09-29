import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { MdMark } from "@/components/brand/MdLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import developerPhoto from "@/assets/developer-mohammed-shamsan.jpeg.asset.json";

export const Route = createFileRoute("/_authenticated/_shell/developer")({
  head: () => ({
    meta: [
      { title: "معلومات المطور | Md School" },
      {
        name: "description",
        content: "محمد شمسان — طالب تقنية معلومات بجامعة إب، مطور ومصمم تطبيق Md School.",
      },
      { property: "og:title", content: "معلومات المطور | Md School" },
      {
        property: "og:description",
        content: "تعرّف على مطوّر Md School ووسيلة التواصل معه.",
      },
    ],
  }),
  component: DeveloperPage,
});

function DeveloperPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="معلومات المطور" description="الجهة التي تقف خلف تطوير Md School." />

      <Card className="overflow-hidden border-border shadow-card">
        <div className="surface-navy flex items-center justify-between px-6 py-6">
          <MdMark variant="light" size="md" />
          <span className="text-support-xs text-brand-soft">Md • Brand Identity</span>
        </div>
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-right">
            <img src={developerPhoto.url} alt="محمد شمسان" className="size-24 shrink-0 rounded-2xl border border-border object-cover" />
            <div className="space-y-2">
              <h2 className="text-page-title text-foreground">محمد شمسان</h2>
              <p className="text-body-base text-muted-foreground">
                مصمم ومطوّر — صاحب هوية Md التقنية.
              </p>
              <p className="flex items-center justify-center gap-2 text-label-sm text-foreground sm:justify-start">
                <GraduationCap className="size-4 text-brand-blue" />
                طالب تقنية معلومات — جامعة إب
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-support-xs text-muted-foreground">
              للتواصل والاستفسار عن تطوير Md School.
            </p>
            <Button asChild className="brand-gradient h-11 rounded-xl px-6 shadow-brand hover:opacity-95">
              <a href="https://wa.me/967713196291" target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                تواصل عبر واتساب
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
