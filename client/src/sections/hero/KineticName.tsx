import { useRef, type CSSProperties } from "react";
import { useWidthLens } from "@/lib/use-width-lens";

/*
  The name, set in Mona Sans with its width axis doing the work. On load each letter rises
  out of a mask, out of focus, while stretching from condensed to wide (CSS, .kinetic-char in
  index.css, so it plays from the prerendered HTML's first paint). With a fine pointer, letters
  near the cursor widen and get heavier, like a lens passing over the name.
*/

const LINES = ["Faisal", "Wani."];
const BASE_STRETCH = 112;
const BASE_WEIGHT = 640;

export default function KineticName({ reduce, interactive }: { reduce: boolean; interactive: boolean }) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  useWidthLens(rootRef, { enabled: !reduce && interactive });

  let n = 0;
  return (
    <h1
      ref={rootRef}
      className="type-display select-none text-[clamp(4.4rem,21vw,19rem)] leading-[0.8] lg:text-[clamp(4.4rem,17.2vw,19rem)]"
    >
      <span className="sr-only">Faisal Wani</span>
      {LINES.map((line) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]" aria-hidden="true">
          {line.split("").map((ch) => (
            <span
              key={`${line}-${n}`}
              data-char={n}
              className="kinetic-char inline-block will-change-transform"
              style={{ fontStretch: `${BASE_STRETCH}%`, fontWeight: BASE_WEIGHT, "--i": n++ } as CSSProperties}
            >
              {ch}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
