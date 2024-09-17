import { Outlet } from 'react-router-dom';
import Navbar from '@components/navbar';
import { ParticlesDiv } from "@components/particles/particles";
import { useEffect } from "react";
import GlobalCursor from "@components/global-cursor";

const AppContent: React.FC = () => {
  useEffect(() => {
    window.history.scrollRestoration = 'manual'
  }, []);

  return (
    <div className="relative">
      <GlobalCursor />
      <ParticlesDiv />
      <Navbar />
      <Outlet />
    </div>
  );
};

export default AppContent;
