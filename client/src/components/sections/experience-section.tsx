import React from "react";
import { motion } from "framer-motion";
import { cn } from "@lib/utils";

const experiences = [
  {
    role: "Full Stack Developer",
    company: "Mojen.ai",
    duration: "01/2024 - Present",
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
    duration: "03/2023 - 12/2023",
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
    duration: "04/2022",
    description: [
      "Advanced in the 168 Hour Hackathon HACKaTHAILAND 2022, organized by DEPA, for developing innovative technological solutions",
      "Created a prototype business solution for SMEs in OTOP entrepreneurship.",
      "Aimed at increasing local sales and promoting sustainable economic growth.",
    ],
  },
];

export const ExperienceSection: React.FC = () => {
  return (
    <div className="flex flex-col p-4 sm:p-16 pt-4">
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
          />
        ))}
      </div>
    </div>
  );
};

interface ExperienceItemProps {
  role: string;
  company: string;
  duration: string;
  description: string[];
  href?: string;
}

const ExperienceItem: React.FC<ExperienceItemProps> = ({
  role,
  company,
  duration,
  description,
  href
}) => {
  return (
    <motion.div
      className={cn('relative mb-8 pl-10', href && 'cursor-pointer')}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onClick={() => {
        if (href) {
          window.open(href, "_blank");
        }
      }}
    >
      <div className="absolute -left-1.5 top-2 w-5 h-5 bg-text rounded-full"></div>
      <div>
        <h2 className="text-2xl font-bold whitespace-nowrap">{role}</h2>
        <a href={href} target="_blank" className={cn('text-text-20', href && 'hover:underline')}>{company} | {duration}</a>
        <ul className="list-disc ml-5 mt-2 text-text-10">
          {description.map((desc, index) => (
            <li key={index} className="text-md">{desc}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default ExperienceSection;
