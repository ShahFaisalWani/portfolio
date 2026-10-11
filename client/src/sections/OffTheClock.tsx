import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotionPref } from "@/lib/use-media";
import fb1 from "@/assets/media/fb-1.webp";
import fb2 from "@/assets/media/fb-2.webp";
import fb4 from "@/assets/media/fb-4.webp";
import fb6 from "@/assets/media/fb-6.webp";
import fb8 from "@/assets/media/fb-8.webp";
import fb9 from "@/assets/media/fb-9.webp";
import fb10 from "@/assets/media/fb-10.webp";

/*
  Zoom parallax. A collage of match photos sits in a pinned frame; scrolling
  pushes the camera through it until one photo fills the screen and the caption
  lands on top. It moves the page from work to life in one continuous shot.
*/

const SHOTS = [
  { src: fb6, alt: "Faisal dribbling past a defender", box: "w-[25vw] h-[25vh]", pos: "", scale: 4 },
  { src: fb9, alt: "Holding the trophy after winning a cup in Phuket", box: "w-[35vw] h-[30vh]", pos: "-top-[30vh] left-[5vw]", scale: 5 },
  { src: fb2, alt: "With a trophy on the pitch at night", box: "w-[20vw] h-[45vh]", pos: "-top-[10vh] -left-[25vw]", scale: 6 },
  { src: fb8, alt: "Rising for a header", box: "w-[25vw] h-[25vh]", pos: "left-[27.5vw]", scale: 5 },
  { src: fb4, alt: "Running onto the ball in an orange kit", box: "w-[20vw] h-[25vh]", pos: "top-[27.5vh] left-[5vw]", scale: 6 },
  { src: fb10, alt: "Champions photo with the team trophy", box: "w-[30vw] h-[25vh]", pos: "top-[27.5vh] -left-[22.5vw]", scale: 8 },
  { src: fb1, alt: "On the ball in a five-a-side match", box: "w-[15vw] h-[15vh]", pos: "top-[22.5vh] left-[25vw]", scale: 9 },
];

export default function OffTheClock() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotionPref();

  useGSAP(
    () => {
      if (reduce) return;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom bottom", scrub: 0.8 },
      });
      // zoom through the collage for the first 70%, then hold the full-bleed shot while the caption lands
      gsap.utils.toArray<HTMLElement>("[data-zoom]").forEach((el, i) => {
        tl.to(el, { scale: SHOTS[i].scale, duration: 0.7, ease: "power1.in" }, 0);
      });
      tl.fromTo("[data-zoom-shade]", { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0.68);
      tl.fromTo("[data-zoom-copy] > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.14, stagger: 0.04 }, 0.72);
      tl.to({}, { duration: 0.1 });
    },
    { scope: ref, dependencies: [reduce] },
  );

  if (reduce) {
    return (
      <section id="section_offwork" aria-label="Off the clock" className="px-5 py-24 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1680px]">
          <h2 className="type-title">Off the clock.</h2>
          <p className="type-lead mt-6 max-w-[40ch] text-muted">
            When I’m not at a keyboard, I’m on a football pitch. A few trophies came home too.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3">
            {SHOTS.slice(0, 6).map((s) => (
              <img key={s.src} src={s.src} alt={s.alt} loading="lazy" className="aspect-[4/3] w-full rounded-[16px] object-cover" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="section_offwork" aria-label="Off the clock" className="relative h-[320vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {SHOTS.map((s, i) => (
          <div key={s.src} data-zoom className="absolute inset-0 flex items-center justify-center will-change-transform">
            <div className={`relative overflow-hidden ${i === 0 ? "rounded-[4px]" : "rounded-[16px]"} ${s.box} ${s.pos}`}>
              <img src={s.src} alt={s.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
          </div>
        ))}
        <div
          data-zoom-shade
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,rgb(8_8_9/0.85),rgb(8_8_9/0.15)_55%,transparent)] opacity-0"
        />
        <div data-zoom-copy className="absolute inset-x-0 bottom-0 mx-auto max-w-[1680px] px-5 pb-12 text-on-photo md:px-10 md:pb-16">
          <h2 className="type-title opacity-0">Off the clock.</h2>
          <p className="type-lead mt-5 max-w-[40ch] text-on-photo/80 opacity-0">
            When I’m not at a keyboard, I’m on a football pitch. A few trophies came home too.
          </p>
        </div>
      </div>
    </section>
  );
}
