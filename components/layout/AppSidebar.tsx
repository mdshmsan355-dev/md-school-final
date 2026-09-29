import { Link } from "@tanstack/react-router";
import { MdLockup } from "@/components/brand/MdLogo";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3 pb-6">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-sm text-sidebar-foreground/75 transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
          activeProps={{
            className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
          }}
        >
          <item.icon className="size-[18px] shrink-0" strokeWidth={1.8} />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="app-sidebar surface-navy sticky top-0 hidden h-svh w-72 shrink-0 flex-col border-l border-sidebar-border lg:flex">
      <div className="px-6 py-7">
        <MdLockup variant="light" size="sm" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>
      <div className="border-t border-sidebar-border px-6 py-4 text-support-xs text-sidebar-foreground/55">
        Md School • Version 1.0
      </div>
    </aside>
  );
}
