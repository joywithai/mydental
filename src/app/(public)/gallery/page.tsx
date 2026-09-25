import Image from "next/image";
import { Camera } from "lucide-react";
import { db } from "@/db";
import { galleryImages } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const images = await db
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.isPublished, true))
    .orderBy(asc(galleryImages.order));

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Gallery</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Take a look inside our chamber — modern facilities, sterile environment and a comfortable atmosphere.
        </p>
      </div>

      {images.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Camera className="h-10 w-10" />
          <p>Photos will appear here once added from the admin panel.</p>
        </div>
      ) : (
        <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {images.map((img) => (
            <figure
              key={img.id}
              className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <Image
                src={img.imageUrl}
                alt={img.title || "Gallery image"}
                width={800}
                height={600}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
              {img.title && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {img.title}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
