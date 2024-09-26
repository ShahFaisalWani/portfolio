import { HeroSection } from "@components/sections/hero-section";
import { AboutSection } from "@components/sections/about-section";
import { ExperienceSection } from "@components/sections/experience-section";
import ProjectSection from "@components/sections/project-section";
import { CertSection } from "@components/sections/cert-section";
import TrafficMonitor from "@components/traffic-monitor";
import { FootballSection } from "@components/sections/football-sections";
import { SocialBar } from "@components/social-bar";

const Home = () => {

  return (
    <div className="absolute top-0 h-screen w-screen z-0">
      <TrafficMonitor />
      <section className="h-full w-full" id="section_home">
        <HeroSection />
      </section>

      <section className="w-full" id="section_about">
        <AboutSection />
      </section>

      <section className="h-fit w-full" id="section_work">
        <ExperienceSection />
      </section>

      <section className="h-fit w-full" id="section_projects">
        <ProjectSection />
        <CertSection />
        <FootballSection />
      </section>

      <footer className="flex flex-col justify-between items-center gap-10 py-20 bg-bg mt-20">
        <h1 className="text-center">Thanks for visiting my portfolio</h1>
        <hr className="hr-text w-[90vw] sm:w-[70vw] font-ramillas-light text-3xl" data-content="Shah Faisal Wani"></hr>
        <SocialBar isHome={false} />
      </footer>

    </div>
  );
};

export default Home;