import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeSwitcher } from "@components/theme-switcher";
import Logo from '/logo.svg';
import { Modal } from "@components/modal";
import ContactForm from "@components/contact-form";
import { cn } from "@lib/utils";
import ReactGA from 'react-ga4';

const Navbar: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleScroll = (event: React.MouseEvent, sectionId: string) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section && sectionId !== "section_home") {
      section.scrollIntoView({ behavior: "smooth" });

      ReactGA.event({
        category: "Navigation",
        action: "Navigate to section",
        label: sectionId,
      });
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    ReactGA.event({
      category: "Navigation",
      action: "Open Contact Modal",
      label: "Contact",
    });
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <motion.div
      className="h-[8rem] w-full flex justify-between items-center relative z-10 px-10 pt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 3.3 }}
    >
      <div className="flex items-center gap-20">
        <a className="h-[6rem] w-[6rem]" href="/">
          <img src={Logo} className="text-2xl" alt="Vite logo" />
        </a>
        <div className="flex gap-[5rem] text-3xl w-1/2 text-primary max-sm:hidden">
          <HoverLink href="#section_about" onClick={(event) => handleScroll(event, "section_about")} className="max-sm:hidden">
            About
          </HoverLink>
          <HoverLink href="#section_work" onClick={(event) => handleScroll(event, "section_work")} className="max-sm:hidden">
            Work
          </HoverLink>
          <HoverLink href="#section_projects" onClick={(event) => handleScroll(event, "section_projects")} className="max-sm:hidden">
            Projects
          </HoverLink>
          <HoverLink onClick={openModal}>
            Contact
          </HoverLink>
        </div>
      </div>

      <HoverLink onClick={openModal} className="text-2xl sm:hidden flex items-center justify-center">
        Contact Me
      </HoverLink>

      <ThemeSwitcher />

      <AnimatePresence>
        {isModalOpen && (
          <Modal onClose={closeModal}>
            <ContactForm onClose={closeModal} />
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

type HoverLinkProps = {
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
  className?: string
};

export const HoverLink: React.FC<HoverLinkProps> = (props) => {
  return (
    <motion.a
      href={props.href}
      onClick={props.onClick}
      className={cn('text-text border-b border-transparent hover:border-text font-ramillas-light hover:!cursor-pointer', props.className)}
      initial={{ y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 100 }}
      data-cursor="project"
    >
      {props.children}
    </motion.a>
  );
};

export default Navbar;
