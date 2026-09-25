import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { doctors, services } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { BookingForm } from "@/components/public/booking-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book an Appointment" };

export default async function BookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const [doctorList, serviceList, settings] = await Promise.all([
    db.select({ id: doctors.id, name: doctors.name, specialization: doctors.specialization }).from(doctors).where(eq(doctors.isActive, true)).orderBy(asc(doctors.order)),
    db.select({ id: services.id, name: services.name, duration: services.duration, price: services.price }).from(services).where(and(eq(services.isActive, true))).orderBy(asc(services.order)),
    getSettings(),
  ]);
  return <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><div className="mx-auto max-w-2xl text-center"><p className="font-semibold uppercase tracking-wider text-primary">Simple, secure, online</p><h1 className="mt-2 text-4xl font-extrabold">Book an appointment</h1><p className="mt-3 text-muted-foreground">Choose your doctor, service, date and available time. We’ll confirm your appointment shortly.</p></div><div className="mx-auto mt-9 max-w-3xl"><BookingForm doctors={doctorList} services={serviceList} initialDoctor={typeof query.doctor === "string" ? query.doctor : ""} initialService={typeof query.service === "string" ? query.service : ""} notice={settings.bookingNotice}/></div></div>;
}
