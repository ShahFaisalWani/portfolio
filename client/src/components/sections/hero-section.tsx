import React from 'react'
import { motion } from "framer-motion";

import { useState } from "react";
import MoveWrapper from "../move-wrapper";
import { GridBackground } from "@components/ui/grid-background";
import { SocialBar } from "@components/social-bar";

export const HeroSection: React.FC = () => {
  const [letterMovements, setLetterMovements] = useState<{ x: number; y: number }[]>([]);

  const getRandomMovement = () => {
    return {
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5,
    }
  };

  const onAnimationStart = () => {
    document.body.style.overflow = 'hidden';
  }
  const onAnimationComplete = () => {
    document.documentElement.setAttribute("allow-move", "true"); // Set attribute to allow movement
    document.body.style.overflow = '';
    setLetterMovements(text1.concat(text2).split("").map(() => getRandomMovement()));
  }

  const handleLetterAnimationComplete = (index: number) => {
    setLetterMovements((prevMovements) =>
      prevMovements.map((movement, i) => (i === index ? getRandomMovement() : movement))
    );
  };

  const text1 = "Hello,";
  const text2 = "Again.";

  return (
    <>
      <motion.div
        className="fixed w-screen h-screen left-0 top-0 bg-root-contrast z-[11]"
        initial={{ y: 0 }}
        animate={{ y: -window.innerHeight }}
        transition={{ delay: 2.8, duration: 0.7, ease: "easeOut" }}
        onAnimationStart={onAnimationStart}
        onAnimationComplete={onAnimationComplete}
      />
      <GridBackground />
      <div className="h-4/5 top-[8rem] w-full flex flex-col justify-center items-center font-ramillas-light relative z-[12]">
        <div className="w-full h-full flex flex-col justify-center items-center">
          <MoveWrapper>
            <motion.div
              className="text-[7rem] !tracking-wide h-[5.5rem] leading-[2rem] sm:leading-[5rem] w-[25rem] sm:w-[35rem] relative"
              initial={{ color: 'var(--color-root)' }}
              animate={{
                x: [`-50vw`, '-7.5vw', '-7.5vw', '-12.5vw', '-12.5vw', '-7.5vw', '-4vw'],
                color: 'var(--color-text)'
              }}
              transition={{
                x: {
                  times: [0, 0.2, 0.35, 0.4, 0.7, 0.75, 1],
                  duration: 4,
                },
                color: { delay: 3 }
              }}
            >
              <div className="flex w-fit mr-auto">
                {text1.split("").map((letter, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: 0, y: 0 }}
                    animate={letterMovements[index]}
                    transition={{
                      duration: 2,
                      ease: ["easeInOut"],
                    }}
                    onAnimationComplete={() => handleLetterAnimationComplete(index)}
                    data-cursor="project"
                  >
                    <motion.h1
                      className="text-[7rem] !tracking-wide h-[5.5rem] leading-[2rem] sm:leading-[5rem]"
                      initial={{ color: "var(--color-root)" }}
                      animate={{ color: "var(--color-text)" }}
                      transition={{ color: { delay: 3 } }}
                    >
                      {letter}
                    </motion.h1>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              className="text-[7rem] !tracking-wide h-[5.5rem] leading-[2rem] sm:leading-[5rem] w-[25rem] sm:w-[35rem] relative"
              initial={{ color: 'var(--color-root)' }}
              animate={{
                x: [`50vw`, '7.5vw', '7.5vw', '12.5vw', '12.5vw', '7.5vw', '4vw'],
                color: 'var(--color-text)'
              }}
              transition={{
                x: {
                  times: [0, 0.2, 0.35, 0.4, 0.7, 0.75, 1],
                  duration: 4,
                },
                color: { delay: 3 }
              }}
            >
              <div className="flex w-fit ml-auto">
                {text2.split("").map((letter, index) => {
                  const idx = index + text1.length
                  return (
                    <motion.div
                      key={idx}
                      initial={{ x: 0, y: 0 }}
                      animate={letterMovements[idx]}
                      transition={{
                        duration: 2,
                        ease: ["easeInOut"],
                      }}
                      onAnimationComplete={() => handleLetterAnimationComplete(idx)}
                      data-cursor="project"
                    >
                      <motion.h1
                        className="text-[7rem] !tracking-wide h-[5.5rem] leading-[5rem]"
                        initial={{ color: "var(--color-root)" }}
                        animate={{ color: "var(--color-text)" }}
                        transition={{ color: { delay: 3 } }}
                      >
                        {letter}
                      </motion.h1>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </MoveWrapper>
          <motion.div className="relative top-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
            <SocialBar isHome={true} />
          </motion.div>
        </div>
      </div>
    </>
  )
}
