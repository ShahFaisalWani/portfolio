import { FloatingDock } from "./ui/floating-dock"
import { faLinkedin, faGithub, faMedium } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const socials = [
  {
    title: "Gmail", icon: <FontAwesomeIcon icon={faEnvelope} className="h-full w-full text-white" />, href: "https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=shahfaisalwani14@gmail.com"
  },
  { title: "LinkedIn", icon: <FontAwesomeIcon icon={faLinkedin} className="h-full w-full text-white" />, href: "https://www.linkedin.com/in/faisalw14" },
  { title: "GitHub", icon: <FontAwesomeIcon icon={faGithub} className="h-full w-full text-white" />, href: "https://github.com/ShahFaisalWani" },
  { title: "Medium", icon: <FontAwesomeIcon icon={faMedium} className="h-full w-full text-white" />, href: "https://medium.com/@shahfaisalwani14" },
]

export const SocialBar = ({ isHome = false }: { isHome?: boolean }) => {
  return (
    <FloatingDock items={socials} isHome={isHome} />
  )
}