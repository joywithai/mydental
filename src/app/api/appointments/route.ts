import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctors, patients, services } from "@/db/schema";
import { validateSlot, generateReference, dateKeyToMidnight } from "@/lib/slots";

export const dynamic = "force-dynamic";

const bookingSchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  patient: z.object({
    name: z.string().trim().min(2, "Please enter your full name").max(120),
    phone: z
      .string()
      .trim()
      .min(6, "Please enter a valid phone number")
      .max(20)
      .regex(/^[0-9+\-\s()]+$/, "Phone can only contain digits, +, - and spaces"),
    email: z.string().trim().email("Invalid email address").max(120).optional().or(z.literal("")),
    age: z.coerce.number().int().min(0).max(120).optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  }),
});

/** Public appointment booking endpoint. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { ok: false, message: "Please check the highlighted fields.", fields: flat.fieldErrors },
      { status: 400 },
    );
  }
  const { doctorId, serviceId, date, time, patient } = parsed.data;

  try {
    // 1. Doctor exists & active
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(and(eq(doctors.id, doctorId), eq(doctors.isActive, true)))
      .limit(1);
    if (!doctor) {
      return NextResponse.json({ ok: false, message: "Selected doctor is not available." }, { status: 400 });
    }

    // 2. Service exists & active
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.isActive, true)))
      .limit(1);
    if (!service) {
      return NextResponse.json({ ok: false, message: "Selected service is not available." }, { status: 400 });
    }

    // 3-4. Date must be today or in the future; slot valid & free
    const dateObj = dateKeyToMidnight(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj.getTime() < today.getTime()) {
      return NextResponse.json({ ok: false, message: "Please select today or a future date." }, { status: 400 });
    }
    const slotError = await validateSlot(doctorId, date, time, service.duration);
    if (slotError) {
      return NextResponse.json({ ok: false, message: slotError }, { status: 409 });
    }

    // 5. Patient information → upsert by phone
    const phone = patient.phone.replace(/\s+/g, "");
    let [existing] = await db.select().from(patients).where(eq(patients.phone, phone)).limit(1);
    if (existing) {
      // keep info fresh
      await db
        .update(patients)
        .set({
          name: patient.name,
          email: patient.email ?? existing.email,
          age: patient.age ?? existing.age,
          gender: patient.gender || existing.gender,
          updatedAt: new Date(),
        })
        .where(eq(patients.id, existing.id));
    } else {
      [existing] = await db
        .insert(patients)
        .values({
          name: patient.name,
          phone,
          email: patient.email ?? "",
          age: patient.age ?? null,
          gender: patient.gender ?? "",
        })
        .returning();
    }

    // Slot duration = service duration (capped inside schedule gaps by design)
    const endMinutes = timeToMinutesFn(time) + service.duration;
    const endTime = minutesToTimeFn(endMinutes);

    const [appointment] = await db
      .insert(appointments)
      .values({
        reference: generateReference(),
        patientId: existing!.id,
        doctorId,
        serviceId,
        date: dateObj,
        startTime: time,
        endTime,
        status: "PENDING",
        notes: patient.notes ?? "",
      })
      .returning();

    return NextResponse.json({
      ok: true,
      appointment: {
        reference: appointment!.reference,
        date,
        startTime: time,
        endTime,
        doctor: doctor.name,
        service: service.name,
        status: appointment!.status,
      },
    });
  } catch (e) {
    console.error("booking error", e);
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

function timeToMinutesFn(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h! * 60 + (m ?? 0);
}
function minutesToTimeFn(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
