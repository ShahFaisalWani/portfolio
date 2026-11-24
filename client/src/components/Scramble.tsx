import { useEffect, useRef } from "react";
import { isHydrating } from "@/lib/prerender";
import { inView } from "@/lib/view-transition";
import { useReducedMotionPref } from "@/lib/use-media";
import { scramble } from "@/lib/scramble";

/*
  Text that decodes: each character cycles through random glyphs, then locks into place from
  left to right, the way a streaming transcript settles. The glyphs run on an aria-hidden
  overlay laid over the real text, which only turns transparent meanwhile: its box, its width
  and its accessible name never change, and React's text node is never touched. Text already
  painted on a hydrating page never scrambles (it would flash); intro="mount" only runs while
  the text is still invisible behind its own fade-in.
*/

export default function Scramble({
  text,
  className = "",
  intro,
  hover = false,
  duration = 900,
  delay = 0,
}: {
  text: string;
  className?: string;
  /* mount: decode on load if still hidden; view: decode the first time it scrolls into view */
  intro?: "mount" | "view";
  /* decode again whenever the pointer reaches the nearest link or button (or the text itself) */
  hover?: boolean;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotionPref();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let cancel = () => {};
    let timer = 0;
    const run = (d = duration) => {
      cancel();
      cancel = scramble(el, d);
    };
    const cleanups: (() => void)[] = [];

    if (intro === "mount") {
      let node: HTMLElement | null = el;
      let hidden = false;
      while (node && !hidden) {
        hidden = parseFloat(getComputedStyle(node).opacity) < 0.05;
        node = node.parentElement;
      }
      if (hidden) timer = window.setTimeout(() => run(), delay);
    } else if (intro === "view" && !(isHydrating() && inView(el, 0.01))) {
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          timer = window.setTimeout(() => run(), delay);
        },
        { threshold: 0.6 },
      );
      io.observe(el);
      cleanups.push(() => io.disconnect());
    }

    if (hover) {
      const target = el.closest<HTMLElement>("a, button") ?? el;
      const onEnter = (e: PointerEvent) => {
        if (e.pointerType === "mouse" && !el.dataset.scrambling) run(Math.min(duration, 520));
      };
      target.addEventListener("pointerenter", onEnter);
      cleanups.push(() => target.removeEventListener("pointerenter", onEnter));
    }

    return () => {
      clearTimeout(timer);
      cancel();
      cleanups.forEach((fn) => fn());
    };
  }, [intro, hover, duration, delay, reduce]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
