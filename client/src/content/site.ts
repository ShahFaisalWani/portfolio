import alwani2 from "@/assets/media/alwani-2.webp";
import alwani3 from "@/assets/media/alwani-3.webp";
import alwani4 from "@/assets/media/alwani-4.webp";
import alwani5 from "@/assets/media/alwani-5.webp";
import alwani6 from "@/assets/media/alwani-6.webp";
import alwani1Video from "@/assets/media/alwani-1.mp4";
import alwani1Poster from "@/assets/media/alwani-1-poster.webp";
import dbz1Video from "@/assets/media/dbz-1.mp4";
import dbz1Poster from "@/assets/media/dbz-1-poster.webp";
import dbz2 from "@/assets/media/dbz-2.webp";
import dbz3 from "@/assets/media/dbz-3.webp";
import dbz4 from "@/assets/media/dbz-4.webp";
import robox1 from "@/assets/media/robox-1.webp";
import robox2 from "@/assets/media/robox-2.webp";
import robox3 from "@/assets/media/robox-3.webp";
import robox4 from "@/assets/media/robox-4.webp";
import robox5 from "@/assets/media/robox-5.webp";
import robox6 from "@/assets/media/robox-6.webp";
import robox7 from "@/assets/media/robox-7.webp";

import certDegree from "@/assets/media/cert-degree.webp";
import certGrade0 from "@/assets/media/cert-grade-0.webp";
import certGrade1 from "@/assets/media/cert-grade-1.webp";
import certHack0 from "@/assets/media/cert-hack-0.webp";
import certHack1 from "@/assets/media/cert-hack-1.webp";
import certHack2 from "@/assets/media/cert-hack-2.webp";
import certShopee from "@/assets/media/cert-shopee-code-league-2022.webp";
import certKafka from "@/assets/media/cert-kafka-udemy.webp";
import certTimo from "@/assets/media/cert-timo.webp";
import certUkmt from "@/assets/media/cert-ukmt.webp";
import certGacc from "@/assets/media/cert-gacc.webp";
import certIgcse from "@/assets/media/cert-igcse.webp";
import certEdexel from "@/assets/media/cert-edexel.webp";

export const person = {
  name: "Shah Faisal Wani",
  short: "Faisal Wani",
  role: "Software engineer at SCB 10X",
  email: "shahfaisalwani14@gmail.com",
};

export const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/faisalw14" },
  { label: "GitHub", href: "https://github.com/ShahFaisalWani" },
  { label: "Medium", href: "https://medium.com/@shahfaisalwani14" },
] as const;

/* ---------------------------------------------------------------- Work */

export type Experience = {
  id: string;
  role: string;
  company: string;
  period: string;
  logo: string;
  href?: string;
  summary: string;
  highlights: string[];
  stack: string[];
};

export const experiences: Experience[] = [
  {
    id: "scb10x",
    role: "Full Stack Software Engineer",
    company: "SCB 10X",
    period: "2025 - Now",
    logo: "/logos/scb10x.png",
    summary:
      "Building and scaling a production AI platform that serves OpenAI-compatible APIs.",
    highlights: [
      "Extended a production AI platform exposing OpenAI-compatible APIs via FastAPI and vLLM.",
      "Improved real-time streaming services for low-latency inference and bidirectional communication.",
      "Hardened backend-for-frontend services for authentication, API keys and access control.",
      "Scaled an internal data annotation platform with structured workflows and role-based admin.",
      "Added LLM observability to track usage, reliability and operational health.",
      "Deployed and tuned containerized workloads on GCP, cutting infrastructure and storage costs.",
    ],
    stack: ["FastAPI", "vLLM", "GCP", "Containers"],
  },
  {
    id: "mojen",
    role: "Full Stack Developer",
    company: "Mojen.ai",
    period: "2024 - Now",
    logo: "/logos/mojen.png",
    href: "https://mojen.ai/",
    summary: "Shipped AI features into a cross-platform consumer app, sprint after sprint.",
    highlights: [
      "Built and deployed AI features while releasing continuously in Agile sprints.",
      "Caught and fixed production anomalies quickly, improving user retention by 40%.",
      "Shipped an iOS and Android compatible web app from one codebase.",
      "Moved deployment to Docker on AWS (EC2, S3), reducing costs by 30%.",
    ],
    stack: ["AWS", "Docker", "Web app"],
  },
  {
    id: "booktree",
    role: "Full Stack Developer",
    company: "Booktree",
    period: "2023",
    logo: "/logos/booktree.png",
    summary: "Built a bookstore management system, POS and admin from scratch with the client.",
    highlights: [
      "Turned client goals into specs, then built the store system in React.",
      "Built a REST API and POS that made transactions 40% faster.",
      "Stock management cut inventory errors and costs by 30%.",
      "Automated CI/CD with GitHub Actions and DigitalOcean.",
    ],
    stack: ["React", "REST API", "GitHub Actions", "DigitalOcean"],
  },
  {
    id: "depa",
    role: "168-hour Hackathon",
    company: "HACKaTHAILAND, DEPA",
    period: "2022",
    logo: "/logos/depa.png",
    summary: "Advanced in DEPA’s week-long national hackathon with a product for local SMEs.",
    highlights: [
      "Prototyped a business tool for OTOP entrepreneurs to grow local sales.",
      "Advanced through the 168-hour HACKaTHAILAND 2022 competition.",
    ],
    stack: ["Product", "Prototyping"],
  },
];

