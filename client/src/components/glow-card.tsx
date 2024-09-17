import { css } from "@emotion/css";
import { useCursor } from "@providers/cursor-provider";
import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, MotionProps } from "framer-motion";

interface GlowCardProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
}

const GlowCard: React.FC<GlowCardProps> = ({ children, className, ...motionProps }) => {
  function detectMob() {
    const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
      return navigator.userAgent.match(toMatchItem);
    });
  }

  const elRef = useRef<HTMLDivElement | null>(null);
  const { cursorPosition } = useCursor();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);

  const smoothX = useSpring(x, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(y, { stiffness: 300, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 150, damping: 20 });

  const checkProximity = () => {
    if (detectMob()) return;

    if (elRef.current) {
      const { left, top, width, height } = elRef.current.getBoundingClientRect();
      const newX = cursorPosition.x - left;
      const newY = cursorPosition.y - top;

      const cardCenterX = left + width / 2;
      const cardCenterY = top + height / 2;

      const distance = Math.sqrt(
        Math.pow(cursorPosition.x - cardCenterX, 2) +
        Math.pow(cursorPosition.y - cardCenterY, 2)
      );

      const proximityThreshold = 500;

      if (distance <= proximityThreshold) {
        x.set(newX);
        y.set(newY);
        opacity.set(1);
      } else {
        opacity.set(0);
      }
    }
  };

  useEffect(() => {
    checkProximity();
  }, [cursorPosition, x, y, opacity]);

  const cardClass = css(`
    position: relative;
    padding: 0.2em;
    background: var(--color-text-10);
    border-radius: 1em;
    overflow: hidden;
    width: 100%;

    &::before {
		content: '';
		position: absolute;
		inset: 0px;
		background: radial-gradient(250px circle at ${smoothX.get()}px ${smoothY.get()}px, var(--color-pink), transparent);
		opacity: ${smoothOpacity.get()};
		transition: opacity 0.5s ease-out;
	}
  `);

  return (
    <motion.div
      className={cardClass}
      ref={elRef}
      {...motionProps}
    >
      <div className={`bg-bg relative p-4 rounded-[0.8em] ${className}`}>
        {children}
      </div>
    </motion.div>
  );
};

export default GlowCard;
