import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, GraduationCap, Briefcase, Mail, Phone, Clock, BadgeCheck } from "lucide-react";
import { db } from "@/db";
import { doctors, schedules } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { DAY_NAMES_BD, formatCurrency, formatTime12, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [doctor] = await db.select().from(doctors).where(eq(doctors.slug, slug)).limit(1);
  if (!doctor) return { title: "Doctor" };
  return { title: doctor.name, description: `${doctor.name} — ${doctor.qualification}, ${doctor.specialization}` };
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [doctor] = await db
    .select()
    .from(doctors)
    .where(and(eq(doctors.slug, slug), eq(doctors.isActive, true)))
    .limit(1);
  if (!doctor) notFound();

  const docSchedules = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.doctorId, doctor.id), eq(schedules.isActive, true)))
    .orderBy(asc(schedules.dayOfWeek));

  const grouped = DAY_NAMES_BD.map((day, idx) => ({
    day,
    dayIndex: idx,
    slots: docSchedules.filter((s) => s.dayOfWeek === idx),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Photo card */}
        <div className="space-y-5">
          <div className="relative h-96 overflow-hidden rounded-3xl border border-border bg-muted shadow-lg">
            {doctor.photoUrl ? (
              <Image src={doctor.photoUrl} alt={doctor.name} fill priority className="object-cover object-top" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-soft to-muted text-6xl font-bold text-primary">
                {initials(doctor.name)}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            {doctor.consultationFee !== null && doctor.consultationFee !== undefined && (
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-sm text-muted-foreground">Consultation fee</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(doctor.consultationFee)}</span>
              </div>
            )}
            {doctor.phone && (
              <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" /> {doctor.phone}
              </p>
            )}
            {doctor.email && (
              <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" /> {doctor.email}
              </p>
            )}
            <Link
              href={`/book?doctor=${doctor.id}`}
              className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover active:scale-[0.98]"
            >
              <CalendarPlus className="h-5 w-5" /> Book Appointment
            </Link>
          </div>
        </div>

        {/* Details */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
            <BadgeCheck className="h-3.5 w-3.5" /> Available for appointments
          </span>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{doctor.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-primary">
              <GraduationCap className="h-4.5 w-4.5" /> {doctor.qualification}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4.5 w-4.5" /> {doctor.specialization}
              {doctor.experienceYears > 0 && ` · ${doctor.experienceYears}+ years experience`}
            </span>
          </p>

          {doctor.biography && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">About {doctor.name.split(" ")[0]}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
                {doctor.biography.split(/\n+/).filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Clock className="h-5 w-5 text-primary" /> Visiting schedule
            </h2>
            {docSchedules.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No published schedule yet — please call the chamber for availability.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {grouped
                  .filter((g) => g.slots.length > 0)
                  .map((g) => (
                    <div key={g.day} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <p className="text-sm font-bold">{g.day}</p>
                      <ul className="mt-2 space-y-1.5">
                        {g.slots.map((s) => (
                          <li key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {formatTime12(s.startTime)} – {formatTime12(s.endTime)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <Link
            href={`/book?doctor=${doctor.id}`}
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            <CalendarPlus className="h-5 w-5" /> Book an appointment with {doctor.name.split(" ").slice(-1)[0]}
          </Link>
        </div>
      </div>
    </div>
  );
}
