import { LoaderCircle } from "lucide-react";
export function LoadingBlock({ label = "جارٍ تحميل البيانات..." }: { label?: string }) {
  return <div className="flex min-h-56 items-center justify-center gap-3 text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /><span className="text-label-sm">{label}</span></div>;
}
