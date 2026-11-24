/*
  A photo that comes apart in pixels and shows what is under it. The photo is drawn as a grid of
  small square cards (one draw, all motion in the vertex shader). As the reveal runs, windows open
  over each picture underneath (the caller passes their boxes): around each window the cards drop
  in resolution in steps (sharp, then 16, 8, 4, 2 and 1 blocks per card, each block the average
  colour under it), the card becomes a single pixel, comes loose, tumbles off the plate toward the
  camera, falls away under gravity and fades. Windows open from the middle of each picture out,
  one picture after another, and the lattice between them goes last. At 0 the cards sit edge to
  edge on exact boundaries, so the photo is the photo; at 1 nothing is left.

  WebGL 2 (GLSL 3.00: flat varyings and textureLod for the block averages). Returns null without it.
*/

export type Rect = { x: number; y: number; w: number; h: number };
export type Window = Rect & { delay: number };
export type CrumblePhoto = { src: string; w: number; h: number; pos: readonly [number, number] };

const MAX_WINDOWS = 8;
/* how far into each card's life it is a pixel before it comes loose */
const SPREAD = 1.35;

const VERT = /* glsl */ `#version 300 es
precision highp float;
in vec2 a_corner;
in vec2 a_cell;
in vec3 a_rand;

uniform vec2 u_stage;
uniform float u_cam;
uniform vec4 u_plate;
uniform vec2 u_grid;
uniform vec4 u_crop;
uniform vec4 u_win[${MAX_WINDOWS}];
uniform float u_delay[${MAX_WINDOWS}];
uniform int u_wins;
uniform float u_fmax;
uniform float u_p;

out vec2 v_c;
out vec2 v_face;
out vec2 v_local;
flat out vec2 v_uv0;
flat out vec2 v_uvs;
flat out float v_n;
flat out vec2 v_half;
flat out float v_gap;
flat out float v_shade;
flat out float v_glint;
flat out float v_alpha;

vec3 rot(vec3 v, vec3 k, float a) {
  float c = cos(a);
  float s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}

void main() {
  vec2 cs = u_plate.zw / u_grid;
  vec2 center = u_plate.xy + (a_cell + 0.5) * cs;

  // when this card goes: the nearest window, from its middle out (a rounded box the shape of the picture)
  float f = 10.0;
  vec2 away = vec2(0.0, -1.0);
  for (int i = 0; i < ${MAX_WINDOWS}; i++) {
    if (i >= u_wins) break;
    vec4 w = u_win[i];
    vec2 d = (center - w.xy) / w.zw;
    vec2 ad = abs(d);
    float o = u_delay[i] + mix(max(ad.x, ad.y), length(ad) * 0.7071, 0.45) * 0.62;
    if (o < f) {
      f = o;
      vec2 px = d * w.zw;
      away = length(px) > 0.001 ? normalize(px) : vec2(0.0, -1.0);
    }
  }
  f = clamp((f + (a_rand.x - 0.5) * 0.07) / u_fmax, 0.0, 1.0);
  float u = clamp(u_p * (1.0 + ${SPREAD.toFixed(2)}) - f * ${SPREAD.toFixed(2)}, 0.0, 1.0);
  // the whole photo coarsens slowly from the start (down to 4 blocks a card); near a window it goes all the way to one
  float a = max(clamp(u / 0.5, 0.0, 1.0), clamp(u_p * 1.8 - f * 0.6, 0.0, 0.62));
  float tau = clamp((u - 0.5) / 0.5, 0.0, 1.0);
  if (tau >= 0.999) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  // resolution steps: sharp, then 16, 8, 4, 2, 1 blocks across the card
  float n = a < 0.12 ? 0.0 : exp2(4.0 - min(4.0, floor((a - 0.12) / 0.88 * 5.0)));
  // a single pixel parts from its neighbours just before it comes loose
  float k = 1.0 - 0.12 * smoothstep(0.75, 1.0, a);

  // loose: off the plate toward the camera, tumbling, blown out of the window, then down
  float ang = a_rand.y * 6.2831853;
  vec3 axis = vec3(cos(ang), sin(ang), 0.0);
  float spin = tau * (2.4 + 2.6 * a_rand.z);
  vec3 v = rot(vec3(a_corner * k, 0.0), axis, spin);
  float lift = 110.0 * sin(min(tau * 1.8, 1.0) * 1.5707963) * (0.6 + 0.8 * a_rand.z);
  vec2 drift = (away * (50.0 + 90.0 * a_rand.x) + vec2((a_rand.y - 0.5) * 80.0, 0.0)) * tau;
  vec2 p = u_plate.xy + (a_cell + 0.5 + v.xy) * cs + drift + vec2(0.0, 1000.0 * tau * tau);
  float z = v.z * cs.x + lift;

  float D = u_cam;
  float wc = D - z;
  vec2 c = vec2(p.x - u_stage.x * 0.5, u_stage.y * 0.5 - p.y);
  gl_Position = vec4(c.x * D / (u_stage.x * 0.5), c.y * D / (u_stage.y * 0.5), -z / 4000.0 * wc, wc);

  // light from the top left, exactly 1 on a card facing the camera; both sides of a card are printed
  vec3 nrm = rot(vec3(0.0, 0.0, 1.0), axis, spin);
  if (nrm.z < 0.0) nrm = -nrm;
  vec3 L = normalize(vec3(-0.35, -0.5, 0.8));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  v_shade = clamp(dot(nrm, L) / L.z, 0.35, 1.3);
  v_glint = max(pow(max(dot(nrm, H), 0.0), 48.0) - pow(H.z, 48.0), 0.0) * 0.5;

  v_c = a_corner + 0.5;
  v_face = (a_cell + 0.5 + a_corner) * cs;
  v_uv0 = u_crop.xy + a_cell / u_grid * u_crop.zw;
  v_uvs = u_crop.zw / u_grid;
  v_n = n;
  v_half = 0.5 * k * cs;
  v_local = a_corner * k * cs;
  v_gap = max(1.0 - k, min(1.0, tau * 4.0));
  v_alpha = 1.0 - smoothstep(0.5, 1.0, tau);
}
`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_size;
uniform float u_dpr;
uniform float u_cardTex;
uniform int u_pass;

