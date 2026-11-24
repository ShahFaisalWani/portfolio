import type { CSSProperties } from "react";
import { SpeakerSimpleX } from "@phosphor-icons/react";
import { soundStore, useSoundOn } from "@/lib/sound";

/* Off: a muted speaker. On: a small live meter. The two trade places like the theme glyphs. */
const BARS = [
  { d: "0.9s", o: "-0.2s" },
  { d: "0.7s", o: "-0.5s" },
  { d: "1.1s", o: "-0.1s" },
  { d: "0.8s", o: "-0.35s" },
];
const glyph = "[grid-area:1/1] transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]";

export default function SoundToggle() {
  const on = useSoundOn();
  return (
    <button
      type="button"
      data-sound="self"
      aria-pressed={on}
      aria-label="Interface sound"
      title={on ? "Sound on" : "Sound off"}
      onClick={() => soundStore.set(!on)}
      className="grid size-11 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-surface-1 active:scale-95"
    >
      <SpeakerSimpleX size={18} weight="bold" aria-hidden="true" className={`${glyph} ${on ? "scale-50 opacity-0" : ""}`} />
      <span className={`${glyph} flex h-4 items-end gap-[3px] ${on ? "" : "scale-50 opacity-0"}`} aria-hidden="true">
        {BARS.map((b, i) => (
          <span key={i} className="eq-bar block h-full w-[2px] rounded-full bg-current" style={{ "--d": b.d, "--o": b.o } as CSSProperties} />
        ))}
      </span>
    </button>
  );
}
