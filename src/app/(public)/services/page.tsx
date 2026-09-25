import Image from "next/image";
import Link from "next/link";
import { CalendarPlus, Clock } from "lucide-react";
import { db } from "@/db";
import { services } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our Services" };

export default async function ServicesPage() {
  const [list, settings] = await Promise.all([
    db.select().from(services).where(and(eq(services.isActive, true))).orderBy(asc(services.order)),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Services</h1>
        {settings.servicesIntro && <p className="mt-3 text-lg text-muted-foreground">{settings.servicesIntro}</p>}
      </div>

      {list.length === 0 ? (
        <p className="mt-14 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Services will appear here once added from the admin panel.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <article key={s.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="relative h-48 bg-muted">
                {s.imageUrl ? (
                  <Image src={s.imageUrl} alt={s.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-soft to-muted text-3xl font-bold text-primary">
                    {s.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold">{s.name}</h2>
                  <span className="whitespace-nowrap rounded-xl bg-primary-soft px-3 py-1.5 text-sm font-bold text-primary-soft-foreground">{formatCurrency(s.price)}</span>
                </div>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Clock className="h-3.5 w-3.5" /> ~{s.duration} minutes</span>
                  <Link href={`/book?service=${s.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"><CalendarPlus className="h-3.5 w-3.5" />Book now</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
