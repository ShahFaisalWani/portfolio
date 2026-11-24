import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";
import { createShader, cssColor, fit, GLSL_COMMON, mix, visibleLoop, type Rgb } from "@/lib/gl";

/*
  The footer's light: a mesh gradient. Four color points drift on slow orbits over a
  domain-warped plane and blend into each other, with moving film grain so the bands never
  step. It gathers at the bottom of the page, where the wordmark fades into it. Starts when
  the footer is near; one still frame under reduced motion; a CSS glow without WebGL.
*/

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBg, uC1, uC2, uC3, uC4;
${GLSL_COMMON}

float blob(vec2 p, vec2 c, float r) { vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * asp, uv.y);
  float t = uTime * 0.11;

  // warp the plane so the blends fold into each other like a mesh
  vec2 q = p + 0.22 * vec2(noise(p * 1.4 + t), noise(p * 1.4 - t + 5.2)) - 0.11;
  q += 0.06 * vec2(sin(q.y * 3.1 + t * 2.3), cos(q.x * 2.7 - t * 1.9));

  vec3 col = uBg;
  col = mix(col, uC4, 0.9 * blob(q, vec2(asp * (0.3 + 0.18 * sin(t * 1.1)), 0.05 + 0.08 * cos(t * 1.4)), 0.55));
  col = mix(col, uC1, 0.95 * blob(q, vec2(asp * (0.72 + 0.14 * sin(t * 1.3 + 1.0)), 0.04 + 0.07 * cos(t * 1.2)), 0.4));
  col = mix(col, uC2, 0.85 * blob(q, vec2(asp * (0.48 + 0.2 * cos(t * 0.8)), 0.24 + 0.1 * sin(t * 1.7)), 0.34));
  col = mix(col, uC3, 0.7 * blob(q, vec2(asp * (0.88 + 0.08 * cos(t * 1.6)), 0.02 + 0.05 * sin(t * 0.9)), 0.22));

  // the light lives low on the page and fades out upward, under the copy
  float rise = 1.0 - smoothstep(0.0, 0.42, uv.y);
  col = mix(uBg, col, rise);
  col += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 113.0) - 0.5) * 0.05;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function MeshGradient({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const [fallback, setFallback] = useState(false);
  const recolor = useRef<() => void>(() => {});

  useEffect(() => recolor.current(), [theme]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cleanup = () => {};
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const shader = createShader(canvas, FRAG);
        if (!shader) return setFallback(true);
        const { gl, u, draw } = shader;
        let t = 12;
        const size = () => {
          fit(canvas, 1.5);
          gl.uniform2f(u("uRes"), canvas.width, canvas.height);
        };
        const render = () => {
          gl.uniform1f(u("uTime"), t);
          draw();
        };
        size();
        const ro = new ResizeObserver(() => {
          size();
          render();
        });
        ro.observe(canvas);
        // a GPU reset blanks the canvas: fall back to the CSS glow
        let stop = () => {};
        const onLost = (e: Event) => {
          e.preventDefault();
          stop();
          delete canvas.dataset.ready;
          setFallback(true);
        };
        canvas.addEventListener("webglcontextlost", onLost);
        recolor.current = () => {
          const bg = cssColor("--canvas");
          const ink = cssColor("--ink");
          const accent = cssColor("--accent");
          const light = document.documentElement.getAttribute("data-theme") === "light";
          const set = (n: string, c: Rgb) => gl.uniform3fv(u(n), c);
          set("uBg", bg);
          set("uC1", light ? mix(bg, accent, 0.55) : accent);
          set("uC2", light ? mix(bg, accent, 0.3) : mix(bg, accent, 0.45));
          set("uC3", light ? mix(bg, [1, 1, 1], 0.7) : mix(accent, ink, 0.7));
          set("uC4", light ? mix(bg, accent, 0.16) : mix(bg, accent, 0.22));
          if (reduce) render();
        };
        recolor.current();
        render();
        canvas.dataset.ready = "";
        const teardown = () => {
          ro.disconnect();
          canvas.removeEventListener("webglcontextlost", onLost);
          recolor.current = () => {};
          shader.dispose();
        };
        if (reduce) {
          cleanup = teardown;
          return;
        }
        let last = 0;
        stop = visibleLoop(canvas, (now) => {
          t += last ? Math.min(0.05, (now - last) / 1000) : 0;
          last = now;
          render();
        });
        cleanup = () => {
          stop();
          teardown();
        };
      },
      { rootMargin: "60% 0px" },
    );
    io.observe(canvas);
    return () => {
      io.disconnect();
      cleanup();
    };
  }, [reduce]);

  return (
    <>
      <canvas ref={ref} aria-hidden="true" className="fade-ready pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      {fallback && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[60%] bg-[radial-gradient(60%_80%_at_70%_100%,color-mix(in_oklab,var(--accent)_55%,transparent),transparent_70%)]"
        />
      )}
    </>
  );
}
