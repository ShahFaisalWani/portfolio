import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/lib/theme";

/* Both glyphs stay mounted and trade places: the outgoing one rotates away as the incoming one turns in. */
const glyph = "theme-glyph [grid-area:1/1] transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={(e) => toggle(e.currentTarget)}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      className="grid size-11 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-surface-1 active:scale-95"
    >
      <Sun size={18} weight="bold" aria-hidden="true" className={`${glyph} ${dark ? "" : "rotate-90 scale-50 opacity-0"}`} />
      <Moon size={18} weight="bold" aria-hidden="true" className={`${glyph} ${dark ? "-rotate-90 scale-50 opacity-0" : ""}`} />
    </button>
  );
}
