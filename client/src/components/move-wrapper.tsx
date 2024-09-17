import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface MoveWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const MoveWrapper: React.FC<MoveWrapperProps> = ({ children, className }) => {
  const [moveX, setMoveX] = useState<number>(0);
  const [moveY, setMoveY] = useState<number>(0);
  const [allowMove, setAllowMove] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const proximityRadius = 500;

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const allowMoveAttr = document.documentElement.getAttribute("allow-move");
      setAllowMove(allowMoveAttr === "true");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["allow-move"],
    });

    const initialAllowMove = document.documentElement.getAttribute("allow-move");
    setAllowMove(initialAllowMove === "true");

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!allowMove) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!wrapperRef.current) return;

      const { clientX, clientY } = event;
      const wrapperRect = wrapperRef.current.getBoundingClientRect();

      const elementCenterX = wrapperRect.left + wrapperRect.width / 2;
      const elementCenterY = wrapperRect.top + wrapperRect.height / 2;

      const distance = Math.sqrt(
        Math.pow(clientX - elementCenterX, 2) + Math.pow(clientY - elementCenterY, 2)
      );

      if (distance <= proximityRadius) {
        const x = ((clientX - elementCenterX) / proximityRadius) * 30;
        const y = ((clientY - elementCenterY) / proximityRadius) * 30;

        setMoveX(x);
        setMoveY(y);
      } else {
        setMoveX(0);
        setMoveY(0);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [allowMove]);

  return (
    <motion.div
      ref={wrapperRef}
      className={className}
      animate={{
        x: moveX,
        y: moveY,
      }}
      transition={{
        type: "tween",
      }}
    >
      {children}
    </motion.div>
  );
};

export default MoveWrapper;
