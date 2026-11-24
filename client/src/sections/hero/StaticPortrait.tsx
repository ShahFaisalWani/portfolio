import ditherDark from "@/assets/media/faisal-dither-dark.png";
import ditherLight from "@/assets/media/faisal-dither-light.png";

/*
  The dithered portrait as a still: reduced motion, and devices without a GPU for the shader.
  Same tone curve and Bayer matrix as HeroCanvas, prebaked at 180x320 dots and scaled up
  without smoothing. Placed where the shader puts the portrait.
*/
export default function StaticPortrait() {
  const cls =
    "pixelated pointer-events-none absolute bottom-0 left-[62%] h-[68%] w-auto max-w-none -translate-x-1/2 select-none sm:left-[68%] sm:h-[82%] lg:left-[72%] lg:h-[94%]";
  return (
    <>
      <img src={ditherDark} alt="" width={180} height={320} className={`only-dark ${cls}`} />
      <img src={ditherLight} alt="" width={180} height={320} className={`only-light ${cls}`} />
    </>
  );
}
