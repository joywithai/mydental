import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Share2, MessageCircle } from "lucide-react";
import { Logo } from "./logo";
import { formatTime12, DAY_NAMES_BD } from "@/lib/utils";
import type { SettingsWithHours } from "@/lib/settings";

export function Footer({ settings }: { settings: SettingsWithHours }) {
  const socials = [
    { url: settings.facebookUrl, icon: Share2, label: "Facebook" },
    { url: settings.instagramUrl, icon: Share2, label: "Instagram" },
    { url: settings.youtubeUrl, icon: Share2, label: "YouTube" },
    { url: settings.twitterUrl, icon: Share2, label: "Twitter" },
    { url: settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}` : "", icon: MessageCircle, label: "WhatsApp" },
  ].filter((s) => s.url);

  const todayBd = (new Date().getDay() + 1) % 7;

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo name={settings.name} logoUrl={settings.logoUrl} tagline={settings.tagline} />
          {settings.aboutText && (
            <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
              {settings.aboutText.replace(/[#*_\n]/g, " ").trim().slice(0, 220)}
            </p>
          )}
          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary-soft-foreground"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Quick Links</h3>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/about", "About Us"],
              ["/doctors", "Our Doctors"],
              ["/services", "Services"],
              ["/book", "Book Appointment"],
              ["/appointment-status", "Check Appointment Status"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-muted-foreground transition-colors hover:text-primary">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Contact</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {settings.address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{settings.address}</span>
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${settings.phone}`} className="hover:text-primary">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.emergencyPhone && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>
                  Emergency:{" "}
                  <a href={`tel:${settings.emergencyPhone}`} className="hover:text-primary">
                    {settings.emergencyPhone}
                  </a>
                </span>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${settings.email}`} className="hover:text-primary">
                  {settings.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Opening Hours</h3>
          <ul className="space-y-2 text-sm">
            {settings.hours.map((h) => (
              <li key={h.dayOfWeek} className="flex items-center justify-between gap-3">
                <span className={`flex items-center gap-1.5 ${h.dayOfWeek === todayBd ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  <Clock className={`h-3.5 w-3.5 ${h.dayOfWeek === todayBd ? "text-primary" : "text-transparent"}`} />
                  {DAY_NAMES_BD[h.dayOfWeek]}
                </span>
                <span className={h.isOpen ? "text-muted-foreground" : "text-destructive/80"}>
                  {h.isOpen ? `${formatTime12(h.openTime)} – ${formatTime12(h.closeTime)}` : "Closed"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5">
        <p className="px-4 text-center text-xs text-muted-foreground sm:px-6">
          {settings.footerText || `© ${new Date().getFullYear()} ${settings.name}. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
