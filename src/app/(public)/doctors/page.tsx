import Image from "next/image";
import Link from "next/link";
import { CalendarPlus, GraduationCap, Briefcase } from "lucide-react";
import { db } from "@/db";
import { doctors, schedules } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { DAY_NAMES_SHORT, formatTime12, initials } from "@/lib/utils";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Our Doctors" };

export default async function DoctorsPage() {
  const [list, allSchedules, settings] = await Promise.all([
    db.select().from(doctors).where(eq(doctors.isActive, true)).orderBy(asc(doctors.order)),
    db.select().from(schedules).where(eq(schedules.isActive, true)).orderBy(asc(schedules.dayOfWeek)),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Our Doctors</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {settings.doctorsIntro}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="mt-14 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Doctor profiles will appear here once added from the admin panel.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => {
            const docSchedules = allSchedules.filter((s) => s.doctorId === d.id);
            return (
              <article key={d.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative h-72 bg-muted">
                  {d.photoUrl ? (
                    <Image src={d.photoUrl} alt={d.name} fill className="object-cover object-top" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-soft to-muted text-5xl font-bold text-primary">
                      {initials(d.name)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-bold">{d.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-primary">
                    <GraduationCap className="h-4 w-4" /> {d.qualification}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" /> {d.specialization}
                    {d.experienceYears > 0 && ` · ${d.experienceYears}+ yrs`}
                  </p>

                  {docSchedules.length > 0 && (
                    <div className="mt-4 rounded-xl bg-muted p-3">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visiting hours</p>
                      <ul className="space-y-1 text-xs">
                        {docSchedules.slice(0, 7).map((s) => (
                          <li key={s.id} className="flex justify-between text-muted-foreground">
                            <span className="font-medium text-foreground">{DAY_NAMES_SHORT[s.dayOfWeek]}</span>
                            <span>
                              {formatTime12(s.startTime)} – {formatTime12(s.endTime)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {docSchedules.length > 7 && <p className="mt-1 text-[11px] text-muted-foreground">+{docSchedules.length - 7} more slots</p>}
                    </div>
                  )}

                  <div className="mt-auto flex gap-2 pt-5">
                    <Link
                      href={`/doctors/${d.slug}`}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:bg-muted"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/book?doctor=${d.id}`}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                    >
                      <CalendarPlus className="h-4 w-4" /> Book
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
