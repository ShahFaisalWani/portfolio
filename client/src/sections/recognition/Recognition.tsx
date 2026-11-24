import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import BlurTitle from "@/components/BlurTitle";
import PixelResolve, { type PixelHandle } from "@/components/PixelResolve";
import { flushSync } from "react-dom";
import { ArrowsOutSimple } from "@phosphor-icons/react";
import { certGroups, certs } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { useReducedMotionPref } from "@/lib/use-media";
import CertViewer, { type ViewerControls } from "./CertViewer";

/*
  Certificates as a wall: a hairline grid with one cell per group (its note and
  count) followed by that group's scans, 16 cells for 3 groups and 13 papers.
  Each paper arrives as pixels: a coarse mosaic of itself that resolves as the wall
  scrolls in, row by row (components/PixelResolve.tsx). Papers sit slightly askew and
  straighten under the pointer. Opening one breaks its cell into squares and the full
  scan resolves out of pixels in the viewer; closing breaks the scan up and the cell
  resolves again, the same move as the page transition between case studies.
  Reduced motion: no pixels, the viewer just fades.
*/

const tilt = (id: string) => ((id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 7) - 3) * 0.9;

/* The wall shows thumbnails: warm the full scan on hover or focus so the viewer opens on a decoded image. */
const warmed = new Set<string>();
function preload(src: string) {
  if (warmed.has(src)) return;
  warmed.add(src);
  const img = new Image();
  img.src = src;
  img.decode().catch(() => {});
}

