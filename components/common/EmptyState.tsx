import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-brand-blue">
        <Icon className="size-6" strokeWidth={1.6} />
      </span>
      <h3 className="text-section-title text-foreground">{title}</h3>
      {description ? (
        <p className="max-w-md text-body-base text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
