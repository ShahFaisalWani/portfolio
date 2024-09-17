import { motion } from 'framer-motion';
import { useCursor } from '@providers/cursor-provider';

const GlobalCursor = () => {
  const { cursorPosition, cursorText, cursorVariant, cursorColor } = useCursor();

  const variants = {
    default: {
      height: 25,
      width: 25,
      opacity: 1,
      fontSize: '16px',
      backgroundColor: cursorColor,
      x: cursorPosition.x,
      y: cursorPosition.y,
    },
    project: {
      height: 80,
      width: 80,
      opacity: 1,
      fontSize: '18px',
      backgroundColor: cursorColor,
      x: cursorPosition.x - 40,
      y: cursorPosition.y - 40,
    },
    glowCard: {
      height: 50,
      width: 50,
      opacity: 1,
      fontSize: '16px',
      backgroundColor: cursorColor,
      x: cursorPosition.x - 25,
      y: cursorPosition.y - 25,
    },
    none: {
      height: 80,
      width: 80,
      opacity: 1,
      fontSize: '18px',
      backgroundColor: cursorColor,
      x: cursorPosition.x - 40,
      y: cursorPosition.y - 40,
    },
  };

  return (
    <motion.div
      className="custom-cursor max-sm:hidden"
      variants={variants}
      animate={cursorVariant}
      transition={{ type: "tween", ease: "easeOut" }}
    >
      {cursorText && <span>{cursorText}</span>}
    </motion.div>
  );
};

export default GlobalCursor;
