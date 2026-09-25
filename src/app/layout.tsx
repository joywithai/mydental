import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { ThemeProvider } from "@/components/theme-provider";
import { type ReactNode } from "react";

// Site metadata is managed in Supabase and resolved at request time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    return {
      title: {
        default: `${settings.name}${settings.tagline ? ` — ${settings.tagline}` : ""}`,
        template: `%s | ${settings.name}`,
      },
      description: settings.description || undefined,
      ...((settings.faviconUrl || settings.logoUrl) ? { icons: { icon: settings.faviconUrl || settings.logoUrl! } } : {}),
    };
  } catch (error) {
    console.error("Could not load site metadata from Supabase:", error);
    return { title: "Dental Chamber", description: "Dental clinic website" };
  }
}

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
