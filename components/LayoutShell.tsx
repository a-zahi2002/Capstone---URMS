"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { usePathname } from "next/navigation";

interface LayoutShellProps {
  children: React.ReactNode;
}

/**
 * LayoutShell component that wraps the application content.
 * It provides a consistent layout with a Navbar and Footer,
 * while allowing certain pages (like login/register and dashboard) to skip them if needed.
 */
export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  
  // Define routes that should not show the standard Navbar and Footer
  const isAuthPage = pathname === "/login" || pathname === "/register";
  
  // Dashboard has its own sidebar navigation, so skip global Navbar/Footer
  const isDashboardPage = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const skipGlobalNav = isAuthPage || isDashboardPage;

  return (
    <>
      {!skipGlobalNav && <Navbar />}
      <main className="flex-grow flex flex-col">
        {children}
      </main>
      {!skipGlobalNav && <Footer />}
    </>
  );
}
