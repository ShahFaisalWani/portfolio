import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { ArrowUpRight, Plus } from "@phosphor-icons/react";
import { experiences } from "@/content/site";
import { useFinePointer, useReducedMotionPref } from "@/lib/use-media";

/*
  Experience as an index. Hovering a row floats that company's logo next to
  the cursor (desktop only) and dims the other rows, so the eye stays on one
  entry. Clicking a row opens its details in place.
*/

const ease = [0.16, 1, 0.3, 1] as const;

export default function Work() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotionPref();
  const fine = useFinePointer();
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(experiences[0].id);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });

  const onMove = (e: React.PointerEvent) => {
    const r = sectionRef.current!.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  };

  return (
    <section
      ref={sectionRef}
      id="section_work"
      tabIndex={-1}
      aria-label="Work experience"
      className="relative px-5 py-24 outline-none md:px-10 md:py-36"
      onPointerMove={fine ? onMove : undefined}
    >
      <div className="mx-auto max-w-[1680px]">
        <h2 className="type-title">Where I’ve worked.</h2>

        <ul className="mt-14 border-t border-hairline md:mt-20" onPointerLeave={() => setHovered(null)}>
          {experiences.map((exp, i) => {
            const isOpen = open === exp.id;
            const dim = hovered !== null && hovered !== i && !isOpen;
            return (
              <li
                key={exp.id}
                className={`border-b border-hairline transition-opacity duration-500 ${dim ? "opacity-40" : "opacity-100"}`}
                onPointerEnter={() => setHovered(i)}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? `work-${exp.id}` : undefined}
                    onClick={() => setOpen(isOpen ? null : exp.id)}
                    className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-6 text-left md:grid-cols-[9rem_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:py-8"
                  >
                    <span className="type-meta order-3 col-span-2 text-muted md:order-none md:col-span-1">
                      {exp.period}
                    </span>
                    <span className="text-[clamp(1.6rem,3.2vw,3rem)] font-[600] leading-none tracking-[-0.035em] [font-stretch:112%] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                      {exp.company}
                    </span>
                    <span className="order-4 col-span-2 text-[1rem] text-muted md:order-none md:col-span-1 md:text-[1.05rem]">
                      {exp.role}
                    </span>
                    <span
                      className={`grid size-10 place-items-center rounded-full shadow-[inset_0_0_0_1px_var(--hairline)] transition-[transform,background-color] duration-500 group-hover:bg-surface-1 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <Plus size={16} weight="bold" />
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`work-${exp.id}`}
                      initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.6, ease }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-8 pb-10 md:grid-cols-[9rem_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:gap-x-6 md:pb-14">
                        <div className="hidden md:block" />
                        <div className="flex flex-col items-start gap-6">
                          <p className="type-lead max-w-[34ch] text-pretty">{exp.summary}</p>
                          <ul className="flex flex-wrap gap-2" aria-label="Stack">
                            {exp.stack.map((s) => (
                              <li key={s} className="chip">
                                {s}
                              </li>
                            ))}
                          </ul>
                          {exp.href && (
                            <a
                              href={exp.href}
                              target="_blank"
                              rel="noreferrer"
                              className="group/link inline-flex items-center gap-1 text-[0.95rem] font-[560] text-accent"
                            >
                              <span className="link-underline">Visit {exp.company}</span>
                              <ArrowUpRight size={14} weight="bold" aria-hidden="true" className="transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                            </a>
                          )}
                        </div>
                        <ul className="flex flex-col gap-4 md:col-span-2">
                          {exp.highlights.map((h) => (
                            <li key={h} className="grid grid-cols-[1.25rem_1fr] text-[1rem] leading-relaxed text-muted">
                              <span aria-hidden="true" className="mt-[0.7em] h-px w-2.5 bg-accent" />
                              <span className="text-pretty">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>

      {fine && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-30 hidden lg:block"
          style={{ x: sx, y: sy }}
        >
          <AnimatePresence>
            {hovered !== null && (
              <motion.div
                key={experiences[hovered].id}
                initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 6 }}
                transition={{ duration: reduce ? 0 : 0.45, ease }}
                className="absolute -top-20 left-8 grid h-40 w-56 place-items-center overflow-hidden rounded-[16px] bg-logo-ground shadow-[0_24px_60px_rgb(0_0_0/0.45)]"
              >
                <img src={experiences[hovered].logo} alt="" className="max-h-[78%] max-w-[78%] object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
