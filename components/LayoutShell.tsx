"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { usePathname } from "next/navigation";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "./dashboard/DashboardLayout";

interface LayoutShellProps {
  children: React.ReactNode;
}

/**
 * LayoutShell component that wraps the application content.
 * It provides a consistent layout with a Navbar and Footer,
 * while wrapping all dashboard views in a unified sidebar navigation shell.
 */
export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  
  // Define routes that should not show the standard Navbar and Footer (Authentication pages)
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  
  // Define all dashboard routes that use the Sidebar layout
  const isDashboardPage =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/bookings" || pathname.startsWith("/bookings/") ||
    pathname === "/resources" || pathname.startsWith("/resources/") ||
    pathname === "/notifications" || pathname.startsWith("/notifications/") ||
    pathname === "/maintenance" || pathname.startsWith("/maintenance/") ||
    pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/profile" || pathname.startsWith("/profile/");

  const skipGlobalNav = isAuthPage || isDashboardPage;

  return (
    <>
      {!skipGlobalNav && <Navbar />}
      <main className="flex-grow flex flex-col">
        {isDashboardPage ? (
          <ProtectedRoute>
            <DashboardLayout>{children}</DashboardLayout>
          </ProtectedRoute>
        ) : (
          children
        )}
      </main>
      {!skipGlobalNav && <Footer />}
    </>
  );
}

