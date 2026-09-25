import { HelpCircle, MessageCircleQuestion } from "lucide-react";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const list = await db.select().from(faqs).where(eq(faqs.isActive, true)).orderBy(asc(faqs.order));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: list.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
          <MessageCircleQuestion className="h-7 w-7" />
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Frequently Asked Questions</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Quick answers to the questions patients ask us most.
        </p>
      </div>

      {list.length === 0 ? (
        <p className="mt-14 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          FAQs will appear here once added from the admin panel.
        </p>
      ) : (
        <div className="mt-12 space-y-3">
          {list.map((f) => (
            <details
              key={f.id}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors open:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold transition-colors hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                <span className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  {f.question}
                </span>
                <svg
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className="border-t border-border px-5 py-4 pl-[52px] text-sm leading-relaxed text-muted-foreground">
                {f.answer}
              </div>
            </details>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-2xl bg-primary-soft p-8 text-center">
        <h2 className="text-xl font-bold text-primary-soft-foreground">Still have a question?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-primary-soft-foreground/80">
          Can&apos;t find the answer you&apos;re looking for? Reach out to us or book an appointment — we&apos;re happy to help.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Contact us
          </Link>
          <Link
            href="/book"
            className="inline-flex h-10 items-center rounded-xl border border-primary/30 bg-card px-5 text-sm font-semibold text-primary transition-colors hover:bg-muted"
          >
            Book appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
