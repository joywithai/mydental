import { boolean, customType, index, integer, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const createdAt = () => timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().$defaultFn(() => new Date());
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type EquipmentCondition = "EXCELLENT" | "GOOD" | "FAIR" | "NEEDS_REPAIR" | "OUT_OF_SERVICE";
export type EquipmentStatus = "ACTIVE" | "UNDER_MAINTENANCE" | "RETIRED";

// ------------------------------ Auth ------------------------------

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("ADMIN"), // ADMIN | STAFF (future RBAC)
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// --------------------------- File storage -------------------------
// Binary lives here (BLOB) and is served via /api/files/[id]; all other
// tables store only the URL reference. Swap for S3/R2 in production by
// changing the upload server action only.

export const storedFiles = pgTable("stored_files", {
  id: id(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: createdAt(),
});

// ------------------------- Chamber settings -----------------------

export const chamberSettings = pgTable("chamber_settings", {
  id: id(),
  name: text("name").notNull().default("My Dental Chamber"),
  tagline: text("tagline").notNull().default(""),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  heroUrl: text("hero_url"),
  heroTitle: text("hero_title").notNull().default("Healthy teeth,"),
  heroHighlight: text("hero_highlight").notNull().default("confident smile"),
  primaryCtaLabel: text("primary_cta_label").notNull().default("Book Appointment"),
  secondaryCtaLabel: text("secondary_cta_label").notNull().default("Our Services"),
  trustNoteOne: text("trust_note_one").notNull().default("Sterilized & safe"),
  trustNoteTwo: text("trust_note_two").notNull().default("Experienced doctors"),
  homeAboutHeading: text("home_about_heading").notNull().default("Caring for smiles in your neighbourhood"),
  homeServicesHeading: text("home_services_heading").notNull().default("Featured dental services"),
  homeServicesIntro: text("home_services_intro").notNull().default(""),
  homeDoctorsHeading: text("home_doctors_heading").notNull().default("Our doctors"),
  homeDoctorsIntro: text("home_doctors_intro").notNull().default(""),
  homeCtaHeading: text("home_cta_heading").notNull().default("Ready for a healthier smile?"),
  homeCtaIntro: text("home_cta_intro").notNull().default(""),
  servicesIntro: text("services_intro").notNull().default(""),
  doctorsIntro: text("doctors_intro").notNull().default(""),
  description: text("description").notNull().default(""),
  aboutText: text("about_text").notNull().default(""),
  missionText: text("mission_text").notNull().default(""),
  experienceText: text("experience_text").notNull().default(""),
  facilitiesText: text("facilities_text").notNull().default(""),
  phone: text("phone").notNull().default(""),
  emergencyPhone: text("emergency_phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  mapEmbedUrl: text("map_embed_url"),
  mapLinkUrl: text("map_link_url"),
  facebookUrl: text("facebook_url").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  youtubeUrl: text("youtube_url").notNull().default(""),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  twitterUrl: text("twitter_url").notNull().default(""),
  bookingNotice: text("booking_notice").notNull().default(""),
  footerText: text("footer_text").notNull().default(""),
  updatedAt: updatedAt(),
});

export const openingHours = pgTable(
  "opening_hours",
  {
    id: id(),
    settingsId: text("settings_id")
      .notNull()
      .references(() => chamberSettings.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Saturday ... 6 = Friday
    isOpen: boolean("is_open").notNull().default(true),
    openTime: text("open_time").notNull().default("17:00"),
    closeTime: text("close_time").notNull().default("21:00"),
  },
  (t) => [uniqueIndex("opening_hours_settings_day_uq").on(t.settingsId, t.dayOfWeek)],
);

// ------------------------------ Doctors ---------------------------

export const doctors = pgTable("doctors", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  photoUrl: text("photo_url"),
  qualification: text("qualification").notNull().default(""),
  specialization: text("specialization").notNull().default(""),
  experienceYears: integer("experience_years").notNull().default(0),
  biography: text("biography").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  consultationFee: real("consultation_fee"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const schedules = pgTable(
  "schedules",
  {
    id: id(),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Saturday ... 6 = Friday
    startTime: text("start_time").notNull(), // "17:00"
    endTime: text("end_time").notNull(), // "21:00"
    slotMinutes: integer("slot_minutes").notNull().default(30),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("schedules_doctor_day_idx").on(t.doctorId, t.dayOfWeek)],
);

export const doctorLeaves = pgTable(
  "doctor_leaves",
  {
    id: id(),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
    reason: text("reason").notNull().default(""),
  },
  (t) => [uniqueIndex("doctor_leaves_doctor_date_uq").on(t.doctorId, t.date)],
);

// ------------------------------ Patients --------------------------

export const patients = pgTable(
  "patients",
  {
    id: id(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    address: text("address").notNull().default(""),
    age: integer("age"),
    gender: text("gender").notNull().default(""), // MALE | FEMALE | OTHER | ""
    bloodGroup: text("blood_group").notNull().default(""),
    medicalInfo: text("medical_info").notNull().default(""),
    dentalHistory: text("dental_history").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("patients_phone_uq").on(t.phone)],
);

// ------------------------------ Services --------------------------

export const services = pgTable("services", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  price: real("price").notNull().default(0),
  duration: integer("duration").notNull().default(30), // minutes
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
});

// ---------------------------- Appointments ------------------------

export const appointments = pgTable(
  "appointments",
  {
    id: id(),
    reference: text("reference").notNull().unique(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctors.id),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
    date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(), // day (midnight)
    startTime: text("start_time").notNull(), // "17:30"
    endTime: text("end_time").notNull(),
    status: text("status").$type<AppointmentStatus>().notNull().default("PENDING"),
    notes: text("notes").notNull().default(""),
    adminNote: text("admin_note").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("appointments_doctor_date_idx").on(t.doctorId, t.date), index("appointments_date_idx").on(t.date)],
);

// ------------------------------ Reviews ---------------------------

export const reviews = pgTable("reviews", {
  id: id(),
  name: text("name").notNull(),
  rating: integer("rating").notNull(), // 1..5
  comment: text("comment").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  patientId: text("patient_id"),
  createdAt: createdAt(),
});

// ------------------------------ Employees -------------------------

export const employees = pgTable("employees", {
  id: id(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  position: text("position").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  joiningDate: timestamp("joining_date", { withTimezone: true, mode: "date" }),
  responsibilities: text("responsibilities").notNull().default(""),
  notes: text("notes").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
});

// --------------------------- Medicines ----------------------------

export const medicines = pgTable("medicines", {
  id: id(),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull().default("pcs"),
  purchasePrice: real("purchase_price").notNull().default(0),
  supplier: text("supplier").notNull().default(""),
  expiryDate: timestamp("expiry_date", { withTimezone: true, mode: "date" }),
  minStockLevel: real("min_stock_level").notNull().default(10),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
});

// --------------------------- Equipment ----------------------------

export const equipment = pgTable("equipment", {
  id: id(),
  name: text("name").notNull(),
  serialNumber: text("serial_number").notNull().default(""),
  purchaseDate: timestamp("purchase_date", { withTimezone: true, mode: "date" }),
  purchasePrice: real("purchase_price"),
  condition: text("condition").$type<EquipmentCondition>().notNull().default("GOOD"),
  warrantyUntil: timestamp("warranty_until", { withTimezone: true, mode: "date" }),
  location: text("location").notNull().default(""),
  lastMaintenance: timestamp("last_maintenance", { withTimezone: true, mode: "date" }),
  nextMaintenance: timestamp("next_maintenance", { withTimezone: true, mode: "date" }),
  status: text("status").$type<EquipmentStatus>().notNull().default("ACTIVE"),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
});

export const maintenanceLogs = pgTable("maintenance_logs", {
  id: id(),
  equipmentId: text("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true, mode: "date" }).notNull(),
  description: text("description").notNull().default(""),
  cost: real("cost"),
  performedBy: text("performed_by").notNull().default(""),
  createdAt: createdAt(),
});

// ------------------------------ Gallery ---------------------------

export const galleryImages = pgTable("gallery_images", {
  id: id(),
  title: text("title").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  order: integer("order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: createdAt(),
});

// ------------------------------- FAQs -----------------------------

export const faqs = pgTable("faqs", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// ------------------------------ Types ------------------------------

export type User = typeof users.$inferSelect;
export type ChamberSettings = typeof chamberSettings.$inferSelect;
export type OpeningHour = typeof openingHours.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type DoctorLeave = typeof doctorLeaves.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type StoredFile = typeof storedFiles.$inferSelect;
