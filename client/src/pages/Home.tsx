import { useEffect } from "react";
import Nav from "@/components/Nav";
import ContactDialog from "@/components/ContactDialog";
import Hero from "@/sections/hero/Hero";
import About from "@/sections/About";
import Work from "@/sections/Work";
import Projects from "@/sections/projects/Projects";
import ProjectRealm from "@/sections/projects/ProjectRealm";
import Toolbox from "@/sections/toolbox/Toolbox";
import Recognition from "@/sections/recognition/Recognition";
import OffTheClock from "@/sections/OffTheClock";
import Footer from "@/sections/Footer";
import { ContactProvider } from "@/lib/contact";
import { RealmProvider, useRealm } from "@/lib/realm";
import { SmoothScrollProvider } from "@/lib/smooth-scroll";
import { pingTraffic } from "@/lib/analytics";

/* The page, plus the case study layer that opens over it at /projects/:id. */
function Layers() {
  const { shown } = useRealm();
  return (
    <>
      <div inert={shown !== null}>
        <a
          href="#main"
          className="btn btn-primary fixed left-4 top-3 z-50 -translate-y-24 focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          <About />
          <Work />
          <Projects />
          <Toolbox />
          <Recognition />
          <OffTheClock />
        </main>
        <Footer />
      </div>
      {shown && <ProjectRealm key={shown} id={shown} />}
    </>
  );
}

export default function Home() {
  useEffect(() => {
    // Pinned and scrubbed sections need a known starting point, so always open at the top.
    if (!location.hash) {
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
    pingTraffic();
  }, []);

  return (
    <SmoothScrollProvider>
      <ContactProvider>
        <RealmProvider>
          <Layers />
          <ContactDialog />
          <div className="grain" aria-hidden="true" />
        </RealmProvider>
      </ContactProvider>
    </SmoothScrollProvider>
  );
}
