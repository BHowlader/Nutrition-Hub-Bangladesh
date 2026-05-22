"use client";

import { usePathname } from "next/navigation";

const PHONE = "8801410619932";
const WA_URL = `https://wa.me/${PHONE}?text=${encodeURIComponent("Hi, I'm interested in your supplements!")}`;

export function WhatsAppButton() {
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname?.startsWith("/admin")) return null;

  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_24px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_32px_rgba(37,211,102,0.5)] active:scale-95"
    >
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7">
        <path d="M16.004 2.667A13.26 13.26 0 0 0 2.74 15.93a13.16 13.16 0 0 0 1.782 6.63L2.667 29.333l6.98-1.83A13.27 13.27 0 0 0 16.004 29.3 13.26 13.26 0 0 0 29.333 16.04 13.26 13.26 0 0 0 16.004 2.667Zm0 24.27a10.87 10.87 0 0 1-5.55-1.52l-.398-.236-4.124 1.082 1.1-4.022-.26-.413A10.87 10.87 0 0 1 5.1 15.93a10.9 10.9 0 0 1 10.904-10.9 10.9 10.9 0 0 1 10.97 10.96 10.9 10.9 0 0 1-10.97 10.947Zm5.98-8.16c-.328-.164-1.94-.957-2.24-1.066-.302-.11-.522-.164-.74.164-.22.328-.852 1.066-1.044 1.284-.192.22-.384.246-.712.082-.328-.164-1.384-.51-2.636-1.626-.974-.868-1.632-1.94-1.822-2.268-.192-.328-.02-.506.144-.668.146-.146.328-.384.492-.576.164-.192.22-.328.328-.548.11-.22.056-.412-.026-.576-.082-.164-.74-1.784-.514-2.442-.274-.642-.554-.554-.74-.566h-.632c-.22 0-.576.082-.878.412-.302.328-1.152 1.126-1.152 2.746s1.18 3.186 1.344 3.404c.164.22 2.322 3.542 5.624 4.968.786.34 1.4.542 1.878.694.79.25 1.508.214 2.076.13.634-.094 1.94-.794 2.214-1.56.274-.768.274-1.426.192-1.562-.082-.136-.302-.22-.632-.384Z" />
      </svg>
    </a>
  );
}
