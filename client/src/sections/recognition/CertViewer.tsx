import { useEffect, useRef, type RefObject } from "react";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import type { Cert } from "@/content/site";
import { drawable, drawMosaic, easeIn, easeOut, loadImage, shuffleOrder, sizeCanvas, tween, type Drawable } from "@/lib/mosaic";

/*
  Full-screen certificate viewer on a native <dialog> (focus trap, Escape, top layer). The paper
  arrives as pixels: squares of it drop in at random and shrink until they are the scan, and it
  leaves the same way, breaking into squares that fall out before the dialog fades. Next and
  previous break the paper up and resolve the next one in its place. All of it is drawn on one
  canvas over the dialog at the paper's own box; the real <img> is hidden meanwhile. Recognition
  gets these controls through onControls and handles the cell on the wall. Reduced motion: none of it.
*/

export type ViewerControls = {
  /* resolve the paper in (the dialog was just opened) */
  enter: () => Promise<void>;
  /* break the paper up; the caller closes the dialog afterwards */
  leave: () => Promise<void>;
  /* break up, apply the change, resolve the new paper */
  swap: (update: () => void) => Promise<void>;
};

const RADIUS = 16;

export default function CertViewer({
  dialogRef,
  onControls,
  cert,
  reduce,
  onRequestClose,
  onStep,
  onClosed,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onControls: (controls: ViewerControls | null) => void;
  cert: Cert | null;
  reduce: boolean;
  onRequestClose: () => void;
  onStep: (dir: 1 | -1) => void;
  onClosed: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const certRef = useRef(cert);
  const report = useRef(onControls);
  useEffect(() => {
    certRef.current = cert;
    report.current = onControls;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const canvas = canvasRef.current;
    if (!dialog || !canvas) return;
    const paper = () => dialog.querySelector<HTMLImageElement>("[data-cert-full]");
    // the full scan if it is decoded, else the wall's thumbnail of it (same picture, already loaded)
    const source = async (): Promise<Drawable | null> => {
      const img = paper();
      if (drawable(img)) return img;
      const c = certRef.current;
      if (!c) return null;
      const quick = await Promise.race([loadImage(c.image), new Promise<null>((r) => setTimeout(() => r(null), 160))]);
      return drawable(quick) ? quick : loadImage(c.thumb);
    };
    const box = () => {
      const r = paper()!.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    };
    const hidePaper = (v: boolean) => {
      const img = paper();
      if (img) img.style.opacity = v ? "0" : "";
    };
    const coarse = (w: number) => Math.max(18, w / 13);

    // squares drop in during the first half of the move while they shrink to the scan
    const resolveIn = async (ms: number) => {
      hidePaper(true);
      const src = await source();
      if (!src || !paper()) return;
      hidePaper(true);
      const rect = box();
      const grid = coarse(rect.w);
      const order = shuffleOrder(Math.ceil(rect.w / grid) * Math.ceil(rect.h / grid));
      await tween(ms, (t) => {
        const { ctx, w, h } = sizeCanvas(canvas, { width: innerWidth, height: innerHeight });
        ctx.clearRect(0, 0, w, h);
        drawMosaic(ctx, src, rect, grid + (1 - grid) * easeOut(t), { grid, keep: (i) => order[i] * 0.5 <= t, radius: RADIUS });
      });
      hidePaper(false);
      canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    };
    // squares grow, then fall out in the second half
    const breakUp = async (ms: number) => {
      const src = await source();
      if (!src || !paper()) return;
      const rect = box();
      const grid = coarse(rect.w);
      const order = shuffleOrder(Math.ceil(rect.w / grid) * Math.ceil(rect.h / grid));
      await tween(ms, (t) => {
        const { ctx, w, h } = sizeCanvas(canvas, { width: innerWidth, height: innerHeight });
        ctx.clearRect(0, 0, w, h);
        // the canvas has the first frame before the paper hides: no blank frame between them
        hidePaper(true);
        drawMosaic(ctx, src, rect, 1 + (grid - 1) * easeIn(Math.min(1, t * 1.6)), {
          grid,
          keep: (i) => 0.4 + order[i] * 0.6 > t,
          radius: RADIUS,
        });
      });
    };

    report.current({
      enter: () => resolveIn(620),
      leave: async () => {
        dialog.dataset.leaving = "";
        await breakUp(380);
      },
      swap: async (update) => {
        await breakUp(260);
        update();
        await resolveIn(480);
      },
    });
    return () => report.current(null);
  }, [dialogRef, reduce]);

  return (
    <dialog
      ref={dialogRef}
      className="sheet cert-viewer"
      aria-labelledby="cert-title"
      onCancel={(e) => {
        // Escape: run the animated close instead of the instant one
        e.preventDefault();
        onRequestClose();
      }}
      onClose={() => {
        delete dialogRef.current?.dataset.leaving;
        onClosed();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onRequestClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onStep(1);
        else if (e.key === "ArrowLeft") onStep(-1);
      }}
    >
      {cert && (
        <div
          className="flex h-full w-full flex-col items-center gap-6 px-4 pb-6 pt-20 md:flex-row md:gap-14 md:px-12 md:pb-12 md:pt-12"
          onClick={(e) => {
            if (e.target === e.currentTarget) onRequestClose();
          }}
        >
          <div
            className="flex min-h-0 w-full flex-1 items-center justify-center self-stretch"
            onClick={(e) => {
              if (e.target === e.currentTarget) onRequestClose();
            }}
          >
            <img
              data-cert-full
              src={cert.image}
              alt={`${cert.title}, ${cert.issuer}`}
              width={cert.w}
              height={cert.h}
              // opened with motion, it stays hidden until the pixels have resolved it
              style={reduce ? undefined : { opacity: 0 }}
              className="h-auto max-h-full w-auto max-w-full rounded-[16px] bg-paper object-contain shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]"
            />
          </div>
          <div data-cert-caption className="w-full shrink-0 md:w-[22rem] md:self-end">
            <p className="type-meta text-muted">{cert.group}</p>
            <h3 id="cert-title" className="type-heading mt-3 text-pretty">
              {cert.title}
            </h3>
            <p className="mt-3 text-[1rem] text-muted">
              {cert.issuer}
              {cert.year ? `, ${cert.year}` : ""}
            </p>
            <div className="mt-6 flex gap-2 md:mt-8">
              <button type="button" className="btn btn-secondary size-11 p-0" onClick={() => onStep(-1)} aria-label="Previous certificate">
                <ArrowLeft size={16} weight="bold" aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-secondary size-11 p-0" onClick={() => onStep(1)} aria-label="Next certificate">
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>
          <button
            type="button"
            data-cert-close
            onClick={onRequestClose}
            aria-label="Close certificate"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-surface-1 shadow-[inset_0_0_0_1px_var(--hairline)] transition-transform duration-300 hover:rotate-90 active:scale-95 md:right-6 md:top-6"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      )}
      {!reduce && <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />}
    </dialog>
  );
}
