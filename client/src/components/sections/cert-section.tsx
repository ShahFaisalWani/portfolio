import grade_0 from '@assets/certs/grade_0.jpg'
import grade_1 from '@assets/certs/grade_1.jpg'
import hack_0 from '@assets/certs/hack_0.jpg'
import hack_1 from '@assets/certs/hack_1.jpg'
import hack_2 from '@assets/certs/hack_2.jpg'
import edexel from '@assets/certs/edexel.jpg'
import gacc from '@assets/certs/gacc.jpg'
import igcse from '@assets/certs/igcse.jpg'
import timo from '@assets/certs/timo.jpg'
import ukmt from '@assets/certs/ukmt.jpg'
import { motion } from 'framer-motion'
import { Carousel } from "@components/carousel"

const images = [
  hack_0,
  hack_1,
  hack_2,
  timo,
  ukmt,
  grade_0,
  grade_1,
  edexel,
  igcse,
  gacc,
]

export const CertSection: React.FC = () => {
  return (
    <div className="flex flex-col max-sm:p-4">
      <motion.h1
        className="sm:mb-10 mx-4 sm:mx-16 max-sm:text-center"
        initial={{ y: 100, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        data-cursor="project"
      >
        Certificates
      </motion.h1>
      <Carousel images={images} />
    </div>
  );
};
