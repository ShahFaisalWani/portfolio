import React from 'react';
import { motion } from 'framer-motion';

interface CloseBtnProps {
  onClick?: () => void;
  className?: string;
}

const CloseBtn: React.FC<CloseBtnProps> = ({ onClick, className }) => {
  return (
    <motion.button
      type="button"
      className={`rounded-xl px-4 py-2 text-lg flex gap-4 justify-center items-center font-gt-bold bg-primary-20 text-white ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      &times;
    </motion.button>
  );
};

export default CloseBtn;
