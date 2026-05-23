"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
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

    // Use a very generous rootMargin for mobile compatibility and earlier triggering
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px 0px 150px 0px", threshold: 0 }
    );

    observer.observe(node);

    // Immediate viewport fallback (handles cases where element is already visible)
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
      setVisible(true);
      observer.disconnect();
    }

    // Safety fallback: guaranteed reveal after 1.2s to prevent UX freezing
    // This perfectly addresses the issue where elements get "stucked" indefinitely.
    const fallbackTimer = setTimeout(() => {
      setVisible(true);
      observer.disconnect();
    }, 1200);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: visible && delay ? `${delay}s` : undefined }}
    >
      {children}
    </div>
  );
}
