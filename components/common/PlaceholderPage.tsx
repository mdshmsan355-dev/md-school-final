import type { ComponentType } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Phase 1 placeholder: shows the page's final visual structure with a clean
 * empty state. No data, no business logic.
 */
export function PlaceholderPage({
  title,
  description,
  icon,
  emptyTitle,
  emptyDescription,
  sections,
}: {
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  emptyTitle: string;
  emptyDescription: string;
  sections?: { title: string; hint: string }[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<Badge variant="secondary">قيد الإعداد</Badge>}
      />

      {sections?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.title} className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-section-title">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-body-base text-muted-foreground">
                {section.hint}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <EmptyState
        {...(icon ? { icon } : {})}
        title={emptyTitle}
        description={emptyDescription}
      />

    </div>
  );
}
