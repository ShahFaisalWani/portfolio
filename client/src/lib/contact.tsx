import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { trackEvent } from "./analytics";

type Ctx = { open: boolean; openContact: () => void; closeContact: () => void };
const ContactContext = createContext<Ctx | null>(null);

export function ContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openContact = useCallback(() => {
    setOpen(true);
    trackEvent("Navigation", "Open Contact Modal", "Contact");
  }, []);
  const closeContact = useCallback(() => setOpen(false), []);
  return <ContactContext.Provider value={{ open, openContact, closeContact }}>{children}</ContactContext.Provider>;
}

export function useContact() {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContact must be used inside ContactProvider");
  return ctx;
}
