import { getSettings } from "@/lib/settings";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { ToastProvider } from "@/components/ui/toast";
import { DatabaseUnavailable } from "@/components/ui/database-unavailable";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  let settings: Awaited<ReturnType<typeof getSettings>>;
  try {
    settings = await getSettings();
  } catch (error) {
    console.error("Public site could not load Supabase settings:", error);
    return <DatabaseUnavailable />;
  }
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar name={settings.name} logoUrl={settings.logoUrl} tagline={settings.tagline} phone={settings.phone} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </div>
    </ToastProvider>
  );
}
