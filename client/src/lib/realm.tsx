import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useMatch, useNavigate } from "react-router-dom";
import { projects, type Project } from "@/content/site";
import { ScrollTrigger } from "./gsap";
import { useSmoothScroll } from "./smooth-scroll";
import { trackEvent } from "./analytics";
import { inView, runTransition } from "./view-transition";
import { pixelSwap } from "./pixel-transition";

/*
  Case studies live at /projects/:id but open as a layer over the home page, so
  the page underneath keeps its scroll position, pinned state and WebGL. This
  provider turns route changes into transitions: card cover -> framed hero on
  open, hero -> card on close, and a pixel curtain (lib/pixel-transition.ts) from
  one case study to the next or when the shared element is off screen. It works
  the same for in-page buttons and the browser's back and forward.
*/

export type ProjectId = Project["id"];
type Ctx = {
  shown: ProjectId | null;
  open: (id: ProjectId) => void;
  close: () => void;
  go: (id: ProjectId) => void;
};

const RealmContext = createContext<Ctx | null>(null);
const isId = (v?: string): v is ProjectId => projects.some((p) => p.id === v);
const q = (selector: string) => document.querySelector<HTMLElement>(selector);

/* Lets heavy effects on the home page (the hero point cloud) pause while a case study covers it. */
let layerOpen = false;
const listeners = new Set<() => void>();
export const realmStore = {
  get: () => layerOpen,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
};
function setLayerOpen(v: boolean) {
  if (layerOpen === v) return;
  layerOpen = v;
  listeners.forEach((fn) => fn());
}

/*
  The project index (Projects.tsx) shows one featured cover at a time on its screen. It registers
  here how to bring a project's cover on screen: scroll its row to the middle and swap at once.
*/
export const coverStage: { reveal: ((id: ProjectId, scrollWindow: (y: number) => void) => boolean) | null } = { reveal: null };

/* Scrolls the home page (instantly, it is hidden) so the project's card sits in view. */
function revealCard(id: ProjectId, scrollWindow: (y: number) => void) {
  if (coverStage.reveal?.(id, scrollWindow)) return;
  const card = q(`[data-cover-card="${id}"]`);
  if (!card || inView(card, 0.6)) return;
  const r = card.getBoundingClientRect();
  scrollWindow(scrollY + r.top - (innerHeight - r.height) / 2);
  ScrollTrigger.update();
}

/* The morph crops both snapshots like the card does (each cover has its own focus point). */
function coverFocus(card: HTMLElement | null) {
  const media = card?.querySelector<HTMLElement>("img, video");
  const pos = media ? getComputedStyle(media).objectPosition : "50% 0%";
  document.documentElement.style.setProperty("--cover-focus", pos);
}

export function RealmProvider({ children }: { children: ReactNode }) {
  const match = useMatch("/projects/:id");
  const param = match?.params.id;
  const routeId = isId(param) ? param : null;
  const navigate = useNavigate();
  const { scrollTo, lock, unlock } = useSmoothScroll();
  const [shown, setShown] = useState<ProjectId | null>(routeId);
  const shownRef = useRef(shown);
  // true when the layer was opened from this page, so closing can step back in history
  const entered = useRef(false);

  useEffect(() => {
    if (param && !routeId) navigate("/", { replace: true });
  }, [param, routeId, navigate]);

  const isOpen = shown !== null;
  useLayoutEffect(() => {
    if (!isOpen) return;
    lock();
    setLayerOpen(true);
    return () => {
      unlock();
      setLayerOpen(false);
    };
  }, [isOpen, lock, unlock]);

  useLayoutEffect(() => {
    const from = shownRef.current;
    if (routeId === from) return;
    shownRef.current = routeId;
    const commit = () => flushSync(() => setShown(routeId));
    const scrollWindow = (y: number) => scrollTo(y, { immediate: true });

    // a microtask later, so flushSync never runs inside React's commit
    queueMicrotask(() => {
      if (from === null && routeId) {
        const card = q(`[data-cover-card="${routeId}"]`);
        coverFocus(card);
        // the cover morphs into the hero when it is on screen; otherwise the page dissolves in pixels
        if (!inView(card, 0.2)) {
          pixelSwap(commit);
          return;
        }
        runTransition({
          kind: "open",
          name: "project-cover",
          from: card,
          update: commit,
          to: () => q(`[data-cover-hero="${routeId}"]`),
        });
      } else if (from && routeId === null) {
        entered.current = false;
        const hero = q(`[data-cover-hero="${from}"]`);
        coverFocus(q(`[data-cover-card="${from}"]`));
        const update = () => {
          commit();
          revealCard(from, scrollWindow);
        };
        const refocus = () => q(`[data-card-link="${from}"]`)?.focus({ preventScroll: true });
        // the hero shrinks back into its card while it is on screen; scrolled away, the layer dissolves in pixels
        if (!inView(hero, 0.3)) {
          pixelSwap(update).then(refocus);
          return;
        }
        runTransition({
          kind: "close",
          name: "project-cover",
          from: hero,
          update,
          to: () => q(`[data-cover-card="${from}"]`),
        }).then(refocus);
      } else if (from && routeId) {
        // case study to case study: the page breaks into pixels and resolves as the next one
        pixelSwap(commit);
      }
    });
  }, [routeId, scrollTo]);

  const open = useCallback(
    (id: ProjectId) => {
      entered.current = true;
      trackEvent("Project", "Click on card", id);
      navigate(`/projects/${id}`);
    },
    [navigate],
  );
  const close = useCallback(() => {
    if (entered.current) navigate(-1);
    else navigate("/", { replace: true });
  }, [navigate]);
  const go = useCallback((id: ProjectId) => navigate(`/projects/${id}`, { replace: true }), [navigate]);

  return <RealmContext.Provider value={{ shown, open, close, go }}>{children}</RealmContext.Provider>;
}

export function useRealm() {
  const ctx = useContext(RealmContext);
  if (!ctx) throw new Error("useRealm must be used inside RealmProvider");
  return ctx;
}
