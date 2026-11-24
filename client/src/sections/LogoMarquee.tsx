import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "@phosphor-icons/react";
import { gsap } from "@/lib/gsap";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { useReducedMotionPref } from "@/lib/use-media";

/*
  The teams behind the work, as one band under the hero. Logos are single-color masks
  (public/logos/mono, cut from the originals with their knockouts kept) painted in the ink
  color, so the row reads as one system in both themes; hovering one brings back its real
  colors. The band drifts left, follows the scroll direction, speeds up with scroll velocity
  and settles to a stop under the pointer or when paused with its switch (or a tap). Reduced
  motion: a still row.
*/

const LOGOS = [
  { id: "scbdatax", name: "SCB DataX", w: 319, h: 120, color: "/logos/color/scbdatax.webp" },
  { id: "scb10x", name: "SCB 10X", w: 241, h: 119, color: "/logos/color/scb10x.webp" },
  { id: "iqra", name: "Iqra AI", w: 102, h: 119, color: "/logos/color/iqra.webp" },
  { id: "mojen", name: "Mojen.ai", w: 104, h: 116, color: "/logos/color/mojen.webp" },
  { id: "scg", name: "SCG", w: 335, h: 110, color: "/logos/color/scg.webp" },
  { id: "alwani", name: "Alwani Travel", w: 120, h: 120, color: "/logos/color/alwani.webp" },
  { id: "booktree", name: "Booktree", w: 202, h: 120, color: "/logos/color/booktree.webp" },
];

/* optical sizing: equal ink area rather than equal height, so wide wordmarks and square marks weigh the same */
const size = (w: number, h: number) => {
  const height = Math.min(44, Math.max(30, Math.sqrt(3400 / (w / h))));
  return { width: Math.round((height * w) / h), height: Math.round(height) };
};

export default function LogoMarquee() {
  const reduce = useReducedMotionPref();
  const { lenis } = useSmoothScroll();
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [colors, setColors] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const view = viewRef.current;
    const track = trackRef.current;
    if (reduce || !view || !track) return;
    let x = 0;
    let dir = -1;
    let speed = 1;
    let hover = false;
    let span = track.scrollWidth / 2;
    let onScreen = false;
    const ro = new ResizeObserver(() => (span = track.scrollWidth / 2));
    ro.observe(track);
    const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
    io.observe(view);

    const tick = (_t: number, dt: number) => {
      if (!onScreen || !span) return;
      const v = lenis()?.velocity ?? 0;
      if (Math.abs(v) > 0.4) dir = v > 0 ? -1 : 1;
      speed += ((hover || pausedRef.current ? 0 : 1) - speed) * 0.07;
      x += dir * (34 + Math.min(Math.abs(v) * 22, 700)) * speed * (dt / 1000);
      if (x <= -span) x += span;
      if (x > 0) x -= span;
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    };
    gsap.ticker.add(tick);
    const enter = (e: PointerEvent) => e.pointerType === "mouse" && (hover = true);
    const leave = () => (hover = false);
    // touch has no hover: a tap on the band toggles the pause instead
    const press = (e: PointerEvent) => e.pointerType !== "mouse" && setPaused((v) => !v);
    view.addEventListener("pointerenter", enter);
    view.addEventListener("pointerleave", leave);
    view.addEventListener("pointerdown", press);
    return () => {
      gsap.ticker.remove(tick);
      track.style.transform = "";
      view.removeEventListener("pointerdown", press);
      ro.disconnect();
      io.disconnect();
      view.removeEventListener("pointerenter", enter);
      view.removeEventListener("pointerleave", leave);
    };
  }, [reduce, lenis]);

  const copies = reduce ? [0] : [0, 1];
  return (
    <section aria-label="Teams I’ve built for" className="relative border-y border-hairline">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-5 py-7 md:flex-row md:items-center md:gap-10 md:px-10 md:py-9">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="type-meta whitespace-nowrap text-muted">Teams I’ve built for</p>
          {!reduce && (
            <button
              type="button"
              aria-pressed={paused}
              aria-label="Pause the logo band"
              onClick={() => setPaused((v) => !v)}
              className="grid size-8 place-items-center rounded-full text-muted shadow-[inset_0_0_0_1px_var(--hairline)] transition-colors duration-300 hover:bg-surface-1 hover:text-ink active:scale-95"
            >
              {paused ? <Play size={12} weight="fill" aria-hidden="true" /> : <Pause size={12} weight="fill" aria-hidden="true" />}
            </button>
          )}
        </div>
        <div ref={viewRef} onPointerEnter={() => setColors(true)} className={reduce ? "min-w-0 flex-1" : "marquee-mask min-w-0 flex-1 overflow-hidden"}>
          <ul ref={trackRef} className={reduce ? "flex flex-wrap items-center gap-x-12 gap-y-6" : "flex w-max items-center will-change-transform"}>
            {copies.map((copy) =>
              LOGOS.map((l) => {
                const s = size(l.w, l.h);
                return (
                  <li
                    key={`${copy}-${l.id}`}
                    aria-hidden={copy === 1 || undefined}
                    className={`logo-cell relative shrink-0 ${reduce ? "" : "mx-7 md:mx-10"}`}
                    style={s}
                  >
                    <span className="logo-mono absolute inset-0" style={{ "--logo": `url(/logos/mono/${l.id}.png)` } as CSSProperties} />
                    {copy === 0 && <span className="sr-only">{l.name}</span>}
                    {colors && (
                      <img
                        src={l.color}
                        alt=""
                        width={s.width}
                        height={s.height}
                        decoding="async"
                        className="logo-color absolute inset-0 h-full w-full object-contain"
                      />
                    )}
                  </li>
                );
              }),
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
