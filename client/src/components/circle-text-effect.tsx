import { css } from "@emotion/css";
import React, { useEffect, useRef, useState } from "react";

interface CircleTextEffectProps {
  text: string;
}

const CircleTextEffect: React.FC<CircleTextEffectProps> = ({ text }) => {
  const circleRef = useRef<HTMLDivElement>(null);
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (circleRef.current) {
        const halfCircleSize = circleRef.current.offsetHeight / 2;
        setCirclePosition({
          x: e.clientX - halfCircleSize,
          y: e.clientY - halfCircleSize,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Styles using emotion's `css`
  const containerStyle = css`
    position: relative;
    padding: 2rem;
    background: #3590f3;
    overflow: hidden;
    // cursor: none; /* Hide the default cursor */
    display: inline-block; /* Make the container dynamic and shrink to content size */
    border-radius: 8px;
  `;

  const textStyle = css`
    width: 100%;
    font-size: 2.5rem;
    font-weight: bold;
    line-height: 3.5rem;
    text-align: center;
    pointer-events: none;

    @media screen and (max-width: 768px) {
      padding: 5px;
      font-size: 2rem;
      line-height: 2.5rem;
    }
  `;

  const filledTextStyle = css`
    ${textStyle};
    color: #fff;
    z-index: 0;
  `;

  const outlinedTextStyle = css`
    ${textStyle};
    color: transparent;
    -webkit-text-stroke: 0.5px #fff;
    z-index: 2;
  `;

  const circleStyle = css`
    height: 200px;
    width: 200px;
    border-radius: 50%;
    background: #3590f3;
    border: 20px solid #fff;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
    position: absolute;
    z-index: 1;
    pointer-events: none;
  `;

  return (
    <div className={containerStyle}>
      <span className={filledTextStyle}>{text}</span>
      <span className={outlinedTextStyle} aria-hidden="true">
        {text}
      </span>
      <div
        className={circleStyle}
        ref={circleRef}
        style={{
          left: `${circlePosition.x}px`,
          top: `${circlePosition.y}px`,
        }}
      />
    </div>
  );
};

export default CircleTextEffect;
