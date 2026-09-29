import logoLight from "@/assets/md-logo-light.png.asset.json";
import logoDark from "@/assets/md-logo-dark.png.asset.json";
import { cn } from "@/lib/utils";

type LogoVariant = "light" | "dark";

const markSizes = {
  sm: "h-8",
  md: "h-11",
  lg: "h-16",
  xl: "h-24",
} as const;

export function MdMark({
  variant = "light",
  size = "md",
  className,
}: {
  variant?: LogoVariant;
  size?: keyof typeof markSizes;
  className?: string;
}) {
  return (
    <img
      src={variant === "light" ? logoLight.url : logoDark.url}
      alt="شعار Md"
      className={cn(markSizes[size], "w-auto select-none", className)}
    />
  );
}

/**
 * Brand lockup: Md mark + "Md" wordmark + product name "School".
 * Layouts follow the supplied Md brand reference.
 */
export function MdLockup({
  variant = "light",
  orientation = "horizontal",
  size = "md",
  showTagline = false,
  className,
}: {
  variant?: LogoVariant;
  orientation?: "horizontal" | "vertical";
  size?: keyof typeof markSizes;
  showTagline?: boolean;
  className?: string;
}) {
  const isLight = variant === "light";
  const vertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        vertical && "flex-col gap-2 text-center",
        className,
      )}
    >
      <MdMark variant={variant} size={size} />
      <div className={cn("leading-none", vertical && "flex flex-col items-center gap-1")}>
        <span
          className={cn(
            "block font-bold tracking-tight",
            size === "xl" ? "text-4xl" : size === "lg" ? "text-3xl" : "text-xl",
            isLight ? "text-navy-foreground" : "text-navy",
          )}
        >
          Md
        </span>
        <span
          className={cn(
            "block tracking-[0.35em]",
            size === "xl" ? "text-lg" : size === "lg" ? "text-base" : "text-xs",
            isLight ? "text-brand-soft" : "text-brand-blue",
          )}
        >
          School
        </span>
        {showTagline ? (
          <span
            className={cn(
              "mt-2 block text-support-xs",
              isLight ? "text-brand-soft/80" : "text-muted-foreground",
            )}
          >
            بناء مستقبل أفضل
          </span>
        ) : null}
      </div>
    </div>
  );
}
