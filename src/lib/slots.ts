import { randomBytes } from "crypto";
import { db } from "@/db";
import { appointments, doctorLeaves, schedules, type AppointmentStatus } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { jsDayToBd, minutesToTime, timeToMinutes, toDateKey } from "./utils";

export type Slot = {
  time: string; // "17:30"
  endTime: string;
  available: boolean;
};

const BLOCKING_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "RESCHEDULED"];

export function dateKeyToMidnight(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/**
 * Computes bookable slots for a doctor on a given date (YYYY-MM-DD).
 * A slot is available when:
 *  - the doctor has an active schedule covering that weekday,
 *  - the doctor is not on leave that day,
 *  - the slot is not already booked (PENDING/CONFIRMED/RESCHEDULED),
 *  - the slot is in the future (for today).
 */
export async function getAvailability(doctorId: string, dateKey: string, requestedDuration?: number): Promise<Slot[]> {
  const date = dateKeyToMidnight(dateKey);
  const bdDay = jsDayToBd(date.getDay());

  // 1. Active schedules for that weekday
  const daySchedules = await db
    .select()
    .from(schedules)
    .where(and(eq(schedules.doctorId, doctorId), eq(schedules.dayOfWeek, bdDay), eq(schedules.isActive, true)));

  if (daySchedules.length === 0) return [];

  // 2. Leave check
  const leaves = await db
    .select()
    .from(doctorLeaves)
    .where(and(eq(doctorLeaves.doctorId, doctorId), eq(doctorLeaves.date, date)));
  if (leaves.length > 0) return [];

  // 3. Booked slots
  const booked = await db
    .select({ startTime: appointments.startTime, endTime: appointments.endTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.date, date),
        inArray(appointments.status, BLOCKING_STATUSES),
      ),
    );
  const bookedIntervals = booked.map((b) => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }));

  // 4. Build slots
  const now = new Date();
  const isToday = toDateKey(now) === dateKey;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: Slot[] = [];
  const seen = new Set<string>();
  for (const s of daySchedules) {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    const duration = Math.max(5, requestedDuration ?? s.slotMinutes);
    for (let t = start; t + duration <= end; t += s.slotMinutes) {
      const time = minutesToTime(t);
      if (seen.has(time)) continue;
      seen.add(time);
      const overlaps = bookedIntervals.some((booking) => t < booking.end && t + duration > booking.start);
      const available = !overlaps && (!isToday || t > nowMinutes);
      slots.push({ time, endTime: minutesToTime(t + duration), available });
    }
  }
  slots.sort((a, b) => a.time.localeCompare(b.time));
  return slots;
}

/** Server-side validation used by the booking API before creating an appointment. */
export async function validateSlot(doctorId: string, dateKey: string, time: string, duration?: number): Promise<string | null> {
  const slots = await getAvailability(doctorId, dateKey, duration);
  const slot = slots.find((s) => s.time === time);
  if (!slot) return "Selected time is not within the doctor's schedule.";
  if (!slot.available) return "Selected time is no longer available. Please choose another slot.";
  return null;
}

export function generateReference(): string {
  return `APT-${randomBytes(4).toString("hex").toUpperCase()}`;
}
