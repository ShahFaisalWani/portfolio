import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface DivRevealProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  inverse?: boolean;
}

const DivReveal: React.FC<DivRevealProps> = ({ children, delay = 0.5, inverse, ...rest }) => {
  return (
    <motion.div
      initial={{ x: inverse ? 100 : -100, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay, type: "spring" }}
      viewport={{ once: true, amount: 0.5 }}
      {...rest}
      data-cursor="project"
    >
      {children}
    </motion.div>
  );
};

export default DivReveal;
