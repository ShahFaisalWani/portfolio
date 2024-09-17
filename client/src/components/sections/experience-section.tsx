// import React from 'react'
// import { motion } from 'framer-motion'

// export const ExperienceSection: React.FC = () => {
//   return (
//     <div className="flex flex-col p-16 justify-center pt-10">
//       <div className="flex justify-start leading-none">
//         <motion.h1
//           className="font-ramillas-light text-6xl sm:text-4xl md:text-7xl"
//           initial={{ y: 100, opacity: 0 }}
//           whileInView={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.5, ease: "easeOut" }}
//           data-cursor="project"
//         >
//           Experience
//         </motion.h1>
//       </div>
//     </div >
//   )
// }
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@lib/utils";

const experiences = [
  {
    role: "Full Stack Engineer",
    company: "Mojen.ai",
    duration: "01/2024 - Present",
    description: [
      "Built scalable web apps with Solid.js, improving user retention by 35%.",
      "Deployed AI models using Python and Stable Diffusion, enhancing product quality.",
      "Reduced cold start times by 70% through serverless on-demand integration, cutting GPU costs by 20%.",
      "Developed high-performance services with Go, increasing traffic by 83%.",
      "Used Docker and AWS for deployment, reducing costs by 30%.",
    ],
    href: "https://mojen.ai/",
  },
  {
    role: "Full Stack Engineer",
    company: "Booktree",
    duration: "03/2023 - 12/2023",
    description: [
      "Collaborated with clients to define design specifications and business goals.",
      "Developed a scalable bookstore management system using React.",
      "Built a RESTful API and POS system, improving transaction speeds by 40%.",
      "Implemented a stock management system, reducing inventory errors by 20%.",
      "Automated CI/CD pipelines using GitHub Actions Runner and DigitalOcean.",
    ],
  },
  {
    role: "168-Hour Hackathon",
    company: "HACKaTHAILAND",
    duration: "04/2022",
    description: [
      "Advanced in the 168-Hour Hackathon HACKaTHAILAND 2022.",
      "Created a prototype business solution for SMEs in OTOP entrepreneurship.",
    ],
  },
];

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
      className="relative mb-8 pl-10"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="absolute -left-1.5 top-2 w-5 h-5 bg-text rounded-full"></div>
      <div>
        <h2 className="text-2xl font-bold">{role}</h2>
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

export default ExperienceSection;
