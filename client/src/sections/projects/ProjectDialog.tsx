import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "@phosphor-icons/react";
import type { Project } from "@/content/site";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { useReducedMotionPref } from "@/lib/use-media";
import ProjectMedia from "./ProjectMedia";

/* Case study sheet. Native <dialog> gives focus trapping and Escape for free. */
export default function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const { lenis } = useSmoothScroll();
  const reduce = useReducedMotionPref();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (project && !d.open) {
      d.showModal();
      lenis()?.stop();
      stripRef.current?.scrollTo({ left: 0 });
    } else if (!project && d.open) d.close();
  }, [project, lenis]);

  const nudge = (dir: 1 | -1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: dir * strip.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="project-title"
      onClose={() => {
        lenis()?.start();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
    >
      {project && (
        <div className="pointer-events-none flex h-full w-full items-end p-2 sm:p-3">
          <div
            className="sheet-panel pointer-events-auto flex max-h-full w-full flex-col overflow-y-auto rounded-[16px] bg-surface-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:h-full"
            data-lenis-prevent
          >
            <div className="flex items-start justify-between gap-6 px-5 pt-6 sm:px-10 sm:pt-9">
              <div>
                <p className="type-meta text-muted">{project.kicker}</p>
                <h2 id="project-title" className="type-title mt-3">
                  {project.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close case study"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 transition-transform hover:rotate-90 active:scale-95"
              >
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <div className="relative mt-8">
              <div
                ref={stripRef}
                className="no-scrollbar flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 motion-safe:scroll-smooth sm:scroll-px-10 sm:px-10"
                tabIndex={0}
                role="region"
                aria-label={`${project.title} screenshots`}
              >
                {project.gallery.map((m, i) => (
                  <figure
                    key={i}
                    className={`relative shrink-0 snap-start overflow-hidden rounded-[16px] bg-canvas ${
                      m.kind === "image" && m.portrait ? "aspect-[9/19.5] h-[46vh] sm:h-[56vh]" : "aspect-[16/10] h-[46vh] sm:h-[56vh]"
                    }`}
                  >
                    <ProjectMedia media={m} reduce={reduce} className="h-full w-full object-cover object-top" />
                  </figure>
                ))}
                <div className="w-2 shrink-0 sm:w-6" aria-hidden="true" />
              </div>
              <div className="mt-4 flex gap-2 px-5 sm:px-10">
                <button type="button" className="btn btn-secondary size-11 p-0" onClick={() => nudge(-1)} aria-label="Previous screenshots">
                  <ArrowLeft size={16} weight="bold" aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-secondary size-11 p-0" onClick={() => nudge(1)} aria-label="Next screenshots">
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid gap-10 px-5 pb-10 pt-12 sm:px-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:pb-14">
              <div className="flex flex-col items-start gap-6">
                <p className="type-heading max-w-[24ch] text-pretty">{project.summary}</p>
                <ul className="flex flex-wrap gap-2" aria-label="Stack">
                  {project.stack.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
                {project.link && (
                  <a href={project.link.href} target="_blank" rel="noreferrer" className="btn btn-primary">
                    {project.link.label}
                    <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                  </a>
                )}
              </div>
              <ul className="flex flex-col gap-4">
                {project.details.map((d) => (
                  <li key={d} className="grid grid-cols-[1.25rem_1fr] text-[1.05rem] leading-relaxed text-muted">
                    <span aria-hidden="true" className="mt-[0.75em] h-px w-2.5 bg-accent" />
                    <span className="text-pretty">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
