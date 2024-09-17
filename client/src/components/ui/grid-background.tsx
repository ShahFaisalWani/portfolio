import React from "react";

export function GridBackground() {
  return (
    <div className="w-full h-full top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 duration-[0.4s] bg-grid-[#1970b9]/[0.2] dark:bg-grid-[#ebebeb]/[0.2] flex items-center justify-center absolute -z-10">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center duration-[0.4s] bg-bg [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black)]"></div>
    </div>
  );
}