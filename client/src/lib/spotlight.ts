import { useEffect } from "react";

/*
  Spotlight: one pointer listener for the page. Every .spot inside the hovered
  [data-spot-group] (or a lone .spot) gets the pointer position in its own coordinates as
  --mx/--my, so the light in index.css lands on the card under the pointer and spills onto
  the near edges of its neighbours. Batched to one write per frame.
*/
export function useSpotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    let target: Element | null = null;

    const run = () => {
      raf = 0;
      const host = target?.closest("[data-spot-group]") ?? target?.closest(".spot");
      if (!host) return;
      const spots = host.matches(".spot") ? [host as HTMLElement] : Array.from(host.querySelectorAll<HTMLElement>(".spot"));
      // read every box first, then write: interleaving would force a layout per card
      const rects = spots.map((s) => s.getBoundingClientRect());
      spots.forEach((s, i) => {
        s.style.setProperty("--mx", `${x - rects[i].left}px`);
        s.style.setProperty("--my", `${y - rects[i].top}px`);
      });
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      target = e.target as Element;
      if (!raf) raf = requestAnimationFrame(run);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);
}