/* ------------------------------------------------------------ Projects */

export type Media =
  | { kind: "image"; src: string; alt: string; portrait?: boolean }
  | { kind: "video"; src: string; poster: string; alt: string };

export type Project = {
  id: "alwani" | "dbz" | "robox";
  title: string;
  kicker: string;
  summary: string;
  details: string[];
  stack: string[];
  link?: { label: string; href: string };
  cover: Media;
  gallery: Media[];
};

export const projects: Project[] = [
  {
    id: "alwani",
    title: "Alwani Travel",
    kicker: "Travel commerce",
    summary: "A booking platform for a Phuket travel agency, with live availability and Stripe payments.",
    details: [
      "Built the storefront and booking flow in React on top of a Strapi CMS.",
      "Integrated real-time booking and secure payments with Stripe.",
    ],
    stack: ["React", "Strapi", "Stripe"],
    cover: { kind: "image", src: alwani2, alt: "Alwani Travel tour page with booking panel" },
    gallery: [
      { kind: "image", src: alwani2, alt: "Tour detail page with date picker and pricing" },
      { kind: "video", src: alwani1Video, poster: alwani1Poster, alt: "Scrolling through the Alwani Travel home page" },
      { kind: "image", src: alwani6, alt: "Show listing with image carousel" },
      { kind: "image", src: alwani4, alt: "Mobile home page", portrait: true },
      { kind: "image", src: alwani5, alt: "Mobile tour page", portrait: true },
      { kind: "image", src: alwani3, alt: "Values section and site footer" },
    ],
  },
  {
    id: "dbz",
    title: "Dragon Ball NFT Game",
    kicker: "Web3 game",
    summary: "A memory card game where winning cards are minted as NFTs you can trade on OpenSea.",
    details: [
      "Built a memory card game with blockchain integration and NFT minting.",
      "Winning cards land in wallets like MetaMask and are tradable on OpenSea.",
      "Smart contracts handle secure NFT creation and transfers.",
      "UI built with React, Web3.js and Ethers.js.",
    ],
    stack: ["Solidity", "React", "Ethers.js", "Web3.js"],
    link: {
      label: "Read the write-up",
      href: "https://medium.com/@shahfaisalwani14/create-dragon-ball-nft-game-deploy-to-sepolia-testnet-6badfd52b906",
    },
    cover: { kind: "video", src: dbz1Video, poster: dbz1Poster, alt: "Gameplay of the Dragon Ball memory card game" },
    gallery: [
      { kind: "video", src: dbz1Video, poster: dbz1Poster, alt: "Gameplay of the memory card game" },
      { kind: "image", src: dbz2, alt: "Game start screen with wallet connect" },
      { kind: "image", src: dbz4, alt: "Minted card collection on OpenSea" },
      { kind: "image", src: dbz3, alt: "Single minted NFT detail page" },
    ],
  },
  {
    id: "robox",
    title: "Autonomous Service Robot",
    kicker: "Robotics",
    summary: "A mobile robot that maps a room with LIDAR and plans its own collision-free path.",
    details: [
      "Built autonomous navigation with SLAM on ROS2.",
      "Designed the circuits linking the LIDAR, motors and onboard processor.",
      "Wrote the path planning for collision-free movement.",
    ],
    stack: ["ROS2", "SLAM", "LIDAR", "Circuits"],
    cover: { kind: "image", src: robox1, alt: "The service robot with its LIDAR sensor on top" },
    gallery: [
      { kind: "image", src: robox5, alt: "Occupancy grid map built by the robot" },
      { kind: "image", src: robox1, alt: "The robot, side view", portrait: true },
      { kind: "image", src: robox2, alt: "The robot, top view with LIDAR", portrait: true },
      { kind: "image", src: robox3, alt: "Odometry geometry for the drive model" },
      { kind: "image", src: robox4, alt: "Raw LIDAR scan points" },
      { kind: "image", src: robox6, alt: "RViz layout" },
      { kind: "image", src: robox7, alt: "Navigation goal and costmap in RViz" },
    ],
  },
];

