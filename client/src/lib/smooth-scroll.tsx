import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { useReducedMotionPref } from "./use-media";

type ScrollTo = (target: string | number | HTMLElement, opts?: { offset?: number }) => void;
type Ctx = { scrollTo: ScrollTo; lenis: () => Lenis | null };

const SmoothScrollContext = createContext<Ctx | null>(null);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotionPref();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.2 });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduce]);

  const scrollTo = useCallback<ScrollTo>((target, opts) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset: opts?.offset ?? 0, duration: 1.4 });
      return;
    }
    const el =
      typeof target === "string" ? document.querySelector<HTMLElement>(target) : typeof target === "number" ? null : target;
    if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    else if (typeof target === "number") window.scrollTo({ top: target });
  }, [reduce]);

  const getLenis = useCallback(() => lenisRef.current, []);

  return (
    <SmoothScrollContext.Provider value={{ scrollTo, lenis: getLenis }}>{children}</SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside SmoothScrollProvider");
  return ctx;
}
