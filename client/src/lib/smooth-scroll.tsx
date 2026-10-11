import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { useReducedMotionPref } from "./use-media";

type ScrollTo = (target: string | number | HTMLElement, opts?: { offset?: number; immediate?: boolean }) => void;
type Ctx = { scrollTo: ScrollTo; lenis: () => Lenis | null; lock: () => void; unlock: () => void };

const SmoothScrollContext = createContext<Ctx | null>(null);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotionPref();
  const lenisRef = useRef<Lenis | null>(null);
  const locks = useRef(0);

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.2 });
    lenisRef.current = lenis;
    if (locks.current > 0) lenis.stop();
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

  // Pinned sections measure their start once. When anything above them changes height
  // (an accordion, a late font or image), re-measure so pins engage exactly at the top.
  useEffect(() => {
    let last = document.body.scrollHeight;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - last) < 2) return;
      last = h;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        ScrollTrigger.refresh();
        last = document.body.scrollHeight;
      }, 200);
    });
    ro.observe(document.body);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const scrollTo = useCallback<ScrollTo>((target, opts) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset: opts?.offset ?? 0, duration: 1.4, immediate: opts?.immediate, force: opts?.immediate });
      return;
    }
    const el =
      typeof target === "string" ? document.querySelector<HTMLElement>(target) : typeof target === "number" ? null : target;
    const instant = reduce || opts?.immediate;
    if (el) el.scrollIntoView({ behavior: instant ? "auto" : "smooth" });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: instant ? "auto" : "smooth" });
  }, [reduce]);

  // Ref-counted page scroll lock, shared by the menu, dialogs and the case study layer.
  const lock = useCallback(() => {
    if (locks.current++ > 0) return;
    if (lenisRef.current) lenisRef.current.stop();
    else document.documentElement.style.overflow = "hidden";
  }, []);
  const unlock = useCallback(() => {
    if (locks.current === 0 || --locks.current > 0) return;
    lenisRef.current?.start();
    document.documentElement.style.overflow = "";
  }, []);

  const getLenis = useCallback(() => lenisRef.current, []);

  return (
    <SmoothScrollContext.Provider value={{ scrollTo, lenis: getLenis, lock, unlock }}>{children}</SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside SmoothScrollProvider");
  return ctx;
}
