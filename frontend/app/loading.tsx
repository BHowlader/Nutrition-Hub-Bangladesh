import Image from "next/image";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 text-cream">
      <div className="flex flex-col items-center text-center">
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-gold/25 bg-gold/10">
          <Image
            src="/images/logo.png"
            alt="Nutrition Hub Bangladesh"
            width={42}
            height={42}
            className="rounded-lg object-contain"
            priority
          />
          <span className="absolute inset-0 rounded-2xl border border-gold/30 motion-safe:animate-ping" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-gold">
          Loading
        </p>
      </div>
    </main>
  );
}
