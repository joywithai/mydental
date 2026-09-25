"use server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users, chamberSettings, openingHours } from "@/db/schema";
import { createSession, destroySession, hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";

const credentialsSchema = z.object({ email: z.string().email().max(200), password: z.string().min(8).max(128) });
export async function loginAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Enter a valid email and password (at least 8 characters)." };
  const email = parsed.data.email.toLowerCase();
  let user;
  try {
    [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  } catch (error) {
    console.error("Admin login could not reach Supabase PostgreSQL:", error);
    return { ok: false, message: "Database is unavailable. Check the Supabase connection and try again." };
  }
  if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) return { ok: false, message: "Email or password is incorrect." };
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/admin");
}

export async function setupAction(formData: FormData) {
  const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(200), password: z.string().min(12).max(128), confirm: z.string() }).refine((x) => x.password === x.confirm, { path: ["confirm"], message: "Passwords do not match" });
  const parsed = schema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your details." };
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) return { ok: false, message: "Initial setup is already complete. Please sign in." };
  const [user] = await db.insert(users).values({ name: parsed.data.name, email: parsed.data.email.toLowerCase(), passwordHash: await hashPassword(parsed.data.password), role: "ADMIN" }).returning();
  if (!user) return { ok: false, message: "Could not create administrator." };
  const [settings] = await db.select().from(chamberSettings).limit(1);
  if (!settings) {
    const [created] = await db.insert(chamberSettings).values({ name: "My Dental Chamber" }).returning();
    if (created) await db.insert(openingHours).values(Array.from({ length: 7 }, (_, dayOfWeek) => ({ settingsId: created.id, dayOfWeek, isOpen: dayOfWeek !== 6, openTime: "17:00", closeTime: "21:00" })));
  }
  await createSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/admin");
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireAdmin();
  const schema = z.object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  }).refine((data) => data.newPassword === data.confirmPassword, { path: ["confirmPassword"], message: "New passwords do not match." }).refine((data) => data.newPassword !== data.currentPassword, { path: ["newPassword"], message: "Choose a different password." });
  const parsed = schema.safeParse({ currentPassword: formData.get("currentPassword"), newPassword: formData.get("newPassword"), confirmPassword: formData.get("confirmPassword") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your password." };
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) return { ok: false, message: "Current password is incorrect." };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.newPassword), updatedAt: new Date() }).where(eq(users.id, user.id));
  return { ok: true, message: "Password updated successfully." };
}

export async function logoutAction() { await destroySession(); redirect("/admin/login"); }

export async function updateSettingsAction(payload: unknown) {
  await requireAdmin();
  const schema = z.object({
    name: z.string().trim().min(2).max(120), tagline: z.string().max(200).optional(), logoUrl: z.string().max(500).nullable().optional(), faviconUrl: z.string().max(500).nullable().optional(), heroUrl: z.string().max(500).nullable().optional(),
    heroTitle: z.string().max(200).optional(), heroHighlight: z.string().max(200).optional(), primaryCtaLabel: z.string().max(80).optional(), secondaryCtaLabel: z.string().max(80).optional(), trustNoteOne: z.string().max(120).optional(), trustNoteTwo: z.string().max(120).optional(),
    homeAboutHeading: z.string().max(200).optional(), homeServicesHeading: z.string().max(200).optional(), homeServicesIntro: z.string().max(1000).optional(), homeDoctorsHeading: z.string().max(200).optional(), homeDoctorsIntro: z.string().max(1000).optional(), homeCtaHeading: z.string().max(200).optional(), homeCtaIntro: z.string().max(1000).optional(), servicesIntro: z.string().max(1000).optional(), doctorsIntro: z.string().max(1000).optional(),
    description: z.string().max(2000).optional(), aboutText: z.string().max(10000).optional(), missionText: z.string().max(5000).optional(), experienceText: z.string().max(200).optional(), facilitiesText: z.string().max(5000).optional(),
    phone: z.string().max(40).optional(), emergencyPhone: z.string().max(40).optional(), email: z.string().max(200).optional(), address: z.string().max(500).optional(), mapEmbedUrl: z.string().max(1000).nullable().optional(), mapLinkUrl: z.string().max(1000).nullable().optional(),
    facebookUrl: z.string().max(500).optional(), instagramUrl: z.string().max(500).optional(), youtubeUrl: z.string().max(500).optional(), twitterUrl: z.string().max(500).optional(), whatsappNumber: z.string().max(40).optional(), bookingNotice: z.string().max(1000).optional(), footerText: z.string().max(500).optional(),
    hours: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), isOpen: z.boolean(), openTime: z.string().regex(/^\d{2}:\d{2}$/), closeTime: z.string().regex(/^\d{2}:\d{2}$/) })).length(7),
  });
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your settings." };
  if (new Set(parsed.data.hours.map((h) => h.dayOfWeek)).size !== 7) return { ok: false, message: "Please configure each weekday exactly once." };
  const { hours, ...settingsData } = parsed.data;
  const [current] = await db.select().from(chamberSettings).limit(1);
  let settingsId = current?.id;
  if (current) await db.update(chamberSettings).set({ ...settingsData, updatedAt: new Date() }).where(eq(chamberSettings.id, current.id));
  else { const [created] = await db.insert(chamberSettings).values(settingsData).returning(); settingsId = created?.id; }
  if (!settingsId) return { ok: false, message: "Unable to save settings." };
  for (const h of hours) {
    const [old] = await db.select().from(openingHours).where(and(eq(openingHours.settingsId, settingsId), eq(openingHours.dayOfWeek, h.dayOfWeek))).limit(1);
    if (old) await db.update(openingHours).set({ isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime }).where(eq(openingHours.id, old.id));
    else await db.insert(openingHours).values({ ...h, settingsId });
  }
  return { ok: true, message: "Chamber settings saved." };
}