in vec2 v_c;
in vec2 v_face;
in vec2 v_local;
flat in vec2 v_uv0;
flat in vec2 v_uvs;
flat in float v_n;
flat in vec2 v_half;
flat in float v_gap;
flat in float v_shade;
flat in float v_glint;
flat in float v_alpha;
out vec4 o;

float box(vec2 p, vec2 h, float r) {
  vec2 q = abs(p) - (h - r);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  // opaque cards first with depth, then the fading ones blended over them
  if ((u_pass == 0) != (v_alpha >= 0.999)) discard;
  float a = clamp(0.5 - box(v_face - u_size * 0.5, u_size * 0.5, 16.0) * u_dpr, 0.0, 1.0);
  if (v_gap > 0.001) a *= clamp(0.5 - box(v_local, v_half, 2.5 * clamp(v_gap * 6.0, 0.0, 1.0)) * u_dpr, 0.0, 1.0);
  a *= v_alpha;
  if (a <= 0.003) discard;

  vec3 col;
  if (v_n < 0.5) {
    col = texture(u_tex, v_uv0 + v_c * v_uvs).rgb;
  } else {
    // one block: the average colour under it, read from the mip level its size calls for
    vec2 q = (min(floor(v_c * v_n), v_n - 1.0) + 0.5) / v_n;
    col = textureLod(u_tex, v_uv0 + q * v_uvs, log2(max(1.0, u_cardTex / v_n))).rgb;
  }
  if (v_gap > 0.001) {
    vec2 e = v_half - abs(v_local);
    col *= mix(1.0, 0.65 + 0.35 * smoothstep(0.0, 1.4, min(e.x, e.y)), clamp(v_gap * 4.0, 0.0, 1.0));
  }
  col = col * v_shade + v_glint;
  o = vec4(col * a, a);
}
`;

export type Crumble = {
  /* stage: the canvas box; plate: where the photo sits; windows: the pictures underneath, in reveal order by delay (canvas CSS px) */
  layout: (stage: { w: number; h: number }, plate: Rect, windows: Window[]) => void;
  /* 0: the photo, 1: gone */
  render: (p: number) => void;
  dispose: () => void;
};

export function createCrumble(canvas: HTMLCanvasElement, photo: CrumblePhoto, onReady: () => void): Crumble | null {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, depth: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  if (!gl) return null;

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
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
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
  const loc = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!loc.has(name)) loc.set(name, gl.getUniformLocation(program, name));
    return loc.get(name)!;
  };

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  const ibo = gl.createBuffer();
  const STRIDE = 7;
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  const attrib = (name: string, size: number, offset: number) => {
    const a = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
  };
  attrib("a_corner", 2, 0);
  attrib("a_cell", 2, 2);
  attrib("a_rand", 3, 4);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u("u_tex"), 0);
  let texWidth = 0;
  let disposed = false;
  const img = new Image();
  img.decoding = "async";
  img.src = photo.src;
  img
    .decode()
    .then(() => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      texWidth = img.naturalWidth;
      cardTex();
      onReady();
    })
    .catch(() => {});

  let cards = 0;
  let cols = 1;
  let crop = [0, 0, 1, 1];
  const cardTex = () => gl.uniform1f(u("u_cardTex"), ((crop[2] / cols) * texWidth) || 1);

  const layout: Crumble["layout"] = (s, plate, windows) => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(s.w * dpr));
    canvas.height = Math.max(1, Math.round(s.h * dpr));

    // square cards, about 20px on a big screen and 13px on a phone, the grid filling the plate exactly
    cols = Math.max(12, Math.round(plate.w / (plate.w > 700 ? 20 : 13)));
    const rows = Math.max(1, Math.round(plate.h / (plate.w / cols)));
    cards = cols * rows;

    // object-fit: cover, at the photo's focus
    const a = photo.w / photo.h;
    const box = plate.w / plate.h;
    crop = a > box ? [(1 - box / a) * photo.pos[0], 0, box / a, 1] : [0, (1 - a / box) * photo.pos[1], 1, a / box];

    const data = new Float32Array(cards * 4 * STRIDE);
    const index = new Uint32Array(cards * 6);
    const corners = [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5];
    for (let id = 0; id < cards; id++) {
      const r = [Math.random(), Math.random(), Math.random()];
      for (let v = 0; v < 4; v++) {
        const o = (id * 4 + v) * STRIDE;
        data.set([corners[v * 2], corners[v * 2 + 1], id % cols, Math.floor(id / cols), r[0], r[1], r[2]], o);
      }
      index.set([id * 4, id * 4 + 1, id * 4 + 2, id * 4, id * 4 + 2, id * 4 + 3], id * 6);
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);

    const wins = windows.slice(0, MAX_WINDOWS);
    gl.uniform2f(u("u_stage"), s.w, s.h);
    gl.uniform1f(u("u_cam"), s.h / 2 / Math.tan((45 * Math.PI) / 360));
    gl.uniform4f(u("u_plate"), plate.x, plate.y, plate.w, plate.h);
    gl.uniform2f(u("u_size"), plate.w, plate.h);
    gl.uniform2f(u("u_grid"), cols, rows);
    gl.uniform4f(u("u_crop"), crop[0], crop[1], crop[2], crop[3]);
    gl.uniform1i(u("u_wins"), wins.length);
    if (wins.length) {
      gl.uniform4fv(u("u_win[0]"), new Float32Array(wins.flatMap((w) => [w.x + w.w / 2, w.y + w.h / 2, w.w / 2, w.h / 2])));
      gl.uniform1fv(u("u_delay[0]"), new Float32Array(wins.map((w) => w.delay)));
    }
    // the last card to go: the latest window's far corner, plus jitter
    gl.uniform1f(u("u_fmax"), Math.max(0, ...wins.map((w) => w.delay)) + 0.62 * 1.08 + 0.035);
    gl.uniform1f(u("u_dpr"), dpr);
    cardTex();
  };

  const render: Crumble["render"] = (p) => {
    if (!cards) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.uniform1f(u("u_p"), p);
    gl.depthMask(true);
    gl.uniform1i(u("u_pass"), 0);
    gl.drawElements(gl.TRIANGLES, cards * 6, gl.UNSIGNED_INT, 0);
    gl.depthMask(false);
    gl.uniform1i(u("u_pass"), 1);
    gl.drawElements(gl.TRIANGLES, cards * 6, gl.UNSIGNED_INT, 0);
  };

  return {
    layout,
    render,
    dispose: () => {
      disposed = true;
      gl.deleteTexture(tex);
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ibo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
