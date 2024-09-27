import React from 'react';
import { motion } from 'framer-motion';

interface ImgMagnifierProps {
  images: string[];
}

const ImgMagnifier: React.FC<ImgMagnifierProps> = ({ images }) => {
  return (
    <div className="w-full h-[50vmin] flex items-center justify-center gap-[1vmin]">
      {images.map((image, index) => (
        <motion.img
          key={index}
          src={image}
          className="h-full object-cover overflow-hidden"
          initial={{ flex: 1, filter: 'grayscale(0.75) brightness(0.75)' }}
          whileHover={{
            filter: 'grayscale(0) brightness(1.15)',
            flex: 7,
            transition: {
              duration: 0.6,
              ease: 'easeInOut',
            },
          }}
          animate={{
            flex: 1,
            filter: 'grayscale(0.75) brightness(0.75)',
            transition: {
              duration: 0.6,
              ease: 'easeInOut',
            },
          }}
        />
      ))}
    </div>
  );
};

export default ImgMagnifier;
