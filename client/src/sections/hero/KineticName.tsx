import { useEffect, useRef } from "react";

/*
  The name, set in Mona Sans with its width axis doing the work. On load each
  letter rises out of a mask while stretching from condensed to wide. With a
  fine pointer, letters near the cursor widen and get heavier, so the name
  reacts like a lens passing over it. Direct style writes in rAF, no React state.
*/

const LINES = ["Faisal", "Wani."];
const BASE_STRETCH = 112;
const BASE_WEIGHT = 640;

export default function KineticName({ reduce, interactive }: { reduce: boolean; interactive: boolean }) {
  const rootRef = useRef<HTMLHeadingElement>(null);

  // intro
  useEffect(() => {
    const chars = rootRef.current?.querySelectorAll<HTMLSpanElement>("[data-char]");
    if (!chars || reduce) return;
    const anims = Array.from(chars).map((el, i) =>
      el.animate(
        [
          { transform: "translateY(108%)", fontStretch: "75%", fontWeight: 300 },
          { transform: "translateY(0)", fontStretch: `${BASE_STRETCH}%`, fontWeight: BASE_WEIGHT },
        ],
        { duration: 1300, delay: 150 + i * 55, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" },
      ),
    );
    return () => anims.forEach((a) => a.cancel());
  }, [reduce]);

  // lens on hover
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduce || !interactive) return;
    const chars = Array.from(root.querySelectorAll<HTMLSpanElement>("[data-char]"));
    const state = chars.map(() => ({ s: BASE_STRETCH, w: BASE_WEIGHT }));
    let centers: { x: number; y: number }[] = [];
    let pointer = { x: -1e4, y: -1e4 };
    let raf = 0;
    let active = false;

    const measure = () => {
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
        const dx = (pointer.x - c.x) / (size * 1.6);
        const dy = (pointer.y - c.y) / (size * 0.9);
        const k = active ? Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) : 0;
        const e = k * k * (3 - 2 * k);
        const ts = active ? 100 + 25 * e : BASE_STRETCH;
        const tw = active ? 520 + 330 * e : BASE_WEIGHT;
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
  }, [reduce, interactive]);

  let n = 0;
  return (
    <h1
      ref={rootRef}
      className="type-display select-none text-[clamp(4.4rem,21vw,19rem)] leading-[0.8] lg:text-[clamp(4.4rem,17.2vw,19rem)]"
    >
      <span className="sr-only">Faisal Wani</span>
      {LINES.map((line) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]" aria-hidden="true">
          {line.split("").map((ch) => (
            <span
              key={`${line}-${n}`}
              data-char={n++}
              className="inline-block will-change-transform"
              style={{ fontStretch: `${BASE_STRETCH}%`, fontWeight: BASE_WEIGHT }}
            >
              {ch}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
