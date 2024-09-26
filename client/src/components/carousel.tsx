import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import CloseBtn from "./close-btn";

interface CarouselProps {
  images: string[];
}

export const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right'>('left');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const updateWidths = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContentWidth(containerRef.current.scrollWidth);
      }
    };

    updateWidths();

    window.addEventListener('resize', updateWidths);
    return () => window.removeEventListener('resize', updateWidths);
  }, [images]);

  const maxScroll = contentWidth - containerWidth;

  const slideImages = useCallback(() => {
    if (autoScroll) {
      const currentX = x.get();
      let newX = currentX;
      if (scrollDirection === 'left') {
        newX -= 1;
        if (-newX >= maxScroll) {
          newX = -maxScroll;
          setScrollDirection('right');
        }
      } else {
        newX += 1;
        if (newX >= 0) {
          newX = 0;
          setScrollDirection('left');
        }
      }
      x.set(newX);
    }
  }, [autoScroll, x, maxScroll, scrollDirection]);

  const useInterval = (callback: () => void, delay: number | null) => {
    useEffect(() => {
      if (delay === null) return;
      const id = setInterval(callback, delay);
      return () => clearInterval(id);
    }, [callback, delay]);
  };

  useInterval(slideImages, autoScroll ? 20 : null);

  const handleDragStart = () => {
    setAutoScroll(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  const handleDragEnd = () => {
    const id = setTimeout(() => {
      setAutoScroll(true);
    }, 5000);
    setTimeoutId(id);
  };

  const handleImgClick = (image: string) => {
    setSelectedImage(image);
  };

  return (
    <div
      ref={containerRef}
      className="overflow-hidden w-[95vw] sm:w-screen relative sm:px-20 max-sm:h-[20rem] cursor-grab select-none"
      draggable={false}
    >
      <motion.div
        className="flex flex-nowrap gap-8 py-10 w-max max-h-[50rem] h-full sm:h-[40rem] select-none"
        drag="x"
        dragElastic={0.1}
        dragConstraints={{ left: -maxScroll, right: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
      >
        {images.map((image, index) => (
          <motion.img
            key={index}
            src={image}
            className="h-full w-auto object-cover rounded-lg flex-shrink-0 cursor-pointer"
            onTap={() => handleImgClick(image)}
            drag={false}
            draggable={false}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center select-none"
            onClick={() => setSelectedImage(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CloseBtn className="absolute top-4 right-4" />
            <motion.img
              src={selectedImage}
              className="w-auto h-auto max-h-full max-w-full rounded-lg select-none"
              layoutId={selectedImage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
