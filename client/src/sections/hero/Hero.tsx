import { lazy, Suspense, useRef, type CSSProperties } from "react";
import { ArrowDownRight } from "@phosphor-icons/react";
import KineticName from "./KineticName";
import StaticPortrait from "./StaticPortrait";
import Scramble from "@/components/Scramble";
import { useContact } from "@/lib/contact";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { useFinePointer, useReducedMotionPref } from "@/lib/use-media";
import { gsap, useGSAP } from "@/lib/gsap";
import { trackEvent } from "@/lib/analytics";
import { person } from "@/content/site";

const HeroCanvas = lazy(() => import("./HeroCanvas"));

const LEAD = "I build speech AI, LLM evaluation and the full-stack products around them, and once taught a robot to find its own way.";

/*
  Layered hero. Back to front: the signal field, the dithered portrait (both in HeroCanvas),
  the copy, the name. Each layer leaves at its own speed when the page scrolls, so the hero
  comes apart in depth. The role line decodes, the lead comes into focus word by word.
*/
export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotionPref();
  const fine = useFinePointer();
  const { openContact } = useContact();
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      if (reduce) return;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
      });
      tl.to("[data-hero-copy]", { yPercent: -60, opacity: 0, duration: 0.6 }, 0)
        .to("[data-hero-name]", { yPercent: -22, duration: 1 }, 0)
        .to("[data-hero-name]", { opacity: 0.15, duration: 0.5 }, 0.5);
    },
    { scope: ref, dependencies: [reduce], revertOnUpdate: true },
  );

  const words = LEAD.split(" ");
  return (
    <section ref={ref} id="section_home" aria-label="Introduction" className="relative isolate min-h-[100dvh] overflow-hidden">
      {reduce ? (
        <StaticPortrait />
      ) : (
        <Suspense fallback={null}>
          <HeroCanvas sectionRef={ref} />
        </Suspense>
      )}

      <div className="pointer-events-none relative z-[2] mx-auto grid min-h-[100dvh] max-w-[1680px] grid-rows-[1fr_auto] px-5 pb-6 pt-24 md:px-10 md:pb-9">
        <div data-hero-copy className="flex max-w-[30rem] flex-col items-start gap-6 self-start md:pt-6">
          <p className="rise pointer-events-auto type-meta text-muted" style={{ "--d": "0.45s" } as CSSProperties}>
            <Scramble text={person.role} intro="mount" duration={1100} delay={520} />
          </p>
          <p className="pointer-events-auto type-lead text-pretty text-ink">
            {words.map((w, i) => (
              <span key={i}>
                <span className="blur-word" style={{ "--i": i } as CSSProperties}>
                  {w}
                </span>
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
          <div className="rise pointer-events-auto flex flex-wrap gap-3" style={{ "--d": "0.95s" } as CSSProperties}>
            <button type="button" className="btn btn-primary" onClick={openContact}>
              Get in touch
            </button>
            <a
              href="#section_projects"
              className="btn btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("#section_projects");
                trackEvent("Navigation", "Navigate to section", "section_projects");
              }}
            >
              See projects
              <ArrowDownRight size={16} weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div data-hero-name className="pointer-events-auto justify-self-start">
          <KineticName reduce={reduce} interactive={fine} />
        </div>
      </div>
    </section>
  );
}
