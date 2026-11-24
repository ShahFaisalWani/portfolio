import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { ArrowUp, ArrowUpRight, Check, Copy } from "@phosphor-icons/react";
import { person, socials } from "@/content/site";
import { useContact } from "@/lib/contact";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { useFinePointer, useReducedMotionPref } from "@/lib/use-media";
import { useWidthLens } from "@/lib/use-width-lens";
import BlurTitle from "@/components/BlurTitle";
import Scramble from "@/components/Scramble";
import MeshGradient from "./MeshGradient";

/*
  Closing poster: one contact action, the links, and the name cropped by the page edge. A mesh
  gradient gathers at the bottom and the wordmark fades down into it; the wordmark answers
  the pointer on its width axis like the name in the hero.
*/

function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 16, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 200, damping: 16, mass: 0.5 });
  const active = fine && !reduce;

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      style={active ? { x: sx, y: sy } : undefined}
      onPointerMove={(e) => {
        if (!active) return;
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.35);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.45);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="btn btn-primary h-16 px-9 text-[1.1rem] md:h-[4.5rem] md:px-11 md:text-[1.2rem]"
    >
      {children}
    </motion.button>
  );
}

/* The page is prerendered at build time: hydrate with the build year, then show the visitor's year. */
const noop = () => () => {};
const useYear = () => useSyncExternalStore(noop, () => new Date().getFullYear(), () => __BUILD_YEAR__);

function Wordmark() {
  const ref = useRef<HTMLParagraphElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  useWidthLens(ref, {
    enabled: fine && !reduce,
    base: { stretch: 112, weight: 640 },
    lens: { stretch: [84, 125], weight: [420, 860] },
    reach: [1.1, 1.2],
  });
  let n = 0;
  return (
    <p
      ref={ref}
      aria-hidden="true"
      className="type-display wordmark-fade -mb-[0.2em] mt-4 select-none whitespace-nowrap text-center text-[17.2vw] leading-[0.78] text-ink"
    >
      {"faisal wani".split("").map((ch) => (
        <span key={n} data-char={n++} className="inline-block" style={{ fontStretch: "112%", fontWeight: 640 }}>
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </p>
  );
}

export default function Footer() {
  const year = useYear();
  const reduce = useReducedMotionPref();
  const { openContact } = useContact();
  const { scrollTo } = useSmoothScroll();
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");

  useEffect(() => {
    if (copied === "idle") return;
    const id = setTimeout(() => setCopied("idle"), 2400);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  };

  const links = [{ label: "Email", href: `mailto:${person.email}` }, ...socials];

  return (
    <footer id="section_contact" className="relative isolate overflow-hidden px-5 pt-28 md:px-10 md:pt-44">
      <MeshGradient reduce={reduce} />
      <div className="mx-auto max-w-[1680px]">
        <BlurTitle className="type-display max-w-[12ch] text-[clamp(3.2rem,9.5vw,10rem)] leading-[0.86]">Let’s build something.</BlurTitle>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4 md:mt-16">
          <MagneticButton onClick={openContact}>Get in touch</MagneticButton>
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${person.email}`}
            className="group inline-flex items-center gap-2.5 rounded-full px-2 py-2 text-[1.05rem] font-[540] text-muted transition-colors hover:text-ink"
          >
            <Scramble text={person.email} hover duration={700} className="break-all" />
            <span className="grid size-8 place-items-center rounded-full bg-surface-1 transition-colors group-hover:bg-surface-2">
              {copied === "done" ? <Check size={14} weight="bold" aria-hidden="true" /> : <Copy size={14} weight="bold" aria-hidden="true" />}
            </span>
          </button>
          <span aria-live="polite" className="type-meta text-muted">
            {copied === "done" ? "Copied" : copied === "failed" ? "Couldn’t copy. Select it instead." : ""}
          </span>
        </div>

        <ul data-spot-group className="mt-24 grid grid-cols-2 border-t border-hairline md:mt-32 md:grid-cols-4">
          {links.map((l, i) => (
            <li key={l.label} className={`spot spot-cell border-b border-hairline ${i % 2 === 1 ? "border-l" : ""} ${i > 0 ? "md:border-l" : ""}`}>
              <a
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                className="group flex items-center justify-between px-1 py-6 text-[1.05rem] font-[560] transition-colors duration-300 hover:bg-surface-1 md:px-6 md:py-8 md:text-[1.15rem]"
              >
                {l.label}
                <ArrowUpRight
                  size={18}
                  weight="bold"
                  aria-hidden="true"
                  className="text-muted transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent"
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="type-meta flex items-center justify-between py-6 text-ink">
          <span>© {year} {person.name}</span>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="group inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:text-ink"
          >
            Back to top
            <ArrowUp size={13} weight="bold" aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      <Wordmark />
    </footer>
  );
}
