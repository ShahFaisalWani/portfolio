import { useMemo, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { certs, type Cert } from "@/content/site";

/*
  Certificates as a physical deck. Swipe the top card away (or use the arrows)
  to send it to the back; picking an entry in the list brings that card to the top.
*/

const GROUPS: Cert["group"][] = ["Academic", "Competitions", "Courses"];
const VISIBLE = 4;
const tilt = (id: string) => ((id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 7) - 3) * 0.9;

function Card({
  cert,
  depth,
  onSwipe,
  reduce,
}: {
  cert: Cert;
  depth: number;
  onSwipe: (dir: 1 | -1) => void;
  reduce: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-400, 400], [-14, 14]);
  const top = depth === 0;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 600;
    if (!swipe) {
      animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
      return;
    }
    const dir = (info.offset.x || info.velocity.x) > 0 ? 1 : -1;
    animate(x, dir * 700, { duration: 0.3, ease: [0.4, 0, 1, 1] }).then(() => {
      onSwipe(dir as 1 | -1);
      x.set(0);
    });
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{ zIndex: 20 - depth }}
      initial={false}
      animate={{
        y: Math.min(depth, VISIBLE) * 16,
        scale: 1 - Math.min(depth, VISIBLE) * 0.045,
        opacity: depth < VISIBLE ? 1 : 0,
      }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
    >
      <motion.div
        className={`h-full w-full ${top ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
        style={{ x, rotate }}
        drag={top && !reduce ? "x" : false}
        dragElastic={0.9}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        <div
          className="h-full w-full overflow-hidden rounded-[16px] bg-paper shadow-[0_1px_0_rgb(255_255_255/0.4)_inset,0_30px_60px_-20px_rgb(0_0_0/0.5)] transition-transform duration-700"
          style={{ transform: `rotate(${depth === 0 ? 0 : tilt(cert.id)}deg)` }}
        >
          <img
            src={cert.image}
            alt={depth === 0 ? `${cert.title}, ${cert.issuer}` : ""}
            draggable={false}
            loading="lazy"
            className={`h-full w-full ${cert.tall ? "object-contain p-3" : "object-cover"}`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Recognition() {
  const reduce = useReducedMotion() ?? false;
  const [order, setOrder] = useState<string[]>(() => certs.map((c) => c.id));
  const byId = useMemo(() => Object.fromEntries(certs.map((c) => [c.id, c])), []);
  const current = byId[order[0]];

  const cycle = (dir: 1 | -1) =>
    setOrder((o) => (dir === 1 ? [...o.slice(1), o[0]] : [o[o.length - 1], ...o.slice(0, -1)]));

  const bringToTop = (id: string) =>
    setOrder((o) => {
      const i = o.indexOf(id);
      return [...o.slice(i), ...o.slice(0, i)];
    });

  return (
    <section id="section_recognition" aria-label="Certificates and awards" className="relative px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1680px]">
        <h2 className="type-title">Certificates and awards.</h2>

        <div className="mt-14 grid items-start gap-14 md:mt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-24">
          <div className="lg:sticky lg:top-28">
            <div className="relative mx-auto aspect-[10/7] w-full max-w-[44rem] touch-pan-y select-none">
              {order.map((id, depth) => (
                <Card key={id} cert={byId[id]} depth={depth} onSwipe={cycle} reduce={reduce} />
              ))}
            </div>
            <div className="mx-auto mt-14 flex max-w-[44rem] items-start justify-between gap-6">
              <p aria-live="polite" className="min-h-[3.2em]">
                <span className="block text-[1.05rem] font-[580] tracking-[-0.01em]">{current.title}</span>
                <span className="mt-1 block text-[0.92rem] text-muted">
                  {current.issuer}
                  {current.year ? `, ${current.year}` : ""}
                </span>
              </p>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="btn btn-secondary size-11 p-0" onClick={() => cycle(-1)} aria-label="Previous certificate">
                  <ArrowLeft size={16} weight="bold" aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-secondary size-11 p-0" onClick={() => cycle(1)} aria-label="Next certificate">
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-12">
            {GROUPS.map((g) => (
              <div key={g}>
                <h3 className="type-meta text-muted">{g}</h3>
                <ul className="mt-4 border-t border-hairline">
                  {certs
                    .filter((c) => c.group === g)
                    .map((c) => {
                      const on = c.id === current.id;
                      return (
                        <li key={c.id} className="border-b border-hairline">
                          <button
                            type="button"
                            onClick={() => bringToTop(c.id)}
                            aria-pressed={on}
                            className="group grid w-full grid-cols-[1fr_auto] items-baseline gap-4 py-4 text-left"
                          >
                            <span
                              className={`text-[1.05rem] font-[540] tracking-[-0.01em] transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5 ${
                                on ? "text-ink" : "text-muted group-hover:text-ink"
                              }`}
                            >
                              {on && <span aria-hidden="true" className="mr-2.5 inline-block h-px w-4 translate-y-[-0.3em] bg-accent" />}
                              {c.title}
                            </span>
                            <span className="type-meta text-muted">{c.year ?? ""}</span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
