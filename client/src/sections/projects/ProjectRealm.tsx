import { useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import { projects, type Media } from "@/content/site";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { useRealm, type ProjectId } from "@/lib/realm";
import { useContact } from "@/lib/contact";
import { useReducedMotionPref } from "@/lib/use-media";
import { isHydrating } from "@/lib/prerender";
import ThemeToggle from "@/components/ThemeToggle";
import ProjectMedia from "./ProjectMedia";

/*
  A case study as its own layer over the home page, with its own scroller.
  The hero cover is the shared element the card morphs into (lib/realm.tsx).
  Inside: the title stretches out of a mask on the Mona Sans width axis, the
  summary rises line by line, and each screenshot is scanned in by a curtain
  with a signal line on its edge, then drifts with the scroll. The next-project
  cover at the bottom morphs into the next case study's hero.
*/

type Row = { kind: "wide" | "duo" | "pair" | "solo"; items: Media[] };

/* wide media get their own row; neighbours with the same orientation pair up; the rest stand alone */
function toRows(gallery: Media[]): Row[] {
  const rows: Row[] = [];
  const tall = (m: Media) => m.h > m.w;
  for (let i = 0; i < gallery.length; ) {
    const m = gallery[i];
    const n = gallery[i + 1];
    if (m.span === "wide") {
      rows.push({ kind: "wide", items: [m] });
      i += 1;
    } else if (n && n.span !== "wide" && tall(m) === tall(n)) {
      rows.push({ kind: tall(m) ? "pair" : "duo", items: [m, n] });
      i += 2;
    } else {
      rows.push({ kind: "solo", items: [m] });
      i += 1;
    }
  }
  return rows;
}

function Frame({ media, reduce, className = "", style }: { media: Media; reduce: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <figure className={className} style={style}>
      <div
        data-frame
        className="relative overflow-hidden rounded-[16px] bg-surface-1"
        style={{ aspectRatio: `${media.w} / ${media.h}` }}
      >
        <div data-frame-drift className={`absolute inset-x-0 ${reduce ? "inset-y-0" : "-inset-y-[6%]"}`}>
          <div data-frame-media className="h-full w-full">
            <ProjectMedia media={media} reduce={reduce} className="h-full w-full object-cover" />
          </div>
        </div>
        {!reduce && (
          <div data-curtain aria-hidden="true" className="absolute inset-0 bg-canvas">
            <span className="absolute inset-x-0 bottom-0 h-px bg-accent" />
          </div>
        )}
      </div>
      <figcaption className="type-meta mt-3 text-muted">{media.alt}</figcaption>
    </figure>
  );
}

function GalleryRow({ row, index, reduce }: { row: Row; index: number; reduce: boolean }) {
  const [a, b] = row.items;
  if (row.kind === "wide") return <Frame media={a} reduce={reduce} />;

  if (row.kind === "duo") {
    // the sharper asset gets the wider column, the second one sits lower for an offset rhythm
    const aWide = a.w >= b.w;
    return (
      <div className="grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-6">
        <Frame media={a} reduce={reduce} className={aWide ? "md:col-span-7" : "md:col-span-5"} />
        <Frame media={b} reduce={reduce} className={`md:mt-[22vh] ${aWide ? "md:col-span-5" : "md:col-span-7"}`} />
      </div>
    );
  }

  if (row.kind === "pair") {
    const width = (m: Media) => `min(100%, calc(68dvh * ${(m.w / m.h).toFixed(4)}))`;
    return (
      <div className="flex items-start justify-center gap-4 rounded-[16px] bg-surface-1 px-4 py-10 md:gap-[7vw] md:px-10 md:py-20">
        <Frame media={a} reduce={reduce} className="min-w-0" style={{ width: width(a) }} />
        <Frame media={b} reduce={reduce} className="mt-10 min-w-0 md:mt-24" style={{ width: width(b) }} />
      </div>
    );
  }

  // solo: alternate sides; portrait media get a narrower column
  const tall = a.h > a.w;
  const right = index % 2 === 0;
  const cols = tall
    ? right
      ? "md:col-span-4 md:col-start-8"
      : "md:col-span-4 md:col-start-2"
    : right
      ? "md:col-span-7 md:col-start-6"
      : "md:col-span-7 md:col-start-1";
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 md:gap-6">
      <Frame media={a} reduce={reduce} className={cols} />
    </div>
  );
}

