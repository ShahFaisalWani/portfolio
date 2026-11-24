import type { Media } from "@/content/site";

/*
  Ribbed glass over a cover. Each rib is a slice of the cover's still, magnified around its
  own center with a cylinder of light and shade on top (index.css, .flute). --flute 1 is
  ribbed, 0 is clear: the slices then line up into the plain image and the layer fades out,
  handing over to the real media underneath without a seam. Driven by a scroll timeline (deck
  cards clear as they land on top) or by hover (.flute-hover).
*/
export default function FlutedGlass({ media, ribs = 24, hover = false }: { media: Media; ribs?: number; hover?: boolean }) {
  const src = media.kind === "video" ? media.poster : media.src;
  const focus = media.focus ?? "50% 0%";
  return (
    <div data-flute aria-hidden="true" className={`flute ${hover ? "flute-hover" : ""}`}>
      {Array.from({ length: ribs }, (_, i) => (
        <div key={i} className="flute-rib" style={{ left: `${(i / ribs) * 100}%`, width: `${100 / ribs}%` }}>
          <img
            src={src}
            alt=""
            decoding="async"
            loading="lazy"
            draggable={false}
            style={{ left: `${-i * 100}%`, width: `${ribs * 100}%`, objectPosition: focus, transformOrigin: `${((i + 0.5) / ribs) * 100}% 50%` }}
          />
        </div>
      ))}
    </div>
  );
}
