/*
  Decodes an element's text in place: each character cycles through random glyphs, then locks
  in from left to right. The glyphs run on an aria-hidden overlay; the element's own text only
  turns transparent meanwhile, so its box and accessible name never change. Returns a cancel.
*/

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=<>/";

export function scramble(el: HTMLElement, duration = 900) {
  if (el.dataset.scrambling) return () => {};
  const chars = Array.from(el.textContent ?? "");
  const n = chars.length;
  const lock = chars.map((_, i) => (i / Math.max(1, n)) * duration * 0.7 + Math.random() * duration * 0.3);
  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  overlay.className = "scramble-overlay";
  overlay.style.color = getComputedStyle(el).color;
  el.dataset.scrambling = "";
  el.classList.add("scrambling");
  el.append(overlay);
  const start = performance.now();
  let last = 0;
  let raf = 0;

  const finish = () => {
    cancelAnimationFrame(raf);
    overlay.remove();
    el.classList.remove("scrambling");
    delete el.dataset.scrambling;
  };

  const tick = (now: number) => {
    const t = now - start;
    if (t >= duration) return finish();
    if (now - last > 42) {
      last = now;
      const frag = document.createDocumentFragment();
      let run = "";
      chars.forEach((c, i) => {
        if (c === " " || t >= lock[i]) {
          run += c;
          return;
        }
        if (run) frag.append(run);
        run = "";
        const g = document.createElement("span");
        g.className = "scramble-glyph";
        g.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        frag.append(g);
      });
      if (run) frag.append(run);
      overlay.replaceChildren(frag);
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return finish;
}
