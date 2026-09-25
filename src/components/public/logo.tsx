import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  name,
  logoUrl,
  className,
  nameClassName,
  size = "md",
  tagline,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
  nameClassName?: string;
  size?: "sm" | "md" | "lg";
  tagline?: string;
}) {
  const box = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {logoUrl ? (
        <span className={cn("relative shrink-0 overflow-hidden rounded-xl", box)}>
          <Image src={logoUrl} alt={name} fill className="object-contain" unoptimized />
        </span>
      ) : (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
            box,
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[60%] w-[60%]">
            <path d="M12 5.5c-1.5-1.8-3.5-2.5-5-2-2 .6-3 2.5-3 5 0 4.5 2.2 9.5 4 9.5 1.4 0 1.6-2.7 2-4.5.2-.9.7-1.5 2-1.5s1.8.6 2 1.5c.4 1.8.6 4.5 2 4.5 1.8 0 4-5 4-9.5 0-2.5-1-4.4-3-5-1.5-.5-3.5.2-5 2z" />
          </svg>
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className={cn("font-bold tracking-tight", text, nameClassName)}>{name}</span>
        {tagline && <span className="text-[11px] text-muted-foreground">{tagline}</span>}
      </span>
    </span>
  );
}

export function LogoLink({
  name,
  logoUrl,
  tagline,
  className,
}: {
  name: string;
  logoUrl: string | null;
  tagline?: string;
  className?: string;
}) {
  return (
    <Link href="/" className={cn("shrink-0 transition-opacity hover:opacity-85", className)} aria-label={name}>
      <Logo name={name} logoUrl={logoUrl} tagline={tagline} />
    </Link>
  );
}
