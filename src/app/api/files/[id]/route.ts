import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { storedFiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Serves uploaded files (logo, photos, gallery…) from the DB blob storage.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [file] = await db.select().from(storedFiles).where(eq(storedFiles.id, id)).limit(1);
  if (!file) {
    return NextResponse.json({ ok: false, message: "File not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox;",
    },
  });
}
