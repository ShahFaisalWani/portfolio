import { useEffect, useRef, useState, type CSSProperties } from "react";
import BlurTitle from "@/components/BlurTitle";
import { useReducedMotionPref } from "@/lib/use-media";
import { afterLoad, visibleLoop } from "@/lib/gl";
import { createCrumble, type Crumble, type Window } from "@/lib/crumble";
import fb1 from "@/assets/media/fb-1.webp";
import fb2 from "@/assets/media/fb-2.webp";
import fb4 from "@/assets/media/fb-4.webp";
import fb6 from "@/assets/media/fb-6.webp";
import fb6xl from "@/assets/media/fb-6-xl.webp";
import fb8 from "@/assets/media/fb-8.webp";
import fb9 from "@/assets/media/fb-9.webp";
import fb10 from "@/assets/media/fb-10.webp";

/*
  One photo, then the season under it. The section opens on a single big photo. Scrolling the
  sticky stage breaks it into pixels: windows open over each photo of a collage underneath, from
  the middle of that photo out and one photo after another. Around each window the big photo
  steps down in resolution until every card is a single pixel, then the pixels come loose, tumble
  toward the camera and fall away (lib/crumble.ts, WebGL 2). Under it the collage comes up out of
  shadow and settles. At the end all six are there, whole and uncropped, as real <img>s.
  Reduced motion or no WebGL 2: all seven photos as a plain spread.
*/

const COPY = "When I’m not at a keyboard, I’m on a football pitch. A few trophies came home too.";

const HERO = { src: fb6xl, w: 2048, h: 1365, pos: [0.5, 0.62] as const, alt: "Faisal dribbling past a defender" };

const PHOTOS = {
  fb9: { src: fb9, w: 1400, h: 933, caption: "Chill Chill Cup, champions", alt: "Holding the Chill Chill Cup trophy in Phuket" },
  fb8: { src: fb8, w: 1200, h: 800, caption: "Rising for a header", alt: "Rising for a header" },
  fb2: { src: fb2, w: 1400, h: 1050, caption: "A trophy under the lights", alt: "With a trophy on the pitch at night" },
  fb10: { src: fb10, w: 1400, h: 1050, caption: "K&L Sport Phuket Cup, champions", alt: "Holding the K&L Sport Phuket Cup trophy" },
  fb4: { src: fb4, w: 1400, h: 933, caption: "Onto the ball in orange", alt: "Running onto the ball in an orange kit" },
  fb1: { src: fb1, w: 1400, h: 934, caption: "Five-a-side, Prime Cup", alt: "On the ball in a five-a-side match" },
};
type Key = keyof typeof PHOTOS;
/* justified rows: every photo at its own shape, each row exactly the plate's width */
const ROWS_WIDE: Key[][] = [
  ["fb9", "fb8", "fb2"],
  ["fb10", "fb4", "fb1"],
];
const ROWS_NARROW: Key[][] = [
  ["fb9", "fb8"],
  ["fb2", "fb10"],
  ["fb4", "fb1"],
];
/* the order the windows open in, by photo */
const DELAY: Record<Key, number> = { fb8: 0, fb10: 0.05, fb2: 0.1, fb9: 0.15, fb1: 0.2, fb4: 0.25 };

