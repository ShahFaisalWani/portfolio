import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className="grid size-11 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-surface-1 active:scale-95"
    >
      {theme === "dark" ? <Sun size={18} weight="bold" aria-hidden="true" /> : <Moon size={18} weight="bold" aria-hidden="true" />}
    </button>
  );
}
