import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotionPref } from "@/lib/use-media";
import portrait from "@/assets/media/faisal-pill.webp";
import robot from "@/assets/media/robox-1-pill.webp";
import football from "@/assets/media/fb-6-pill.webp";

/*
  Manifesto. Words light up in reading order as the paragraph scrolls through
  the viewport, so the statement is read at the pace it is revealed.
  Small photos sit inline in the sentence where the words mention them.
*/

type Token = string | { img: string; alt: string; pos?: string };

const MANIFESTO: Token[] = [
  "You dream it, I code it to life. I’m Faisal",
  { img: portrait, alt: "Faisal", pos: "50% 18%" },
  ", an engineer who builds speech AI, LLM tooling and the full-stack products around them. I studied Digital Engineering at PSU, built a robot",
  { img: robot, alt: "The service robot", pos: "50% 45%" },
  "that maps its own room, and when I’m off work I’m on a football pitch",
  { img: football, alt: "Faisal playing football", pos: "62% 40%" },
  ".",
];

const FACTS = [
  { label: "Now", value: "Research Engineer at SCB DataX" },
  { label: "Building", value: "Iqra AI, a voice tutor for Quran recitation" },
  { label: "Before", value: "SCB 10X, Mojen.ai, SCG and Booktree" },
  { label: "Studied", value: "B.Eng Digital Engineering, Prince of Songkla University" },
];

export default function About() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotionPref();

  useGSAP(
    () => {
      if (reduce) return;
      const words = gsap.utils.toArray<HTMLElement>("[data-word]");
      const pics = gsap.utils.toArray<HTMLElement>("[data-pic]");
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "[data-manifesto]", start: "top 78%", end: "bottom 42%", scrub: 0.6 },
      });
      tl.fromTo(words, { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: "none", duration: 0.3 }, 0);
      pics.forEach((pic) => {
        const order = Number(pic.dataset.pic);
        tl.fromTo(
          pic,
          { scale: 0.2, opacity: 0 },
          { scale: 1, opacity: 1, ease: "back.out(2)", duration: 0.5 },
          order * 0.05 - 0.1,
        );
      });

      gsap.from("[data-fact]", {
        y: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: "[data-facts]", start: "top 85%" },
      });
    },
    { scope: ref, dependencies: [reduce], revertOnUpdate: true },
  );

  let wordIndex = 0;
  return (
    <section ref={ref} id="section_about" aria-label="About" tabIndex={-1} className="relative outline-none px-5 pb-24 pt-28 md:px-10 md:pb-36 md:pt-44">
      <div className="mx-auto max-w-[1680px]">
        <p
          data-manifesto
          className="max-w-[24ch] text-[clamp(1.85rem,4.3vw,4.25rem)] font-[560] leading-[1.06] tracking-[-0.035em] [font-stretch:106%]"
        >
          {MANIFESTO.map((token, t) => {
            if (typeof token !== "string") {
              return (
                <span
                  key={t}
                  data-pic={wordIndex}
                  className="relative mx-[0.12em] inline-block h-[0.82em] w-[1.55em] translate-y-[0.08em] overflow-hidden rounded-full align-baseline"
                >
                  <img
                    src={token.img}
                    alt={token.alt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: token.pos }}
                  />
                </span>
              );
            }
            const words = token.trim().split(/\s+/);
            const leadingSpace = !/^[,.]/.test(token) && t > 0;
            return (
              <span key={t}>
                {leadingSpace ? " " : ""}
                {words.map((w, i) => (
                  <span key={i}>
                    <span data-word={wordIndex++} className="inline-block">
                      {w}
                    </span>
                    {i < words.length - 1 ? " " : ""}
                  </span>
                ))}
                {/[a-z]$/i.test(token) ? " " : ""}
              </span>
            );
          })}
        </p>

        <dl
          data-facts
          className="mt-20 grid grid-cols-1 border-t border-hairline sm:grid-cols-2 md:mt-32 lg:grid-cols-4"
        >
          {FACTS.map((f, i) => (
            <div
              key={f.label}
              data-fact
              className={`flex flex-col gap-3 border-b border-hairline py-6 sm:pr-8 lg:border-b-0 lg:py-8 ${
                i > 0 ? "lg:border-l lg:pl-8" : ""
              } ${i % 2 === 1 ? "sm:border-l sm:pl-8 lg:pl-8" : ""}`}
            >
              <dt className="type-meta text-muted">{f.label}</dt>
              <dd className="text-[1.15rem] font-[560] leading-snug tracking-[-0.015em] text-pretty">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
