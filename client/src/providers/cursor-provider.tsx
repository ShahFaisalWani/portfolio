import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

export enum CursorVariant {
  Default = 'default',
  Project = 'project',
  GlowCard = 'glowCard',
  None = 'none',
}

const useCursorProvider = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorText, setCursorText] = useState('');
  const [cursorVariant, setCursorVariant] = useState<CursorVariant>(CursorVariant.Default);
  const [cursorColor, setCursorColor] = useState('var(--color-primary)');

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        setCursorPosition({ x: clientX, y: clientY });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-cursor="project"]')) {
        const color = getComputedStyle(document.documentElement).getPropertyValue("--color-text").trim();
        setCursorColor(color);
        setCursorVariant(CursorVariant.Project);
      }
      else if (target.closest('[data-cursor="glowCard"]')) {
        setCursorColor('var(--color-root-contrast)');
        setCursorVariant(CursorVariant.GlowCard);
      }
      else if (!target.classList.contains('custom-cursor')) {
        setCursorColor('var(--color-primary)');
        setCursorVariant(CursorVariant.Default);
      }
    }

    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return {
    cursorPosition,
    cursorText,
    cursorVariant,
    cursorColor,
    setCursorText,
    setCursorVariant,
    setCursorColor,
  };
};

export type CursorContextType = ReturnType<typeof useCursorProvider>;

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const CursorProvider = ({ children }: { children: ReactNode }) => {
  const cursorProvider = useCursorProvider();

  return (
    <CursorContext.Provider value={cursorProvider}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};
