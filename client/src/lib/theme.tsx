import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { canTransition, runTransition } from "@/lib/view-transition";

export type Theme = "dark" | "light";
const KEY = "theme-state";

/* origin: the control that asked for the switch; the new theme spreads out from its center */
type Ctx = { theme: Theme; toggle: (origin?: HTMLElement | null) => void };
const ThemeContext = createContext<Ctx | null>(null);

/*
  html[data-theme] is the source of truth: index.html sets it from storage before first paint. The
  prerendered markup is always dark, so hydration reads "dark" and React re-renders once if it is light.
*/
const listeners = new Set<() => void>();
const read = (): Theme => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, read, (): Theme => "dark");

  useEffect(() => {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute("content", theme === "dark" ? "#0b0b0c" : "#efefec"));
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage can be unavailable in private mode */
    }
  }, [theme]);

  const toggle = useCallback((origin?: HTMLElement | null) => {
    const root = document.documentElement;
    const next: Theme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    // html[data-theme-switch] turns off color transitions, so every surface flips in the same frame
    root.dataset.themeSwitch = "";
    const update = () => {
      root.setAttribute("data-theme", next);
      flushSync(() => listeners.forEach((fn) => fn()));
    };

    if (!canTransition()) {
      update();
      // two frames: the first style pass has to see the new colors with transitions still off
      requestAnimationFrame(() => requestAnimationFrame(() => delete root.dataset.themeSwitch));
      return;
    }

    const r = origin?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : innerWidth - 40;
    const y = r ? r.top + r.height / 2 : 32;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r0", `${r ? r.width / 2 : 0}px`);
    root.style.setProperty("--vt-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);

    runTransition({ kind: "theme", update }).finally(() => {
      if (root.dataset.vt) return; // a newer transition owns the page now
      delete root.dataset.themeSwitch;
      ["--vt-x", "--vt-y", "--vt-r0", "--vt-r"].forEach((p) => root.style.removeProperty(p));
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
