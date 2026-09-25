import { NextResponse } from "next/server";
import { db } from "@/db";
import { chamberSettings } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Read-only DB liveness probe; never returns database credentials or records. */
export async function GET() {
  try {
    await db.select({ id: chamberSettings.id }).from(chamberSettings).limit(1);
    return NextResponse.json({ ok: true, database: "connected" });
  } catch {
    return NextResponse.json(
      { ok: false, database: "unavailable", message: "Supabase PostgreSQL is unavailable. Check DATABASE_URL and the database connection." },
      { status: 503 },
    );
  }
}
