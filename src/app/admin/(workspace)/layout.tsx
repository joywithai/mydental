import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { ToastProvider } from "@/components/ui/toast";
import { getSettings } from "@/lib/settings";
import { PageLoader } from "@/components/ui/feedback";
import { DatabaseUnavailable } from "@/components/ui/database-unavailable";

export const dynamic = "force-dynamic";

/** Keep the route layout synchronous; auth and database work suspends below it. */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoader label="Opening admin workspace…" />}>
      <AdminWorkspace>{children}</AdminWorkspace>
    </Suspense>
  );
}

async function AdminWorkspace({ children }: { children: ReactNode }) {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  let settings: Awaited<ReturnType<typeof getSettings>>;
  try {
    settings = await getSettings();
  } catch (error) {
    console.error("Admin workspace could not load Supabase settings:", error);
    return <DatabaseUnavailable retryHref="/admin/login" />;
  }
  return (
    <ToastProvider>
      <AdminShell user={user} chamberName={settings.name} logoUrl={settings.logoUrl}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
