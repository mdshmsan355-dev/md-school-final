import { cn } from "@/lib/utils";
import { RESULT_TEMPLATES, type ResultTemplate } from "@/lib/result-templates";

export function ResultTemplatePicker({ value, onChange }: { value: ResultTemplate; onChange: (value: ResultTemplate) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {RESULT_TEMPLATES.map((template) => {
        const children = template.group === "children";
        return (
          <button
            key={template.value}
            type="button"
            onClick={() => onChange(template.value)}
            className={cn("group rounded-xl border p-2 text-right transition-all hover:-translate-y-0.5 hover:shadow-sm", value === template.value ? "border-primary ring-2 ring-primary/20" : "border-border")}
            aria-pressed={value === template.value}
          >
            <span className="mb-2 block h-12 overflow-hidden rounded-lg border" style={{ background: `linear-gradient(135deg, #fff 0 65%, ${template.accent} 66% 100%)` }}>
              <span className="flex h-full items-start justify-between p-1.5">
                <span className="h-2 w-9 rounded-full" style={{ backgroundColor: template.accent }} />
                <span className="mt-1 size-5 rounded-full border-2 bg-white/90" style={{ borderColor: template.accent }} />
              </span>
              <span className="mx-2 block h-1 rounded-full bg-white/80" />
              <span className="mx-2 mt-1 block h-1 rounded-full bg-white/70" />
            </span>
            <span className="block text-xs font-bold">{template.label}</span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">{children ? "تصميم طفولي مدرسي" : "تصميم رسمي"}</span>
          </button>
        );
      })}
    </div>
  );
}
