"use client";

import { ReactNode } from "react";
import GridBackground from "@/components/GridBackground";
import Navbar from "@/components/Navbar";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <GridBackground />
      <Navbar />
      <div className="relative z-10">{children}</div>
    </>
  );
}
