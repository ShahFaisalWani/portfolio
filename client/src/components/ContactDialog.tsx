import { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { ArrowUpRight, CheckCircle, X } from "@phosphor-icons/react";
import { useContact } from "@/lib/contact";
import { useSmoothScroll } from "@/lib/smooth-scroll";
import { person, socials } from "@/content/site";

type Status = "idle" | "sending" | "sent" | "error";
type Errors = Partial<Record<"user_name" | "user_email" | "message", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: HTMLFormElement): Errors {
  const data = new FormData(form);
  const errors: Errors = {};
  if (!String(data.get("user_name") ?? "").trim()) errors.user_name = "Please add your name.";
  const email = String(data.get("user_email") ?? "").trim();
  if (!email) errors.user_email = "Please add your email.";
  else if (!EMAIL_RE.test(email)) errors.user_email = "That email doesn’t look right.";
  if (!String(data.get("message") ?? "").trim()) errors.message = "Please write a short message.";
  return errors;
}

const fieldClass =
  "w-full rounded-[16px] bg-canvas px-4 py-3 text-[1rem] text-ink shadow-[inset_0_0_0_1px_var(--hairline)] outline-none transition-shadow duration-300 placeholder:text-muted focus-visible:shadow-[inset_0_0_0_1.5px_var(--accent)] focus-visible:outline-none aria-[invalid=true]:shadow-[inset_0_0_0_1.5px_var(--danger)]";

export default function ContactDialog() {
  const { open, closeContact } = useContact();
  const { lenis } = useSmoothScroll();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      lenis()?.stop();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open, lenis]);

  const onClose = () => {
    lenis()?.start();
    closeContact();
    setErrors({});
    if (status !== "sending") setStatus("idle");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      await emailjs.sendForm("service_9r6wred", "template_c5sh1ji", form, { publicKey: "c4nY5ohJFe3OH89j1" });
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="contact-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
    >
      <div className="pointer-events-none flex h-full w-full items-end justify-end p-2 sm:p-3">
        <div
          className="sheet-panel pointer-events-auto flex max-h-full w-full flex-col overflow-y-auto rounded-[16px] bg-surface-1 p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_30px_80px_rgb(0_0_0/0.35)] sm:h-full sm:max-w-[34rem] sm:p-9"
          data-lenis-prevent
        >
          <div className="flex items-start justify-between gap-6">
            <h2 id="contact-title" className="type-title">
              Say hello.
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 transition-transform hover:rotate-90 active:scale-95"
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>

          {status === "sent" ? (
            <div className="mt-10 flex flex-1 flex-col items-start gap-5" role="status">
              <CheckCircle size={40} weight="duotone" className="text-accent" aria-hidden="true" />
              <p className="type-heading max-w-[20ch]">Thanks, your message is on its way.</p>
              <p className="text-muted">I’ll reply to the email you left.</p>
              <button type="button" className="btn btn-secondary mt-4" onClick={() => dialogRef.current?.close()}>
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="type-lead mt-4 max-w-[36ch] text-muted">
                Tell me what you’re working on and how I can help.
              </p>
              <form ref={formRef} noValidate onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="cf-name" className="text-[0.9rem] font-[560]">
                    Name
                  </label>
                  <input
                    id="cf-name"
                    name="user_name"
                    aria-required="true"
                    autoComplete="name"
                    className={fieldClass}
                    aria-invalid={Boolean(errors.user_name)}
                    aria-describedby={errors.user_name ? "cf-name-err" : undefined}
                  />
                  {errors.user_name && (
                    <p id="cf-name-err" className="text-[0.85rem] text-danger" aria-live="polite">
                      {errors.user_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="cf-email" className="text-[0.9rem] font-[560]">
                    Email
                  </label>
                  <input
                    id="cf-email"
                    name="user_email"
                    aria-required="true"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    className={fieldClass}
                    aria-invalid={Boolean(errors.user_email)}
                    aria-describedby={errors.user_email ? "cf-email-err" : undefined}
                  />
                  {errors.user_email && (
                    <p id="cf-email-err" className="text-[0.85rem] text-danger" aria-live="polite">
                      {errors.user_email}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="cf-message" className="text-[0.9rem] font-[560]">
                    Message
                  </label>
                  <textarea
                    id="cf-message"
                    name="message"
                    aria-required="true"
                    rows={5}
                    className={`${fieldClass} resize-y`}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "cf-message-err" : undefined}
                  />
                  {errors.message && (
                    <p id="cf-message-err" className="text-[0.85rem] text-danger" aria-live="polite">
                      {errors.message}
                    </p>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <button type="submit" className="btn btn-primary min-w-36" disabled={status === "sending"}>
                    {status === "sending" ? "Sending…" : "Send message"}
                  </button>
                  {status === "error" && (
                    <p className="text-[0.9rem] text-danger" role="alert">
                      That didn’t send. Please email me directly.
                    </p>
                  )}
                </div>
              </form>
            </>
          )}

          <div className="mt-auto pt-10">
            <div className="h-px bg-hairline" />
            <a
              href={`mailto:${person.email}`}
              className="link-underline mt-5 inline-block break-all text-[1.05rem] font-[560]"
            >
              {person.email}
            </a>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-1 text-[0.92rem] text-muted transition-colors hover:text-ink"
                  >
                    {s.label}
                    <ArrowUpRight size={14} weight="bold" aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </dialog>
  );
}
