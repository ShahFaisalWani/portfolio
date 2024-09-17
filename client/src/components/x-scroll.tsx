import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HorizontalScrollProps {
  images: string[];
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting && entry.intersectionRatio === 1);
      },
      { threshold: 1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      if (isInView && containerRef.current) {
        e.preventDefault();
        containerRef.current.scrollLeft += e.deltaY;

        if (containerRef.current.scrollLeft <= 0) {
          setIsInView(false);
        }
      }
    };

    if (isInView) {
      window.addEventListener("wheel", handleScroll, { passive: false });
    } else {
      window.removeEventListener("wheel", handleScroll);
    }

    return () => {
      window.removeEventListener("wheel", handleScroll);
    };
  }, [isInView]);


  useEffect(() => {
    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (!container) return;

      setIsDragging(true);
      setStartX(e.touches[0].pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !container) return;

      e.preventDefault();
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = (x - startX) * 2;
      container.scrollLeft = scrollLeft - walk;
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (container) {
      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchmove", handleTouchMove, { passive: false });
      container.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [isDragging, startX, scrollLeft]);

  return (
    <div ref={containerRef} className="overflow-hidden w-full relative sm:px-20 max-sm:h-[20rem]">
      <div className="flex gap-8 py-10 w-full max-h-[50rem] h-full sm:h-[40rem]">
        {images.map((image, index) => (
          <motion.img
            key={index}
            src={image}
            className="h-full w-auto object-cover rounded-lg flex-shrink-0 cursor-pointer"
            onClick={() => setSelectedImage(image)}
            layout
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              src={selectedImage}
              className="w-auto h-auto max-h-full max-w-full rounded-lg"
              layoutId={selectedImage}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
