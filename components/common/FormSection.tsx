import type { ReactNode } from "react";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-section-title text-foreground">{title}</h2>
        {description ? (
          <p className="text-support-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  full = false,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <label htmlFor={htmlFor} className="block text-label-sm text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
