import fb_1 from '@assets/football/fb_1.jpg'
import fb_2 from '@assets/football/fb_2.jpg'
import fb_3 from '@assets/football/fb_3.jpg'
import fb_4 from '@assets/football/fb_4.jpg'
import fb_5 from '@assets/football/fb_5.jpg'
import fb_6 from '@assets/football/fb_6.jpg'
import fb_7 from '@assets/football/fb_7.jpg'
import fb_8 from '@assets/football/fb_8.jpg'
import fb_9 from '@assets/football/fb_9.jpg'
import fb_10 from '@assets/football/fb_10.jpg'
import { motion } from 'framer-motion'
import ImgMagnifier from "@components/img-manifier"

const images = [
  fb_9,
  fb_1,
  fb_2,
  fb_3,
  fb_4,
  fb_5,
  fb_6,
  fb_7,
  fb_8,
  fb_10
]

export const FootballSection: React.FC = () => {
  const displayedImages = window.innerWidth < 640 ? images.slice(0, 6) : images;

  return (
    <div className="flex flex-col pt-4 sm:pt-16">
      <motion.h1
        className="sm:mb-10 mx-4 sm:mx-16 max-sm:text-center"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        data-cursor="project"
      >
        When I'm Off Work
      </motion.h1>
      <div className="flex justify-center mt-8">
        <ImgMagnifier images={displayedImages} />
      </div>
    </div>
  );
};
