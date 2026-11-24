import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { projects, socials, type Project } from "@/content/site";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useIsDesktop, useReducedMotionPref } from "@/lib/use-media";
import { coverStage, useRealm } from "@/lib/realm";
import { drawable, drawMosaic, easeIn, easeOut, loadImage, parsePos, shuffleOrder, sizeCanvas, type Drawable } from "@/lib/mosaic";
import { scramble } from "@/lib/scramble";
import ProjectMedia from "./ProjectMedia";
import FlutedGlass from "@/components/FlutedGlass";
import BlurTitle from "@/components/BlurTitle";
import PixelResolve from "@/components/PixelResolve";

/*
  Featured projects as an index beside a screen. At 1024px+ the titles run down the left and a
  screen holds still on the right: whichever project sits across the middle of the viewport
  (or under the pointer, or holds focus) is lit, and the screen breaks the cover it shows into
  pixels of itself, live video frames included, then resolves the next one out of them. The
  same move as the page transition between case studies, on one screen. Clicking the screen or
  "Case study" opens the case study layer (lib/realm.tsx), morphing the screen into its hero.
  Below 1024px, or with reduced motion, it is a list whose covers resolve as they scroll in.
  Earlier builds sit below, three across, with ribbed glass that clears under the pointer.
*/

const featured = projects.filter((p) => p.featured);
const earlier = projects.filter((p) => !p.featured);
const posterOf = (p: Project) => (p.cover.kind === "video" ? p.cover.poster : p.cover.src);
const focusOf = (p: Project) => p.cover.focus ?? "50% 0%";

const modified = (e: React.MouseEvent) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

function useOpenCase() {
  const { open } = useRealm();
  return (e: React.MouseEvent, p: Project) => {
    // let modified clicks open the case study in a new tab
    if (modified(e)) return;
    e.preventDefault();
    open(p.id);
  };
}

function CaseLink({ p, onOpen }: { p: Project; onOpen: (e: React.MouseEvent, p: Project) => void }) {
  return (
    <a
      href={`/projects/${p.id}`}
      data-card-link={p.id}
      className="btn btn-secondary group/cta"
      aria-label={`${p.title} case study`}
      onClick={(e) => onOpen(e, p)}
    >
      Case study
      <ArrowRight size={16} weight="bold" aria-hidden="true" className="transition-transform duration-300 group-hover/cta:translate-x-0.5" />
    </a>
  );
}

function OutLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="group/link inline-flex items-center gap-1 text-[0.95rem] font-[560] text-accent">
      <span className="link-underline">{label}</span>
      <ArrowUpRight
        size={14}
        weight="bold"
        aria-hidden="true"
        className="transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
      />
    </a>
  );
}

