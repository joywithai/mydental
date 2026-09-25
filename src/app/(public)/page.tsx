import Link from "next/link";
import Image from "next/image";
import {
  CalendarPlus,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { doctors, reviews, services } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { formatCurrency, formatTime12, DAY_NAMES_BD, initials, truncate } from "@/lib/utils";
import { StarRating } from "@/components/ui/misc";
import { Badge } from "@/components/ui/card";
import { Logo } from "@/components/public/logo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();

  const [featuredServices, allDoctors, approvedReviews, ratingRow, serviceCount] = await Promise.all([
    db.select().from(services).where(and(eq(services.isActive, true), eq(services.isFeatured, true))).orderBy(services.order).limit(6),
    db.select().from(doctors).where(eq(doctors.isActive, true)).orderBy(doctors.order).limit(3),
    db.select().from(reviews).where(eq(reviews.isApproved, true)).orderBy(desc(reviews.createdAt)).limit(6),
    db.select({ avg: sql<number>`avg(rating)`, count: sql<number>`count(*)` }).from(reviews).where(eq(reviews.isApproved, true)),
    db.select({ count: sql<number>`count(*)` }).from(services).where(eq(services.isActive, true)),
  ]);

  const avgRating = ratingRow[0]?.avg ? Number(ratingRow[0].avg) : 0;
  const reviewCount = ratingRow[0]?.count ? Number(ratingRow[0].count) : 0;
  const facilities = settings.facilitiesText.split("\n").map((f) => f.trim()).filter(Boolean);
  const todayBd = (new Date().getDay() + 1) % 7;
  const todayHours = settings.hours.find((h) => h.dayOfWeek === todayBd);

  return (
    <>
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-background to-background" />
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <Badge variant="primary" className="mb-5 px-3 py-1.5 text-sm">
              <Sparkles className="h-3.5 w-3.5" /> {settings.tagline}
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
              {settings.heroTitle}{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{settings.heroHighlight}</span>
              <span className="block text-2xl font-bold text-foreground/80 sm:text-3xl">{settings.name}</span>
            </h1>
            {settings.description && <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{settings.description}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/book"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover active:scale-[0.98]"
              >
                <CalendarPlus className="h-5 w-5" /> {settings.primaryCtaLabel}
              </Link>
              <Link
                href="/services"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {settings.secondaryCtaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                {settings.trustNoteOne && <><ShieldCheck className="h-4 w-4 text-primary" /> {settings.trustNoteOne}</>}
              </span>
              <span className="inline-flex items-center gap-1.5">
                {settings.trustNoteTwo && <><Stethoscope className="h-4 w-4 text-primary" /> {settings.trustNoteTwo}</>}
              </span>
              {avgRating > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)} from {reviewCount} reviews
                </span>
              )}
            </div>
          </div>

          <div className="animate-fade-up relative lg:justify-self-end" style={{ animationDelay: "0.15s" }}>
            <div className="relative h-72 w-full overflow-hidden rounded-3xl border border-border shadow-2xl shadow-primary/10 sm:h-96 lg:h-[26rem] lg:w-[34rem]">
              {settings.heroUrl ? (
                <Image src={settings.heroUrl} alt={settings.name} fill priority className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-soft to-muted">
                  <Logo name={settings.name} logoUrl={settings.logoUrl} size="lg" />
                </div>
              )}
            </div>
            {todayHours?.isOpen && (
              <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:left-8">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open today</p>
                  <p className="text-sm font-semibold">
                    {formatTime12(todayHours.openTime)} – {formatTime12(todayHours.closeTime)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------- Stats band ----------------------------- */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {[
            { icon: Stethoscope, value: `${allDoctors.length > 0 ? allDoctors.length : "—"}+`, label: "Expert Doctors" },
            { icon: Sparkles, value: `${serviceCount[0]?.count ?? 0}+`, label: "Services" },
            ...(settings.experienceText ? [{ icon: ShieldCheck, value: settings.experienceText, label: "Experience" }] : []),
            { icon: Users, value: reviewCount > 0 ? `${reviewCount}+` : "—", label: "Patient Reviews" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
                <s.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xl font-bold tracking-tight">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------ About snippet ------------------------------ */}
      {settings.aboutText && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">About the chamber</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{settings.homeAboutHeading}</h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">{truncate(settings.aboutText, 480)}</p>
              {settings.missionText && (
                <p className="mt-3 leading-relaxed text-muted-foreground">{truncate(settings.missionText, 200)}</p>
              )}
              <Link
                href="/about"
                className="mt-6 inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                Learn more about us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {facilities.slice(0, 6).map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium leading-snug">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------ Services ------------------------------ */}
      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">What we offer</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{settings.homeServicesHeading}</h2>
              {settings.homeServicesIntro && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{settings.homeServicesIntro}</p>}
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              All services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredServices.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Services will appear here once added from the admin panel.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredServices.map((s) => (
                <Link
                  key={s.id}
                  href="/services"
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-44 overflow-hidden bg-muted">
                    {s.imageUrl ? (
                      <Image src={s.imageUrl} alt={s.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Stethoscope className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold">{s.name}</h3>
                      <span className="whitespace-nowrap rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-bold text-primary-soft-foreground">
                        {formatCurrency(s.price)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> ~{s.duration} min
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------ Doctors ------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Meet the team</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our doctors</h2>
          </div>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            All doctors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {allDoctors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Doctor profiles will appear here once added from the admin panel.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {allDoctors.map((d) => (
              <Link
                key={d.id}
                href={`/doctors/${d.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-64 overflow-hidden bg-muted">
                  {d.photoUrl ? (
                    <Image src={d.photoUrl} alt={d.name} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-soft to-muted text-4xl font-bold text-primary">
                      {initials(d.name)}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{d.name}</h3>
                  <p className="mt-0.5 text-sm text-primary">{d.qualification}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{d.specialization}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------ CTA banner ------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-hover px-6 py-14 text-center text-primary-foreground shadow-xl sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-black/10 blur-2xl" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{settings.homeCtaHeading}</h2>
          {settings.homeCtaIntro && <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">{settings.homeCtaIntro}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/book"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-teal-700 shadow-lg transition-all hover:bg-teal-50 active:scale-[0.98]"
            >
              <CalendarPlus className="h-5 w-5" /> {settings.primaryCtaLabel}
            </Link>
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/40 px-6 font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Phone className="h-5 w-5" /> {settings.phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------ Hours + Contact ------------------------------ */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Clock className="h-5 w-5 text-primary" /> Opening hours
          </h3>
          <ul className="space-y-2 text-sm">
            {settings.hours.map((h) => (
              <li key={h.dayOfWeek} className="flex items-center justify-between">
                <span className={h.dayOfWeek === todayBd ? "font-semibold text-primary" : "text-muted-foreground"}>
                  {DAY_NAMES_BD[h.dayOfWeek]}
                </span>
                <span className={h.isOpen ? "" : "text-destructive"}>
                  {h.isOpen ? `${formatTime12(h.openTime)} – ${formatTime12(h.closeTime)}` : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Phone className="h-5 w-5 text-primary" /> Contact
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {settings.phone && (
              <li>
                <span className="block text-xs uppercase tracking-wide text-muted-foreground/70">Phone</span>
                <a href={`tel:${settings.phone}`} className="font-medium text-foreground hover:text-primary">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.emergencyPhone && (
              <li>
                <span className="block text-xs uppercase tracking-wide text-muted-foreground/70">Emergency</span>
                <a href={`tel:${settings.emergencyPhone}`} className="font-medium text-foreground hover:text-primary">
                  {settings.emergencyPhone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <span className="block text-xs uppercase tracking-wide text-muted-foreground/70">Email</span>
                <a href={`mailto:${settings.email}`} className="font-medium text-foreground hover:text-primary">
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && (
              <li>
                <span className="block text-xs uppercase tracking-wide text-muted-foreground/70">Address</span>
                <span className="font-medium text-foreground">{settings.address}</span>
              </li>
            )}
          </ul>
          <Link href="/contact" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover">
            Contact page <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {settings.mapEmbedUrl ? (
            <iframe src={settings.mapEmbedUrl} className="h-full min-h-64 w-full" title="Chamber location" loading="lazy" />
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium text-foreground">{settings.address || "Location not set yet"}</p>
              <p className="text-xs">Map location can be configured in Chamber Settings.</p>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------ Reviews ------------------------------ */}
      {approvedReviews.length > 0 && (
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Patient voices</p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Patient reviews</h2>
                {avgRating > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <StarRating rating={Math.round(avgRating)} size="sm" /> {avgRating.toFixed(1)} average from {reviewCount} approved reviews
                  </div>
                )}
              </div>
              <Link
                href="/reviews"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                All reviews <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {approvedReviews.slice(0, 6).map((r) => (
                <figure key={r.id} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <StarRating rating={r.rating} size="sm" />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    “{truncate(r.comment, 220)}”
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-soft-foreground">
                      {initials(r.name)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
