import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotionPref } from "@/lib/use-media";
import { isHydrating } from "@/lib/prerender";
import { inView } from "@/lib/view-transition";
import { drawMosaic, easeIn, easeOut, loadImage, parsePos, shuffleOrder, sizeCanvas, tween } from "@/lib/mosaic";

/*
  A picture that arrives as pixels. A canvas over the real image holds a coarse mosaic of it
  until the image scrolls into view, then the squares drop in at random and shrink until they
  are the picture, and the canvas steps aside. Its handle (passed out through onHandle) can
  break it back into squares (out) and resolve it again (in) (the certificate viewer runs these around opening and
  closing). The canvas only arms on the client: a hydrating page that already shows the
  picture keeps it as it is, and reduced motion never gets one.
*/

export type PixelHandle = { out: (ms?: number) => Promise<void>; in: (ms?: number) => Promise<void> };

export default function PixelResolve({
  src,
  blocks = 10,
  delay = 0,
  pos,
  className = "",
  onHandle,
}: {
  /* the same picture the element under it shows (a poster for a video) */
  src: string;
  /* columns of squares at the coarsest */
  blocks?: number;
  /* ms after it comes into view */
  delay?: number;
  /* object-position of the picture under it, e.g. "30% 0%" */
  pos?: string;
  /* the canvas's own background shows where squares have not landed yet */
  className?: string;
  onHandle?: (handle: PixelHandle | null) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotionPref();
  const [armed, setArmed] = useState(false);
  // the latest callback, so a new arrow from the parent does not restart a running resolve
  const report = useRef(onHandle);
  useEffect(() => {
    report.current = onHandle;
  });

  useLayoutEffect(() => {
    const c = ref.current;
    // a direct visit that lands on a painted picture keeps it
    if (reduce || !c?.parentElement || (isHydrating() && inView(c.parentElement, 0.01))) return;
    setArmed(true);
  }, [reduce]);

  useEffect(() => {
    const c = ref.current;
    if (!armed || !c) return;
    const signal = { cancelled: false };
    const at = parsePos(pos);
    const coarse = () => c.clientWidth / blocks;
    const paint = (img: HTMLImageElement, block: number, keep?: (i: number) => boolean) => {
      const { ctx, w, h } = sizeCanvas(c);
      ctx.clearRect(0, 0, w, h);
      drawMosaic(ctx, img, { x: 0, y: 0, w, h }, block, { pos: at, grid: coarse(), keep });
    };
    const show = (v: boolean) => {
      c.style.opacity = v ? "1" : "0";
    };

    // resolve: squares drop in during the first half while they shrink to the picture
    const resolve = async (ms: number) => {
      const img = await loadImage(src);
      if (signal.cancelled) return;
      const order = shuffleOrder(Math.ceil(blocks * blocks * 2));
      show(true);
      await tween(
        ms,
        (t) => {
          const k = easeOut(t);
          paint(img, coarse() + (1 - coarse()) * k, (i) => (order[i] ?? 0) * 0.5 <= t);
        },
        signal,
      );
      if (!signal.cancelled) show(false);
    };

    let started = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || started) return;
        started = true;
        io.disconnect();
        window.setTimeout(() => resolve(950), delay);
      },
      { threshold: 0.3 },
    );
    io.observe(c);
    // until then: the coarse mosaic, as soon as the picture is ready
    loadImage(src).then((img) => !started && !signal.cancelled && paint(img, coarse()));

    report.current?.({
      out: async (ms = 300) => {
        const img = await loadImage(src);
        show(true);
        await tween(ms, (t) => paint(img, 1 + (coarse() - 1) * easeIn(t)), signal);
      },
      in: (ms = 520) => resolve(ms),
    });
    return () => {
      signal.cancelled = true;
      io.disconnect();
      report.current?.(null);
    };
  }, [armed, src, blocks, delay, pos]);

  if (reduce) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${armed ? "" : "hidden"} ${className}`}
    />
  );
}
