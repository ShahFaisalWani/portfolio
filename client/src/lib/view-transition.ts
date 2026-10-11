/*
  Shared-element page transitions on the View Transitions API. One element in
  the old state and one in the new state get the same view-transition-name, and
  the browser morphs between them while the rest of the page runs the keyframes
  in index.css picked by html[data-vt]. Browsers without the API, and reduced
  motion, get the plain state change.
*/

export type TransitionKind =
  | "open"
  | "close"
  | "close-plain"
  | "swap"
  | "swap-plain"
  | "cert-open"
  | "cert-close"
  | "cert-next"
  | "cert-prev"
  | "theme";

export function canTransition() {
  return "startViewTransition" in document && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* At least `share` of the element's box is inside the viewport. */
export function inView(el: Element | null, share = 0.35): boolean {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
  const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
  return (w * h) / (r.width * r.height) >= share;
}

let active: ViewTransition | null = null;

async function settled(el: HTMLElement) {
  const img = el.querySelector("img");
  if (!img || img.complete) return;
  await Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 250))]);
}

export function runTransition({
  kind,
  name,
  from,
  update,
  to,
}: {
  kind: TransitionKind;
  name?: string;
  /* shared element in the current state, or null for a page-only transition */
  from?: HTMLElement | null;
  /* applies the new state synchronously (wrap React updates in flushSync) */
  update: () => void;
  /* finds the shared element in the new state */
  to?: () => HTMLElement | null;
}) {
  if (!canTransition()) {
    update();
    return Promise.resolve();
  }
  const root = document.documentElement;
  const shared = name && from ? name : null;
  let target: HTMLElement | null = null;
  if (shared) from!.style.viewTransitionName = shared;
  root.dataset.vt = kind;

  const vt = document.startViewTransition(async () => {
    if (shared) from!.style.viewTransitionName = "";
    update();
    target = shared ? (to?.() ?? null) : null;
    if (target) {
      target.style.viewTransitionName = shared!;
      await settled(target);
    }
  });
  active = vt;

  return vt.finished
    .catch(() => {})
    .finally(() => {
      if (target) target.style.viewTransitionName = "";
      // a transition started on top of this one skips it; leave html[data-vt] to the newer one
      if (active !== vt) return;
      active = null;
      delete root.dataset.vt;
    });
}
