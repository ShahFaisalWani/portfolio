/*
  Pixel curtain: the screen breaks into square cells that switch to the canvas color in random
  order (a few flash the accent as they turn), the page changes underneath, then the cells
  switch off in a new random order and the next page resolves through them. Used where there
  is no shared element to morph: moving to the next case study, and closing one whose hero has
  scrolled away. Plain swap under reduced motion.
*/

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const frames = (n: number) => new Promise<void>((r) => (function f(i) { if (i <= 0) r(); else requestAnimationFrame(() => f(i - 1)); })(n));

let running = false;

export async function pixelSwap(update: () => void) {
  if (running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  running = true;
  const root = getComputedStyle(document.documentElement);
  const canvasColor = root.getPropertyValue("--canvas").trim();
  const accent = root.getPropertyValue("--accent").trim();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const el = document.createElement("canvas");
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, { position: "fixed", inset: "0", width: "100%", height: "100%", zIndex: "65", pointerEvents: "none" });
  document.body.append(el);
  const W = el.clientWidth || innerWidth;
  const H = el.clientHeight || innerHeight;
  el.width = Math.round(W * dpr);
  el.height = Math.round(H * dpr);
  const ctx = el.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const size = Math.max(36, Math.round(W / 24));
  const cols = Math.ceil(W / size);
  const rows = Math.ceil(H / size);
  const n = cols * rows;
  const spark = Float32Array.from({ length: n }, () => Math.random());
  let order = Float32Array.from({ length: n }, () => Math.random());

  // covered(i, k): whether cell i shows the curtain at progress k
  const draw = (k: number, covered: (o: number, k: number) => boolean) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = canvasColor;
    for (let i = 0; i < n; i++) if (covered(order[i], k)) ctx.fillRect((i % cols) * size, Math.floor(i / cols) * size, size + 0.5, size + 0.5);
    ctx.fillStyle = accent;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(k - order[i]);
      if (d < 0.07 && spark[i] < 0.35) ctx.fillRect((i % cols) * size + 1, Math.floor(i / cols) * size + 1, size - 2, size - 2);
    }
  };
  const run = (ms: number, covered: (o: number, k: number) => boolean) =>
    new Promise<void>((resolve) => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        draw(easeInOut(t) * 1.08, covered);
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

  try {
    await run(420, (o, k) => k >= o);
    update();
    await frames(2);
    order = Float32Array.from({ length: n }, () => Math.random());
    await run(560, (o, k) => k < o);
  } finally {
    el.remove();
    running = false;
  }
}
