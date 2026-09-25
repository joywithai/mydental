"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

export function ReviewForm() {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), comment: form.get("comment"), rating }) });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.message || "Could not submit review.");
      toast("success", data.message); formElement.reset(); setRating(5);
    } catch (err) { toast("error", err instanceof Error ? err.message : "Please try again."); }
    finally { setLoading(false); }
  }
  return <Card className="sticky top-24"><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-primary"/>Leave a review</CardTitle><p className="text-sm text-muted-foreground">Reviews are published after moderation.</p></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><Field label="Your name" required><Input name="name" required minLength={2} maxLength={80} placeholder="Full name"/></Field><div><span className="mb-1.5 block text-sm font-medium">Your rating</span><StarRating rating={rating} size="lg" onChange={setRating}/></div><Field label="Your experience" required><Textarea name="comment" required minLength={5} maxLength={1500} placeholder="Tell us about your visit…"/></Field><Button type="submit" loading={loading} className="w-full">Submit review</Button></form></CardContent></Card>;
}
