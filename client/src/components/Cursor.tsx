import { useEffect, useRef } from "react";
import { useFinePointer, useMediaQuery, useReducedMotionPref } from "@/lib/use-media";
import { ScrollTrigger } from "@/lib/gsap";

/*
  The cursor: a dot locked to the pointer and a ring that trails it, both blended with
  difference so they read on any surface. It reads intent from what is under it:
  - links and buttons: the ring opens around the target and the dot steps aside
  - [data-cursor="Label"]: an accent disc grows with the label ("Open", "Drag", "View")
  - [data-cursor="lens"]: the hero draws its own lens ring, so only the dot stays (links
    inside it still open the ring)
  - [data-cursor="dot"]: something else follows the pointer (the Work logo), so only the dot
    stays, links included
  - text fields: the native caret comes back
  Fine pointers only, and never under reduced motion, forced colors or a high-contrast
  preference: those visitors keep the system cursor at the size and color they chose. The
  native cursor is only hidden once a mouse has actually moved over the page, and pen or touch
  input brings it straight back. Positions are written to the DOM in one rAF loop; React never
  re-renders on pointer moves.
*/

const INTERACTIVE = "a[href], button, [role='button'], summary, label, select";

export default function Cursor() {
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  const plain = useMediaQuery("(forced-colors: active), (prefers-contrast: more)");
  const blendRef = useRef<HTMLDivElement>(null);
  const discLayerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const on = fine && !reduce && !plain;

  useEffect(() => {
    if (!on) return;
    const blend = blendRef.current!;
    const discLayer = discLayerRef.current!;
    const label = labelRef.current!;
    const dot = blend.querySelector<HTMLElement>(".cursor-dot")!;
    const ring = blend.querySelector<HTMLElement>(".cursor-ring")!;
    const disc = discLayer.querySelector<HTMLElement>(".cursor-disc")!;
    const root = document.documentElement;

    const p = { x: -200, y: -200, rx: -200, ry: -200, dx: -200, dy: -200 };
    let raf = 0;
    let seen = false;
    let settled = false;

    const setMode = (mode: string) => {
      blend.dataset.mode = mode;
      discLayer.dataset.mode = mode;
    };
    const hide = (v: boolean) => {
      for (const l of [blend, discLayer]) {
        if (v) l.dataset.hidden = "";
        else delete l.dataset.hidden;
      }
    };
    hide(true);

    const tick = () => {
      p.rx += (p.x - p.rx) * 0.2;
      p.ry += (p.y - p.ry) * 0.2;
      p.dx += (p.x - p.dx) * 0.16;
      p.dy += (p.y - p.dy) * 0.16;
      // `translate`, not `transform`: the modes resize with `scale`, which applies before
      // `translate` but after `transform`, so a scaled ring would also scale its position
      dot.style.translate = `${p.x}px ${p.y}px`;
      ring.style.translate = `${p.rx}px ${p.ry}px`;
      disc.style.translate = `${p.dx}px ${p.dy}px`;
      settled = Math.abs(p.x - p.rx) < 0.1 && Math.abs(p.y - p.ry) < 0.1 && Math.abs(p.x - p.dx) < 0.1;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const read = (target: Element | null) => {
      if (!target) return setMode("default");
      if (target.closest("input, textarea, [contenteditable='true']")) return setMode("text");
      const labelled = target.closest<HTMLElement>("[data-cursor]");
      const control = target.closest(INTERACTIVE);
      // a labelled area wins over the link it wraps (a cover that opens a case study)
      if (labelled && (!control || labelled.contains(control) || control.contains(labelled))) {
        const value = labelled.dataset.cursor!;
        if (value === "dot") return setMode("lens");
        if (value === "lens") return setMode(control ? "link" : "lens");
        label.textContent = value;
        return setMode("label");
      }
      setMode(control ? "link" : "default");
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        // a pen or a finger on a hybrid device: hand back the system cursor
        root.classList.remove("has-cursor");
        hide(true);
        seen = false;
        return;
      }
      if (!seen) root.classList.add("has-cursor");
      p.x = e.clientX;
      p.y = e.clientY;
      if (!seen) {
        seen = true;
        Object.assign(p, { rx: p.x, ry: p.y, dx: p.x, dy: p.y });
        hide(false);
      }
      kick();
    };
    const onOver = (e: PointerEvent) => read(e.target as Element);
    const onDown = () => {
      blend.dataset.down = "";
    };
    const onUp = () => {
      delete blend.dataset.down;
    };
    window.addEventListener("blur", onUp);
    const onLeave = () => hide(true);
    const onEnter = () => seen && hide(false);
    // content can move under a still pointer (smooth scroll, pinned sections): re-read what is under it
    const onScroll = () => {
      if (seen) read(document.elementFromPoint(p.x, p.y));
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointercancel", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);
    ScrollTrigger.addEventListener("scrollEnd", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor");
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
      ScrollTrigger.removeEventListener("scrollEnd", onScroll);
    };
  }, [on]);

  if (!on) return null;
  return (
    <>
      <div ref={discLayerRef} className="cursor-layer" aria-hidden="true">
        <div className="cursor-disc">
          <span ref={labelRef} />
        </div>
      </div>
      <div ref={blendRef} className="cursor-layer cursor-blend" aria-hidden="true">
        <div className="cursor-ring" />
        <div className="cursor-dot" />
      </div>
    </>
  );
}
