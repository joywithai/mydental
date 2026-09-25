import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/slots";
import { db } from "@/db";
import { services } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { toDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const doctorId = req.nextUrl.searchParams.get("doctorId");
  const date = req.nextUrl.searchParams.get("date") ?? toDateKey(new Date());
  if (!doctorId) {
    return NextResponse.json({ ok: false, message: "doctorId is required" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, message: "date must be YYYY-MM-DD" }, { status: 400 });
  }
  try {
    const serviceId = req.nextUrl.searchParams.get("serviceId");
    let duration: number | undefined;
    if (serviceId) {
      const [service] = await db.select().from(services).where(and(eq(services.id, serviceId), eq(services.isActive, true))).limit(1);
      if (service) duration = service.duration;
    }
    const slots = await getAvailability(doctorId, date, duration);
    return NextResponse.json({ ok: true, slots });
  } catch {
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
