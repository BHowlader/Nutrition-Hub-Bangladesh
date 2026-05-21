import Image from "next/image";

export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 text-cream">
      <div className="flex flex-col items-center text-center">
        <div className="relative grid h-14 w-14 place-items-center rounded-xl border border-gold/25 bg-gold/10">
          <Image
            src="/images/logo.png"
            alt="Nutrition Hub Bangladesh"
            width={36}
            height={36}
            className="rounded-lg object-contain"
            priority
          />
          <span className="absolute inset-0 rounded-xl border border-gold/30 motion-safe:animate-ping" />
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-gold">
          {label}
        </p>
      </div>
    </main>
  );
}
