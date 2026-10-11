import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { List, X } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";
import { useContact } from "@/lib/contact";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { trackEvent } from "@/lib/analytics";

const LINKS = [
  { id: "section_about", label: "About" },
  { id: "section_work", label: "Work" },
  { id: "section_projects", label: "Projects" },
];

export default function Nav() {
  const { scrollY } = useScroll();
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { openContact } = useContact();
  const { scrollTo, lenis } = useSmoothScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev && y > 480 && !menuOpen);
  });

  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const l = lenis();
    l?.stop();
    // keep focus inside the menu: everything behind it becomes inert
    const behind = [document.getElementById("main"), document.getElementById("section_contact")];
    behind.forEach((el) => el?.setAttribute("inert", ""));
    const toggle = toggleRef.current;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => document.querySelector<HTMLElement>("#mobile-menu a")?.focus());
    return () => {
      l?.start();
      behind.forEach((el) => el?.removeAttribute("inert"));
      window.removeEventListener("keydown", onKey);
      toggle?.focus({ preventScroll: true });
    };
  }, [menuOpen, lenis]);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuOpen(false);
    scrollTo(`#${id}`);
    history.replaceState(null, "", `#${id}`);
    document.getElementById(id)?.focus({ preventScroll: true });
    trackEvent("Navigation", "Navigate to section", id);
  };

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-40"
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={`transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
            scrolled
              ? "bg-canvas/75 shadow-[inset_0_-1px_0_var(--hairline)] backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-5 md:px-10">
            <a
              href="/"
              className="group flex items-center gap-2.5 rounded-full"
              onClick={(e) => {
                e.preventDefault();
                scrollTo(0);
              }}
            >
              <img src="/logo.svg" alt="" width={28} height={27} className="h-7 w-auto transition-transform duration-500 group-hover:rotate-[-12deg]" />
              <span className="text-[0.95rem] font-[620] tracking-[-0.02em] [font-stretch:112%]">Faisal Wani</span>
            </a>

            <div className="flex items-center gap-1 md:gap-2">
              <ul className="mr-3 hidden items-center gap-1 md:flex">
                {LINKS.map((l) => (
                  <li key={l.id}>
                    <a
                      href={`#${l.id}`}
                      onClick={(e) => go(e, l.id)}
                      aria-current={active === l.id ? "location" : undefined}
                      className={`relative rounded-full px-3.5 py-2 text-[0.92rem] font-[520] transition-colors duration-300 hover:text-ink ${
                        active === l.id ? "text-ink" : "text-muted"
                      }`}
                    >
                      {l.label}
                      {active === l.id && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-x-3.5 -bottom-0.5 h-px bg-accent"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary hidden h-10 sm:inline-flex" onClick={openContact}>
                Get in touch
              </button>
              <ThemeToggle />
              <button
                ref={toggleRef}
                type="button"
                className="grid size-11 place-items-center rounded-full hover:bg-surface-1 md:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? <X size={20} weight="bold" aria-hidden="true" /> : <List size={20} weight="bold" aria-hidden="true" />}
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-30 flex flex-col justify-end bg-canvas px-5 pb-10 pt-24 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a href={`#${l.id}`} onClick={(e) => go(e, l.id)} className="type-title block py-1">
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-primary mt-10 self-start"
              onClick={() => {
                setMenuOpen(false);
                openContact();
              }}
            >
              Get in touch
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
