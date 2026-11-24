/*
  Pixel mosaic: the same "resolve" as the page transition (lib/pixel-transition.ts), but made of
  the picture itself. An image or a playing video is drawn into a tiny canvas, one pixel per
  block, then scaled back up without smoothing, so it shows as big flat squares of its own
  colors. Shrinking the block to 1 resolves it into the picture; growing it breaks it apart.
  Cells of a fixed coarse grid can also drop in or out in random order, like the curtain.
  Used by the project screen, the cover and certificate reveals and the certificate viewer.
*/

export type Drawable = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;
export type Rect = { x: number; y: number; w: number; h: number };
type Fit = { fit?: "cover" | "contain"; pos?: [number, number] };

export const easeIn = (t: number) => t * t * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const images = new Map<string, Promise<HTMLImageElement>>();
/* Loads and decodes an image once; every later call shares it (and the browser's cache). */
export function loadImage(src: string) {
  if (!images.has(src)) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    images.set(
      src,
      img.decode().then(
        () => img,
        () => img,
      ),
    );
  }
  return images.get(src)!;
}

export function sizeOf(d: Drawable): [number, number] {
  if (d instanceof HTMLVideoElement) return [d.videoWidth, d.videoHeight];
  if (d instanceof HTMLImageElement) return [d.naturalWidth, d.naturalHeight];
  return [d.width, d.height];
}

/* Can be drawn right now: a decoded image or a video with a current frame. */
export function drawable(d: Drawable | null | undefined): d is Drawable {
  if (!d) return false;
  if (d instanceof HTMLVideoElement) return d.readyState >= 2 && d.videoWidth > 0;
  if (d instanceof HTMLImageElement) return d.complete && d.naturalWidth > 0;
  return d.width > 0;
}

/* object-fit for a source of sw x sh into a w x h box; pos is object-position as fractions */
export function fitRect(sw: number, sh: number, w: number, h: number, { fit = "cover", pos = [0.5, 0.5] }: Fit = {}): Rect {
  const k = fit === "cover" ? Math.max(w / sw, h / sh) : Math.min(w / sw, h / sh);
  const dw = sw * k;
  const dh = sh * k;
  return { x: (w - dw) * pos[0], y: (h - dh) * pos[1], w: dw, h: dh };
}

/* "30% 0%" (a computed object-position) as fractions */
export function parsePos(value: string | undefined): [number, number] {
  const parts = (value ?? "").split(/\s+/).map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : NaN));
  return [Number.isFinite(parts[0]) ? parts[0] : 0.5, Number.isFinite(parts[1]) ? parts[1] : 0.5];
}

/* Matches a canvas's backing store to its CSS box and returns a context in CSS pixels. */
export function sizeCanvas(canvas: HTMLCanvasElement, box?: { width: number; height: number }) {
  const w = box?.width ?? canvas.clientWidth;
  const h = box?.height ?? canvas.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const bw = Math.max(1, Math.round(w * dpr));
  const bh = Math.max(1, Math.round(h * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

let scratch: HTMLCanvasElement | null = null;

/*
  Draws src into rect as a mosaic of block x block squares (block <= 1 draws it plainly).
  keep(i, cols) can drop cells of a fixed grid (grid px squares, from the rect's corner).
*/
export function drawMosaic(
  ctx: CanvasRenderingContext2D,
  src: Drawable,
  rect: Rect,
  block: number,
  { fit, pos, grid, keep, radius = 0 }: Fit & { grid?: number; keep?: (i: number) => boolean; radius?: number } = {},
) {
  const [sw, sh] = sizeOf(src);
  if (!sw || !sh) return;
  ctx.save();
  ctx.beginPath();
  if (radius) ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
  else ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (block <= 1.01) {
    const r = fitRect(sw, sh, rect.w, rect.h, { fit, pos });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, rect.x + r.x, rect.y + r.y, r.w, r.h);
  } else {
    const cw = Math.max(1, Math.ceil(rect.w / block));
    const ch = Math.max(1, Math.ceil(rect.h / block));
    scratch ??= document.createElement("canvas");
    if (scratch.width < cw || scratch.height < ch) {
      scratch.width = Math.max(scratch.width, cw);
      scratch.height = Math.max(scratch.height, ch);
    }
    const s = scratch.getContext("2d")!;
    s.imageSmoothingEnabled = true;
    s.imageSmoothingQuality = "high";
    s.clearRect(0, 0, cw, ch);
    // the small canvas holds the rect at 1 / block scale, the last column and row overhanging
    const r = fitRect(sw, sh, rect.w / block, rect.h / block, { fit, pos });
    s.drawImage(src, r.x, r.y, r.w, r.h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(scratch, 0, 0, cw, ch, rect.x, rect.y, cw * block, ch * block);
  }
  if (grid && keep) {
    const cols = Math.ceil(rect.w / grid);
    const rows = Math.ceil(rect.h / grid);
    for (let i = 0; i < cols * rows; i++) {
      if (!keep(i)) ctx.clearRect(rect.x + (i % cols) * grid, rect.y + Math.floor(i / cols) * grid, grid, grid);
    }
  }
  ctx.restore();
}

/* Random order for a grid of cells, for dropping them in or out. */
export const shuffleOrder = (n: number) => Float32Array.from({ length: n }, () => Math.random());

/* A rAF loop over ms; frame gets linear progress 0..1. Resolves at the end or when cancelled. */
export function tween(ms: number, frame: (t: number) => void, signal?: { cancelled: boolean }) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const step = (now: number) => {
      if (signal?.cancelled) return resolve();
      const t = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
      frame(t);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
