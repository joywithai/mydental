import Link from "next/link";
import { Clock, MapPin, Mail, Phone, MessageCircle, Share2 } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatTime12, DAY_NAMES_BD } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const s = await getSettings();
  const links = [
    ["Facebook", s.facebookUrl, Share2], ["Instagram", s.instagramUrl, Share2], ["YouTube", s.youtubeUrl, Share2],
    ["WhatsApp", s.whatsappNumber ? `https://wa.me/${s.whatsappNumber.replace(/[^0-9]/g, "")}` : "", MessageCircle],
  ] as const;
  return <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
    <div className="max-w-2xl"><p className="font-semibold uppercase tracking-wider text-primary">We’re here to help</p><h1 className="mt-2 text-4xl font-extrabold">Contact {s.name}</h1><p className="mt-3 text-muted-foreground">Reach out to schedule an appointment, ask a question, or find our chamber.</p></div>
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-1">
        {([
          s.phone ? { icon: Phone, title: "Call us", value: s.phone, href: `tel:${s.phone}` } : null,
          s.emergencyPhone ? { icon: Phone, title: "Emergency line", value: s.emergencyPhone, href: `tel:${s.emergencyPhone}` } : null,
          s.email ? { icon: Mail, title: "Email", value: s.email, href: `mailto:${s.email}` } : null,
          s.address ? { icon: MapPin, title: "Visit us", value: s.address, href: s.mapLinkUrl || undefined } : null,
        ].filter((item): item is NonNullable<typeof item> => item !== null)).map((item) => {
          const c = item!;
          return <div key={c.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><c.icon className="h-5 w-5" /></span><div><h2 className="text-sm font-semibold">{c.title}</h2>{c.href ? <a href={c.href} className="mt-1 block text-sm text-muted-foreground hover:text-primary">{c.value}</a> : <p className="mt-1 text-sm text-muted-foreground">{c.value}</p>}</div></div>;
        })}
        {links.filter(([, href]) => href).length > 0 && <div className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">Follow us</h2><div className="mt-3 flex gap-2">{links.filter(([, href]) => href).map(([label, href, Icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-primary"><Icon className="h-4 w-4" /></a>)}</div></div>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2">
        {s.mapEmbedUrl ? <iframe src={s.mapEmbedUrl} className="h-full min-h-[420px] w-full" title="Chamber location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 bg-muted/40 p-8 text-center"><MapPin className="h-10 w-10 text-primary"/><p className="font-medium">{s.address || "Map location not configured"}</p><p className="max-w-sm text-sm text-muted-foreground">The chamber location map can be added by an administrator under Chamber Settings.</p>{s.mapLinkUrl && <a href={s.mapLinkUrl} className="text-sm font-semibold text-primary" target="_blank" rel="noreferrer">Open in Maps</a>}</div>}
      </div>
    </div>
    <div className="mt-8 rounded-2xl border border-border bg-card p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Clock className="h-5 w-5 text-primary"/>Opening hours</h2><div className="mt-4 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">{s.hours.map(h=><div key={h.dayOfWeek} className="flex justify-between border-b border-border py-2 text-sm"><span className="font-medium">{DAY_NAMES_BD[h.dayOfWeek]}</span><span className={h.isOpen?"text-muted-foreground":"text-destructive"}>{h.isOpen?`${formatTime12(h.openTime)} – ${formatTime12(h.closeTime)}`:"Closed"}</span></div>)}</div></div>
    <div className="mt-8 rounded-2xl bg-primary-soft p-6 text-center"><p className="font-semibold text-primary-soft-foreground">Ready to book your visit?</p><Link href="/book" className="mt-3 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Book an appointment</Link></div>
  </div>;
}
