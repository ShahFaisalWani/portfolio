import { useEffect, useRef } from "react";
import type { Media } from "@/content/site";
import { realmStore } from "@/lib/realm";

/*
  Image or muted looping video. Videos only play while on screen, and videos on
  the home page pause while a case study layer covers it.
*/
export default function ProjectMedia({
  media,
  className = "",
  eager = false,
  reduce = false,
}: {
  media: Media;
  className?: string;
  eager?: boolean;
  reduce?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduce) return;
    const covered = v.closest("[data-realm]") ? () => false : realmStore.get;
    let visible = false;
    const sync = () => (visible && !covered() ? v.play().catch(() => {}) : v.pause());
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    io.observe(v);
    const unsubscribe = realmStore.subscribe(sync);
    return () => {
      io.disconnect();
      unsubscribe();
    };
  }, [reduce]);

  const style = media.focus ? { objectPosition: media.focus } : undefined;

  if (media.kind === "video") {
    return (
      <video
        ref={videoRef}
        className={className}
        style={style}
        src={media.src}
        poster={media.poster}
        width={media.w}
        height={media.h}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={media.alt}
      />
    );
  }
  return (
    <img
      className={className}
      style={style}
      src={media.src}
      alt={media.alt}
      width={media.w}
      height={media.h}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
    />
  );
}
