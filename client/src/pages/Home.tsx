import { HeroSection } from "@components/sections/hero-section";
import { AboutSection } from "@components/sections/about-section";
import { ExperienceSection } from "@components/sections/experience-section";
import ProjectSection from "@components/sections/project-section";
import { AchievementSection } from "@components/sections/achievement-section";
import TrafficMonitor from "@components/traffic-monitor";

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
        <ProjectSection />
        <AchievementSection />
      </section>

    </div>
  );
};

export default Home;