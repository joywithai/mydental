import { AppointmentLookup } from "@/components/public/appointment-lookup";
export const metadata = { title: "Check Appointment Status" };
export default async function StatusPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6"><div className="text-center"><p className="font-semibold uppercase tracking-wider text-primary">Booking lookup</p><h1 className="mt-2 text-4xl font-extrabold">Appointment status</h1><p className="mt-3 text-muted-foreground">Enter the reference from your booking and the phone number used to book.</p></div><div className="mx-auto mt-8 max-w-xl"><AppointmentLookup initialReference={typeof q.reference === "string" ? q.reference : ""}/></div></div>;
}