/* ------------------------------------------------------------- Toolbox */

export type Tool = { name: string; core?: boolean };

export const toolbox: Tool[] = [
  { name: "TypeScript", core: true },
  { name: "Python", core: true },
  { name: "React", core: true },
  { name: "FastAPI", core: true },
  { name: "Node.js", core: true },
  { name: "Go", core: true },
  { name: "JavaScript" },
  { name: "Next.js" },
  { name: "NestJS" },
  { name: "vLLM" },
  { name: "Docker" },
  { name: "GCP" },
  { name: "AWS" },
  { name: "MongoDB" },
  { name: "MySQL" },
  { name: "Spark" },
  { name: "Vue.js" },
  { name: "Solid.js" },
  { name: "Flask" },
  { name: "Nginx" },
  { name: "Linux" },
  { name: "Git" },
  { name: "DigitalOcean" },
  { name: "Solidity" },
  { name: "OpenCV" },
  { name: "ROS2" },
  { name: "Java" },
  { name: "C" },
];

/* --------------------------------------------------------- Recognition */

export type Cert = {
  id: string;
  title: string;
  issuer: string;
  year?: string;
  group: "Academic" | "Competitions" | "Courses";
  image: string;
  tall?: boolean;
};

export const certs: Cert[] = [
  { id: "degree", title: "B.Eng Digital Engineering, Second Class Honours", issuer: "Prince of Songkla University", year: "2025", group: "Academic", image: certDegree },
  { id: "grade-0", title: "Academic excellence, GPA 3.95", issuer: "PSU College of Computing", year: "2022", group: "Academic", image: certGrade0 },
  { id: "grade-1", title: "Academic excellence, GPA 3.91", issuer: "PSU College of Computing", year: "2023", group: "Academic", image: certGrade1 },
  { id: "igcse", title: "Cambridge IGCSE", issuer: "Cambridge Assessment International Education", group: "Academic", image: certIgcse, tall: true },
  { id: "edexel", title: "Edexcel International GCSE", issuer: "Pearson", group: "Academic", image: certEdexel, tall: true },
  { id: "hack-0", title: "HACKaTHAILAND Competition", issuer: "DEPA", year: "2022", group: "Competitions", image: certHack0 },
  { id: "shopee", title: "Shopee Code League", issuer: "Shopee", year: "2022", group: "Competitions", image: certShopee },
  { id: "ukmt", title: "Senior Mathematical Challenge, Silver", issuer: "UK Mathematics Trust", year: "2020", group: "Competitions", image: certUkmt },
  { id: "timo", title: "Merit Award, TIMO", issuer: "Thailand International Mathematical Olympiad", year: "2018", group: "Competitions", image: certTimo },
  { id: "gacc", title: "PSU Young GACC", issuer: "Prince of Songkla University", year: "2021", group: "Competitions", image: certGacc },
  { id: "kafka", title: "Apache Kafka for Beginners", issuer: "Udemy", year: "2024", group: "Courses", image: certKafka },
  { id: "hack-1", title: "Basic AI Course", issuer: "HACKaTHAILAND, DEPA and AIAT", year: "2022", group: "Courses", image: certHack1 },
  { id: "hack-2", title: "Fundamental Data Analytics", issuer: "HACKaTHAILAND, DEPA and AIAT", year: "2021", group: "Courses", image: certHack2 },
];
