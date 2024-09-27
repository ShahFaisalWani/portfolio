import { cn } from "@lib/utils";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import ReactGA from 'react-ga4';

export const FloatingDock = ({
  items,
  desktopClassName,
  isHome,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  desktopClassName?: string;
  mobileClassName?: string;
  isHome: boolean;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} isHome={isHome} />
    </>
  );
};


const FloatingDockDesktop = ({
  items,
  className,
  isHome,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
  isHome: boolean
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex h-24 gap-6 items-end rounded-2xl bg-primary-20 px-4 pb-2 sm:pb-4",
        className,
        isHome ? "bg-transparent" : "bg-primary-20"
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} isHome={isHome} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  isHome,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  isHome: boolean;
}) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [50, 100, 50]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [50, 100, 50]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  let heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20]
  );

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    ReactGA.event({
      category: 'Floating Social Bar',
      action: 'Click link',
      label: title,
    });
  };

  return (
    <a href={href} target="_blank" onClick={handleClick}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn('aspect-square rounded-full flex items-center justify-center relative', isHome ? 'bg-primary' : 'bg-accent-10')}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: -4, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className={cn('px-2 py-0.5 whitespace-pre rounded-md text-white text-sm absolute left-1/2 -translate-x-1/2 -top-8 w-fit font-gt-bold', isHome ? 'bg-primary' : 'bg-accent-10')}
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
}
