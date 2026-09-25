import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { reviews } from "@/db/schema";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  rating: z.coerce.number().int().min(1, "Please select a rating").max(5),
  comment: z.string().trim().min(5, "Please write a short review").max(1500),
});

/** Public review submission — stored unapproved until an admin approves it. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your input." },
      { status: 400 },
    );
  }
  try {
    await db.insert(reviews).values(parsed.data); // isApproved = false until moderated
    return NextResponse.json({
      ok: true,
      message: "Thank you! Your review has been submitted and will appear after moderation.",
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
