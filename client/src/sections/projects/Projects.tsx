import { useRef } from "react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { projects, socials, type Project } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { useIsDesktop, useReducedMotionPref } from "@/lib/use-media";
import { useRealm } from "@/lib/realm";
import ProjectMedia from "./ProjectMedia";

/*
  Selected projects on a pinned horizontal track. While the section is pinned,
  vertical scroll pans the track, and each panel turns slightly toward the
  centre like screens on a curved wall, so the one in the middle reads as "current".
  The panels stay flat in their parent's plane (no preserve-3d), so clicks land.
  A card opens its case study layer (lib/realm.tsx), morphing the cover into the hero.
  Below 1024px, or with reduced motion, it becomes a plain vertical list.
*/

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPref();
  const desktop = useIsDesktop();
  const pan = desktop && !reduce;
  const { open } = useRealm();

  useGSAP(
    () => {
      if (!pan) return;
      const track = trackRef.current!;
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", track);
      const media = panels.map((p) => p.querySelector<HTMLElement>("[data-parallax]"));
      const distance = () => track.scrollWidth - window.innerWidth;

      const curve = () => {
        const mid = window.innerWidth / 2;
        panels.forEach((p, i) => {
          const r = p.getBoundingClientRect();
          const off = gsap.utils.clamp(-1.4, 1.4, (r.left + r.width / 2 - mid) / mid);
          gsap.set(p, { rotateY: off * -12, transformPerspective: 1800 });
          if (media[i]) gsap.set(media[i], { xPercent: off * -7 });
        });
      };

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        onUpdate: curve,
        scrollTrigger: {
          id: "projects-pan",
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onRefresh: curve,
        },
      });
      curve();

      // Tabbing to a panel that is off to the side scrolls the page so the track brings it into view.
      // Keyboard focus only: a mouse click already has the panel in view.
      const onFocus = (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        if (!target.matches(":focus-visible")) return;
        const panel = target.closest<HTMLElement>("[data-panel]");
        const st = tween.scrollTrigger;
        if (!panel || !st) return;
        const progress = gsap.utils.clamp(0, 1, (panel.offsetLeft - 40) / distance());
        // wait a frame so the browser's own focus scrolling has settled first
        requestAnimationFrame(() => window.scrollTo({ top: st.start + progress * (st.end - st.start) }));
      };
      track.addEventListener("focusin", onFocus);
      return () => track.removeEventListener("focusin", onFocus);
    },
    { scope: sectionRef, dependencies: [pan], revertOnUpdate: true },
  );

  const onCard = (e: React.MouseEvent, p: Project) => {
    // let modified clicks open the case study in a new tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    open(p.id);
  };

  return (
    <section ref={sectionRef} id="section_projects" aria-label="Projects" tabIndex={-1} className="relative outline-none">
      <div className={pan ? "flex h-[100dvh] flex-col justify-center overflow-clip" : "py-24 md:py-36"}>
        <div className="mx-auto w-full max-w-[1680px] px-5 md:px-10">
          <h2 className="type-title">Things I’ve built.</h2>
        </div>

        <div
          ref={trackRef}
          className={
            pan
              ? "mt-10 flex w-max items-start gap-[3.5vw] pl-10 pr-[12vw] will-change-transform"
              : "mx-auto mt-14 grid max-w-[1680px] grid-cols-1 gap-x-6 gap-y-16 px-5 md:grid-cols-2 md:px-10"
          }
        >
          {projects.map((p) => (
            <article
              key={p.id}
              data-panel
              className={pan ? "w-[min(60vw,62rem,calc((100dvh-21rem)*1.6))] shrink-0 [backface-visibility:hidden]" : "w-full"}
            >
              <a
                href={`/projects/${p.id}`}
                data-cover-card={p.id}
                tabIndex={-1}
                aria-hidden="true"
                onClick={(e) => onCard(e, p)}
                className="group relative block aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-surface-1"
              >
                <div data-parallax className="absolute inset-[-8%]">
                  <ProjectMedia
                    media={p.cover}
                    reduce={reduce}
                    className="h-full w-full object-cover object-top transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </div>
                <span className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]" />
              </a>
              <div className="mt-5 grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
                <div>
                  <p className="type-meta text-muted">{p.kicker}</p>
                  <h3 className="type-heading mt-2">{p.title}</h3>
                  <p className="mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-muted text-pretty">{p.summary}</p>
                </div>
                <a
                  href={`/projects/${p.id}`}
                  data-card-link={p.id}
                  className="btn btn-secondary group/cta justify-self-start"
                  aria-label={`${p.title} case study`}
                  onClick={(e) => onCard(e, p)}
                >
                  Case study
                  <ArrowRight
                    size={16}
                    weight="bold"
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover/cta:translate-x-0.5"
                  />
                </a>
              </div>
            </article>
          ))}

          <aside
            data-panel
            className={
              pan
                ? "flex aspect-[16/10] w-[min(34vw,32rem,calc((100dvh-21rem)*1.6))] shrink-0 flex-col justify-between rounded-[16px] bg-surface-1 p-10"
                : "flex flex-col items-start justify-between gap-8 rounded-[16px] bg-surface-1 p-8 md:aspect-[16/10] md:p-10"
            }
          >
            <p className="type-heading max-w-[16ch]">Smaller experiments and source code live on GitHub.</p>
            <a href={socials[1].href} target="_blank" rel="noreferrer" className="btn btn-primary self-start">
              Open GitHub
              <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
