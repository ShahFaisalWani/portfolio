import { useEffect, useSyncExternalStore } from "react";

/*
  UI sound, synthesized with Web Audio: no files to download, every sound is a few oscillators
  and a burst of filtered noise shaped by an envelope. Off by default and remembered per visitor.
  The AudioContext is created on the click that turns sound on, which is the user gesture
  browsers require before audio can start.

  hover: a short high tick when the pointer reaches a new link or button
  click: a soft low "thock" with a noise transient on press
  on / off: two notes, rising for on and falling for off (switches, accordions, the theme)
  collide: a wooden tap scaled by impact speed (the toolbox pills)
*/

const KEY = "sound-on";
let enabled = false;
// browsers only let audio start after a click or key press: until then, stay silent instead of warning
let unlocked = false;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
const listeners = new Set<() => void>();

function readStored() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
    // one second of white noise, reused by every transient
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(c: AudioContext, at: number, f0: number, f1: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function burst(c: AudioContext, at: number, freq: number, q: number, dur: number, gain: number) {
  const s = c.createBufferSource();
  s.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(master!);
  s.start(at, Math.random() * 0.5);
  s.stop(at + dur + 0.02);
}

export type Sound = "hover" | "click" | "on" | "off" | "collide";

let lastHover = 0;
let lastCollide = 0;

export function play(kind: Sound, strength = 1) {
  if (!enabled || !unlocked) return;
  const c = audio();
  if (!c || !master) return;
  const t = c.currentTime + 0.002;
  switch (kind) {
    case "hover": {
      if (t - lastHover < 0.045) return;
      lastHover = t;
      tone(c, t, 2300, 1900, 0.035, 0.022);
      burst(c, t, 6000, 2, 0.012, 0.012);
      break;
    }
    case "click": {
      tone(c, t, 420, 140, 0.11, 0.11, "triangle");
      burst(c, t, 2600, 1.4, 0.018, 0.05);
      break;
    }
    case "on": {
      tone(c, t, 660, 660, 0.09, 0.07, "triangle");
      tone(c, t + 0.07, 990, 990, 0.14, 0.07, "triangle");
      break;
    }
    case "off": {
      tone(c, t, 880, 880, 0.09, 0.06, "triangle");
      tone(c, t + 0.07, 520, 520, 0.14, 0.06, "triangle");
      break;
    }
    case "collide": {
      if (t - lastCollide < 0.035) return;
      lastCollide = t;
      const k = Math.min(1, strength);
      burst(c, t, 700 + Math.random() * 500, 3, 0.05 + k * 0.04, 0.03 + k * 0.12);
      tone(c, t, 240 + Math.random() * 80, 180, 0.06, 0.02 + k * 0.05, "sine");
      break;
    }
  }
}

export const soundStore = {
  get: () => enabled,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
  set(v: boolean) {
    if (v === enabled) return;
    if (!v) play("off");
    enabled = v;
    if (v) play("on");
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {
      /* private mode */
    }
    listeners.forEach((fn) => fn());
  },
};

export function useSoundOn() {
  return useSyncExternalStore(soundStore.subscribe, soundStore.get, () => false);
}

const INTERACTIVE = "a[href], button, [role='button'], summary, label[for], [data-sound]";

/*
  One delegated listener pair for the whole page: a hover tick when the pointer reaches a new
  control, and on press a click, or the on/off pair for anything that toggles (aria-expanded,
  aria-pressed, or data-sound="toggle").
*/
export function useUiSounds() {
  useEffect(() => {
    // a remembered "on" can't make sound until the visitor interacts: the first gesture unlocks the context
    if (readStored()) {
      enabled = true;
      listeners.forEach((fn) => fn());
    }
    const unlock = () => (unlocked = true);
    document.addEventListener("pointerdown", unlock, { capture: true, once: true });
    document.addEventListener("keydown", unlock, { capture: true, once: true });
    let last: Element | null = null;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element).closest(INTERACTIVE);
      if (el === last) return;
      last = el;
      if (el && !el.hasAttribute("disabled")) play("hover");
    };
    // data-sound="self": the control plays its own sound (the sound switch, the theme switch)
    const press = (el: Element | null) => {
      if (!el || el.hasAttribute("disabled") || el.getAttribute("data-sound") === "self") return;
      const state = el.getAttribute("aria-expanded") ?? el.getAttribute("aria-pressed");
      if (state !== null) play(state === "true" ? "off" : "on");
      else play("click");
    };
    const onDown = (e: PointerEvent) => press((e.target as Element).closest(INTERACTIVE));
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
      press((e.target as Element).closest?.(INTERACTIVE) ?? null);
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", unlock, { capture: true });
      document.removeEventListener("keydown", unlock, { capture: true });
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
}
