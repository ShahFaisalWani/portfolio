import { useEffect, useRef, useState, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useTheme } from "@/lib/theme";
import { afterLoad, createShader, cssColor, fit, GLSL_COMMON, loadTexture, mix, uncovered, visibleLoop } from "@/lib/gl";
import portraitUrl from "@/assets/media/faisal-cut.webp";
import StaticPortrait from "./StaticPortrait";

/*
  The hero as raw signal. One full-bleed shader draws three layers:
  - a pixel field: soft light posterized into square cells, drifting like a slow spectrogram,
    switching on cell by cell when it boots
  - the portrait as 1-bit ordered dither on its own dot grid, scanned in from the top,
    cut out of the field so the silhouette reads against the light
  - a lens under the pointer that resolves both: the field turns smooth and the photo comes
    back in full color, slightly magnified
  Scrolling away pushes the layers apart (the field lags most) and coarsens the dither, so
  the signal degrades as you leave. Touch devices get a lens that drifts over the face.
*/

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes, uLens, uMouse, uFieldOff;
uniform float uDpr, uTime, uLight, uBoot, uScan, uScroll, uDot, uCell, uLensR, uLensOn, uMouseOn;
uniform vec3 uS0, uS1, uS2, uS3, uS4, uCanvas, uInk, uAccent;
uniform sampler2D uPhoto;
uniform vec4 uRect;
${GLSL_COMMON}

float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

vec3 ramp(float v) {
  v = clamp(v, 0.0, 1.0) * 4.0;
  vec3 c = mix(uS0, uS1, clamp(v, 0.0, 1.0));
  c = mix(c, uS2, clamp(v - 1.0, 0.0, 1.0));
  c = mix(c, uS3, clamp(v - 2.0, 0.0, 1.0));
  return mix(c, uS4, clamp(v - 3.0, 0.0, 1.0));
}

float blob(vec2 p, vec2 c, float r) { vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }

float field(vec2 frag) {
  vec2 uv = (frag + uFieldOff) / uRes.y;
  float asp = uRes.x / uRes.y;
  float t = uTime;
  float v = 0.0;
  v += 0.9 * blob(uv, vec2(asp * 0.73 + 0.05 * sin(t * 0.21), 0.62 + 0.05 * cos(t * 0.17)), 0.34);
  v += 0.8 * blob(uv, vec2(asp * 0.98 + 0.06 * cos(t * 0.13), 0.04 + 0.04 * sin(t * 0.19)), 0.42);
  v += 0.35 * blob(uv, vec2(asp * (0.62 + 0.08 * sin(t * 0.09)), 0.2 + 0.08 * cos(t * 0.11)), 0.26);
  v *= 0.55 + 0.8 * noise(uv * 3.2 + vec2(t * 0.05, -t * 0.035));
  // keep the copy and the name on clean canvas: the light gathers right of center on wide
  // screens, and below the copy (behind the portrait) on tall ones
  float wide = smoothstep(asp * 0.3, asp * 0.62, uv.x + 0.12 * uv.y);
  float tall = (1.0 - smoothstep(0.46, 0.64, uv.y)) * smoothstep(0.1, 0.26, uv.y + 0.1 * uv.x);
  v *= mix(tall, wide, smoothstep(0.75, 1.05, asp));
  v += uMouseOn * 0.28 * blob(uv, (uMouse + uFieldOff) / uRes.y, 0.13);
  v = pow(max(v, 0.0), 1.35);
  return v * (1.0 - 0.8 * uScroll);
}

vec4 photo(vec2 frag) {
  vec2 uv = (frag - uRect.xy) / uRect.zw;
  uv.y = 1.0 - uv.y;
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  return texture2D(uPhoto, uv) * inside;
}

