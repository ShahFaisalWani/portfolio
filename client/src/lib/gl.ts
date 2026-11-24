import { realmStore } from "./realm";

/*
  Bare WebGL for full-screen fragment shaders (the hero signal field and portrait, the footer
  mesh). One big triangle covers the canvas; the fragment shader does the rest. Each canvas
  only runs its frame loop while it is on screen, the tab is visible and no case study covers
  the page.
*/

export type Rgb = [number, number, number];

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

export function cssColor(name: string): Rgb {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* No GPU (or a blocklisted driver): WebGL falls back to the CPU, too slow for a full-screen shader. */
function softwareRendered(gl: WebGLRenderingContext) {
  let name = String(gl.getParameter(gl.RENDERER) ?? "");
  if (!name || /^webkit webgl$/i.test(name)) {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) name = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
  }
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
}

/* Decoration waits for the copy to paint and the page to hydrate. */
export function afterLoad() {
  return new Promise<void>((resolve) => {
    const idle = () =>
      "requestIdleCallback" in window ? requestIdleCallback(() => resolve(), { timeout: 1200 }) : setTimeout(resolve, 200);
    if (document.readyState === "complete") idle();
    else addEventListener("load", idle, { once: true });
  });
}

/* A case study opened on load covers the page: nothing to draw until it closes. */
export function uncovered() {
  return new Promise<void>((resolve) => {
    if (!realmStore.get()) return resolve();
    const off = realmStore.subscribe(() => {
      if (realmStore.get()) return;
      off();
      resolve();
    });
  });
}

export type Shader = {
  gl: WebGLRenderingContext;
  u: (name: string) => WebGLUniformLocation | null;
  draw: () => void;
  dispose: () => void;
};

export function createShader(canvas: HTMLCanvasElement, frag: string): Shader | null {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
  if (!gl || softwareRendered(gl)) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const cache = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
    return cache.get(name)!;
  };

  return {
    gl,
    u,
    draw: () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose: () => {
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

export async function loadTexture(gl: WebGLRenderingContext, src: string) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { tex, w: img.naturalWidth, h: img.naturalHeight };
}

/* Sizes the drawing buffer to the canvas box (device pixels, capped) and returns the scale used. */
export function fit(canvas: HTMLCanvasElement, maxDpr = 2) {
  const dpr = Math.min(devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return dpr;
}

/*
  Runs `frame` every animation frame while the element is on screen, the tab is visible and no
  case study covers the page. Returns a stop function.
*/
export function visibleLoop(el: Element, frame: (now: number) => void, margin = "0px") {
  let raf = 0;
  let onScreen = false;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    frame(now);
  };
  const sync = () => {
    const run = onScreen && !document.hidden && !realmStore.get();
    if (run && !raf) raf = requestAnimationFrame(loop);
    if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const io = new IntersectionObserver(
    ([e]) => {
      onScreen = e.isIntersecting;
      sync();
    },
    { rootMargin: margin },
  );
  io.observe(el);
  document.addEventListener("visibilitychange", sync);
  const off = realmStore.subscribe(sync);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    document.removeEventListener("visibilitychange", sync);
    off();
  };
}

export const GLSL_COMMON = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
}
`;
