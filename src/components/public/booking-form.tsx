/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, UserRound, ChevronRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { formatCurrency, formatTime12, toDateKey } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type Doctor = { id: string; name: string; specialization: string };
type Service = { id: string; name: string; duration: number; price: number };
type Slot = { time: string; endTime: string; available: boolean };
type Props = { doctors: Doctor[]; services: Service[]; initialDoctor: string; initialService: string; notice: string };

export function BookingForm({ doctors, services, initialDoctor, initialService, notice }: Props) {
  const toast = useToast();
  const [doctorId, setDoctorId] = useState(initialDoctor);
  const [serviceId, setServiceId] = useState(initialService);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ reference: string; date: string; startTime: string; doctor: string; service: string } | null>(null);
  const selectedService = services.find((s) => s.id === serviceId);
  const minDate = useMemo(() => toDateKey(new Date()), []);

  useEffect(() => {
    setSlots([]); setSlot("");
    if (!doctorId || !date) return;
    let alive = true;
    setLoadingSlots(true);
    fetch(`/api/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}${serviceId ? `&serviceId=${encodeURIComponent(serviceId)}` : ""}`)
      .then((r) => r.json())
      .then((d) => { if (alive) { if (!d.ok) throw new Error(d.message); setSlots(d.slots); } })
      .catch((e) => { if (alive) toast("error", e instanceof Error ? e.message : "Could not load available times."); })
      .finally(() => { if (alive) setLoadingSlots(false); });
    return () => { alive = false; };
  }, [doctorId, date, serviceId, toast]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, serviceId, date, time: slot, patient: { name: form.get("name"), phone: form.get("phone"), email: form.get("email"), age: form.get("age") || undefined, gender: form.get("gender"), notes: form.get("notes") } }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Booking could not be completed.");
      setResult(data.appointment); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { toast("error", err instanceof Error ? err.message : "Please try again."); }
    finally { setSubmitting(false); }
  }

  if (result) return <Card className="overflow-hidden"><div className="bg-success-soft p-8 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"><CheckCircle2 className="h-9 w-9"/></span><h2 className="mt-4 text-2xl font-bold">Appointment requested!</h2><p className="mt-2 text-sm text-muted-foreground">Your booking is pending chamber confirmation.</p><div className="mx-auto mt-5 max-w-xs rounded-xl border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Booking reference</p><p className="mt-1 font-mono text-2xl font-bold text-primary">{result.reference}</p><p className="mt-2 text-sm">Please save this reference to check your appointment status.</p></div></div><CardContent className="space-y-3 p-6 text-sm"><p><b>Doctor:</b> {result.doctor}</p><p><b>Service:</b> {result.service}</p><p><b>Date:</b> {new Date(`${result.date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p><p><b>Time:</b> {formatTime12(result.startTime)}</p><div className="mt-5 flex flex-wrap justify-center gap-3"><Link href={`/appointment-status?reference=${result.reference}`} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground">Check status</Link><Link href="/" className="inline-flex h-10 items-center rounded-xl border border-border px-4 font-semibold">Back to home</Link></div></CardContent></Card>;

  if (!doctors.length || !services.length) return <Card><CardContent className="p-8 text-center"><Info className="mx-auto h-8 w-8 text-primary"/><h2 className="mt-3 font-bold">Appointments are not available yet</h2><p className="mt-2 text-sm text-muted-foreground">Please check back later or call the chamber directly.</p></CardContent></Card>;

  return <form onSubmit={submit} className="space-y-5">
    {notice && <div className="flex gap-2 rounded-xl border border-info/20 bg-info-soft p-3 text-sm text-info"><Info className="mt-0.5 h-4 w-4 shrink-0"/><p>{notice}</p></div>}
    <Card><div className="flex items-center gap-3 border-b border-border px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary"><CalendarDays className="h-5 w-5"/></span><div><h2 className="font-semibold">Appointment details</h2><p className="text-xs text-muted-foreground">Choose a doctor, service and time</p></div></div><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Doctor" required><Select required value={doctorId} onChange={e=>setDoctorId(e.target.value)}><option value="">Select a doctor</option>{doctors.map(d=><option key={d.id} value={d.id}>{d.name}{d.specialization?` — ${d.specialization}`:""}</option>)}</Select></Field>
      <Field label="Service" required><Select required value={serviceId} onChange={e=>setServiceId(e.target.value)}><option value="">Select a service</option>{services.map(s=><option key={s.id} value={s.id}>{s.name} · {formatCurrency(s.price)}</option>)}</Select></Field>
      <Field label="Date" required><Input type="date" required min={minDate} value={date} onChange={e=>setDate(e.target.value)}/></Field>
      <Field label="Available time" required>{!doctorId||!date?<div className="flex h-10 items-center rounded-xl border border-dashed border-border px-3 text-sm text-muted-foreground">Select a doctor and date first</div>:loadingSlots?<div className="flex h-10 items-center gap-2 text-sm text-muted-foreground"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent"/>Checking availability…</div>:slots.filter(s=>s.available).length===0?<div className="flex h-10 items-center rounded-xl border border-dashed border-border px-3 text-sm text-muted-foreground">No times available on this date</div>:<Select required value={slot} onChange={e=>setSlot(e.target.value)}><option value="">Choose a time</option>{slots.filter(s=>s.available).map(s=><option key={s.time} value={s.time}>{formatTime12(s.time)} – {formatTime12(s.endTime)}</option>)}</Select>}</Field>
      {selectedService && <div className="sm:col-span-2"><Badge variant="primary"><Clock3 className="h-3.5 w-3.5"/>{selectedService.duration} min · {formatCurrency(selectedService.price)}</Badge></div>}
    </CardContent></Card>
    <Card><div className="flex items-center gap-3 border-b border-border px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary"><UserRound className="h-5 w-5"/></span><div><h2 className="font-semibold">Your information</h2><p className="text-xs text-muted-foreground">We’ll use this to confirm your appointment</p></div></div><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
      <Field label="Full name" required><Input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Your full name"/></Field><Field label="Phone number" required><Input name="phone" required minLength={6} maxLength={20} autoComplete="tel" placeholder="e.g. +880 1XXX-XXXXXX"/></Field>
      <Field label="Email (optional)"><Input name="email" type="email" autoComplete="email" placeholder="you@example.com"/></Field><Field label="Age (optional)"><Input name="age" type="number" min="0" max="120" placeholder="Age"/></Field>
      <Field label="Gender (optional)"><Select name="gender" defaultValue=""><option value="">Prefer not to say</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></Select></Field><Field label="Notes (optional)" className="sm:col-span-2"><Textarea name="notes" maxLength={1000} placeholder="Anything the doctor should know?"/></Field>
    </CardContent></Card>
    <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"><p className="text-xs leading-relaxed text-muted-foreground">By booking, you agree to be contacted about your appointment. Your booking is pending until confirmed by the chamber.</p><Button type="submit" loading={submitting} disabled={!doctorId||!serviceId||!date||!slot||loadingSlots} size="lg" className="shrink-0">Request appointment <ChevronRight className="h-4 w-4"/></Button></div>
  </form>;
}
