import { useEffect, useRef, useState, type RefObject } from "react";
import { Camera, Geometry, Mesh, Program, Renderer, Transform } from "ogl";
import { ScrollTrigger } from "@/lib/gsap";
import { useTheme } from "@/lib/theme";
import portraitUrl from "@/assets/media/portrait-points.png";
import portraitFallback from "@/assets/media/faisal.webp";

/*
  The hero portrait as a LIDAR-style point cloud. A scan line draws it in from
  the top, the pointer pushes points aside, and scrolling out of the hero
  scatters it. Under reduced motion it renders a single, fully revealed frame.
*/

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec4 aData; // lum, rand, edge, -
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uReveal;
uniform float uScatter;
uniform float uSweep;
uniform float uSize;
uniform float uDpr;
uniform float uTop;
uniform float uBottom;
uniform vec2 uMouse;
uniform float uMouseOn;
uniform float uAspect;
uniform float uInvert;
varying float vAlpha;
varying float vGlow;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  float lum = aData.x;
  float rnd = aData.y;
  float edge = aData.z;
  vec3 p = position;

  float scanY = mix(uTop, uBottom, uReveal);
  float above = smoothstep(scanY - 0.004, scanY + 0.09, position.y);
  vec3 dir = normalize(vec3(hash(rnd * 91.7) - 0.5, hash(rnd * 13.1) - 0.5, hash(rnd * 47.3) * 0.8 + 0.2));
  p += dir * (1.0 - above) * (0.3 + rnd * 0.5);

  p.z += sin(uTime * 0.9 + position.y * 9.0 + rnd * 6.2831) * 0.006;
  p.x += cos(uTime * 0.7 + position.y * 5.0 + rnd * 3.0) * 0.0025;

  p += dir * uScatter * (0.5 + rnd * 1.3);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;

  vec2 ndc = clip.xy / clip.w;
  vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
  float f = uMouseOn * smoothstep(0.2, 0.0, length(d));
  ndc += normalize(d + 1e-5) / vec2(uAspect, 1.0) * f * 0.06;
  clip.xy = ndc * clip.w;
  gl_Position = clip;

  float scanGlow = (1.0 - smoothstep(0.0, 0.045, abs(position.y - scanY))) * step(uReveal, 0.999);
  float sweepGlow = 0.0;
  if (uSweep >= 0.0) {
    float sy = mix(uTop, uBottom, uSweep);
    sweepGlow = (1.0 - smoothstep(0.0, 0.025, abs(position.y - sy))) * 0.75;
  }
  vGlow = max(max(scanGlow, sweepGlow), f);

  float tone = mix(lum, 1.0 - lum, uInvert);
  vAlpha = max(0.2 + 0.8 * tone, edge * 0.7) * above * (1.0 - uScatter);
  gl_PointSize = uSize * uDpr * (0.5 + tone * 0.9 + vGlow * 0.5) * (5.0 / -mv.z);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec3 uInk;
