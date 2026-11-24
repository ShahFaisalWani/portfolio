import { Fragment, useRef, type ElementType } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotionPref } from "@/lib/use-media";
import { isHydrating } from "@/lib/prerender";
import { inView } from "@/lib/view-transition";

/*
  A section title that comes into focus word by word the first time it scrolls into view:
  each word sharpens from a blur while it rises into place. A title already painted on a
  hydrating page (a direct visit to #section_work) stays as it is.
*/
export default function BlurTitle({
  children,
  as: Tag = "h2",
  className = "",
  id,
}: {
  children: string;
  as?: ElementType;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotionPref();
  const words = children.split(" ");

  useGSAP(
    () => {
      const el = ref.current;
      if (reduce || !el || (isHydrating() && inView(el, 0.01))) return;
      gsap.from(el.querySelectorAll("[data-bw]"), {
        opacity: 0,
        filter: "blur(18px)",
        yPercent: 38,
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.075,
        // a resting filter would keep each word on its own layer
        clearProps: "filter",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    },
    { dependencies: [reduce], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} id={id} className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span data-bw className="inline-block">
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Tag>
  );
}
