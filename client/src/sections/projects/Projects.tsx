import { useRef, useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { projects, socials, type Project } from "@/content/site";
import { gsap, useGSAP } from "@/lib/gsap";
import { useIsDesktop, useReducedMotionPref } from "@/lib/use-media";
import { trackEvent } from "@/lib/analytics";
import ProjectMedia from "./ProjectMedia";
import ProjectDialog from "./ProjectDialog";

/*
  Selected projects on a pinned horizontal track. While the section is pinned,
  vertical scroll pans the track, and each panel turns slightly toward the
  centre like screens on a curved wall, so the one in the middle reads as "current".
  Below 1024px, or with reduced motion, it becomes a plain vertical list.
*/

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPref();
  const desktop = useIsDesktop();
  const pan = desktop && !reduce;
  const [active, setActive] = useState<Project | null>(null);

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
          gsap.set(p, { rotateY: off * -16, z: -Math.abs(off) * 140, transformPerspective: 1800 });
          if (media[i]) gsap.set(media[i], { xPercent: off * -7 });
        });
      };

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: curve,
          onRefresh: curve,
        },
      });
      curve();

      // Tabbing to a panel that is off to the side scrolls the page so the track brings it into view.
      const onFocus = (e: FocusEvent) => {
        const panel = (e.target as HTMLElement).closest<HTMLElement>("[data-panel]");
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

  const open = (p: Project) => {
    setActive(p);
    trackEvent("Project", "Click on card", p.id);
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
              ? "mt-10 flex w-max items-start gap-[3.5vw] pl-10 pr-[12vw] [transform-style:preserve-3d] will-change-transform"
              : "mx-auto mt-14 grid max-w-[1680px] grid-cols-1 gap-x-6 gap-y-16 px-5 md:grid-cols-2 md:px-10"
          }
        >
          {projects.map((p, i) => (
            <article
              key={p.id}
              data-panel
              className={pan ? "w-[min(60vw,62rem,calc((100dvh-21rem)*1.6))] shrink-0 [backface-visibility:hidden]" : "w-full"}
            >
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => open(p)}
                className="group relative block aspect-[16/10] w-full overflow-hidden rounded-[16px] bg-surface-1"
              >
                <div data-parallax className="absolute inset-[-8%]">
                  <ProjectMedia
                    media={p.cover}
                    reduce={reduce}
                    eager={i === 0}
                    className="h-full w-full object-cover object-top transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </div>
                <span className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]" />
              </button>
              <div className="mt-5 grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
                <div>
                  <p className="type-meta text-muted">{p.kicker}</p>
                  <h3 className="type-heading mt-2">{p.title}</h3>
                  <p className="mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-muted text-pretty">{p.summary}</p>
                </div>
                <button type="button" className="btn btn-secondary justify-self-start" onClick={() => open(p)}>
                  Case study
                  <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                </button>
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

      <ProjectDialog project={active} onClose={() => setActive(null)} />
    </section>
  );
}
