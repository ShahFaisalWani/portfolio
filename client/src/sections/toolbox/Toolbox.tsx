import { useEffect, useRef, useState } from "react";
import { toolbox } from "@/content/site";
import { useFinePointer, useReducedMotionPref } from "@/lib/use-media";
import type { PhysicsHandle } from "./physics";

/*
  The stack as a pile of pills that drop into a tray when it scrolls into view.
  Drag and throw them with a mouse; tap (or press Enter) to flick one.
  Reduced motion gets the same pills as a still, wrapped list.
*/

export default function Toolbox() {
  const trayRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPref();
  const fine = useFinePointer();
  const [phase, setPhase] = useState<"waiting" | "live" | "failed">("waiting");
  const mode = reduce || phase === "failed" ? "static" : phase;

  useEffect(() => {
    if (reduce) return;
    const tray = trayRef.current!;
    let handle: PhysicsHandle | null = null;
    let cancelled = false;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (handle) handle.resume();
          else if (entry.intersectionRatio > 0.3) {
            import("./physics")
              .then(({ startPhysics }) => {
                if (cancelled || handle) return;
                const items = Array.from(tray.querySelectorAll<HTMLElement>("[data-pill]"));
                handle = startPhysics(tray, items, { draggable: fine });
                setPhase("live");
              })
              .catch(() => setPhase("failed"));
          }
        } else handle?.pause();
      },
      { threshold: [0, 0.3, 0.6] },
    );
    io.observe(tray);
    return () => {
      cancelled = true;
      io.disconnect();
      handle?.destroy();
      setPhase((p) => (p === "live" ? "waiting" : p));
    };
  }, [reduce, fine]);

  return (
    <section id="section_stack" aria-label="Tech stack" className="relative px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1680px]">
        <h2 className="type-title">What I build with.</h2>
        <p id="toolbox-hint" className="type-lead mt-6 max-w-[38ch] text-muted">
          {mode === "static"
            ? "The languages, frameworks and infrastructure I use most."
            : fine
              ? "The languages, frameworks and infrastructure I use most. Pick one up and throw it."
              : "The languages, frameworks and infrastructure I use most. Tap one to toss it."}
          {mode === "live" && <span className="sr-only"> With a keyboard, press Enter on one to toss it.</span>}
        </p>

        <div
          ref={trayRef}
          className={`relative mt-12 overflow-hidden rounded-[16px] bg-surface-1 md:mt-16 ${
            mode === "static"
              ? "p-6 md:p-10"
              : `h-[480px] md:h-[420px] ${fine ? "cursor-grab data-[dragging=true]:cursor-grabbing" : ""}`
          }`}
        >
          <ul
            aria-describedby="toolbox-hint"
            className={mode === "static" ? "flex flex-wrap gap-2.5 md:gap-3" : "contents"}
          >
            {toolbox.map((t) => {
              const cls = `select-none whitespace-nowrap rounded-full font-[580] tracking-[-0.015em] [font-stretch:110%] transition-[background-color,color,box-shadow,opacity] duration-300 data-[drag=true]:bg-accent data-[drag=true]:text-canvas ${
                t.core
                  ? "inline-flex items-center h-16 bg-primary px-7 text-[1.35rem] text-on-primary md:h-[4.5rem] md:px-8 md:text-[1.6rem]"
                  : "inline-flex items-center h-12 bg-canvas px-5 text-[1.05rem] text-ink shadow-[inset_0_0_0_1px_var(--hairline)] md:h-14 md:px-6 md:text-[1.2rem]"
              }`;
              return (
                <li key={t.name} className={mode === "static" ? "" : "contents"}>
                  {mode === "static" ? (
                    <span className={cls}>{t.name}</span>
                  ) : (
                    <button
                      type="button"
                      data-pill
                      tabIndex={mode === "live" ? 0 : -1}
                      className={`${cls} ${mode === "waiting" ? "opacity-0" : "opacity-100 will-change-transform"}`}
                    >
                      {t.name}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
