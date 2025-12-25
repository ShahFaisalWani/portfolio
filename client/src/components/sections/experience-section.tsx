import React, { useEffect, useState, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@lib/utils";
import { useTheme, Theme } from "@providers/theme-provider";

const experiences = [
  {
    role: "Full Stack Software Engineer",
    company: "SCB10X",
    duration: "Jun 2025 - Present",
    logo: "/logos/scb10x.png",
    description: [
      "Contributed to and extended a production AI platform, exposing OpenAI-compatible APIs via FastAPI and vLLM.",
      "Implemented and improved real-time streaming services supporting low-latency inference and bidirectional communication.",
      "Enhanced backend-for-frontend services for authentication, API key management, and secure access control.",
      "Improved and scaled an internal data annotation platform with structured workflows and role-based administration.",
      "Optimized system performance through query tuning, caching strategies, and server-side rendering improvements.",
      "Integrated LLM observability and monitoring to track usage, reliability, and operational health.",
      "Collaborated with external security teams to support penetration testing and vulnerability remediation.",
      "Deployed and optimized containerized workloads on GCP, reducing infrastructure and storage costs.",
    ],
  },
  {
    role: "Full Stack Developer",
    company: "Mojen.ai",
    duration: "Jan 2024 - Present",
    logo: "/logos/mojen.png",
    description: [
      "Built a scalable, user-friendly app by translating user requirements into clean, optimized code.",
      "Developed and deployed AI solutions while staying up-to-date with global trends and continuously releasing new features.",
      "Participated in Agile/Scrum sprints and learned best practices for consistent software delivery.",
      "Quickly detected and resolved production anomalies, improving user retention by 40%.",
      "Successfully implemented an iOS and Android-compatible web app, ensuring cross-platform functionality.",
      "Optimized deployment with Docker and AWS (EC2, S3), reducing costs by 30%.",
    ],
    href: "https://mojen.ai/",
  },
  {
    role: "Full Stack Developer",
    company: "Booktree",
    duration: "Mar 2023 - Dec 2023",
    logo: "/logos/booktree.png",
    description: [
      "Collaborated with clients to define design specifications and business goals.",
      "Developed a scalable bookstore management system using React.",
      "Built a RESTful API and POS system, improving transaction speeds by 40%.",
      "Implemented a stock management system that reduced inventory errors and cut costs by 30%.",
      "Created an admin panel for real-time data and reporting.",
      "Automated CI/CD pipelines using GitHub Actions and DigitalOcean, improving release efficiency.",
    ],
  },
  {
    role: "168-Hackathon HACKaTHAILAND",
    company: "DEPA Thailand",
    duration: "Apr 2022",
    logo: "/logos/depa.png",
    description: [
      "Advanced in the 168 Hour Hackathon HACKaTHAILAND 2022, organized by DEPA, for developing innovative technological solutions",
      "Created a prototype business solution for SMEs in OTOP entrepreneurship.",
      "Aimed at increasing local sales and promoting sustainable economic growth.",
    ],
  },
];

export const ExperienceSection: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const preloadImages = () => {
      experiences.forEach((exp) => {
        if (exp.logo) {
          const img = new Image();
          img.src = exp.logo;
        }
      });
    };
    preloadImages();
  }, []);

  return (
    <div className="flex flex-col p-4 sm:p-16 pt-4 relative">
      <motion.h1
        className="mb-10"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        data-cursor="project"
      >
        Experience
      </motion.h1>
      <div className="relative max-sm:px-8">
        <motion.div
          className="absolute h-[95%] mt-4 w-2 bg-text-10 rounded-full"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {experiences.map((exp, index) => (
          <ExperienceItem
            key={index}
            {...exp}
            index={index}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
          />
        ))}
      </div>
      <AnimatePresence>
        {hoveredIndex !== null && experiences[hoveredIndex]?.logo && (
          <LogoDisplay
            key={hoveredIndex}
            logo={experiences[hoveredIndex].logo}
            company={experiences[hoveredIndex].company}
            itemRef={itemRefs.current[hoveredIndex]}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface ExperienceItemProps {
  role: string;
  company: string;
  duration: string;
  description: string[];
  href?: string;
  logo?: string;
  index: number;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

const ExperienceItem = forwardRef<HTMLDivElement, ExperienceItemProps>(
  (
    { role, company, duration, description, href, onHoverStart, onHoverEnd },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn("relative mb-8 pl-10 z-10", href && "cursor-pointer")}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        onClick={() => {
          if (href) {
            window.open(href, "_blank");
          }
        }}
      >
        <div className="absolute -left-1.5 top-2 w-5 h-5 bg-text rounded-full"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold whitespace-nowrap">{role}</h2>
          <a
            href={href}
            target="_blank"
            className={cn("text-text-20", href && "hover:underline")}
          >
            {company} | {duration}
          </a>
          <ul className="list-disc ml-5 mt-2 text-text-10">
            {description.map((desc, index) => (
              <li key={index} className="text-md">
                {desc}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    );
  }
);

ExperienceItem.displayName = "ExperienceItem";

interface LogoDisplayProps {
  logo: string;
  company: string;
  itemRef: HTMLDivElement | null;
}

const LogoDisplay: React.FC<LogoDisplayProps> = ({
  logo,
  company,
  itemRef,
}) => {
  const { theme } = useTheme();
  const [position, setPosition] = useState({ top: 0, height: 0 });

  useEffect(() => {
    if (itemRef) {
      const updatePosition = () => {
        const rect = itemRef.getBoundingClientRect();
        setPosition({
          top: rect.top,
          height: rect.height,
        });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [itemRef]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="fixed right-4 sm:right-8 z-0 pointer-events-none p-2"
      style={{
        top: `${position.top}px`,
        transform: "translateY(-50%)",
      }}
    >
      <div
        className="rounded-xl overflow-hidden flex items-center justify-center min-h-32 sm:min-h-40 bg-background/90 p-4 relative"
        style={{
          height: `${position.height}px`,
        }}
      >
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background:
              theme === Theme.Dark
                ? `radial-gradient(circle at right center, rgba(25,112,185,0.25) 0%, rgba(25,112,185,0.12) 40%, transparent 70%)`
                : `radial-gradient(circle at right center, rgba(25,112,185,0.3) 0%, rgba(25,112,185,0.15) 40%, transparent 70%)`,
          }}
        />
        <img
          src={logo}
          alt={company}
          className="block h-full w-auto relative z-10"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    </motion.div>
  );
};

export default ExperienceSection;
