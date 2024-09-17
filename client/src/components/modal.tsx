import React from "react";
import { motion } from 'framer-motion'

export const Modal: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]"
      initial={{ opacity: 0, z: 0 }}
      animate={{ opacity: 1, z: 100 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-primary rounded-2xl shadow-xl w-[90vw] md:w-[50vw] max-h-[90vh] p-8"
        initial={{ y: "100vh" }}
        animate={{ y: 0 }}
        exit={{ y: "100vh" }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};