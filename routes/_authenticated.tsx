import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function isOffline() { return typeof navigator !== "undefined" && navigator.onLine === false; }

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) return { user: data.user };
    // When offline, a persisted session is sufficient to open the cached application.
    if (isOffline()) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) return { user: sessionData.session.user };
    }
    throw redirect({ to: "/" });
  },
  component: () => <Outlet />,
});
