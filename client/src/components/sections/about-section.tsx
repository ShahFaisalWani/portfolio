import React from 'react'
import DivReveal from "../text-animation/div-reveal"
import { FlipTextReveal } from "../text-animation/flip-text"
import MoveWrapper from "../move-wrapper"
import AnimatedText from "../text-animation/text-anim"
import TechStackHoneyComb from "../techstack-honeycomb"
import GlowCard from "../glow-card"
import { motion } from 'framer-motion'
import myImg_bgrm from '@assets/FaisalPic-Photoroom.png'
import myImgY from '@assets/image.png'

export const AboutSection: React.FC = () => {
  return (
    <div className="flex p-8 sm:p-16 justify-center pt-10 overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="flex flex-col justify-start items-center sm:items-start text-center w-full sm:w-1/2 z-50 gap-8">
          <div className="flex flex-col gap-4">
            <MoveWrapper>
              <DivReveal delay={0} children={(
                <h1 className="flex justify-center sm:justify-start items-center font-ramillas-light" data-cursor="project">You dream it,</h1>
              )} />
              <DivReveal delay={0.2} children={(
                <h1 className="flex justify-center sm:justify-start items-center sm:ml-10 whitespace-nowrap font-ramillas-light" data-cursor="project">
                  I <FlipTextReveal text1="code" text2="craft" className="font-bold inline-block font-ramillas-stroke mx-2 px-6 rounded-full" /> it to life
                </h1>
              )} />
            </MoveWrapper>
            <div className="text-left flex flex-col gap-3">
              <AnimatedText className="text-lg" text="Hi, I'm Faisal, a Software Engineer passionate about building scalable web apps, integrating AI models and blockchain" />
              <AnimatedText className="text-base leading-6" text="I thrive on solving complex challenges and am constantly learning new technologies. I enjoy bringing ideas to life through clean, efficient code and am always looking for opportunities to develop high-impact solutions." />
              <AnimatedText className="text-md font-gt-bold leading-6" text="I'm ready to take on exciting challenges and grow as part of a dynamic team in the tech industry." />
            </div>
          </div>
          <motion.div className="w-[24rem] relative sm:hidden"
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1.4, type: "spring" }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <motion.img
              src={myImg_bgrm}
              className="w-full relative z-50"
            />

            <motion.img
              src={myImgY}
              className="absolute top-0 w-[24rem] h-auto z-10 origin-center"
              initial={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
              animate={{
                clipPath: [
                  "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                  "polygon(0% 0%, 90% 30%, 100% 100%, 10% 90%)",
                  "polygon(10% 0%, 100% 60%, 100% 100%, 0% 100%)",
                  "polygon(0% 0%, 90% 30%, 90% 100%, 10% 100%)",
                  "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                ]
              }}
              transition={{
                duration: 10,
                ease: ["easeInOut"],
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </motion.div>
          <div className="my-10 sm:mt-20 w-full flex flex-col justify-center items-center">
            <DivReveal children={(
              <h1 className="mb-10">
                Tech Stack
              </h1>
            )} />
            <div className="flex flex-col gap-x-8 gap-y-2 w-full sm:w-[50rem]">
              <TechStackHoneyComb />
            </div>
          </div>
        </div>

        <div className="w-full sm:w-1/2">
          <motion.div className="w-[32rem] relative m-auto max-sm:hidden"
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1.4, type: "spring" }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <motion.img
              src={myImg_bgrm}
              className="w-full relative z-50"
            />

            <motion.img
              src={myImgY}
              className="absolute top-0 w-[32rem] h-auto z-10 origin-center"
              initial={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
              animate={{
                clipPath: [
                  "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                  "polygon(0% 0%, 90% 30%, 100% 100%, 10% 90%)",
                  "polygon(10% 0%, 100% 60%, 100% 100%, 0% 100%)",
                  "polygon(0% 0%, 90% 30%, 90% 100%, 10% 100%)",
                  "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                ]
              }}
              transition={{
                duration: 10,
                ease: ["easeInOut"],
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </motion.div>
          <div className="flex flex-col gap-8 items-center my-10 sm:mt-20">
            <DivReveal inverse children={(
              <h1
                className="sm:mb-10"
                data-cursor="project"
              >
                Core Values
              </h1>
            )} />
            <div className="flex flex-1 flex-col items-center justify-center gap-4 w-full sm:w-4/5">
              <GlowCard
                className="w-full h-[7rem]"
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1, type: "spring" }}
              >
                <h1 className="text-lg font-gt-bold text-text-10">
                  Continuous Learning and Adaptability 📚
                </h1>
                <p className="text-text-20">
                  I embrace new technologies and continuously learn to stay ahead in the ever-evolving tech landscape.
                </p>
              </GlowCard>
              <GlowCard
                className="w-full h-[7rem]"
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1, type: "spring" }}
              >
                <h1 className="text-lg font-gt-bold text-text-10">
                  Collaboration and Leadership 🤝
                </h1>
                <p className="text-text-20">
                  I value teamwork and take initiative to lead and guide projects to success.
                </p>
              </GlowCard>
              <GlowCard
                className="w-full h-[7rem]"
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1, type: "spring" }}
              >
                <h1 className="text-lg font-gt-bold text-text-10">
                  Sharing Knowledge and Mentorship 👨‍🏫
                </h1>
                <p className="text-text-20">
                  I am passionate about sharing my knowledge through part-time tutoring, mentoring others, and helping them learn new skills.
                </p>
              </GlowCard>
              <GlowCard
                className="w-full h-[7rem]"
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1, type: "spring" }}
              >
                <h1 className="text-lg font-gt-bold text-text-10">
                  Commitment to High-Quality Solutions 🔧
                </h1>
                <p className="text-text-20">
                  I am dedicated to delivering reliable, scalable, and high-quality products that meet real-world needs.
                </p>
              </GlowCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
