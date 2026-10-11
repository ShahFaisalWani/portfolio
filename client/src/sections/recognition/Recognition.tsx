import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { ArrowsOutSimple } from "@phosphor-icons/react";
import { certGroups, certs, type Cert } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { useReducedMotionPref } from "@/lib/use-media";
import { inView, runTransition } from "@/lib/view-transition";
import CertViewer from "./CertViewer";

/*
  Certificates as a wall: a hairline grid with one cell per group (its note and
  count) followed by that group's scans, 16 cells for 3 groups and 13 papers.
  As the wall enters, each paper is scanned in by a curtain with the signal line
  on its edge, the same LIDAR sweep the hero portrait uses. Papers sit slightly
  askew and straighten under the pointer; opening one morphs it into the viewer.
  Reduced motion: no scan, no morphs.
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
      ScrollTrigger.batch("[data-cert-cell]", {
        start: "top 86%",
        once: true,
        onEnter: (cells) =>
          gsap.to(
            cells.map((c) => c.querySelector("[data-scan]")),
            { yPercent: 101, duration: 1.15, ease: "power3.inOut", stagger: 0.09 },
          ),
      });
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) =>
        gsap.from(el, {
          fontStretch: "75%",
          opacity: 0,
          duration: 1.4,
          ease: "expo.out",
          clearProps: "fontStretch",
          scrollTrigger: { trigger: el, start: "top 88%" },
        }),
      );
    },
    { scope: ref, dependencies: [reduce], revertOnUpdate: true },
  );

  const thumb = (c: Cert) => ref.current?.querySelector<HTMLElement>(`[data-cert-thumb="${c.id}"]`) ?? null;
  const full = () => dialogRef.current?.querySelector<HTMLElement>("[data-cert-full]") ?? null;

  const open = (i: number) => {
    runTransition({
      kind: "cert-open",
      name: "cert-focus",
      from: thumb(ordered[i]),
      update: () => {
        flushSync(() => setIndex(i));
        dialogRef.current?.showModal();
        lock();
      },
      to: full,
    });
  };

  const close = () => {
    const d = dialogRef.current;
    if (!d?.open || index === null) return;
    const cell = thumb(ordered[index]);
    runTransition({
      kind: "cert-close",
      name: "cert-focus",
      from: full(),
      update: () => d.close(),
      to: () => (inView(cell, 0.5) ? cell : null),
    }).then(() => cell?.closest("button")?.focus({ preventScroll: true }));
  };

  const step = (dir: 1 | -1) => {
    if (index === null) return;
    const n = ordered.length;
    runTransition({
      kind: dir === 1 ? "cert-next" : "cert-prev",
      name: "cert-focus",
      from: full(),
      update: () => flushSync(() => setIndex((index + dir + n) % n)),
      to: full,
    });
  };

  const cell = "border-b border-r border-hairline p-4 md:p-6";

  return (
    <section ref={ref} id="section_recognition" aria-label="Certificates and awards" className="relative px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1680px]">
        <h2 className="type-title">Certificates and awards.</h2>

        <div className="mt-14 grid grid-cols-2 border-l border-t border-hairline md:mt-20 md:grid-cols-4">
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
                    data-cert-cell
                    aria-haspopup="dialog"
                    onClick={() => open(i)}
                    onPointerEnter={() => preload(c.image)}
                    onFocus={() => preload(c.image)}
                    className={`${cell} group relative flex aspect-[3/4] touch-manipulation flex-col gap-4 text-left transition-colors duration-500 hover:bg-surface-1 md:aspect-square`}
                  >
                    <span className="flex min-h-0 w-full flex-1 items-center justify-center">
                      <span
                        data-cert-thumb={c.id}
                        style={paper}
                        className="relative block max-h-full max-w-full overflow-hidden rounded-[16px] bg-paper shadow-[0_18px_36px_-18px_rgb(0_0_0/0.55)] transition-[rotate,translate,scale] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [rotate:var(--tilt)] group-hover:-translate-y-1.5 group-hover:scale-[1.04] group-hover:[rotate:0deg] group-active:scale-[0.99]"
                      >
                        <img src={c.thumb} alt="" width={c.w} height={c.h} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        {!reduce && (
                          <span data-scan aria-hidden="true" className="absolute inset-0 bg-canvas">
                            <span className="absolute inset-x-0 top-0 h-px bg-accent" />
                          </span>
                        )}
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
