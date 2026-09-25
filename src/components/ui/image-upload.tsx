"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Image picker used across admin forms. Uploads to /api/upload (admin-only)
 * and hands the resulting URL back to the parent form.
 */
export function ImageUpload({
  value,
  onChange,
  label = "Image",
  className,
  aspect = "square",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (file.size > 4 * 1024 * 1024) {
      setError("File is too large. Maximum size is 4 MB.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Upload failed");
      onChange(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <div
        className={cn(
          "group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/60 hover:bg-muted",
          aspect === "square" ? "h-36" : "h-28",
        )}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <>
            <Image src={value} alt="Preview" fill className="object-contain p-2" unoptimized />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-900">
                <ImagePlus className="h-3.5 w-3.5" /> Change
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span className="text-xs font-medium">{uploading ? "Uploading…" : "Click to upload image"}</span>
            <span className="text-[11px]">JPG, PNG, WebP or SVG · max 4 MB</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
