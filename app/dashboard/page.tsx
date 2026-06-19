"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout />
        </ProtectedRoute>
    );
}
