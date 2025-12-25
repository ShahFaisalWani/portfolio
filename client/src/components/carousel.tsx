import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import CloseBtn from "./close-btn";

export const Carousel: React.FC<{ images: string[] }> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [singleSetWidth, setSingleSetWidth] = useState(0);

  const duplicatedImages = [...images, ...images];

  const updateWidths = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      const container = containerRef.current.offsetWidth;
      const content = contentRef.current.scrollWidth;
      setContainerWidth(container);
      setContentWidth(content);

      const firstSetEnd = contentRef.current.querySelector(`[data-image-index="${images.length - 1}"]`);
      const firstImage = contentRef.current.querySelector(`[data-image-index="0"]`);

      if (firstSetEnd && firstImage) {
        const endRect = firstSetEnd.getBoundingClientRect();
        const startRect = firstImage.getBoundingClientRect();
        const gap = 32;
        setSingleSetWidth(endRect.right - startRect.left + gap);
      } else if (content > 0) {
        setSingleSetWidth(content / 2);
      }
    }
  }, [images.length]);

  useEffect(() => {
    const initializeWidths = () => {
      requestAnimationFrame(() => {
        updateWidths();
      });
    };

    initializeWidths();

    const resizeObserver = new ResizeObserver(() => {
      updateWidths();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener("resize", updateWidths);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidths);
    };
  }, [images, updateWidths]);

  useEffect(() => {
    if (!contentRef.current) return;

    const imageLoadHandler = () => {
      requestAnimationFrame(() => {
        updateWidths();
      });
    };

    const imageElements = contentRef.current.querySelectorAll("img");
    const loadHandlers: Array<{ img: HTMLImageElement; handler: () => void }> = [];

    imageElements.forEach((img) => {
      if (img.complete) {
        imageLoadHandler();
      } else {
        img.addEventListener("load", imageLoadHandler, { once: true });
        loadHandlers.push({ img, handler: imageLoadHandler });
      }
    });

    return () => {
      loadHandlers.forEach(({ img, handler }) => {
        img.removeEventListener("load", handler);
      });
    };
  }, [images, updateWidths]);

  useEffect(() => {
    if (singleSetWidth <= 0) return;

    const unsubscribe = x.on("change", (latest) => {
      if (Math.abs(latest) >= singleSetWidth) {
        const newX = latest + singleSetWidth;
        x.set(newX);
      } else if (latest > 0) {
        const newX = latest - singleSetWidth;
        x.set(newX);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [x, singleSetWidth]);

  const slideImages = useCallback(() => {
    if (autoScroll && singleSetWidth > 0) {
      const currentX = x.get();
      const newX = currentX - 1;
      x.set(newX);
    }
  }, [autoScroll, x, singleSetWidth]);

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
        ref={contentRef}
        className="flex flex-nowrap gap-8 py-10 w-max max-h-[50rem] h-full sm:h-[40rem] select-none"
        drag="x"
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x }}
      >
        {duplicatedImages.map((image, index) => (
          <motion.img
            key={index}
            data-image-index={index % images.length}
            src={image}
            className="h-full w-auto object-cover rounded-lg flex-shrink-0 cursor-pointer"
            alt={`Certificate or achievement ${(index % images.length) + 1}`}
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
              alt="Certificate or achievement - Full view"
              layoutId={selectedImage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
