import type { RefObject } from "react";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import type { Cert } from "@/content/site";

/*
  Full-screen certificate viewer on a native <dialog> (focus trap, Escape, top
  layer). Opening, closing and stepping are view transitions run by Recognition:
  the scan morphs out of its cell, and next/previous slide the paper sideways.
*/
export default function CertViewer({
  dialogRef,
  cert,
  onRequestClose,
  onStep,
  onClosed,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  cert: Cert | null;
  onRequestClose: () => void;
  onStep: (dir: 1 | -1) => void;
  onClosed: () => void;
}) {
  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="cert-title"
      onCancel={(e) => {
        // Escape: run the animated close instead of the instant one
        e.preventDefault();
        onRequestClose();
      }}
      onClose={onClosed}
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
              className="h-auto max-h-full w-auto max-w-full rounded-[16px] bg-paper object-contain shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]"
            />
          </div>
          <div className="w-full shrink-0 [view-transition-name:cert-caption] md:w-[22rem] md:self-end">
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
            onClick={onRequestClose}
            aria-label="Close certificate"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-surface-1 shadow-[inset_0_0_0_1px_var(--hairline)] transition-transform duration-300 hover:rotate-90 active:scale-95 md:right-6 md:top-6"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      )}
    </dialog>
  );
}