void main() {
  vec2 frag = gl_FragCoord.xy;

  // pixel field
  vec2 cell = floor(frag / uCell);
  float h = hash(cell);
  float age = uBoot - h * 0.85;
  float born = smoothstep(0.0, 0.1, age);
  float f = field((cell + 0.5) * uCell);
  float v = f * born;
  float q = v < 0.05 ? 0.0 : floor(v * 8.0 + bayer4(cell) * 0.85) / 8.0;
  vec2 inC = fract(frag / uCell);
  float gap = uDpr / uCell;
  float cellMask = step(gap, inC.x) * step(gap, inC.y);
  vec3 col = mix(uS0, ramp(q), cellMask);
  // cells flash the accent as they switch on, mostly where the light will settle, so the copy boots quietly
  float spark = (smoothstep(0.0, 0.03, age) - smoothstep(0.05, 0.16, age)) * step(hash(cell + 7.0), 0.35) * (0.12 + 0.88 * smoothstep(0.01, 0.12, f));
  col = mix(col, uAccent, spark * cellMask * 0.8);

  // portrait: ordered dither on a dot grid anchored to the photo
  vec2 dcell = floor((frag - uRect.xy) / uDot);
  vec2 dc = uRect.xy + (dcell + 0.5) * uDot;
  vec4 ph = photo(dc);
  float lum = dot(ph.rgb, vec3(0.299, 0.587, 0.114));
  float tone = mix(pow(smoothstep(0.02, 0.58, lum), 0.8), 0.9 * smoothstep(0.1, 0.98, 1.0 - lum), uLight);
  float duvY = 1.0 - (dc.y - uRect.y) / uRect.w;
  float scanY = uScan * 1.1 - 0.05;
  float sil = step(0.5, ph.a) * step(duvY, scanY);
  vec2 inD = fract((frag - uRect.xy) / uDot);
  // a one-pixel gap makes the dots read as an LED grid, but only once they are big enough to spare it
  float gd = uDot >= 5.0 ? 1.0 / uDot : 0.0;
  float dotMask = step(gd, inD.x) * step(gd, inD.y);
  float on = step(bayer8(dcell) + 0.002, tone) * sil * dotMask;
  col = mix(col, uCanvas, sil);
  col = mix(col, uInk, on);
  float line = step(0.5, ph.a) * (1.0 - smoothstep(0.0, 0.01, abs(duvY - scanY))) * step(uScan, 0.999);
  col = mix(col, uAccent, line);

  // lens: the resolved signal, magnified
  float dl = length(frag - uLens);
  float aa = 1.25 * uDpr;
  float lens = uLensOn * (1.0 - smoothstep(uLensR - aa, uLensR, dl));
  if (lens > 0.0) {
    vec2 m = uLens + (frag - uLens) / 1.14;
    vec4 mp = photo(m);
    vec3 res = mix(ramp(field(m)), mp.rgb, mp.a * step(1.0 - (m.y - uRect.y) / uRect.w, scanY));
    col = mix(col, res, lens);
  }
  col = mix(col, uAccent, uLensOn * (1.0 - smoothstep(0.0, aa, abs(dl - uLensR))));
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function HeroCanvas({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [mode, setMode] = useState<"wait" | "live" | "static">("wait");
  const recolor = useRef<() => void>(() => {});

  useEffect(() => recolor.current(), [theme]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      await afterLoad();
      await uncovered();
      const canvas = canvasRef.current;
      const section = sectionRef.current;
      if (disposed || !canvas || !section) return;
      const shader = createShader(canvas, FRAG);
      if (!shader) return setMode("static");
      const { gl, u, draw } = shader;
      let tex: Awaited<ReturnType<typeof loadTexture>>;
      try {
        tex = await loadTexture(gl, portraitUrl);
      } catch {
        shader.dispose();
        return setMode("static");
      }
      if (disposed) return shader.dispose();

      gl.uniform1i(u("uPhoto"), 0);

      recolor.current = () => {
        const canvasC = cssColor("--canvas");
        const ink = cssColor("--ink");
        const accent = cssColor("--accent");
        const light = document.documentElement.getAttribute("data-theme") === "light";
        const stops = light
          ? [canvasC, mix(canvasC, accent, 0.1), mix(canvasC, accent, 0.3), mix(canvasC, accent, 0.62), accent]
          : [canvasC, mix(canvasC, accent, 0.2), mix(canvasC, accent, 0.52), accent, mix(accent, ink, 0.62)];
        stops.forEach((c, i) => gl.uniform3fv(u(`uS${i}`), c));
        gl.uniform3fv(u("uCanvas"), canvasC);
        gl.uniform3fv(u("uInk"), ink);
        gl.uniform3fv(u("uAccent"), accent);
        gl.uniform1f(u("uLight"), light ? 1 : 0);
      };
      recolor.current();

      // layout, in css px with a bottom-left origin like gl_FragCoord
      // device pixels per css pixel; drops if the GPU can't hold 60 fps at full resolution
      let maxDpr = 2;
      let dpr = 1;
      let W = 0;
      let H = 0;
      const base = { x: 0, w: 0, h: 0 };
      let lensR = 118;
      let cellPx = 12;
      let dotPx = 3;
      const layout = () => {
        dpr = fit(canvas, maxDpr);
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        let h: number;
        let cx: number;
        if (W >= 1024) [h, cx] = [H * 0.94, W * 0.72];
        else if (W >= 640) [h, cx] = [H * 0.82, W * 0.68];
        else [h, cx] = [H * 0.68, W * 0.62];
        base.h = h;
        base.w = (h * tex.w) / tex.h;
        base.x = cx - base.w / 2;
        lensR = W >= 640 ? 118 : 84;
        cellPx = W >= 640 ? 12 : 9;
        dotPx = W >= 1024 ? 3 : 2.5;
        gl.uniform2f(u("uRes"), canvas.width, canvas.height);
        gl.uniform1f(u("uDpr"), dpr);
        gl.uniform1f(u("uCell"), Math.round(cellPx * dpr));
      };
      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(canvas);

      // pointer: lens target and parallax
      const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
      const ptr = { x: 0, y: 0, inside: false, moved: false };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const r = canvas.getBoundingClientRect();
        ptr.x = e.clientX - r.left;
        ptr.y = r.bottom - e.clientY;
        ptr.inside = true;
        ptr.moved = true;
      };
      const onLeave = () => (ptr.inside = false);
      section.addEventListener("pointermove", onMove);
      section.addEventListener("pointerleave", onLeave);

      let scroll = 0;
      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => (scroll = self.progress),
      });

      const s = { lx: 0, ly: 0, on: 0, px: 0, py: 0, mouseOn: 0 };
      let t0 = 0;
      let first = true;
      let prev = 0;
      let slow = 0;
      const frame = (now: number) => {
        if (!t0) t0 = now;
        // after the boot, a run of slow frames lowers the resolution a step (the dither is drawn
        // in device pixels, so it stays crisp; the frame just has fewer of them)
        if (prev && now - t0 > 2500) {
          slow = now - prev > 24 ? slow + 1 : Math.max(0, slow - 1);
          if (slow > 45 && maxDpr > 1) {
            maxDpr = Math.max(1, maxDpr - 0.5);
            slow = 0;
            layout();
          }
        }
        prev = now;
        const t = (now - t0) / 1000;
        const boot = Math.min(1, t / 1.5);
        const k = Math.min(1, Math.max(0, (t - 0.35) / 1.9));
        const scan = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

        // the lens follows the pointer once it has moved here; until then (and on touch) it drifts over the face
        const wander = !fine || !ptr.moved;
        const tx = wander ? base.x + base.w * (0.44 + 0.16 * Math.sin(t * 0.43)) : ptr.x;
        const ty = wander ? base.h * (0.74 + 0.08 * Math.sin(t * 0.31 + 1.2)) : ptr.y;
        const ease = wander ? 0.05 : 0.2;
        if (!s.lx && !s.ly) [s.lx, s.ly] = [tx, ty];
        s.lx += (tx - s.lx) * ease;
        s.ly += (ty - s.ly) * ease;
        const lensTarget = scan < 1 ? 0 : wander ? 1 : ptr.inside ? 1 : 0;
        s.on += (lensTarget - s.on) * 0.09;
        s.mouseOn += ((ptr.inside ? 1 : 0) - s.mouseOn) * 0.06;

        const nx = ptr.inside ? (ptr.x / W) * 2 - 1 : 0;
        const ny = ptr.inside ? (ptr.y / H) * 2 - 1 : 0;
        s.px += (nx - s.px) * 0.05;
        s.py += (ny - s.py) * 0.05;

        const rx = base.x + s.px * 14;
        const ry = -scroll * H * 0.32 + s.py * 8;
        gl.uniform4f(u("uRect"), rx * dpr, ry * dpr, base.w * dpr, base.h * dpr);
        gl.uniform2f(u("uFieldOff"), -s.px * 22 * dpr, (scroll * H * 0.55 - s.py * 12) * dpr);
        gl.uniform1f(u("uDot"), Math.max(2, Math.round(dotPx * dpr * (1 + scroll * 2.2))));
        gl.uniform2f(u("uLens"), s.lx * dpr, s.ly * dpr);
        gl.uniform1f(u("uLensR"), lensR * dpr * (0.55 + 0.45 * s.on));
        gl.uniform1f(u("uLensOn"), s.on < 0.01 ? 0 : s.on);
        gl.uniform2f(u("uMouse"), ptr.x * dpr, ptr.y * dpr);
        gl.uniform1f(u("uMouseOn"), s.mouseOn);
        gl.uniform1f(u("uTime"), t);
        gl.uniform1f(u("uBoot"), boot);
        gl.uniform1f(u("uScan"), scan);
        gl.uniform1f(u("uScroll"), scroll);
        draw();
        if (first) {
          first = false;
          canvas.dataset.ready = "";
          if (fine) section.dataset.cursor = "lens";
          setMode("live");
        }
      };
      let stop = visibleLoop(section, frame);

      // a GPU reset blanks the canvas: hand over to the still portrait
      const onLost = (e: Event) => {
        e.preventDefault();
        stop();
        stop = () => {};
        delete canvas.dataset.ready;
        delete section.dataset.cursor;
        setMode("static");
      };
      canvas.addEventListener("webglcontextlost", onLost);

      cleanup = () => {
        stop();
        canvas.removeEventListener("webglcontextlost", onLost);
        ro.disconnect();
        st.kill();
        section.removeEventListener("pointermove", onMove);
        section.removeEventListener("pointerleave", onLeave);
        delete section.dataset.cursor;
        recolor.current = () => {};
        gl.deleteTexture(tex.tex);
        shader.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [sectionRef]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className="fade-ready absolute inset-0 h-full w-full" />
      {mode === "static" && <StaticPortrait />}
    </>
  );
}