/* What every featured project says, in the index and in the list alike. */
function Entry({ p, on = true, onOpen }: { p: Project; on?: boolean; onOpen: (e: React.MouseEvent, p: Project) => void }) {
  const live = p.links[0];
  return (
    <>
      <p className="type-meta flex justify-between gap-6 text-muted">
        <span>{p.kicker}</span>
        {p.year && <span>{p.year}</span>}
      </p>
      <h3 data-on={on ? "" : undefined} className="index-title mt-4">
        {p.title}
      </h3>
      <p className="mt-5 max-w-[42ch] text-[1.05rem] leading-relaxed text-muted text-pretty">{p.summary}</p>
      {p.stats && (
        <dl className="mt-8 grid max-w-[30rem] grid-cols-2 gap-6">
          {p.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse justify-end gap-2 border-t border-hairline pt-4">
              <dt className="text-[0.9rem] leading-snug text-muted text-pretty">{s.label}</dt>
              <dd className="text-[clamp(1.75rem,2.3vw,2.5rem)] font-[620] leading-none tracking-[-0.04em] [font-stretch:110%]">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <ul className="mt-8 flex flex-wrap gap-2" aria-label="Stack">
        {p.stack.slice(0, 4).map((s) => (
          <li key={s} className="chip">
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <CaseLink p={p} onOpen={onOpen} />
        {live && <OutLink href={live.href} label={live.label} />}
      </div>
    </>
  );
}

type ScreenApi = { go: (i: number) => void; snap: (i: number) => void };

/*
  The screen's pixel swap, drawn on a canvas over the covers. out: the cover on screen breaks
  into ever bigger squares of itself; then the covers swap underneath; in: the next cover
  resolves out of squares, with a few accent sparks as they land, and the canvas fades into
  the real video. A new target mid-resolve breaks the picture up again from where it is.
  Before the screen is first seen it holds the first cover as squares and resolves on arrival.
*/
function usePixelScreen(setShown: (i: number) => void) {
  const screen = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<ScreenApi | null>(null);

  useEffect(() => {
    const el = screen.current!;
    const c = canvas.current!;
    const posters: (HTMLImageElement | null)[] = featured.map(() => null);
    featured.forEach((p, i) => loadImage(posterOf(p)).then((img) => (posters[i] = img)));
    const OUT = 300;
    const IN = 620;
    let displayed = 0;
    let target = 0;
    let phase: "hold" | "idle" | "out" | "in" = "hold";
    let from = 1;
    let block = 1;
    let t0 = 0;
    let raf = 0;
    let sparks = new Float32Array(0);
    const coarse = () => Math.max(24, c.clientWidth / 16);

    // the live video when it has a frame, else its poster (already decoded)
    const source = (i: number): Drawable | null => {
      const layer = el.querySelector(`[data-cover-card="${featured[i].id}"]`);
      const media = layer?.querySelector<HTMLVideoElement | HTMLImageElement>("video, img");
      if (drawable(media)) return media;
      return drawable(posters[i]) ? posters[i] : null;
    };
    const paint = (i: number, b: number, spark = 0) => {
      block = b;
      const { ctx, w, h } = sizeCanvas(c);
      ctx.clearRect(0, 0, w, h);
      const src = source(i);
      if (!src) return;
      drawMosaic(ctx, src, { x: 0, y: 0, w, h }, b, { pos: parsePos(focusOf(featured[i])) });
      if (spark <= 0) return;
      const g = coarse();
      const cols = Math.ceil(w / g);
      ctx.globalAlpha = spark;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent");
      sparks.forEach((r, k) => r < 0.07 && ctx.fillRect((k % cols) * g + 1, Math.floor(k / cols) * g + 1, g - 2, g - 2));
      ctx.globalAlpha = 1;
    };
    const show = (v: boolean) => (c.style.opacity = v ? "1" : "0");

    const loop = (now: number) => {
      raf = 0;
      if (phase === "out") {
        const t = Math.min(1, (now - t0) / OUT);
        paint(displayed, from + (coarse() - from) * easeIn(t));
        if (t < 1) return void (raf = requestAnimationFrame(loop));
        displayed = target;
        setShown(displayed);
        phase = "in";
        t0 = now;
        from = coarse();
        sparks = shuffleOrder(Math.ceil(c.clientWidth / from) * Math.ceil(c.clientHeight / from));
      }
      if (phase === "in") {
        const t = Math.min(1, (now - t0) / IN);
        paint(displayed, from + (1 - from) * easeOut(t), t < 0.35 ? 1 - t / 0.35 : 0);
        c.style.opacity = t > 0.8 ? String((1 - t) / 0.2) : "1";
        if (t < 1) return void (raf = requestAnimationFrame(loop));
        phase = "idle";
        show(false);
        if (target !== displayed) start("out", 1);
      }
    };
    const start = (p: "out" | "in", b: number) => {
      phase = p;
      from = b;
      t0 = performance.now();
      show(true);
      if (!raf) raf = requestAnimationFrame(loop);
    };

    // first sight: the first cover waits as squares, then resolves
    const hold = () => phase === "hold" && paint(displayed, coarse());
    loadImage(posterOf(featured[0])).then(hold);
    show(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || phase !== "hold") return;
        io.disconnect();
        start("in", coarse());
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    api.current = {
      go(i) {
        target = i;
        if (phase === "hold") {
          displayed = i;
          setShown(i);
          loadImage(posterOf(featured[i])).then(hold);
        } else if (phase === "idle" && i !== displayed) start("out", 1);
        // mid-resolve: break the picture up again from the squares it is at now
        else if (phase === "in" && i !== displayed) start("out", block);
      },
      snap(i) {
        cancelAnimationFrame(raf);
        raf = 0;
        io.disconnect();
        phase = "idle";
        displayed = target = i;
        show(false);
        flushSync(() => setShown(i));
      },
    };
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      api.current = null;
    };
  }, [setShown]);

  return { screen, canvas, api };
}

function Index({ onOpen }: { onOpen: (e: React.MouseEvent, p: Project) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const { screen: screenRef, canvas: canvasRef, api: screen } = usePixelScreen(setShown);
  const intent = useRef(0);

  useEffect(() => screen.current?.go(active), [active, screen]);

  // the caption decodes to the name of each cover as it lands
  const captioned = useRef(shown);
  useEffect(() => {
    if (captioned.current === shown || !captionRef.current) return;
    captioned.current = shown;
    return scramble(captionRef.current, 650);
  }, [shown]);

  // the row across the middle of the viewport is the one on screen
  useGSAP(
    () => {
      rootRef.current!.querySelectorAll<HTMLElement>("[data-project-row]").forEach((row, i) =>
        ScrollTrigger.create({ trigger: row, start: "top 50%", end: "bottom 50%", onToggle: (st) => st.isActive && setActive(i) }),
      );
    },
    { scope: rootRef },
  );

  // a case study closing over this page asks for its cover: scroll its row to the middle and show it at once
  useEffect(() => {
    coverStage.reveal = (id, scrollWindow) => {
      const i = featured.findIndex((p) => p.id === id);
      const row = rootRef.current?.querySelector<HTMLElement>(`[data-project-row="${id}"]`);
      if (i < 0 || !row) return false;
      const r = row.getBoundingClientRect();
      scrollWindow(scrollY + r.top + r.height / 2 - innerHeight / 2);
      ScrollTrigger.update();
      flushSync(() => setActive(i));
      screen.current?.snap(i);
      return true;
    };
    return () => {
      coverStage.reveal = null;
    };
  }, [screen]);

  // opening from a row that is not lit yet: put its cover on screen first, so the morph starts from it
  const openHere = (e: React.MouseEvent, p: Project) => {
    const i = featured.indexOf(p);
    if (i !== shown && !modified(e)) {
      flushSync(() => setActive(i));
      screen.current?.snap(i);
    }
    onOpen(e, p);
  };

  const hover = (i: number) => {
    clearTimeout(intent.current);
    intent.current = window.setTimeout(() => setActive(i), 90);
  };

  return (
    <div ref={rootRef} className="mt-10 grid grid-cols-12 gap-x-10 xl:gap-x-16">
      <ol aria-label="Featured projects" className="col-span-5 border-b border-hairline">
        {featured.map((p, i) => {
          const on = i === active;
          return (
            <li
              key={p.id}
              data-project-row={p.id}
              onPointerEnter={(e) => e.pointerType === "mouse" && hover(i)}
              onPointerLeave={() => clearTimeout(intent.current)}
              onFocus={() => setActive(i)}
              className="relative min-h-[66dvh] border-t border-hairline pb-24 pt-12"
            >
              {/* the signal line runs along the top of the lit row */}
              <span
                aria-hidden="true"
                className={`absolute -top-px left-0 h-px w-full origin-left bg-accent transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? "scale-x-100" : "scale-x-0"}`}
              />
              <div className={`transition-opacity duration-500 ${on ? "opacity-100" : "opacity-40"}`}>
                <Entry p={p} on={on} onOpen={openHere} />
              </div>
            </li>
          );
        })}
      </ol>

      <div className="col-span-7">
        <div className="sticky top-0 flex h-[100dvh] flex-col justify-center py-20">
          <div ref={screenRef} className="spot relative aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-surface-1">
            {featured.map((p, i) => (
              <a
                key={p.id}
                href={`/projects/${p.id}`}
                data-cover-card={p.id}
                data-cursor="Open"
                tabIndex={-1}
                aria-hidden="true"
                onClick={(e) => openHere(e, p)}
                className={`absolute inset-0 block ${i === shown ? "" : "invisible"}`}
              >
                <ProjectMedia
                  media={p.cover}
                  active={i === shown}
                  ahead={Math.abs(i - active) <= 1}
                  className="h-full w-full object-cover object-top"
                />
              </a>
            ))}
            <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full bg-surface-1" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]" />
          </div>
          <div aria-hidden="true" className="mt-5 flex items-center justify-between gap-6">
            <p className="type-meta truncate text-muted">
              <span ref={captionRef} className="text-ink">
                {featured[shown].title}
              </span>
              <span>, {featured[shown].kicker}</span>
            </p>
            <span className="flex shrink-0 gap-1.5">
              {featured.map((p, i) => (
                <span
                  key={p.id}
                  className={`h-[3px] w-7 rounded-full transition-colors duration-500 ${i === active ? "bg-accent" : "bg-hairline"}`}
                />
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function List({ reduce, onOpen }: { reduce: boolean; onOpen: (e: React.MouseEvent, p: Project) => void }) {
  return (
    <ol aria-label="Featured projects" className="mt-14 flex flex-col gap-20 md:mt-20 md:gap-28">
      {featured.map((p) => (
        <li key={p.id} className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-10">
          <a
            href={`/projects/${p.id}`}
            data-cover-card={p.id}
            data-cursor="Open"
            tabIndex={-1}
            aria-hidden="true"
            onClick={(e) => onOpen(e, p)}
            className="relative block aspect-[16/10] overflow-hidden rounded-[16px] bg-surface-1 md:col-span-7"
          >
            <ProjectMedia media={p.cover} reduce={reduce} className="h-full w-full object-cover object-top" />
            <PixelResolve src={posterOf(p)} blocks={12} pos={focusOf(p)} className="bg-surface-1" />
          </a>
          <div className="md:col-span-5">
            <Entry p={p} onOpen={onOpen} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Projects() {
  const reduce = useReducedMotionPref();
  const desktop = useIsDesktop();
  const indexed = desktop && !reduce;
  const onOpen = useOpenCase();

  return (
    <section id="section_projects" aria-label="Projects" tabIndex={-1} className="relative py-24 outline-none md:py-36">
      <div className="mx-auto max-w-[1680px] px-5 md:px-10">
        <BlurTitle className="type-title">Things I’ve built.</BlurTitle>

        {indexed ? <Index onOpen={onOpen} /> : <List reduce={reduce} onOpen={onOpen} />}

        {earlier.length > 0 && (
          <div className="mt-24 md:mt-36">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-t border-hairline pt-6">
              <h3 className="type-heading">Earlier builds</h3>
              <OutLink href={socials[1].href} label="More on GitHub" />
            </div>
            <ul data-spot-group className="mt-10 grid grid-cols-1 gap-x-6 gap-y-16 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
              {earlier.map((p) => (
                <li key={p.id} className="flute-host flex flex-col">
                  <a
                    href={`/projects/${p.id}`}
                    data-cover-card={p.id}
                    data-cursor="Open"
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={(e) => onOpen(e, p)}
                    className="spot group relative block aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-surface-1"
                  >
                    <ProjectMedia
                      media={p.cover}
                      reduce={reduce}
                      className="h-full w-full object-cover object-top transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                    {!reduce && <FlutedGlass media={p.cover} ribs={18} hover />}
                    <span className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]" />
                  </a>
                  {/* three across from lg: the link drops under the summary, level along the row */}
                  <div className="mt-5 grid flex-1 grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8 lg:grid-cols-1 lg:grid-rows-[1fr_auto] lg:gap-6">
                    <div>
                      <p className="type-meta text-muted">{p.kicker}</p>
                      <h4 className="type-heading mt-2">{p.title}</h4>
                      <p className="mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-muted text-pretty">{p.summary}</p>
                    </div>
                    <div className="justify-self-start">
                      <CaseLink p={p} onOpen={onOpen} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
