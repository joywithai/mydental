import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctors, patients, services } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Public appointment status lookup: reference + phone. */
export async function GET(req: NextRequest) {
  const reference = (req.nextUrl.searchParams.get("reference") ?? "").trim().toUpperCase();
  const phone = (req.nextUrl.searchParams.get("phone") ?? "").trim().replace(/\s+/g, "");

  if (!reference || !phone) {
    return NextResponse.json(
      { ok: false, message: "Please enter both your booking reference and phone number." },
      { status: 400 },
    );
  }

  try {
    const [row] = await db
      .select({
        appointment: appointments,
        doctorName: doctors.name,
        serviceName: services.name,
        patientName: patients.name,
        patientPhone: patients.phone,
      })
      .from(appointments)
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(eq(appointments.reference, reference))
      .limit(1);

    if (!row || row.patientPhone !== phone) {
      return NextResponse.json(
        { ok: false, message: "No appointment found for this reference and phone number." },
        { status: 404 },
      );
    }

    const a = row.appointment;
    return NextResponse.json({
      ok: true,
      appointment: {
        reference: a.reference,
        status: a.status,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        notes: a.notes,
        createdAt: a.createdAt,
        doctorName: row.doctorName,
        serviceName: row.serviceName,
        patientName: row.patientName,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
