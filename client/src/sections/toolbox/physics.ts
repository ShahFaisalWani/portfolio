import Matter from "matter-js";

/*
  Drives real DOM pills with Matter.js bodies. The DOM keeps text crisp and
  accessible; the physics only writes transforms. Loaded on demand.
*/

const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;

export type PhysicsHandle = { pause: () => void; resume: () => void; destroy: () => void };

export function startPhysics(
  container: HTMLElement,
  items: HTMLElement[],
  { draggable }: { draggable: boolean },
): PhysicsHandle {
  const engine = Engine.create({ gravity: { x: 0, y: 1.05 } });
  const world = engine.world;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  let W = container.clientWidth;
  let H = container.clientHeight;
  const T = 400;
  const floor = Bodies.rectangle(W / 2, H + T / 2, W * 3, T, { isStatic: true });
  const left = Bodies.rectangle(-T / 2, -H, T, H * 6, { isStatic: true });
  const right = Bodies.rectangle(W + T / 2, -H, T, H * 6, { isStatic: true });
  Composite.add(world, [floor, left, right]);

  const sizes = items.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
  const bodies = items.map((_el, i) => {
    const { w, h } = sizes[i];
    const b = Bodies.rectangle(rand(w / 2 + 8, W - w / 2 - 8), -rand(60, H * 1.4) - i * 26, w, h, {
      chamfer: { radius: h / 2 - 0.5 },
      restitution: 0.32,
      friction: 0.3,
      frictionAir: 0.014,
      density: 0.0018,
    });
    Body.setAngle(b, rand(-0.5, 0.5));
    return b;
  });
  Composite.add(world, bodies);

  items.forEach((el) => {
    el.style.position = "absolute";
    el.style.left = "0";
    el.style.top = "0";
  });

  let mouseConstraint: Matter.MouseConstraint | null = null;
  if (draggable) {
    const mouse = Mouse.create(container);
    // Matter listens to the wheel and blocks page scroll; give the wheel back to the page.
    const m = mouse as unknown as { mousewheel: EventListener };
    container.removeEventListener("wheel", m.mousewheel);
    container.removeEventListener("mousewheel", m.mousewheel);
    container.removeEventListener("DOMMouseScroll", m.mousewheel);
    mouseConstraint = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08 } });
    Composite.add(world, mouseConstraint);
    Events.on(mouseConstraint, "startdrag", (e) => {
      const i = bodies.indexOf((e as unknown as { body: Matter.Body }).body);
      if (i >= 0) items[i].dataset.drag = "true";
      container.dataset.dragging = "true";
    });
    Events.on(mouseConstraint, "enddrag", (e) => {
      const i = bodies.indexOf((e as unknown as { body: Matter.Body }).body);
      if (i >= 0) delete items[i].dataset.drag;
      delete container.dataset.dragging;
    });
  }

  // Tap, Enter or Space flicks the pill upward. `click` never fires for a touch
  // that turned into a page scroll, and mouse clicks are left to the drag constraint.
  const flicks = items.map((el, i) => {
    const flick = (e: Event) => {
      if (draggable && (e as PointerEvent).pointerType === "mouse") return;
      const b = bodies[i];
      Body.setVelocity(b, { x: rand(-6, 6), y: -rand(12, 17) });
      Body.setAngularVelocity(b, rand(-0.2, 0.2));
    };
    el.addEventListener("click", flick);
    return flick;
  });

  const ro = new ResizeObserver(() => {
    W = container.clientWidth;
    H = container.clientHeight;
    Body.setPosition(floor, { x: W / 2, y: H + T / 2 });
    Body.setPosition(right, { x: W + T / 2, y: -H });
    bodies.forEach((b) => {
      if (b.position.x > W) Body.setPosition(b, { x: W - 60, y: b.position.y });
    });
  });
  ro.observe(container);

  let raf = 0;
  let last = 0;
  const step = (now: number) => {
    raf = requestAnimationFrame(step);
    const dt = Math.min(32, last ? now - last : 16.67);
    last = now;
    Engine.update(engine, Math.min(dt, 1000 / 60));
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const { w, h } = sizes[i];
      // anything that escapes gets dropped back in
      if (b.position.y > H + 200 || b.position.x < -200 || b.position.x > W + 200) {
        Body.setPosition(b, { x: W / 2, y: -100 });
        Body.setVelocity(b, { x: 0, y: 0 });
      }
      items[i].style.transform = `translate3d(${b.position.x - w / 2}px, ${b.position.y - h / 2}px, 0) rotate(${b.angle}rad)`;
    }
  };

  const resume = () => {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(step);
  };
  const pause = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  resume();

  return {
    pause,
    resume,
    destroy: () => {
      pause();
      ro.disconnect();
      items.forEach((el, i) => {
        el.removeEventListener("click", flicks[i]);
        el.style.cssText = "";
        delete el.dataset.drag;
      });
      if (mouseConstraint) {
        Events.off(mouseConstraint, "startdrag");
        Events.off(mouseConstraint, "enddrag");
        const m = mouseConstraint.mouse as unknown as Record<string, EventListener>;
        const el = container;
        el.removeEventListener("mousemove", m.mousemove);
        el.removeEventListener("mousedown", m.mousedown);
        el.removeEventListener("mouseup", m.mouseup);
        el.removeEventListener("touchmove", m.mousemove);
        el.removeEventListener("touchstart", m.mousedown);
        el.removeEventListener("touchend", m.mouseup);
        delete container.dataset.dragging;
      }
      Composite.clear(world, false);
      Engine.clear(engine);
    },
  };
}
