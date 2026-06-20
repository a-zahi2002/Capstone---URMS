"use client";

import React, { Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import LecturerDashboard from "@/components/dashboard/LecturerDashboard";
import MaintenanceDashboard from "@/components/dashboard/MaintenanceDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

function DashboardPageContent() {
    const { profile } = useAuth();
    const role = profile?.role || "student";

    const renderDashboard = () => {
        switch (role) {
            case "admin":
                return <AdminDashboard />;
            case "lecturer":
                return <LecturerDashboard />;
            case "maintenance":
                return <MaintenanceDashboard />;
            case "student":
            default:
                return <StudentDashboard />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
            {renderDashboard()}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="max-w-7xl mx-auto p-6 lg:p-8 text-center font-bold text-slate-500">Loading Dashboard...</div>}>
            <DashboardPageContent />
        </Suspense>
    );
}


