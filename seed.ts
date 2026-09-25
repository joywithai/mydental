import "dotenv/config";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./src/db";
import {
  appointments, chamberSettings, doctors, employees, equipment, faqs, galleryImages,
  maintenanceLogs, medicines, openingHours, patients, reviews, schedules, services, storedFiles, users,
} from "./src/db/schema";

const CHAMBER = {
  name: "Saifur's dental planet",
  tagline: "Gentle care. Confident smiles.",
  heroTitle: "Healthy teeth,",
  heroHighlight: "confident smile",
  primaryCtaLabel: "Book Appointment",
  secondaryCtaLabel: "View our services",
  trustNoteOne: "Sterilized & safe",
  trustNoteTwo: "Experienced doctors",
  homeAboutHeading: "Personal dental care, close to home",
  homeServicesHeading: "Dental care for every smile",
  homeServicesIntro: "Explore our treatments and choose the care that is right for you.",
  homeDoctorsHeading: "Meet your dental care team",
  homeDoctorsIntro: "Get to know our clinicians and find a doctor who fits your needs.",
  homeCtaHeading: "Ready to book your visit?",
  homeCtaIntro: "Choose an available doctor and appointment time online, any time.",
  servicesIntro: "Browse available dental treatments and their current fees. Your dentist will confirm a treatment plan before care begins.",
  doctorsIntro: "View clinician profiles, specialties and availability, then book with the doctor you prefer.",
  description: "Modern dental care with experienced clinicians, gentle treatment and transparent pricing.",
  aboutText: "Saifur's dental planet is a patient-first dental chamber focused on comfortable, evidence-based oral healthcare. Our team combines modern equipment with a personal approach, so every visit feels clear, calm and convenient.\n\nFrom routine checkups to advanced restorative treatments, we make it easier to take care of your smile.",
  missionText: "To make quality dental care accessible, reassuring and tailored to every patient.",
  experienceText: "10+ years of trusted care",
  facilitiesText: "Digital dental imaging\nSterilized instruments for every patient\nComfortable treatment rooms\nTransparent treatment plans\nFriendly, multilingual care team",
  phone: "+8801312468151",
  emergencyPhone: "+8801312468151",
  whatsappNumber: "8801312468151",
  email: "dr.saifursdentalplanet@gmail.com",
  address: "Madar Mansion (2nd floor), East Side of Metro Rail Pillar #249, Mirpur-10, Dhaka",
  mapLinkUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Madar Mansion (2nd floor), East Side of Metro Rail Pillar #249, Mirpur-10, Dhaka")}`,
  mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent("Madar Mansion (2nd floor), East Side of Metro Rail Pillar #249, Mirpur-10, Dhaka")}&output=embed`,
  bookingNotice: "Please arrive 10 minutes before your appointment. New bookings are pending until confirmed by our team.",
  footerText: "Saifur's dental planet · Care for every smile.",
};

const DEMO_NAMES = ["Ayesha Rahman","Tanvir Ahmed","Nusrat Jahan","Mahmud Hasan","Farzana Islam","Rafiq Uddin","Samira Hossain","Imran Chowdhury","Sadia Akter","Arif Hossain","Maliha Karim","Rakibul Islam","Sharmeen Sultana","Nayeem Ahmed","Tanjila Noor","Fahim Rahman","Mehjabin Akter","Sajid Hasan","Tasnim Jahan","Rashedul Alam"];
const SERVICE_NAMES = ["Dental Checkup","Teeth Cleaning","Dental Filling","Root Canal Treatment","Teeth Whitening","Braces Consultation","Tooth Extraction","Dental Crown","Dental Bridge","Dentures Consultation","Pediatric Dentistry","Gum Treatment","Dental Implant Consultation","Wisdom Tooth Evaluation","Fluoride Treatment","Dental Sealants","Night Guard Fitting","Emergency Dental Visit","Veneer Consultation","Oral Cancer Screening"];
const SERVICE_SLUGS = ["dental-checkup","teeth-cleaning","dental-filling","root-canal-treatment","teeth-whitening","braces-consultation","tooth-extraction","dental-crown","dental-bridge","dentures-consultation","pediatric-dentistry","gum-treatment","dental-implant-consultation","wisdom-tooth-evaluation","fluoride-treatment","dental-sealants","night-guard-fitting","emergency-dental-visit","veneer-consultation","oral-cancer-screening"];
const FAQS: [string,string][] = [
  ["How do I book an appointment?","Choose a doctor, service, date and available time from the Book Appointment page, then enter your contact details."],
  ["What should I bring to my first visit?","Please bring a photo ID, relevant medical or dental records, a list of current medicines and insurance details if applicable."],
  ["Can I change or cancel an appointment?","Call the chamber as early as possible. Our team can help you reschedule or cancel your booking."],
  ["Are instruments sterilized?","Yes. Instruments are cleaned, packaged and sterilized between every patient using validated procedures."],
  ["How do I check appointment status?","Use Appointment Status and enter your booking reference and the phone number used to make the booking."],
  ["Do you accept walk-ins?","Appointments are recommended. Please contact the chamber to check same-day availability."],
  ["How early should I arrive?","Please arrive about ten minutes before your scheduled appointment."],
  ["Are children welcome?","Yes. Our team provides gentle dental care for children and adults."],
  ["How can I pay?","Please contact the chamber for current payment options and accepted methods."],
  ["Is teeth cleaning painful?","Professional cleaning is usually comfortable. Let your clinician know if your teeth or gums are sensitive."],
  ["Do you provide emergency dental care?","Call the chamber phone number and our team will advise you about the earliest available appointment."],
  ["How much does treatment cost?","Service prices are listed on the Services page. Your dentist will explain any treatment plan and costs before proceeding."],
  ["Do I need a checkup if I have no pain?","Regular dental checkups can help identify issues early, even when you do not have symptoms."],
  ["Can I request a specific dentist?","Yes. Select your preferred available dentist while booking online."],
  ["What if I am running late?","Please call the chamber as soon as possible so the team can advise you."],
  ["Are digital X-rays available?","Digital imaging availability depends on the clinical assessment. Ask your dentist during your visit."],
  ["How do I prepare for a dental visit?","Continue your usual routine and share any medical conditions, allergies or medicines with your dentist."],
  ["Can I book for a family member?","Yes. Enter the patient’s name and the contact phone number you would like us to use."],
  ["Where is the chamber located?","We are at Madar Mansion, 2nd floor, east side of Metro Rail Pillar #249, Mirpur-10, Dhaka."],
  ["How can I leave a review?","Submit your feedback from the Reviews page. Reviews are published after moderation."],
];

async function imageUrl(filename: string): Promise<string> {
  const [existing] = await db.select().from(storedFiles).where(eq(storedFiles.filename, filename)).limit(1);
  if (existing) return `/api/files/${existing.id}`;
  const data = await readFile(path.join(process.cwd(), "seed-images", filename));
  const mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
  const [file] = await db.insert(storedFiles).values({ filename, mimeType, size: data.length, data: Buffer.from(data) }).returning();
  return `/api/files/${file!.id}`;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seeding is disabled in production. Run this only against a local/test database.");
  }
  if (process.argv.includes("--if-empty")) {
    const existingUser = await db.select({ id: users.id }).from(users).limit(1);
    if (existingUser.length) {
      console.log("Supabase database already has an administrator; leaving its data unchanged.");
      return;
    }
  }

  const [oldSettings] = await db.select().from(chamberSettings).limit(1);
  let settingsId = oldSettings?.id;
  const [hero, logo] = await Promise.all([imageUrl("hero.jpg"), imageUrl("logo.png")]);
  if (!oldSettings) {
    const [created] = await db.insert(chamberSettings).values({ ...CHAMBER, heroUrl: hero, logoUrl: logo }).returning();
    settingsId = created!.id;
  } else {
    // Update only a known demo profile; keep later admin edits intact on re-seed.
    const knownSeedNames = ["BrightSmile Dental Care", "My Dental Chamber"];
    const changes: Record<string, string | null> = {};
    if (knownSeedNames.includes(oldSettings.name)) Object.assign(changes, CHAMBER);
    if (!oldSettings.heroUrl) changes.heroUrl = hero;
    if (!oldSettings.logoUrl) changes.logoUrl = logo;
    const defaultCopy: Record<string, string> = {
      heroTitle: "Healthy teeth,", heroHighlight: "confident smile", primaryCtaLabel: "Book Appointment",
      secondaryCtaLabel: "Our Services", trustNoteOne: "Sterilized & safe", trustNoteTwo: "Experienced doctors",
      homeAboutHeading: "Caring for smiles in your neighbourhood", homeServicesHeading: "Featured dental services",
      homeDoctorsHeading: "Our doctors", homeCtaHeading: "Ready for a healthier smile?",
    };
    for (const [key, defaultValue] of Object.entries(defaultCopy)) {
      if ((oldSettings as unknown as Record<string, unknown>)[key] === defaultValue) changes[key] = CHAMBER[key as keyof typeof CHAMBER] as string;
    }
    for (const key of ["homeServicesIntro", "homeDoctorsIntro", "homeCtaIntro", "servicesIntro", "doctorsIntro"] as const) {
      if (!(oldSettings as unknown as Record<string, unknown>)[key]) changes[key] = CHAMBER[key];
    }
    if (Object.keys(changes).length) await db.update(chamberSettings).set({ ...changes, updatedAt: new Date() }).where(eq(chamberSettings.id, oldSettings.id));
  }
  if (settingsId && (await db.select().from(openingHours).where(eq(openingHours.settingsId, settingsId)).limit(1)).length === 0) {
    await db.insert(openingHours).values(Array.from({ length: 7 }, (_, dayOfWeek) => ({ settingsId: settingsId!, dayOfWeek, isOpen: dayOfWeek !== 6, openTime: "09:00", closeTime: "18:00" })));
  }

  const doctorPhotos = [await imageUrl("doctor-1.jpg"), await imageUrl("doctor-2.jpg")];
  const existingDoctors = await db.select().from(doctors);
  if (existingDoctors.length < 2) {
    const originals = [
      { name: "Dr. Ahsan Rahman", slug: "dr-ahsan-rahman", photoUrl: doctorPhotos[0]!, qualification: "BDS, FCPS (Conservative Dentistry)", specialization: "Restorative & Cosmetic Dentistry", experienceYears: 12, biography: "An experienced restorative dentist known for clear communication and gentle, precise care.", phone: "+8801312468151", email: CHAMBER.email, consultationFee: 800, order: 0 },
      { name: "Dr. Nadia Karim", slug: "dr-nadia-karim", photoUrl: doctorPhotos[1]!, qualification: "BDS, MS (Orthodontics)", specialization: "Orthodontics & Pediatric Dentistry", experienceYears: 9, biography: "A warm, patient-centred specialist in orthodontic and children's dental care.", phone: "+8801312468151", email: CHAMBER.email, consultationFee: 700, order: 1 },
    ];
    for (const item of originals) {
      if (!(await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.slug, item.slug)).limit(1)).length) {
        const [created] = await db.insert(doctors).values(item).returning();
        if (created) await db.insert(schedules).values([0,1,2,3,4,5].map(dayOfWeek => ({ doctorId: created.id, dayOfWeek, startTime: "09:00", endTime: "18:00", slotMinutes: 30, isActive: true })));
      }
    }
  }
  let doctorList = await db.select().from(doctors).orderBy(doctors.order);
  for (let i = doctorList.length; i < 20; i++) {
    const no = i + 1;
    const slug = `demo-dentist-${String(no).padStart(2,"0")}`;
    const [created] = await db.insert(doctors).values({ name: `Demo Dentist ${String(no).padStart(2,"0")}`, slug, photoUrl: doctorPhotos[i % doctorPhotos.length], qualification: "BDS · Demo profile", specialization: ["General Dentistry","Orthodontics","Restorative Dentistry","Pediatric Dentistry"][i % 4]!, experienceYears: 2 + i % 15, biography: "Sample profile for testing and demonstration. Edit or remove this record in the admin panel.", phone: CHAMBER.phone, email: CHAMBER.email, consultationFee: 500 + i * 25, order: no }).returning();
    if (created) await db.insert(schedules).values([0,1,2,3,4,5].map(dayOfWeek => ({ doctorId: created.id, dayOfWeek, startTime: "09:00", endTime: "18:00", slotMinutes: 30, isActive: true })));
  }
  doctorList = await db.select().from(doctors).orderBy(doctors.order);

  const serviceImages = await Promise.all(["service-checkup.jpg","service-cleaning.jpg","service-filling.jpg","service-rootcanal.jpg","service-whitening.jpg","service-braces.jpg"].map(imageUrl));
  const currentServices = await db.select().from(services);
  for (let i = currentServices.length; i < 20; i++) {
    const duration = [30,45,45,90,60,30,45,60,75,60][i % 10]!;
    await db.insert(services).values({ name: SERVICE_NAMES[i]!, slug: SERVICE_SLUGS[i]!, description: `${SERVICE_NAMES[i]} provided with a clear treatment plan and patient-focused care. This is editable sample content for testing.`, price: 700 + i * 350, duration, imageUrl: serviceImages[i % serviceImages.length]!, isFeatured: i < 9, order: i });
  }
  const serviceList = await db.select().from(services).orderBy(services.order);

  const patientRows = await db.select().from(patients);
  for (let i = patientRows.length; i < 20; i++) {
    await db.insert(patients).values({ name: DEMO_NAMES[i]!, phone: `+8801700100${String(i + 1).padStart(3,"0")}`, email: `patient${String(i + 1).padStart(2,"0")}@example.test`, address: ["Mirpur, Dhaka","Dhanmondi, Dhaka","Uttara, Dhaka","Pallabi, Dhaka"][i % 4]!, age: 18 + (i * 3) % 50, gender: i % 2 ? "FEMALE" : "MALE", bloodGroup: ["A+","B+","O+","AB+"][i % 4]!, medicalInfo: i % 5 === 0 ? "Sample allergy information — verify with patient." : "", dentalHistory: "Sample record for testing.", notes: "Demo patient record. Please replace with real information before clinical use." });
  }
  const allPatients = await db.select().from(patients).orderBy(patients.createdAt);

  const reviewRows = await db.select().from(reviews);
  for (let i = reviewRows.length; i < 20; i++) {
    await db.insert(reviews).values({ name: DEMO_NAMES[i]!, rating: i % 5 + 1, comment: `Demo review ${i + 1}: sample patient feedback for checking review moderation and display.`, isApproved: i % 4 !== 0 });
  }
  const faqRows = await db.select().from(faqs);
  for (let i = faqRows.length; i < 20; i++) {
    const [question, answer] = FAQS[i]!;
    await db.insert(faqs).values({ question, answer, order: i, isActive: true });
  }

  const galleryRows = await db.select().from(galleryImages);
  const galleryFiles = await Promise.all(["hero.jpg","service-checkup.jpg","service-cleaning.jpg","service-filling.jpg","service-rootcanal.jpg","service-whitening.jpg"].map(imageUrl));
  for (let i = galleryRows.length; i < 20; i++) {
    await db.insert(galleryImages).values({ imageUrl: galleryFiles[i % galleryFiles.length]!, title: `Demo clinic photo ${String(i + 1).padStart(2,"0")}`, order: i, isPublished: true });
  }

  const employeeRows = await db.select().from(employees);
  for (let i = employeeRows.length; i < 20; i++) {
    await db.insert(employees).values({ name: `Demo Staff ${String(i + 1).padStart(2,"0")}`, position: ["Receptionist","Dental Assistant","Patient Coordinator","Clinic Manager"][i % 4]!, phone: `+8801700200${String(i + 1).padStart(3,"0")}`, email: `staff${String(i + 1).padStart(2,"0")}@example.test`, joiningDate: new Date(2022, i % 12, (i % 27) + 1), responsibilities: "Sample staff information for admin-panel testing.", notes: "Demo record — update or delete before clinical use.", isActive: i % 7 !== 0 });
  }

  const medicineRows = await db.select().from(medicines);
  for (let i = medicineRows.length; i < 20; i++) {
    await db.insert(medicines).values({ name: ["Lidocaine 2%","Chlorhexidine mouthwash","Ibuprofen 400 mg","Paracetamol 500 mg","Amoxicillin 500 mg","Dental fluoride gel","Topical anesthetic gel","Saline solution","Gauze pads","Disposable gloves"][i % 10]! + (i >= 10 ? ` · Batch ${String(i + 1).padStart(2,"0")}` : ""), category: ["Local anesthetic","Antiseptic","Analgesic","Antibiotic","Dental supplies"][i % 5]!, quantity: i % 6 === 0 ? 2 : 15 + i, unit: i % 3 ? "pcs" : "boxes", purchasePrice: 100 + i * 18, supplier: "Demo Dental Supply Co.", expiryDate: new Date(Date.now() + (i % 5 === 0 ? 20 : 240) * 86400000), minStockLevel: 8, notes: "Demo inventory item for testing." });
  }

  const equipmentRows = await db.select().from(equipment);
  for (let i = equipmentRows.length; i < 20; i++) {
    await db.insert(equipment).values({ name: ["Dental chair","Digital X-ray unit","Autoclave sterilizer","Air compressor","Dental operating light","Ultrasonic scaler","Intraoral camera","Amalgamator","Apex locator","Endodontic motor"][i % 10]! + (i >= 10 ? ` · Unit ${String(i + 1).padStart(2,"0")}` : ""), serialNumber: `DEMO-EQ-${String(i + 1).padStart(4,"0")}`, purchaseDate: new Date(2021 + i % 5, i % 12, 10), purchasePrice: 25000 + i * 12500, condition: i % 8 === 0 ? "NEEDS_REPAIR" : i % 3 === 0 ? "EXCELLENT" : "GOOD", warrantyUntil: new Date(2027 + i % 3, i % 12, 15), location: `Treatment room ${i % 4 + 1}`, lastMaintenance: new Date(2026, i % 8, 10), nextMaintenance: new Date(Date.now() + (i % 6 === 0 ? 10 : 120) * 86400000), status: i % 9 === 0 ? "UNDER_MAINTENANCE" : "ACTIVE", notes: "Demo equipment record for testing." });
  }

  const maintenanceRows = await db.select().from(maintenanceLogs);
  const equipmentList = await db.select().from(equipment);
  for (let i = maintenanceRows.length; i < 20; i++) {
    const target = equipmentList[i % equipmentList.length];
    await db.insert(maintenanceLogs).values({ equipmentId: target!.id, date: new Date(2025, i % 12, (i % 27) + 1), description: `Demo scheduled inspection ${i + 1}`, cost: 500 + i * 125, performedBy: `Demo technician ${i % 4 + 1}` });
  }

  // Appointments form a 20-record, linked demo dataset across future dates.
  const appointmentRows = await db.select().from(appointments);
  for (let i = appointmentRows.length; i < 20; i++) {
    const patient = allPatients[i % allPatients.length]!;
    const doctor = doctorList[i % doctorList.length]!;
    const service = serviceList[i % serviceList.length]!;
    const day = new Date(); day.setHours(0,0,0,0); day.setDate(day.getDate() + i + 1 + Math.floor(i / 5));
    // Keep sample bookings on scheduled clinic days (Saturday–Thursday).
    while ((day.getDay() + 1) % 7 === 6) day.setDate(day.getDate() + 1);
    // Each demo appointment is on a different date, so sample records never collide.
    const hour = 9 + (i % 7);
    const startTime = `${String(hour).padStart(2,"0")}:00`;
    const end = hour * 60 + service.duration;
    const endTime = `${String(Math.floor(end / 60)).padStart(2,"0")}:${String(end % 60).padStart(2,"0")}`;
    await db.insert(appointments).values({ reference: `APT-DEMO${String(i + 1).padStart(4,"0")}`, patientId: patient.id, doctorId: doctor.id, serviceId: service.id, date: day, startTime, endTime, status: (["PENDING","CONFIRMED","COMPLETED","CANCELLED","RESCHEDULED"] as const)[i % 5]!, notes: "Demo appointment — sample record for testing only." });
  }

  // Explicitly requested test login. It is created only by the local demo seed
  // (the seed itself refuses NODE_ENV=production) and stores a bcrypt hash.
  const demoEmail = "admin@gamil.com";
  if (!(await db.select({ id: users.id }).from(users).where(eq(users.email, demoEmail)).limit(1)).length) {
    await db.insert(users).values({ email: demoEmail, name: "Demo Administrator", passwordHash: await bcrypt.hash("admin123", 12), role: "ADMIN", isActive: true });
  }

  console.log("Supabase demo data ready: 20 patients, appointments, doctors, services, staff, inventory, equipment, reviews, FAQs, gallery images and maintenance logs.");
  console.log(`Test admin: ${demoEmail} / admin123 (development/testing only — change before any deployment).`);
}

main().catch(error => { console.error(error); process.exit(1); });
