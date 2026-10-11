/*
  True while React hydrates a prerendered page (scripts/prerender.mjs). Its markup is already on screen,
  so an intro that hides content and animates it back in would flash: those intros check this and skip.
  App flips it off after the first commit, so anything opened later animates as usual.
*/
let hydrating = typeof document !== "undefined" && document.getElementById("root")?.firstElementChild != null;

export const isHydrating = () => hydrating;
export function hydrated() {
  hydrating = false;
}
