export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Cloudinary images: inject transformation params directly so the browser
  // fetches from Cloudinary CDN without going through Vercel's image optimizer.
  if (src.startsWith("https://res.cloudinary.com")) {
    const q = quality ?? "auto";
    return src.replace(
      "/image/upload/",
      `/image/upload/w_${width},q_${q},f_auto/`
    );
  }

  // Local and non-Cloudinary remote images: fall back to Next.js optimizer.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
