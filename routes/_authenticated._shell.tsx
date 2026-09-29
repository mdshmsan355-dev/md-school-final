import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { SchoolProvider } from "@/contexts/SchoolContext";

export const Route = createFileRoute("/_authenticated/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <SchoolProvider><div className="flex min-h-svh bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            {/* Nested pages render here. */}
            <Outlet />
          </div>
        </main>
        <footer className="app-shell-footer border-t border-border px-4 py-4 text-center text-support-xs text-muted-foreground md:px-8">
          Md School • Version 1.0
        </footer>
      </div>
    </div></SchoolProvider>
  );
}
