import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardBody, CardContainer, CardItem } from "@components/ui/3d-card";
import { cn } from "@lib/utils";
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

  const handleExpand = (index: number) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
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
        variants={window.innerWidth < 640 ? undefined : containerVariants}
        initial={window.innerWidth < 640 ? undefined : "hidden"}
        whileInView={window.innerWidth < 640 ? undefined : "show"}
        viewport={window.innerWidth < 640 ? undefined : { once: true, amount: 0.5 }}

      >
        {projects.map((project, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            initial={window.innerWidth < 640 ? "hidden" : undefined}
            whileInView={window.innerWidth < 640 ? "show" : undefined}
            viewport={window.innerWidth < 640 ? { once: true, amount: 0.5 } : undefined}
          // onClick={(e) => { e.stopPropagation(); handleExpand(index) }}
          >
            <ProjectItem
              key={index}
              isExpanded={expandedIndex === index}
              onClick={() => handleExpand(index)}
              onClose={() => handleExpand(index)}
              {...project}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ProjectSection;

// interface ProjectItemProps {
//   title: string;
//   description: string[];
//   link?: string;
//   images: string[];
//   onClose: () => void;
//   isExpanded: boolean;
// }

// const ProjectItem: React.FC<ProjectItemProps> = ({ title, description, link, images, onClose, isExpanded }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [dragLimit, setDragLimit] = useState(0);

//   const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
//     if (e.target === e.currentTarget) {
//       onClose();
//     }
//   };

//   useEffect(() => {
//     setTimeout(() => {
//       if (containerRef.current && contentRef.current) {
//         const containerWidth = containerRef.current.offsetWidth;
//         const contentWidth = contentRef.current.scrollWidth;
//         const newDragLimit = containerWidth - contentWidth;
//         setDragLimit(newDragLimit);
//       }
//     }, 100)
//   }, [isExpanded, images.length]);

//   return (
//     <AnimatePresence>
//       <motion.div
//         layout
//         className={cn(
//           "shadow-none bg-transparent rounded-lg cursor-pointer",
//           isExpanded
//             ? "fixed inset-0 z-50"
//             : "w-full sm:w-[36rem] sm:h-[40rem]"
//         )}
//         onClick={handleBackgroundClick}
//       >
//         {isExpanded && (
//           <motion.div
//             initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
//             animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
//             exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
//             transition={{ duration: 0.5, ease: "easeInOut" }}
//             className="fixed inset-0 -z-10"
//             onClick={handleBackgroundClick}
//           />
//         )}

//         {isExpanded && (
//           <button
//             onClick={onClose}
//             className="absolute top-4 right-4 bg-white text-black p-2 rounded-full shadow-lg z-50 hover:bg-gray-200 focus:outline-none"
//           >
//             &times;
//           </button>
//         )}

//         <CardContainer className={cn('h-full w-full', isExpanded && 'mt-40 sm:mt-20')}>
//           <CardBody className={cn('relative flex flex-col gap-4 h-full p-8', isExpanded ? 'w-fit' : 'w-full')}>
//             <CardItem
//               translateZ="50"
//               className="text-2xl font-bold text-foreground"
//             >
//               {title}
//             </CardItem>

//             <CardItem translateZ="100" className={cn(isExpanded ? 'w-[90vw] md:w-[80vh] lg:w-[70vh]' : 'w-full h-[20rem]')}>
//               <img
//                 src={images[0]}
//                 className="h-full w-full object-cover rounded-xl"
//                 onClick={(e) => isExpanded && e.stopPropagation()}
//               />
//             </CardItem>

//             {!isExpanded && (
//               <CardItem
//                 as="ul"
//                 translateZ="60"
//                 className="text-muted-foreground leading-relaxed text-sm"
//               >
//                 <ul className="list-disc ml-6">
//                   {description.map((d) => (
//                     <li key={d}>{d}</li>
//                   ))}
//                 </ul>
//               </CardItem>
//             )}

//             {link && !isExpanded && (
//               <CardItem
//                 translateZ={20}
//                 as="a"
//                 href={link}
//                 target="_blank"
//                 className="text-sm font-medium text-text hover:underline"
//                 onClick={(e: React.MouseEvent) => e.stopPropagation()}
//               >
//                 Learn more →
//               </CardItem>
//             )}

//           </CardBody>
//         </CardContainer>

//         {isExpanded && (
//           <div
//             ref={containerRef}
//             className="flex h-[20rem] md:h-[20vh] lg:h-[30vh] mt-4 w-full py-10"
//             onClick={(e: React.MouseEvent) => e.stopPropagation()}
//           >
//             <motion.div
//               ref={contentRef}
//               className="flex gap-4 cursor-grab px-10"
//               drag="x"
//               dragConstraints={{ left: dragLimit - 40, right: 0 }}
//               dragElastic={0.1}
//               whileTap={{ cursor: "grabbing" }}
//             >
//               {images.slice(1, images.length).map((image) => (
//                 <motion.img
//                   draggable={false}
//                   key={image}
//                   src={image}
//                   className="h-full w-auto object-cover rounded-xl flex-shrink-0 select-none"
//                   alt={`Project image ${image}`}
//                   onClick={(e) => e.stopPropagation()}
//                 />
//               ))}
//             </motion.div>
//           </div>
//         )}
//       </motion.div>
//     </AnimatePresence>
//   );
// };
interface ProjectItemProps {
  title: string;
  description: string[];
  link?: string;
  images: string[];
  onClick: () => void;
  onClose: () => void;
  isExpanded: boolean;
}

const ProjectItem: React.FC<ProjectItemProps> = ({ title, description, link, images, onClick, onClose, isExpanded }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dragLimit, setDragLimit] = useState(0);
  const [currentImage, setCurrentImage] = useState(images[0]); // State to track the main image

  const onMainImgClick = () => {
    onClick()
  }

  const handleClose = () => {
    setCurrentImage(images[0])
    onClose();
  }

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  };

  useEffect(() => {
    setTimeout(() => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const contentWidth = contentRef.current.scrollWidth;
        const newDragLimit = containerWidth - contentWidth;
        setDragLimit(newDragLimit);
      }
    }, 100);
  }, [isExpanded, images.length]);

  const handleImageClick = (image: string) => {
    setCurrentImage(image);
  };

  return (
    <AnimatePresence>
      <motion.div
        layout
        className={cn(
          "shadow-none bg-transparent rounded-lg cursor-pointer",
          isExpanded
            ? "fixed inset-0 z-50"
            : "w-full sm:w-[36rem] sm:h-[40rem]"
        )}
        onClick={handleBackgroundClick}
      >
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, WebkitBackdropFilter: "blur(0px)", backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, WebkitBackdropFilter: "blur(15px)", backdropFilter: "blur(15px)" }}
            exit={{ opacity: 0, WebkitBackdropFilter: "blur(0px)", backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 -z-10"
            onClick={handleBackgroundClick}
          />
        )}

        {isExpanded && (
          <CloseBtn onClick={handleClose} className="absolute top-4 right-4" />
        )}

        <CardContainer className={cn('h-full w-full', isExpanded && 'mt-20')}>
          <CardBody className={cn('relative flex flex-col gap-4 h-full p-8', isExpanded ? 'w-full' : 'w-full')}>
            <CardItem
              translateZ="50"
              className={cn('text-2xl font-bold text-foreground', isExpanded && 'text-center')}
            >
              {title}
            </CardItem>

            <CardItem translateZ="100" className={cn(isExpanded ? 'w-fit m-auto flex justify-center items-center h-[30rem]' : 'w-full h-[20rem]')}>
              <img
                src={currentImage}
                className="h-full w-full object-contain rounded-xl"
                onClick={onMainImgClick}
              />
            </CardItem>

            {!isExpanded && (
              <CardItem
                as="ul"
                translateZ="60"
                className="text-muted-foreground leading-relaxed text-sm"
              >
                <ul className="list-disc ml-6">
                  {description.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </CardItem>
            )}

            {link && !isExpanded && (
              <CardItem
                translateZ={20}
                as="a"
                href={link}
                target="_blank"
                className="text-sm font-medium text-text hover:underline"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                Learn more →
              </CardItem>
            )}

          </CardBody>
        </CardContainer>

        {isExpanded && (
          <div
            ref={containerRef}
            className="flex h-[20rem] md:h-[20vh] lg:h-[30vh] mt-4 w-full py-10"
          >
            <motion.div
              ref={contentRef}
              className="flex gap-4 cursor-grab px-10"
              drag="x"
              dragConstraints={{ left: dragLimit - 40, right: 0 }}
              dragElastic={0.1}
              whileTap={{ cursor: "grabbing" }}
            >
              {images.slice(1, images.length).map((image) => (
                <motion.img
                  draggable={false}
                  key={image}
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
        )}
      </motion.div>
    </AnimatePresence>
  );
};