export default function ProjectRealm({ id }: { id: ProjectId }) {
  const project = projects.find((p) => p.id === id)!;
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { close, go } = useRealm();
  const { openContact } = useContact();
  const reduce = useReducedMotionPref();
  // a direct visit hydrates a prerendered page: the hero is already painted, so it skips its intro
  const [fromHTML] = useState(isHydrating);
  const rows = useMemo(() => toRows(project.gallery.filter((m) => m.src !== project.cover.src)), [project]);
  const [lead, ...rest] = rows;

  // the layer scrolls on its own, with its own Lenis
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ wrapper: rootRef.current!, content: contentRef.current!, lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reduce]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useGSAP(
    () => {
      if (reduce) return;
      const scroller = rootRef.current!;
      const vt = document.documentElement.dataset.vt;
      // wait for the cover morph when one is running, start almost at once on a direct visit
      const delay = vt === "open" || vt === "swap" ? 0.6 : vt ? 0.4 : 0.15;

      if (!fromHTML) {
        const title = SplitText.create("[data-realm-title]", { type: "words,chars", tag: "span", mask: "words", wordsClass: "split-word" });
        const intro = gsap.timeline({ delay, defaults: { ease: "expo.out" } });
        intro
          .from(title.chars, { yPercent: 115, fontStretch: "75%", duration: 1.4, stagger: 0.026, clearProps: "fontStretch" }, 0)
          .from("[data-realm-meta]", { y: 18, opacity: 0, duration: 1 }, 0.2)
          .from("[data-bar-item]", { y: -14, opacity: 0, duration: 0.9, stagger: 0.07 }, 0.1);
        if (!vt) intro.from("[data-hero-media]", { scale: 1.12, opacity: 0, duration: 1.8 }, 0);
      }

      // reading progress
      gsap.fromTo(
        "[data-realm-progress]",
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { scroller, trigger: contentRef.current, start: "top top", end: "bottom bottom", scrub: true } },
      );

      // hero: the cover sinks slower than the page and the title lifts away
      const hero = { scroller, trigger: "[data-realm-hero]", start: "top top", end: "bottom top", scrub: true };
      gsap.to("[data-hero-media]", { yPercent: 22, ease: "none", scrollTrigger: hero });
      gsap.to("[data-hero-copy]", { yPercent: -40, opacity: 0, ease: "none", scrollTrigger: { ...hero, end: "bottom 35%" } });

      SplitText.create("[data-statement]", {
        type: "lines",
        mask: "lines",
        // lines keep whole words, so the text reads as-is (the default aria-label is not allowed on a <p>)
        aria: "none",
        linesClass: "split-line",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 105,
            duration: 1.3,
            stagger: 0.09,
            ease: "expo.out",
            scrollTrigger: { scroller, trigger: "[data-statement]", start: "top 82%" },
          }),
      });

      gsap.from("[data-fact]", {
        y: 26,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "expo.out",
        scrollTrigger: { scroller, trigger: "[data-facts]", start: "top 90%" },
      });

      gsap.utils.toArray<HTMLElement>("[data-detail]").forEach((li) => {
        gsap
          .timeline({ scrollTrigger: { scroller, trigger: li, start: "top 88%" } })
          .from(li.querySelector("[data-detail-rule]"), { scaleX: 0, duration: 0.9, ease: "expo.inOut" }, 0)
          .from(li.querySelector("[data-detail-text]"), { y: 36, opacity: 0, duration: 1.1, ease: "expo.out" }, 0.1);
      });

      // screenshots: a curtain lifts off with the signal line on its edge, then the image drifts
      gsap.utils.toArray<HTMLElement>("[data-frame]").forEach((frame) => {
        gsap
          .timeline({ scrollTrigger: { scroller, trigger: frame, start: "top 86%" } })
          .to(frame.querySelector("[data-curtain]"), { yPercent: -101, duration: 1.25, ease: "expo.inOut" }, 0)
          .from(frame.querySelector("[data-frame-media]"), { scale: 1.3, duration: 1.8, ease: "expo.out" }, 0.15);
        gsap.fromTo(
          frame.querySelector("[data-frame-drift]"),
          { yPercent: -4 },
          { yPercent: 4, ease: "none", scrollTrigger: { scroller, trigger: frame, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });

      // inside a link: aria-label is not allowed on the span, and the letters still read as words
      const nextTitle = SplitText.create("[data-next-title]", {
        type: "words,chars",
        tag: "span",
        mask: "words",
        wordsClass: "split-word",
        aria: "none",
      });
      gsap.from(nextTitle.chars, {
        yPercent: 115,
        fontStretch: "75%",
        duration: 1.3,
        stagger: 0.022,
        ease: "expo.out",
        clearProps: "fontStretch",
        scrollTrigger: { scroller, trigger: "[data-next]", start: "top 78%" },
      });
      gsap.fromTo(
        "[data-next-cover-inner]",
        { scale: 1.18 },
        { scale: 1, ease: "none", scrollTrigger: { scroller, trigger: "[data-cover-next]", start: "top bottom", end: "bottom bottom", scrub: true } },
      );
    },
    { scope: rootRef, dependencies: [reduce, id], revertOnUpdate: true },
  );

  const onNext = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    go(next.id);
  };

  return (
    <div
      ref={rootRef}
      data-realm
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-labelledby="realm-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 scroll-pt-24 overflow-y-auto overscroll-contain bg-canvas text-ink outline-none"
    >
      <div ref={contentRef}>
        <div data-realm-bar className="pointer-events-none fixed inset-x-0 top-0 z-10 flex items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] md:pl-8 md:pr-8 md:pt-4">
          <div data-bar-item className="pointer-events-auto">
            <button type="button" onClick={close} className="btn btn-secondary group/back h-11 bg-surface-1/85 pl-3.5 pr-5 backdrop-blur-md">
              <ArrowLeft size={16} weight="bold" aria-hidden="true" className="transition-transform duration-300 group-hover/back:-translate-x-0.5" />
              All projects
            </button>
          </div>
          <div data-bar-item className="pointer-events-auto flex items-center gap-2">
            <div className="rounded-full bg-surface-1/85 shadow-[inset_0_0_0_1px_var(--hairline)] backdrop-blur-md">
              <ThemeToggle />
            </div>
            <button type="button" className="btn btn-primary hidden h-11 sm:inline-flex" onClick={openContact}>
              Get in touch
            </button>
          </div>
          {!reduce && (
            <span
              data-realm-progress
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[2px] origin-left bg-accent"
              style={{ transform: "scaleX(0)" }}
            />
          )}
        </div>

        <header data-realm-hero className="relative h-[100dvh] min-h-[520px] overflow-hidden bg-surface-1">
          <div data-cover-hero={project.id} className="absolute inset-0 overflow-hidden">
            <div data-hero-media className="absolute inset-0 will-change-transform">
              <ProjectMedia media={project.cover} reduce={reduce} eager className="h-full w-full object-cover object-top" />
            </div>
          </div>
          {/* screenshots are busy: dim them a touch and let a deep bottom scrim carry the title */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-scrim/20" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-scrim/60 to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-scrim via-scrim/65 via-30% to-transparent to-70%" />
          <div
            data-hero-copy
            className="absolute inset-x-0 bottom-0 mx-auto grid max-w-[1680px] items-end gap-6 px-5 pb-[max(2.25rem,env(safe-area-inset-bottom))] text-on-photo md:grid-cols-[minmax(0,1fr)_auto] md:gap-10 md:px-10 md:pb-14"
          >
            <div>
              <p data-realm-meta className="type-meta text-on-photo/75">
                {project.kicker}
              </p>
              <h1 id="realm-title" data-realm-title className="realm-title mt-4 max-w-[15ch]">
                {project.title}
              </h1>
            </div>
            <ul data-realm-meta aria-label="Stack" className="flex flex-wrap gap-2 md:max-w-[22rem] md:justify-end md:pb-3">
              {project.stack.map((s) => (
                <li key={s} className="chip text-on-photo/85 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-on-photo)_32%,transparent)]">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <section aria-label="Overview" className="px-5 pb-24 pt-24 md:px-10 md:pb-36 md:pt-40">
          <div className="mx-auto grid max-w-[1680px] gap-14 lg:grid-cols-12 lg:gap-6">
            <p data-statement className="realm-statement lg:col-span-8">
              {project.summary}
            </p>
            <dl data-facts className="grid grid-cols-2 gap-x-6 gap-y-8 self-end lg:col-span-3 lg:col-start-10 lg:grid-cols-1">
              <div data-fact>
                <dt className="type-meta text-muted">Type</dt>
                <dd className="mt-2 text-[1.05rem] font-[560] tracking-[-0.01em]">{project.kicker}</dd>
              </div>
              <div data-fact>
                <dt className="type-meta text-muted">Built with</dt>
                <dd className="mt-2 text-[1.05rem] font-[560] tracking-[-0.01em]">{project.stack.join(", ")}</dd>
              </div>
              {project.link && (
                <div data-fact className="col-span-2 lg:col-span-1">
                  <dt className="type-meta text-muted">Write-up</dt>
                  <dd className="mt-2">
                    <a
                      href={project.link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group/link inline-flex items-center gap-1 text-[1.05rem] font-[560] text-accent"
                    >
                      <span className="link-underline">{project.link.label}</span>
                      <ArrowUpRight
                        size={14}
                        weight="bold"
                        aria-hidden="true"
                        className="transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                      />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {lead && (
          <div className="mx-auto max-w-[1680px] px-5 md:px-10">
            <GalleryRow row={lead} index={0} reduce={reduce} />
          </div>
        )}

        <section aria-labelledby="realm-built" className="px-5 py-28 md:px-10 md:py-44">
          <div className="mx-auto grid max-w-[1680px] gap-10 lg:grid-cols-12 lg:gap-6">
            <h2 id="realm-built" className="type-heading lg:col-span-4">
              What I built
            </h2>
            <ul className="flex flex-col gap-9 md:gap-12 lg:col-span-8">
              {project.details.map((d) => (
                <li key={d} data-detail className="grid grid-cols-[2.25rem_1fr] items-baseline md:grid-cols-[3rem_1fr]">
                  <span data-detail-rule aria-hidden="true" className="h-px w-5 origin-left -translate-y-[0.35em] bg-accent md:w-7" />
                  <span data-detail-text className="realm-detail text-pretty">
                    {d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {rest.length > 0 && (
          <div className="mx-auto flex max-w-[1680px] flex-col gap-24 px-5 md:gap-40 md:px-10">
            {rest.map((row, i) => (
              <GalleryRow key={i} row={row} index={i + 1} reduce={reduce} />
            ))}
          </div>
        )}

        <section data-next aria-label="Next project" className="px-5 pb-6 pt-28 md:px-10 md:pb-10 md:pt-44">
          <div className="mx-auto max-w-[1680px]">
            <div className="flex items-center justify-between gap-6 border-t border-hairline pt-6">
              <p className="type-meta text-muted">Next project</p>
              <button type="button" onClick={close} className="type-meta link-underline rounded-full text-muted transition-colors hover:text-ink">
                All projects
              </button>
            </div>
            <a href={`/projects/${next.id}`} onClick={onNext} className="realm-next group mt-8 block rounded-[16px] md:mt-10">
              <span data-next-title className="realm-next-title block">
                {next.title}
              </span>
              <span className="mt-3 block max-w-[46ch] text-[1rem] leading-relaxed text-muted text-pretty md:mt-4">{next.summary}</span>
              <div
                data-cover-next={next.id}
                className="relative mt-8 aspect-[16/10] overflow-hidden rounded-[16px] bg-surface-1 md:mt-12 md:aspect-[21/9]"
              >
                <div data-next-cover-inner className="absolute inset-0">
                  <ProjectMedia
                    media={next.cover}
                    reduce={reduce}
                    className="h-full w-full object-cover object-top transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </div>
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
