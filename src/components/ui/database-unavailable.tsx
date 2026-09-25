import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export function DatabaseUnavailable({ retryHref = "/" }: { retryHref?: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16 text-foreground">
      <section role="alert" className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-lg sm:p-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-bold">Clinic database unavailable</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn&apos;t connect to the clinic database. Please try again shortly. If the problem continues, contact the site administrator.
        </p>
        <Link href={retryHref} className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Link>
      </section>
    </main>
  );
}
