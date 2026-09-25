import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { initials } from "@/lib/utils";
import { StarRating } from "@/components/ui/misc";
import { ReviewForm } from "@/components/public/review-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Patient Reviews" };

export default async function ReviewsPage() {
  const list = await db.select().from(reviews).where(eq(reviews.isApproved, true)).orderBy(desc(reviews.createdAt));
  return <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><div className="mx-auto max-w-3xl text-center"><p className="font-semibold uppercase tracking-wider text-primary">Patient stories</p><h1 className="mt-2 text-4xl font-extrabold">Reviews & experiences</h1><p className="mt-3 text-muted-foreground">Your feedback helps us provide better care for every smile.</p></div><div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]"> <div>{list.length? <div className="grid gap-4 sm:grid-cols-2">{list.map(r=><figure key={r.id} className="rounded-2xl border border-border bg-card p-5"><StarRating rating={r.rating}/><blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">“{r.comment}”</blockquote><figcaption className="mt-4 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-soft-foreground">{initials(r.name)}</span><div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</p></div></figcaption></figure>)}</div>:<div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No reviews published yet. Be the first to share your experience.</div>}</div><aside><ReviewForm/></aside></div></div>;
}
