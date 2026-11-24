import { useEffect, type RefObject } from "react";

/*
  A lens on the font's width axis: letters ([data-char]) near the pointer widen and get
  heavier, so the word reacts like glass passing over it. Used by the hero name and the
  footer wordmark. Direct style writes in rAF, no React state.
*/
export function useWidthLens(
  rootRef: RefObject<HTMLElement | null>,
  {
    enabled,
    base = { stretch: 112, weight: 640 },
    lens = { stretch: [100, 125], weight: [520, 850] },
    reach = [1.6, 0.9],
  }: {
    enabled: boolean;
    base?: { stretch: number; weight: number };
    lens?: { stretch: [number, number]; weight: [number, number] };
    /* horizontal and vertical radius of the lens, in font sizes */
    reach?: [number, number];
  },
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    const chars = Array.from(root.querySelectorAll<HTMLSpanElement>("[data-char]"));
    const state = chars.map(() => ({ s: base.stretch, w: base.weight }));
    let centers: { x: number; y: number }[] = [];
    let pointer = { x: -1e4, y: -1e4 };
    let raf = 0;
    let active = false;
    let measuredAt = -1;

    const measure = () => {
      measuredAt = window.scrollY;
      centers = chars.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };

    const tick = () => {
      const size = parseFloat(getComputedStyle(root).fontSize);
      let moving = false;
      chars.forEach((el, i) => {
        const c = centers[i];
        const dx = (pointer.x - c.x) / (size * reach[0]);
        const dy = (pointer.y - c.y) / (size * reach[1]);
        const k = active ? Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) : 0;
        const e = k * k * (3 - 2 * k);
        const ts = active ? lens.stretch[0] + (lens.stretch[1] - lens.stretch[0]) * e : base.stretch;
        const tw = active ? lens.weight[0] + (lens.weight[1] - lens.weight[0]) * e : base.weight;
        const st = state[i];
        st.s += (ts - st.s) * 0.14;
        st.w += (tw - st.w) * 0.14;
        if (Math.abs(ts - st.s) > 0.05 || Math.abs(tw - st.w) > 0.5) moving = true;
        el.style.fontStretch = `${st.s.toFixed(2)}%`;
        el.style.fontWeight = `${Math.round(st.w)}`;
      });
      raf = moving || active ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onEnter = () => {
      measure();
      active = true;
      kick();
    };
    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      // the page may have scrolled since the last measurement (reading layout right after the
      // font writes would force a reflow, so only when it actually moved)
      if (active && window.scrollY !== measuredAt) measure();
      kick();
    };
    const onLeave = () => {
      active = false;
      kick();
    };

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
    };
    // the option objects are literals at the call sites: only re-run when enabled flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, enabled]);
}
