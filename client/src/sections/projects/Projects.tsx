import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { projects, socials, type Project } from "@/content/site";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useIsDesktop, useReducedMotionPref } from "@/lib/use-media";
import { useRealm } from "@/lib/realm";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import ProjectMedia from "./ProjectMedia";

/*
  Featured projects as a deck. At 1024px+ the deck pins, and each scroll step slides the next
  card up over the last one. Covered cards keep their tab (name, type, year) showing above the
  top card, so the deck doubles as an index of what you have passed: click a tab to go back.
  Only the top card's recording plays, and only it and the next one load ahead. A card opens
  its case study layer (lib/realm.tsx), morphing the cover into the case study hero. Earlier
  builds sit below as a plain pair.
  Below 1024px, or with reduced motion, the deck is a vertical list.
*/

const featured = projects.filter((p) => p.featured);
const earlier = projects.filter((p) => !p.featured);

/* scroll distance per deck step, as a share of the viewport height */
const STEP = 0.85;
/* timeline time each card rests on top before the next one starts to slide in */
const HOLD = 0.4;

function useOpenCase() {
  const { open } = useRealm();
  return (e: React.MouseEvent, p: Project) => {
    // let modified clicks open the case study in a new tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
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

function DeckCard({
  p,
  reduce,
  active,
  ahead,
  onOpen,
  onTab,
}: {
  p: Project;
  reduce: boolean;
  active: boolean;
  ahead: boolean;
  onOpen: (e: React.MouseEvent, p: Project) => void;
  onTab?: () => void;
}) {
  const live = p.links[0];
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[16px] bg-surface-1 shadow-[inset_0_0_0_1px_var(--hairline)]">
      {/*
        The tab: the only part of a card that shows once the next card covers it. It repeats the card's
        own title, so it is hidden from assistive tech, and clicking it is a pointer shortcut only:
        keyboard focus on a covered card scrolls the deck to it on its own.
      */}
      {onTab ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={onTab}
          className="type-meta group/tab hidden h-[var(--deck-tab)] w-full shrink-0 items-center gap-6 border-b border-hairline px-6 text-left text-muted transition-colors duration-300 hover:bg-surface-2 active:bg-surface-2 lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)_auto]"
        >
          <span className="truncate text-ink">{p.title}</span>
          <span className="truncate transition-colors duration-300 group-hover/tab:text-ink">{p.kicker}</span>
          <span>{p.year}</span>
        </button>
      ) : (
        <div
          aria-hidden="true"
          className="type-meta hidden h-[var(--deck-tab)] shrink-0 items-center gap-6 border-b border-hairline px-6 text-muted lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)_auto]"
        >
          <span className="truncate text-ink">{p.title}</span>
          <span className="truncate">{p.kicker}</span>
          <span>{p.year}</span>
        </div>
      )}

      <div className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
        <div data-card-copy className="flex flex-col justify-between gap-8 p-6 md:p-8 lg:col-span-5 xl:col-span-4 xl:p-10">
          <div>
            <p className="type-meta text-muted lg:hidden">
              {p.kicker}
              {p.year && `, ${p.year}`}
            </p>
            <h3 data-card-title className="deck-title mt-3 lg:mt-0">
              {p.title}
            </h3>
            <p className="mt-5 max-w-[40ch] text-[1.05rem] leading-relaxed text-muted text-pretty">{p.summary}</p>
          </div>
          {p.stats && (
            <dl className="grid max-w-[30rem] grid-cols-2 gap-6 border-t border-hairline pt-6">
              {p.stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse justify-end gap-2">
                  <dt className="text-[0.9rem] leading-snug text-muted text-pretty">{s.label}</dt>
                  <dd className="text-[clamp(1.9rem,2.6vw,2.75rem)] font-[620] leading-none tracking-[-0.04em] [font-stretch:110%]">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="flex flex-col items-start gap-6">
            <ul className="flex flex-wrap gap-2" aria-label="Stack">
              {p.stack.slice(0, 4).map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <CaseLink p={p} onOpen={onOpen} />
              {live && <OutLink href={live.href} label={live.label} />}
            </div>
          </div>
        </div>

        <a
          href={`/projects/${p.id}`}
          data-cover-card={p.id}
          tabIndex={-1}
          aria-hidden="true"
          onClick={(e) => onOpen(e, p)}
          className="group relative order-first block aspect-[16/10] overflow-hidden bg-surface-2 lg:order-none lg:col-span-7 lg:aspect-auto xl:col-span-8"
        >
          <div data-card-media className="absolute inset-0">
            <ProjectMedia
              media={p.cover}
              reduce={reduce}
              active={active}
              ahead={ahead}
              className="h-full w-full object-cover object-top transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            />
          </div>
        </a>

        {/* darkens a card as the next one slides over it */}
        <div data-card-shade aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-canvas opacity-0 lg:block" />
      </div>
    </div>
  );
}

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPref();
  const desktop = useIsDesktop();
  const stack = desktop && !reduce;
  const onOpen = useOpenCase();
  const { scrollTo } = useSmoothScroll();
  const [top, setTop] = useState(0);
  const jumps = useRef<((i: number) => void) | null>(null);

  useGSAP(
    () => {
      if (!stack) return;
      const deck = deckRef.current!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", deck);
      const tl = gsap.timeline({ defaults: { ease: "none" } });
      // timeline time at which each card has fully arrived on top
      const arrived = [0];
      tl.to({}, { duration: HOLD });
      cards.forEach((card, i) => {
        if (i === 0) return;
        const prev = cards[i - 1];
        const t = tl.duration();
        tl.fromTo(card, { y: () => innerHeight }, { y: 0, duration: 1 }, t)
          .fromTo(card.querySelector("[data-card-media]"), { scale: 1.18 }, { scale: 1, duration: 1 }, t)
          .fromTo(card.querySelector("[data-card-title]"), { fontStretch: "80%" }, { fontStretch: "112%", duration: 0.9, ease: "power2.out" }, t + 0.1)
          .to(prev.querySelector("[data-card-shade]"), { opacity: 0.6, duration: 1 }, t)
          .to(prev.querySelector("[data-card-media]"), { scale: 0.94, duration: 1 }, t);
        arrived.push(t + 1);
        tl.to({}, { duration: HOLD });
      });

      // only the card on top plays its recording: it counts as on top once it is more than half in
      tl.eventCallback("onUpdate", () => {
        const time = tl.time();
        let i = 0;
        while (i + 1 < arrived.length && time > arrived[i + 1] - 0.5) i++;
        setTop(i);
      });

      const st = ScrollTrigger.create({
        id: "projects-stack",
        trigger: deck,
        start: "top top",
        end: () => `+=${tl.duration() * innerHeight * STEP}`,
        pin: true,
        scrub: 0.6,
        // The deck only exists once the client knows the viewport, so on a prerendered page it is
        // created after the ScrollTriggers below it. Refresh it first (this also makes GSAP refresh
        // the rest in page order) so their starts include the pin's scroll distance.
        refreshPriority: 1,
        invalidateOnRefresh: true,
        animation: tl,
      });

      // revealCard (lib/realm.tsx) reads where each card sits on top, as scroll progress
      cards.forEach((card, i) => (card.dataset.stackAt = String(arrived[i] / tl.duration())));
      const at = (i: number) => st.start + (arrived[i] / tl.duration()) * (st.end - st.start);
      jumps.current = (i: number) => scrollTo(at(i) + 2);

      // Tabbing into a card that is covered, or not in yet, scrolls the deck so it is on top.
      // Keyboard focus only: a click lands on the top card anyway.
      const onFocus = (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        if (!target.matches(":focus-visible")) return;
        const i = cards.findIndex((c) => c.contains(target));
        if (i < 0) return;
        // wait a frame so the browser's own focus scrolling has settled first
        requestAnimationFrame(() => window.scrollTo({ top: at(i) + 2 }));
      };
      deck.addEventListener("focusin", onFocus);
      return () => {
        deck.removeEventListener("focusin", onFocus);
        cards.forEach((card) => delete card.dataset.stackAt);
        jumps.current = null;
        setTop(0);
      };
    },
    { scope: sectionRef, dependencies: [stack], revertOnUpdate: true },
  );

  return (
    <section ref={sectionRef} id="section_projects" aria-label="Projects" tabIndex={-1} className="relative py-24 outline-none md:py-36">
      <div className="mx-auto max-w-[1680px] px-5 md:px-10">
        <h2 className="type-title">Things I’ve built.</h2>
      </div>

      <div
        ref={deckRef}
        className={stack ? "mt-6 flex h-[100dvh] items-center [--deck-tab:2.75rem]" : "mx-auto mt-14 max-w-[1680px] px-5 md:px-10 [--deck-tab:2.75rem]"}
      >
        {/* capped on very tall screens, so the media column keeps close to the recordings' 16:10 */}
        <ol
          aria-label="Featured projects"
          className={stack ? "relative mx-auto h-full max-h-[60rem] w-full max-w-[1680px]" : "flex flex-col gap-6 md:gap-8"}
        >
          {featured.map((p, i) => (
            <li
              key={p.id}
              data-card
              className={stack ? "absolute inset-x-10 bottom-6" : ""}
              style={stack ? { top: `calc(5rem + ${i} * var(--deck-tab))`, zIndex: i } : undefined}
            >
              <DeckCard
                p={p}
                reduce={reduce}
                active={!stack || top === i}
                ahead={!stack || top >= i - 1}
                onOpen={onOpen}
                onTab={stack ? () => jumps.current?.(i) : undefined}
              />
            </li>
          ))}
        </ol>
      </div>

      {earlier.length > 0 && (
        <div className="mx-auto mt-24 max-w-[1680px] px-5 md:mt-36 md:px-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-t border-hairline pt-6">
            <h3 className="type-heading">Earlier builds</h3>
            <OutLink href={socials[1].href} label="More on GitHub" />
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-16 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
            {earlier.map((p) => (
              <li key={p.id} className="flex flex-col">
                <a
                  href={`/projects/${p.id}`}
                  data-cover-card={p.id}
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={(e) => onOpen(e, p)}
                  className="group relative block aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-surface-1"
                >
                  <ProjectMedia
                    media={p.cover}
                    reduce={reduce}
                    className="h-full w-full object-cover object-top transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
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
    </section>
  );
}
