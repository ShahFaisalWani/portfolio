import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CardBody, CardContainer, CardItem } from "@components/ui/3d-card";
import alwani_1 from '@assets/alwani/alwani-1.gif'
import alwani_2 from '@assets/alwani/alwani-2.png'
import alwani_3 from '@assets/alwani/alwani-3.png'
import alwani_4 from '@assets/alwani/alwani-4.png'
import alwani_5 from '@assets/alwani/alwani-5.png'
import alwani_6 from '@assets/alwani/alwani-6.png'
import dbz_1 from '@assets/dbz/dbz-1.gif'
import dbz_2 from '@assets/dbz/dbz-2.webp'
import dbz_3 from '@assets/dbz/dbz-3.webp'
import dbz_4 from '@assets/dbz/dbz-4.png'
import robox_1 from '@assets/robox/robox-1.jpeg'
import robox_2 from '@assets/robox/robox-2.jpeg'
import robox_3 from '@assets/robox/robox-3.png'
import robox_4 from '@assets/robox/robox-4.png'
import robox_5 from '@assets/robox/robox-5.png'
import robox_6 from '@assets/robox/robox-6.png'
import robox_7 from '@assets/robox/robox-7.png'
import CloseBtn from "@components/close-btn";
import ReactGA from 'react-ga4';

const projects = [
  {
    title: "Travel Booking Platform",
    description: [
      "Developed an e-commerce site for a Phuket travel agency using React and Strapi.",
      "Integrated real-time booking and secure payments with Stripe.",
    ],
    images: [
      alwani_1,
      alwani_6,
      alwani_2,
      alwani_4,
      alwani_5,
      alwani_3,
    ],
  },
  {
    title: "Dragon Ball NFT Game",
    description: [
      "Developed a memory card game with blockchain integration and NFT minting.",
      "Winning cards were stored in digital wallets like MetaMask and tradable on OpenSea.",
      "Used smart contracts for secure NFT creation and transfers.",
      "Built the UI using React, Web3.js, and Ethers.js.",
    ],
    link: "https://medium.com/@shahfaisalwani14/create-dragon-ball-nft-game-deploy-to-sepolia-testnet-6badfd52b906",
    images: [
      dbz_1,
      dbz_2,
      dbz_4,
      dbz_3,
    ],
  },
  {
    title: "Autonomous Mobile Service Robot",
    description: [
      "Built a robot with autonomous navigation using SLAM and ROS2.",
      "Designed circuits for communication between LIDAR, motors, and processor.",
      "Developed an algorithm for path planning and collision-free movement.",
    ],
    images: [
      robox_5,
      robox_1,
      robox_2,
      robox_3,
      robox_4,
      robox_6,
      robox_7,
    ],
  },
];
export const ProjectSection: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const indexMap = ["alwani", "dbz", "robox"];

  const handleExpand = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
      ReactGA.event({
        category: "Project",
        action: "Click on card",
        label: indexMap[index],
      });
    }
  };

  return (
    <div className="flex flex-col p-4 sm:p-16 pt-4">
      <motion.h1
        className="sm:mb-10 max-sm:text-center"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        data-cursor="project"
      >
        Projects
      </motion.h1>
      <motion.div
        className="relative flex flex-wrap gap-3 sm:gap-10 mt-4 max-sm:justify-center"
      >
        {projects.map((project, index) => (
          <motion.div key={index} className="flex flex-wrap">
            {expandedIndex === index ? (
              <ExpandedProjectItem
                {...project}
                isExpanded={true}
                onClick={() => handleExpand(index)}
              />
            ) : (
              <CardItemComponent
                {...project}
                isExpanded={false}
                onClick={() => handleExpand(index)}
              />
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ProjectSection;

interface ProjectItemProps {
  title: string;
  description: string[];
  link?: string;
  images: string[];
  onClick: () => void;
  isExpanded: boolean;
}

const ExpandedProjectItem: React.FC<ProjectItemProps> = ({ title, images, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentImage, setCurrentImage] = useState(images[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleImageClick = (image: string) => {
    setCurrentImage(image);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - contentRef.current!.offsetLeft);
    setScrollLeft(contentRef.current!.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - contentRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    contentRef.current!.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <motion.div
      layout
      className="fixed inset-0 z-50 shadow-none bg-transparent rounded-lg"
      onClick={onClick}
    >
      <motion.div
        initial={{ opacity: 0, WebkitBackdropFilter: "blur(0px)", backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, WebkitBackdropFilter: "blur(15px)", backdropFilter: "blur(15px)" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-0 -z-10"
      />

      <CloseBtn onClick={onClick} className="absolute top-4 right-4" />

      <CardContainer className="h-full w-full mt-20">
        <CardBody className="relative flex flex-col gap-4 h-full w-full p-8">
          <CardItem translateZ="50" className="text-2xl font-bold text-foreground text-center">
            {title}
          </CardItem>
          <CardItem translateZ="100" className="w-fit m-auto flex justify-center items-center h-[30rem]">
            <div className="h-full w-full flex items-center justify-center">
              <img src={currentImage} className="max-h-full w-full object-contain rounded-xl" alt={title} />
            </div>
          </CardItem>
        </CardBody>
      </CardContainer>

      <div ref={containerRef} className="flex h-[20rem] md:h-[20vh] lg:h-[30vh] w-full pb-10 sm:mt-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <motion.div
          ref={contentRef}
          className="flex gap-4 cursor-grab px-10 hide-scrollbar"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          style={{ overflow: 'auto', whiteSpace: 'nowrap' }}
        >
          {images.slice(1).map((image, index) => (
            <motion.img
              key={index}
              draggable={false}
              src={image}
              className="h-full w-auto object-cover rounded-xl flex-shrink-0 select-none"
              onClick={(e) => {
                e.stopPropagation();
                handleImageClick(image);
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div >
  );
};

const CardItemComponent: React.FC<ProjectItemProps> = ({ title, description, link, images, onClick }) => (
  <CardContainer className="h-full w-full sm:w-[36rem] sm:h-[40rem]">
    <CardBody className="relative flex flex-col gap-4 h-full w-full p-8">
      <CardItem translateZ="50" className="text-2xl font-bold text-text">
        {title}
      </CardItem>
      <CardItem translateZ="100" className="w-full h-[20rem]">
        <img
          src={images[0]}
          className="h-full w-full object-contain rounded-xl"
          onClick={onClick}
        />
      </CardItem>
      <CardItem as="ul" translateZ="60" className="text-muted-foreground leading-relaxed text-sm">
        <ul className="list-disc ml-6">
          {description.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </CardItem>
      {link && (
        <CardItem translateZ="20" as="a" href={link} target="_blank" className="text-sm font-medium text-text hover:underline">
          Learn more →
        </CardItem>
      )}
    </CardBody>
  </CardContainer>
)

