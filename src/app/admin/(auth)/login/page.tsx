"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, Stethoscope } from "lucide-react";
import { loginAction } from "@/app/admin/actions";
import { Input, Field } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [error,setError]=useState(""); const [pending,start]=useTransition(); const router=useRouter();
  function submit(form:FormData){setError("");start(async()=>{try{const r=await loginAction(form);if(r&&!r.ok)setError(r.message);else router.push("/admin");}catch(e){if(e instanceof Error&&e.message.includes("NEXT_REDIRECT"))router.push("/admin");else setError("Unable to sign in. Please try again.");}});}
  return <main className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl"><div className="text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Stethoscope className="h-7 w-7"/></span><h1 className="mt-5 text-2xl font-bold">Admin sign in</h1><p className="mt-1 text-sm text-muted-foreground">Sign in to manage your dental chamber</p></div><form action={submit} className="mt-7 space-y-4"><Field label="Email address" required><Input type="email" name="email" required autoComplete="username" placeholder="admin@example.com"/></Field><Field label="Password" required><Input type="password" name="password" required autoComplete="current-password" placeholder="Your password"/></Field>{error&&<p className="rounded-xl bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}<Button type="submit" loading={pending} className="w-full"><LockKeyhole className="h-4 w-4"/>Sign in</Button></form><p className="mt-6 text-center text-xs text-muted-foreground">Need to initialize the application? <Link href="/admin/setup" className="font-semibold text-primary">First-time setup</Link></p><Link href="/" className="mt-5 block text-center text-sm text-muted-foreground hover:text-primary">← Return to public website</Link></div></main>;
}
