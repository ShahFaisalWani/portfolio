import { lazy, Suspense, useRef } from "react";
import { ArrowDownRight } from "@phosphor-icons/react";
import KineticName from "./KineticName";
import { useContact } from "@/lib/contact";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { useFinePointer, useReducedMotionPref } from "@/lib/use-media";
import { trackEvent } from "@/lib/analytics";
import { person } from "@/content/site";

const PointCloud = lazy(() => import("./PointCloud"));

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotionPref();
  const fine = useFinePointer();
  const { openContact } = useContact();
  const { scrollTo } = useSmoothScroll();

  return (
    <section ref={ref} id="section_home" aria-label="Introduction" className="relative isolate min-h-[100dvh] overflow-hidden">
      <Suspense fallback={null}>
        <PointCloud triggerRef={ref} reduce={reduce} />
      </Suspense>

      <div className="relative z-[2] mx-auto grid min-h-[100dvh] max-w-[1680px] grid-rows-[1fr_auto] px-5 pb-6 pt-24 md:px-10 md:pb-9">
        <div className="hero-intro flex max-w-[30rem] flex-col items-start gap-6 self-start md:pt-6">
          <p className="type-meta text-muted">{person.role}</p>
          <p className="type-lead text-pretty text-ink">
            I build AI platforms, real-time services and full-stack products, and once taught a robot to find its
            own way.
          </p>
          <div className="flex flex-wrap gap-3">
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

        <KineticName reduce={reduce} interactive={fine} />
      </div>
    </section>
  );
}