uniform vec3 uAccent;
varying float vAlpha;
varying float vGlow;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.18, d) * vAlpha;
  gl_FragColor = vec4(mix(uInk, uAccent, clamp(vGlow, 0.0, 1.0)), a);
}
`;

function cssColor(name: string): [number, number, number] {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

async function samplePortrait(cols: number) {
  const img = new Image();
  img.src = portraitUrl;
  await img.decode();
  const rows = Math.round((cols * img.height) / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, cols, rows);
  const px = ctx.getImageData(0, 0, cols, rows).data;
  const alphaAt = (x: number, y: number) =>
    x < 0 || y < 0 || x >= cols || y >= rows ? 0 : px[(y * cols + x) * 4 + 3] / 255;

  // The photo is mostly shadow, so stretch its tonal range (2nd to 98th percentile) and lift the mids.
  const lums: number[] = [];
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] / 255 >= 0.45) lums.push((0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255);
  }
  const sorted = [...lums].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.02)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.98)] ?? 1;

  const h = rows / cols;
  const pos: number[] = [];
  const data: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const a = px[i + 3] / 255;
      if (a < 0.45) continue;
      const raw = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      const lum = Math.pow(Math.min(1, Math.max(0, (raw - lo) / (hi - lo))), 0.62);
      const edge =
        alphaAt(x - 1, y) < 0.45 || alphaAt(x + 1, y) < 0.45 || alphaAt(x, y - 1) < 0.45 || alphaAt(x, y + 1) < 0.45
          ? 1
          : 0;
      const r = Math.random();
      pos.push(
        (x + (Math.random() - 0.5) * 0.7) / cols - 0.5,
        h / 2 - (y + (Math.random() - 0.5) * 0.7) / cols,
        (lum - 0.4) * 0.14 + (Math.random() - 0.5) * 0.012,
      );
      data.push(lum, r, edge, 0);
    }
  }
  return { position: new Float32Array(pos), data: new Float32Array(data), h };
}

type Props = { triggerRef: RefObject<HTMLElement | null>; reduce: boolean };

export default function PointCloud({ triggerRef, reduce }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const themeHook = useRef<() => void>(() => {});

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let disposed = false;
    let raf = 0;
    let running = false;
    let cleanup = () => {};

    (async () => {
      let renderer: Renderer;
      try {
        renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true, antialias: false });
      } catch {
        setFailed(true);
        return;
      }
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      const narrow = window.innerWidth < 768;
      const sample = await samplePortrait(narrow ? 120 : 196);
      if (disposed) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return;
      }

      const canvas = gl.canvas as HTMLCanvasElement;
      canvas.className = "absolute inset-0 h-full w-full";
      canvas.setAttribute("aria-hidden", "true");
      wrap.appendChild(canvas);

      const camera = new Camera(gl, { fov: 20, near: 0.1, far: 50 });
      camera.position.z = 5;
      const scene = new Transform();
      const uniforms = {
        uTime: { value: 0 },
        uReveal: { value: reduce ? 1 : 0 },
        uScatter: { value: 0 },
        uSweep: { value: -1 },
        uSize: { value: narrow ? 2.3 : 2.6 },
        uDpr: { value: renderer.dpr },
        uTop: { value: sample.h / 2 + 0.02 },
        uBottom: { value: -sample.h / 2 - 0.12 },
        uMouse: { value: [9, 9] },
        uMouseOn: { value: 0 },
        uAspect: { value: 1 },
        uInvert: { value: 0 },
        uInk: { value: [1, 1, 1] },
        uAccent: { value: [0.2, 0.6, 1] },
      };
      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const geometry = new Geometry(gl, {
        position: { size: 3, data: sample.position },
        aData: { size: 4, data: sample.data },
      });
      const points = new Mesh(gl, { mode: gl.POINTS, geometry, program });
      points.setParent(scene);

      const applyTheme = () => {
        uniforms.uInk.value = cssColor("--ink");
        uniforms.uAccent.value = cssColor("--accent");
        uniforms.uInvert.value = document.documentElement.getAttribute("data-theme") === "light" ? 1 : 0;
      };
      applyTheme();

      const layout = () => {
        const w = wrap.clientWidth;
        const hgt = wrap.clientHeight;
        renderer.setSize(w, hgt);
        camera.perspective({ aspect: w / hgt });
        uniforms.uAspect.value = w / hgt;
        const visH = 2 * camera.position.z * Math.tan((20 / 2) * (Math.PI / 180));
        const visW = visH * (w / hgt);
        let scale: number;
        let cx: number;
        if (w >= 1024) {
          scale = (visH * 0.88) / sample.h;
          cx = visW * 0.2;
        } else if (w >= 640) {
          scale = (visH * 0.8) / sample.h;
          cx = visW * 0.17;
        } else {
          scale = Math.min(visW * 1.05, (visH * 0.66) / sample.h);
          cx = visW * 0.12;
        }
        points.scale.set(scale, scale, scale);
        points.position.set(cx, -visH / 2 + (sample.h * scale) / 2, 0);
      };

      const render = () => renderer.render({ scene, camera });

      // pointer, in NDC
      const target = { x: 0, y: 0, on: 0 };
      const current = { x: 0, y: 0, on: 0, rx: 0, ry: 0 };
      const onPointer = (e: PointerEvent) => {
        const r = wrap.getBoundingClientRect();
        target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        target.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        target.on = e.pointerType === "mouse" ? 1 : 0.8;
      };
      const onLeave = () => (target.on = 0);

      let t0 = 0;
      let revealDone = reduce ? 0 : -1;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!t0) t0 = now;
        const t = (now - t0) / 1000;
        uniforms.uTime.value = t;

        if (revealDone < 0) {
          const k = Math.min(1, Math.max(0, (t - 0.25) / 2.4));
          uniforms.uReveal.value = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          if (k >= 1) revealDone = t;
        } else {
          const phase = ((t - revealDone) % 8) / 1.8;
          uniforms.uSweep.value = t - revealDone > 3 && phase < 1 ? phase : -1;
        }

        current.x += (target.x - current.x) * 0.12;
        current.y += (target.y - current.y) * 0.12;
        current.on += (target.on - current.on) * 0.08;
        uniforms.uMouse.value = [current.x, current.y];
        uniforms.uMouseOn.value = current.on;
        current.ry += (target.x * 0.22 - current.ry) * 0.05;
        current.rx += (-target.y * 0.08 - current.rx) * 0.05;
        points.rotation.y = current.ry;
        points.rotation.x = current.rx;
        render();
      };

      const start = () => {
        if (running || reduce) return;
        running = true;
        raf = requestAnimationFrame(frame);
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      layout();
      const ro = new ResizeObserver(() => {
        layout();
        if (reduce) render();
      });
      ro.observe(wrap);

      const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
      io.observe(wrap);
      const onVisibility = () => (document.hidden ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);

      let st: ScrollTrigger | undefined;
      if (!reduce) {
        window.addEventListener("pointermove", onPointer, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        if (triggerRef.current) {
          st = ScrollTrigger.create({
            trigger: triggerRef.current,
            start: "top top",
            end: "bottom top",
            onUpdate: (self) => (uniforms.uScatter.value = self.progress),
          });
        }
      }

      themeHook.current = () => {
        applyTheme();
        if (reduce) render();
      };

      render();
      setReady(true);

      cleanup = () => {
        stop();
        ro.disconnect();
        io.disconnect();
        st?.kill();
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        canvas.remove();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    })().catch(() => setFailed(true));

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduce, triggerRef]);

  useEffect(() => {
    // wait one frame so the new CSS variables are applied before reading them
    const id = requestAnimationFrame(() => themeHook.current());
    return () => cancelAnimationFrame(id);
  }, [theme]);

  if (failed) {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-end justify-end overflow-hidden" aria-hidden="true">
        <img
          src={portraitFallback}
          alt=""
          className="mr-[6vw] h-[88%] w-auto object-contain opacity-60 grayscale [mask-image:linear-gradient(to_top,transparent,black_30%)]"
        />
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
