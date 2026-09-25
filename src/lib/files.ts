import "server-only";
import { db } from "@/db";
import { storedFiles } from "@/db/schema";

export const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/x-icon"];

/**
 * Persists an uploaded image and returns a stable public URL for it.
 * Files are stored as blobs and served through /api/files/[id] — this works
 * on any host (local, Vercel) without depending on a writable filesystem.
 * Swapping to S3/R2 later only requires changing this function.
 */
export async function saveUploadedFile(file: File): Promise<string> {
  if (!file || typeof file === "string") throw new Error("Invalid file.");
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type. Please upload a JPG, PNG, WebP, GIF or SVG image.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum size is 4 MB.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(storedFiles)
    .values({
      filename: file.name || "upload",
      mimeType: file.type,
      size: file.size,
      data: buffer,
    })
    .returning({ id: storedFiles.id });
  return `/api/files/${row!.id}`;
}

/** A File field from a form may be an empty File — returns null then. */
export async function saveUploadedFileOptional(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  return saveUploadedFile(file);
}
