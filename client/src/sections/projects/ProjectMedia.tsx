import { useEffect, useRef } from "react";
import type { Media } from "@/content/site";
import { realmStore } from "@/lib/realm";
import { fromPoster, RETINA_WIDE, saveData } from "./media";

/*
  Image or muted looping video. Videos only play while on screen, and videos on
  the home page pause while a case study layer covers it. active={false} pauses
  a video that is on screen but hidden (a deck card under another card).
  A video loads nothing but its poster until it is within half a screen of view,
  then loads ahead so it is ready to play when it gets there. ahead={false}
  holds that off (deck cards more than one step from the top).
*/

export default function ProjectMedia({
  media,
  className = "",
  eager = false,
  reduce = false,
  active = true,
  ahead = true,
}: {
  media: Media;
  className?: string;
  eager?: boolean;
  reduce?: boolean;
  active?: boolean;
  ahead?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const small = media.kind === "video" ? media.small : undefined;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduce) return;
    // a case study scrolls inside its own layer, so "within half a screen" is measured against that
    const realm = v.closest<HTMLElement>("[data-realm]");
    const covered = realm ? () => false : realmStore.get;
    let visible = false;
    let near = false;
    const sync = () => {
      // leaving preload="none" starts the load the browser has held back
      if (near && ahead && !covered() && !saveData()) v.preload = "auto";
      if (visible && active && !covered()) v.play().catch(() => {});
      else v.pause();
    };
    // a decoder that rejects the 2880 copy mid-clip would leave the frame frozen: switch to the 1440 copy
    const onError = () => {
      if (!small || v.error?.code !== MediaError.MEDIA_ERR_DECODE || v.currentSrc.split("#")[0].endsWith(small)) return;
      v.src = small;
      sync();
    };
    v.addEventListener("error", onError);
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    const nearIo = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        sync();
      },
      { root: realm, rootMargin: "50% 0px" },
    );
    io.observe(v);
    nearIo.observe(v);
    const unsubscribe = realmStore.subscribe(sync);
    return () => {
      v.removeEventListener("error", onError);
      io.disconnect();
      nearIo.disconnect();
      unsubscribe();
    };
  }, [reduce, active, ahead, small]);

  const style = media.focus ? { objectPosition: media.focus } : undefined;

  if (media.kind === "video") {
    return (
      <video
        ref={videoRef}
        className={className}
        style={style}
        src={media.small ? undefined : fromPoster(media.src, media)}
        poster={media.poster}
        width={media.w}
        height={media.h}
        muted
        loop
        playsInline
        preload="none"
        aria-label={media.alt}
      >
        {media.small && (
          <>
            <source src={fromPoster(media.src, media)} media={RETINA_WIDE} type="video/mp4" />
            <source src={fromPoster(media.small, media)} type="video/mp4" />
          </>
        )}
      </video>
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