export default function Recognition() {
  const ref = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotionPref();
  const { lock, unlock } = useSmoothScroll();
  const groups = useMemo(() => certGroups.map((g) => ({ ...g, items: certs.filter((c) => c.group === g.id) })), []);
  const ordered = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const [index, setIndex] = useState<number | null>(null);
  const viewer = useRef<ViewerControls | null>(null);
  // each cell's pixel handle, by certificate id
  const cells = useRef<Record<string, PixelHandle | null>>({});
  // one move at a time: a second click while the pixels run would tangle them
  const busy = useRef(false);

  // in the viewer, the neighbours' full scans load ahead of next and previous
  useEffect(() => {
    if (index === null) return;
    const n = ordered.length;
    preload(ordered[(index + 1) % n].image);
    preload(ordered[(index - 1 + n) % n].image);
  }, [index, ordered]);
  const current = index === null ? null : ordered[index];

  useGSAP(
    () => {
      if (reduce) return;
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) =>
        // font-stretch steps in 0.25%: an in-out ease keeps the slow tail short enough not to tick
        gsap.from(el, {
          fontStretch: "75%",
          opacity: 0,
          duration: 1,
          ease: "power3.inOut",
          clearProps: "fontStretch",
          scrollTrigger: { trigger: el, start: "top 88%" },
        }),
      );
    },
    { scope: ref, dependencies: [reduce], revertOnUpdate: true },
  );

  const open = async (i: number) => {
    if (busy.current || dialogRef.current?.open) return;
    busy.current = true;
    const cell = cells.current[ordered[i].id];
    await cell?.out(240);
    flushSync(() => setIndex(i));
    dialogRef.current?.showModal();
    lock();
    // the wall is behind the backdrop now: put the cell back together for when the viewer closes
    cell?.in(0);
    await viewer.current?.enter();
    busy.current = false;
  };

  const close = async () => {
    const d = dialogRef.current;
    if (!d?.open || index === null || busy.current) return;
    busy.current = true;
    const id = ordered[index].id;
    // the cell of the paper on screen (the visitor may have stepped to another) waits as squares
    const cell = cells.current[id];
    await cell?.out(0);
    await viewer.current?.leave();
    d.close();
    busy.current = false;
    await cell?.in(560);
    d.ownerDocument.querySelector<HTMLElement>(`[data-cert-cell="${id}"]`)?.focus({ preventScroll: true });
  };

  const step = async (dir: 1 | -1) => {
    if (index === null || busy.current) return;
    const n = ordered.length;
    const update = () => flushSync(() => setIndex((index + dir + n) % n));
    if (!viewer.current) return update();
    busy.current = true;
    await viewer.current.swap(update);
    busy.current = false;
  };

  const cell = "border-b border-r border-hairline p-4 md:p-6";

  return (
    <section ref={ref} id="section_recognition" aria-label="Certificates and awards" className="relative px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1680px]">
        <BlurTitle className="type-title">Certificates and awards.</BlurTitle>

        <div data-spot-group className="paper mt-14 grid grid-cols-2 overflow-hidden rounded-[16px] bg-surface-1 md:mt-20 md:grid-cols-4">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 rounded-[16px] shadow-[inset_0_0_0_1px_var(--hairline)]" />
          {groups.map((g) => (
            <div key={g.id} className="contents">
              <div className={`${cell} flex aspect-[3/4] flex-col justify-between md:aspect-square`}>
                <div>
                  <h3 className="type-heading">{g.id}</h3>
                  <p className="mt-3 max-w-[24ch] text-[0.95rem] leading-snug text-muted text-pretty">{g.note}</p>
                </div>
                <p className="flex items-end justify-between gap-3">
                  <span className="type-meta text-muted">{g.items.length === 1 ? "entry" : "entries"}</span>
                  <span
                    data-count
                    className="text-[clamp(4rem,8vw,8rem)] font-[640] leading-[0.78] tracking-[-0.05em] [font-stretch:125%] tabular-nums"
                  >
                    {g.items.length}
                  </span>
                </p>
              </div>

              {g.items.map((c) => {
                const i = ordered.indexOf(c);
                // cells resolve left to right across each row of the wall
                const column = (groups.slice(0, groups.indexOf(g)).reduce((a, x) => a + x.items.length + 1, 0) + g.items.indexOf(c) + 1) % 4;
                const tall = c.h > c.w;
                const paper: CSSProperties & Record<"--tilt", string> = {
                  "--tilt": `${tilt(c.id)}deg`,
                  aspectRatio: `${c.w} / ${c.h}`,
                  ...(tall ? { height: "100%" } : { width: "84%" }),
                };
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-cert-cell={c.id}
                    data-cursor="View"
                    aria-haspopup="dialog"
                    onClick={() => open(i)}
                    onPointerEnter={() => preload(c.image)}
                    onFocus={() => preload(c.image)}
                    className={`${cell} spot spot-cell group relative flex aspect-[3/4] touch-manipulation focus-visible:outline-offset-[-3px] flex-col gap-4 text-left transition-colors duration-500 hover:bg-surface-2/50 md:aspect-square`}
                  >
                    <span className="flex min-h-0 w-full flex-1 items-center justify-center">
                      <span
                        data-cert-thumb={c.id}
                        style={paper}
                        className="relative block max-h-full max-w-full overflow-hidden rounded-[16px] bg-paper shadow-[0_18px_36px_-18px_rgb(0_0_0/0.55)] transition-[rotate,translate,scale] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [rotate:var(--tilt)] group-hover:-translate-y-1.5 group-hover:scale-[1.04] group-hover:[rotate:0deg] group-active:scale-[0.99]"
                      >
                        <img src={c.thumb} alt="" width={c.w} height={c.h} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        <PixelResolve
                          src={c.thumb}
                          blocks={9}
                          delay={column * 110}
                          onHandle={(h) => (cells.current[c.id] = h)}
                          className="bg-surface-2"
                        />
                      </span>
                    </span>
                    <span className="block">
                      <span className="line-clamp-2 block text-[0.92rem] font-[560] leading-snug tracking-[-0.01em] md:text-[0.98rem]">
                        {c.title}
                      </span>
                      <span className="type-meta mt-1.5 block truncate text-muted">
                        {c.issuer}
                        {c.year ? `, ${c.year}` : ""}
                      </span>
                      <span className="sr-only">, view certificate</span>
                    </span>
                    <ArrowsOutSimple
                      size={16}
                      weight="bold"
                      aria-hidden="true"
                      className="absolute right-4 top-4 text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 md:right-5 md:top-5"
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <CertViewer
        dialogRef={dialogRef}
        onControls={(v) => (viewer.current = v)}
        reduce={reduce}
        cert={current}
        onRequestClose={close}
        onStep={step}
        onClosed={() => {
          unlock();
          setIndex(null);
        }}
      />
    </section>
  );
}
