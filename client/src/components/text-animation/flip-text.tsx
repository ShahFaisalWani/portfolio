import React from "react";
import { motion } from "framer-motion";

const DURATION = 0.25;
const STAGGER = 0.025;

interface FlipTextRevealProps {
  text1: string;
  text2: string;
  className?: string;
}

export const FlipTextReveal: React.FC<FlipTextRevealProps> = ({ text1, text2, className }) => {
  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className={`relative block overflow-hidden ${className}`}
      variants={{
        initial: {
          backgroundColor: "var(--color-bg)",
        },
        hovered: {
          backgroundColor: "var(--color-pink)",
        },
      }}
    >
      <div>
        {text1.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: 0,
              },
              hovered: {
                y: "-100%",
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </div>
      <div className="absolute inset-0">
        {text2.split("").map((l, i) => (
          <motion.span
            variants={{
              initial: {
                y: "100%",
                color: "var(--color-text)",
              },
              hovered: {
                y: 0,
                color: "var(--color-primary-contrast)",
              },
            }}
            transition={{
              duration: DURATION,
              ease: "easeInOut",
              delay: STAGGER * i,
            }}
            className="inline-block"
            key={i}
          >
            {l}
          </motion.span>
        ))}
      </div>
    </motion.span>
  );
};
