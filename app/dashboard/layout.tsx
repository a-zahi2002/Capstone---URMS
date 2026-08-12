"use client";

/**
 * Dashboard-specific layout that renders ONLY children without the
 * global Navbar and Footer. The DashboardLayout component provides
 * its own sidebar navigation and top bar.
 */
export default function DashboardRouteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
