import { useEffect, useRef } from "react";
import type { Media } from "@/content/site";

/* Image or muted looping video. Videos only play while on screen. */
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
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      threshold: 0.2,
    });
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);

  if (media.kind === "video") {
    return (
      <video
        ref={videoRef}
        className={className}
        src={media.src}
        poster={media.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={media.alt}
      />
    );
  }
  return <img className={className} src={media.src} alt={media.alt} loading={eager ? "eager" : "lazy"} decoding="async" />;
}
