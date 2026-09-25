import "server-only";
import { cache } from "react";
import { db } from "@/db";
import { chamberSettings, openingHours, type ChamberSettings, type OpeningHour } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type SettingsWithHours = ChamberSettings & { hours: OpeningHour[] };

/**
 * Loads the singleton chamber settings (+ weekly opening hours).
 * Falls back to sensible defaults so the site renders even before
 * the first seed / save.
 */
export const getSettings = cache(async (): Promise<SettingsWithHours> => {
  const [settings] = await db.select().from(chamberSettings).limit(1);
  if (!settings) {
    return {
      id: "",
      name: "My Dental Chamber",
      tagline: "Quality dental care for your smile",
      logoUrl: null,
      faviconUrl: null,
      heroUrl: null,
      heroTitle: "Healthy teeth,",
      heroHighlight: "confident smile",
      primaryCtaLabel: "Book Appointment",
      secondaryCtaLabel: "Our Services",
      trustNoteOne: "Sterilized & safe",
      trustNoteTwo: "Experienced doctors",
      homeAboutHeading: "Caring for smiles in your neighbourhood",
      homeServicesHeading: "Featured dental services",
      homeServicesIntro: "",
      homeDoctorsHeading: "Our doctors",
      homeDoctorsIntro: "",
      homeCtaHeading: "Ready for a healthier smile?",
      homeCtaIntro: "",
      servicesIntro: "",
      doctorsIntro: "",
      description: "",
      aboutText: "",
      missionText: "",
      experienceText: "",
      facilitiesText: "",
      phone: "",
      emergencyPhone: "",
      email: "",
      address: "",
      mapEmbedUrl: null,
      mapLinkUrl: null,
      facebookUrl: "",
      instagramUrl: "",
      youtubeUrl: "",
      whatsappNumber: "",
      twitterUrl: "",
      bookingNotice: "",
      footerText: "",
      updatedAt: new Date(),
      hours: defaultHours(),
    };
  }
  const hours = await db
    .select()
    .from(openingHours)
    .where(eq(openingHours.settingsId, settings.id))
    .orderBy(asc(openingHours.dayOfWeek));
  return { ...settings, hours: hours.length ? hours : defaultHours(settings.id) };
});

export function defaultHours(settingsId = ""): OpeningHour[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `default-${i}`,
    settingsId,
    dayOfWeek: i,
    isOpen: i !== 6, // Friday closed by default (BD week: 6 = Friday)
    openTime: "17:00",
    closeTime: "21:00",
  }));
}
