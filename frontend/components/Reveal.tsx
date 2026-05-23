"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Use a generous bottom margin so elements trigger well before entering the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px 100px 0px", threshold: 0 }
    );

    observer.observe(node);

    // Fallback: if element is already in viewport on mount, reveal immediately
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      observer.disconnect();
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: visible && delay ? `${delay}s` : undefined }}
    >
      {children}
    </div>
  );
}