/* the sticky track, in steps of half a screen: hold the photo, the reveal, hold the collage */
const HOLD = 0.5;
const REVEAL = 2.6;
const END = 0.6;
const TOTAL = HOLD + REVEAL + END;
const TRACK_VH = Math.round(TOTAL * 50);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function Collage({ rows, className }: { rows: Key[][]; className: string }) {
  return (
    <div className={`flex-col gap-2 md:gap-3 ${className}`}>
      {rows.map((row) => (
        <div key={row.join()} className="flex gap-2 md:gap-3">
          {row.map((k) => {
            const p = PHOTOS[k];
            return (
              <figure
                key={k}
                data-tile={k}
                className="group relative overflow-hidden rounded-[16px] bg-surface-1"
                style={{ flex: `${p.w / p.h} 1 0%`, aspectRatio: `${p.w} / ${p.h}` }}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  width={p.w}
                  height={p.h}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover [scale:calc(1.08-0.08*var(--reveal,1))]"
                />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-10 text-[0.9rem] font-[560] text-on-photo opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {p.caption}
                </figcaption>
              </figure>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Reveal({ onFail }: { onFail: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fail = useRef(onFail);
  useEffect(() => {
    fail.current = onFail;
  });

  useEffect(() => {
    const section = ref.current!;
    const stage = stageRef.current!;
    const plate = plateRef.current!;
    const canvas = canvasRef.current!;
    let crumble: Crumble | null = null;
    let cancelled = false;
    let dirty = true;
    let ready = false;
    let stop = () => {};
    let ro: ResizeObserver | null = null;
    let track = 1;
    let x = -1;
    let drawn = -1;
    let last = 0;

    const measure = () => {
      if (!crumble) return;
      const s = stage.getBoundingClientRect();
      const rel = (r: DOMRect) => ({ x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height });
      // only the collage that is showing (wide or narrow rows)
      const windows: Window[] = Array.from(plate.querySelectorAll<HTMLElement>("[data-tile]"))
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ ...rel(el.getBoundingClientRect()), delay: DELAY[el.dataset.tile as Key] }));
      crumble.layout({ w: s.width, h: s.height }, rel(plate.getBoundingClientRect()), windows);
      track = Math.max(1, section.offsetHeight - stage.offsetHeight);
      dirty = true;
    };

    const frame = (now: number) => {
      if (!crumble || !ready) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      const top = section.getBoundingClientRect().top;
      const target = clamp01((clamp01(-top / track) * TOTAL - HOLD) / REVEAL);
      // a little give on top of the smooth scroll, so a dragged scrollbar still crumbles smoothly
      x = x < 0 ? target : x + (target - x) * (1 - Math.exp(-dt / 0.07));
      if (Math.abs(target - x) < 0.0003) x = target;
      if (x === drawn && !dirty) return;
      drawn = x;
      dirty = false;
      crumble.render(x);
      plate.style.setProperty("--reveal", x.toFixed(4));
      // the canvas now draws the photo: the poster can step aside
      if (posterRef.current) posterRef.current.style.opacity = "0";
    };

    const start = async () => {
      await afterLoad();
      if (cancelled) return;
      crumble = createCrumble(canvas, HERO, () => {
        ready = true;
        dirty = true;
      });
      if (!crumble) return fail.current();
      measure();
      ro = new ResizeObserver(measure);
      ro.observe(stage);
      ro.observe(plate);
      stop = visibleLoop(section, frame, "10% 0px");
    };
    // build it in the first idle moment after load: compiling the shaders and uploading the photo
    // take a frame or two, which must not land in the middle of someone's scroll
    start();

    return () => {
      cancelled = true;
      ro?.disconnect();
      stop();
      crumble?.dispose();
    };
  }, []);

  return (
    <section
      ref={ref}
      id="section_offwork"
      aria-label="Off the clock"
      className="relative"
      style={{ height: `calc(100dvh + ${TRACK_VH}vh)` }}
    >
      <div ref={stageRef} className="sticky top-0 h-[100dvh] overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1680px] flex-col px-5 pb-6 pt-[5.5rem] md:px-10 md:pb-10 md:pt-28">
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-12 md:gap-10">
            <BlurTitle className="type-title md:col-span-7">Off the clock.</BlurTitle>
            <p className="type-lead max-w-[36ch] text-muted md:col-span-5 md:justify-self-end">{COPY}</p>
          </div>
          <div className="mt-6 grid min-h-0 flex-1 place-items-center [container-type:size] md:mt-10">
            <div
              ref={plateRef}
              className="relative w-[min(100cqw,92cqh)] md:w-[min(100cqw,212cqh)]"
              style={{ "--reveal": 0 } as CSSProperties}
            >
              <Collage rows={ROWS_WIDE} className="hidden md:flex" />
              <Collage rows={ROWS_NARROW} className="flex md:hidden" />
              {/* the collage waits in the big photo's shadow */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[16px] bg-black [opacity:calc(0.55*(1-var(--reveal,1)))]" />
              <img
                ref={posterRef}
                src={HERO.src}
                alt={HERO.alt}
                width={HERO.w}
                height={HERO.h}
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute inset-0 h-full w-full rounded-[16px] object-cover"
                style={{ objectPosition: `${HERO.pos[0] * 100}% ${HERO.pos[1] * 100}%` }}
              />
            </div>
          </div>
        </div>
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      </div>
    </section>
  );
}

/* reduced motion, or no WebGL 2: every photo at once, uncropped */
const SPREAD: { src: string; w: number; h: number; alt: string; span: string }[] = [
  { ...HERO, src: fb6, w: 1400, h: 933, span: "col-span-2 md:col-span-7" },
  { ...PHOTOS.fb9, span: "md:col-span-5" },
  { ...PHOTOS.fb8, span: "md:col-span-4" },
  { ...PHOTOS.fb2, span: "md:col-span-4" },
  { ...PHOTOS.fb10, span: "md:col-span-4" },
  { ...PHOTOS.fb4, span: "md:col-span-6" },
  { ...PHOTOS.fb1, span: "col-span-2 md:col-span-6" },
];

function Spread() {
  return (
    <section id="section_offwork" aria-label="Off the clock" className="relative px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1680px]">
        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12 md:gap-10">
          <BlurTitle className="type-title md:col-span-7">Off the clock.</BlurTitle>
          <p className="type-lead max-w-[36ch] text-muted md:col-span-5 md:justify-self-end">{COPY}</p>
        </div>
        <div className="mt-14 grid grid-cols-2 items-start gap-3 md:mt-20 md:grid-cols-12 md:gap-6">
          {SPREAD.map((s) => (
            <figure key={s.src} className={`overflow-hidden rounded-[16px] bg-surface-1 ${s.span}`}>
              <img src={s.src} alt={s.alt} width={s.w} height={s.h} loading="lazy" decoding="async" className="h-auto w-full" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function OffTheClock() {
  const reduce = useReducedMotionPref();
  const [noGl, setNoGl] = useState(false);
  if (reduce || noGl) return <Spread />;
  return <Reveal onFail={() => setNoGl(true)} />;
}
