import Image from "next/image";
import { Award, Building2, HeartPulse, ShieldCheck, Target } from "lucide-react";
import { db } from "@/db";
import { galleryImages } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { Badge } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "About Us" };

export default async function AboutPage() {
  const settings = await getSettings();
  const photos = await db
    .select()
    .from(galleryImages)
    .where(and(eq(galleryImages.isPublished, true)))
    .orderBy(asc(galleryImages.order))
    .limit(3);

  const facilities = settings.facilitiesText.split("\n").map((f) => f.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="primary" className="mb-4">
          <Building2 className="h-3.5 w-3.5" /> About the chamber
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{settings.name}</h1>
        {settings.tagline && <p className="mt-3 text-lg text-muted-foreground">{settings.tagline}</p>}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {photos.map((p, i) => (
            <div key={p.id} className={`relative h-56 overflow-hidden rounded-2xl border border-border shadow-sm sm:h-64 ${i === 0 ? "sm:col-span-2 sm:h-64" : ""}`}>
              <Image src={p.imageUrl} alt={p.title || "Chamber photo"} fill className="object-cover" unoptimized />
            </div>
          ))}
        </div>
      )}

      {/* About text */}
      {settings.aboutText && (
        <div className="mx-auto mt-14 max-w-3xl">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <HeartPulse className="h-6 w-6 text-primary" /> Our story
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
            {settings.aboutText.split(/\n+/).filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Mission + experience */}
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {settings.missionText && (
          <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
              <Target className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-bold">Our mission</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{settings.missionText}</p>
          </div>
        )}
        {settings.experienceText && (
          <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
              <Award className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-bold">Experience & trust</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{settings.experienceText}</p>
          </div>
        )}
      </div>

      {/* Facilities */}
      {facilities.length > 0 && (
        <div className="mt-14">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6 text-primary" /> Facilities & professional standards
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </span>
                <p className="text-sm font-medium leading-snug">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
