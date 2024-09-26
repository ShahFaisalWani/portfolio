import { cn } from "@lib/utils";
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
  ElementType,
} from "react";

type MouseEnterContextType = [
  boolean,
  Dispatch<SetStateAction<boolean>>
] | undefined;

const MouseEnterContext = createContext<MouseEnterContextType>(undefined);

interface CardContainerProps {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
}

export const CardContainer: React.FC<CardContainerProps> = ({
  children,
  className,
  containerClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseNear, setIsMouseNear] = useState(false);

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

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (detectMob()) return;

      if (!containerRef.current) return;
      const { left, top, right, bottom } = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const nearThreshold = 100;

      const isNear =
        mouseX >= left - nearThreshold && mouseX <= right + nearThreshold &&
        mouseY >= top - nearThreshold && mouseY <= bottom + nearThreshold;

      setIsMouseNear(isNear);

      if (isNear) {
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        const x = (mouseX - centerX) / 25;
        const y = (mouseY - centerY) / 25;
        containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
      } else {
        containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <MouseEnterContext.Provider value={[isMouseNear, setIsMouseNear]}>
      <div
        className={cn(
          // "flex items-center justify-center",
          containerClassName,
        )}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          ref={containerRef}
          className={cn(
            "flex items-center justify-center relative transition-all duration-200 ease-linear",
            className
          )}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "h-96 w-96 [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardItemProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  [key: string]: any;
}

export const CardItem: React.FC<CardItemProps> = ({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMouseEntered] = useMouseEnter();

  useEffect(() => {
    handleAnimations();
  }, [isMouseEntered]);

  const handleAnimations = () => {
    if (!ref.current) return;
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    }
  };

  return (
    <Tag
      ref={ref}
      className={cn("transition duration-200 ease-linear", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export const useMouseEnter = (): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error("useMouseEnter must be used within a MouseEnterProvider");
  }
  return context;
};