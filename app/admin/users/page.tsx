"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import Pagination from "@/components/Pagination";
import SavedSearches from "@/components/SavedSearches";
import { exportToCSV } from "@/lib/exportCsv";
import {
    Users,
    UserPlus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    ArrowLeft,
    Building2,
    Mail,
    Shield,
    X,
    Save,
    CheckCircle2,
    AlertCircle,
    KeyRound,
    Eye,
    EyeOff,
    DownloadCloud
} from "lucide-react";


import { BASE_URL } from "@/lib/apiClient";

interface DBUser {
    id: string;
    name: string;
    email: string;
    role: "admin" | "student" | "lecturer" | "maintenance";
    department: string;
    phone?: string;
    approval_status?: "Pending" | "Approved" | "Rejected";
    created_at: string;
}

const roleBadges: Record<string, string> = {
    admin: "bg-violet-500/10 border-violet-500/20 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400",
    lecturer: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400",
    student: "bg-blue-500/10 border-blue-500/20 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400",
    maintenance: "bg-amber-500/10 border-amber-500/20 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400",
};

const approvalStatusBadges: Record<string, string> = {
    Approved: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    Pending: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:bg-amber-500/20 dark:text-amber-450",
    Rejected: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
};

const departments = [
    "Faculty of Computing",
    "Faculty of Applied Sciences",
    "Faculty of Management",
    "Faculty of Engineering",
    "Faculty of Business",
    "Faculty of Medicine"
];

function UserManagementPageContent() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlPageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const [users, setUsers] = useState<DBUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [approvalFilter, setApprovalFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(urlPage);
    const [pageSize, setPageSize] = useState(urlPageSize);

    const updateUrlParams = (newPage: number, newPageSize: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", newPage.toString());
        params.set("pageSize", newPageSize.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    useEffect(() => {
        const pageVal = parseInt(searchParams.get("page") || "1", 10);
        const pageSizeVal = parseInt(searchParams.get("pageSize") || "10", 10);
        setCurrentPage(pageVal);
        setPageSize(pageSizeVal);
    }, [searchParams]);

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Selected user for Edit/Delete
    const [selectedUser, setSelectedUser] = useState<DBUser | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "student",
        department: "",
        password: "",
        phone: "",
        approval_status: "Approved"
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [showFormPassword, setShowFormPassword] = useState(false);

    const getToken = useCallback(async () => {
        if (user && typeof user.getIdToken === "function") return user.getIdToken();
        return "dev-token";
    }, [user]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let result;
            try {
                result = await res.json();
            } catch (jsonErr) {
                result = null;
            }
            if (!res.ok) {
                throw new Error(result?.message || "Failed to fetch users from server.");
            }
            setUsers(result?.data || []);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load users list.");
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (user) fetchUsers();
    }, [user, fetchUsers]);

    // Handle Create User Submit
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormLoading(true);

        const { name, email, role, department, password, phone } = formData;

        if (!name || !email || !role || !department || !password) {
            setFormError("All fields are required.");
            setFormLoading(false);
            return;
        }

        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, role, department, password, phone })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to create user.");

            setSuccess("User created successfully!");
            setCreateModalOpen(false);
            setFormData({ name: "", email: "", role: "student", department: "", password: "", phone: "", approval_status: "Approved" });
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setFormError(err.message || "Something went wrong.");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle Update User Submit
    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setFormError(null);
        setFormLoading(true);

        const { name, role, department, password, phone, approval_status } = formData;

        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/users/${selectedUser.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, role, department, phone, approval_status, ...(password ? { password } : {}) })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to update user.");

            setSuccess("User updated successfully!");
            setEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setFormError(err.message || "Something went wrong.");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle Delete User Submit
    const handleDeleteSubmit = async () => {
        if (!selectedUser) return;
        setFormLoading(true);
        setError(null);

        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/users/${selectedUser.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Failed to delete user.");

            setSuccess("User deleted successfully!");
            setDeleteModalOpen(false);
            setSelectedUser(null);
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to delete user.");
            setDeleteModalOpen(false);
        } finally {
            setFormLoading(false);
        }
    };

    const handleSetApprovalStatus = async (userToUpdate: DBUser, status: "Approved" | "Rejected") => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const res = await fetch(`${BASE_URL}/users/${userToUpdate.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: userToUpdate.name,
                    role: userToUpdate.role,
                    department: userToUpdate.department,
                    phone: userToUpdate.phone,
                    approval_status: status
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || `Failed to update status to ${status}.`);

            setSuccess(`User registration ${status.toLowerCase()} successfully!`);
            fetchUsers();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to update user status.");
        } finally {
            setLoading(false);
        }
    };

    // Open Edit Modal and fill values
    const openEditModal = (userToEdit: DBUser) => {
        setSelectedUser(userToEdit);
        setFormData({
            name: userToEdit.name,
            email: userToEdit.email,
            role: userToEdit.role,
            department: userToEdit.department || "",
            password: "", // Keep empty unless updating
            phone: userToEdit.phone || "",
            approval_status: userToEdit.approval_status || "Approved"
        });
        setFormError(null);
        setShowFormPassword(false);
        setEditModalOpen(true);
    };

    // Open Delete Modal
    const openDeleteModal = (userToDelete: DBUser) => {
        setSelectedUser(userToDelete);
        setDeleteModalOpen(true);
    };

    // Filter logic
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter ? u.role === roleFilter : true;
        const matchesDept = deptFilter ? u.department === deptFilter : true;
        const matchesApproval = approvalFilter ? (u.approval_status || "Approved") === approvalFilter : true;
        return matchesSearch && matchesRole && matchesDept && matchesApproval;
    });

    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <div className="min-h-screen bg-slate-50 dark:bg-background/20 overflow-x-hidden pb-16">
                
                {/* Header Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-5">
                            <Link href="/dashboard" className="p-2.5 bg-card border border-slate-200 dark:border-border rounded-2xl hover:bg-slate-100 dark:bg-foreground/5 transition-colors shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-foreground/70" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                                    <Users className="w-8 h-8 text-brand-primary" /> User Directory
                                </h1>
                                <p className="text-slate-600 dark:text-foreground/60 text-sm font-bold mt-1">Manage institutional members, roles, and profiles</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setFormData({ name: "", email: "", role: "student", department: "", password: "", phone: "", approval_status: "Approved" });
                                setFormError(null);
                                setShowFormPassword(false);
                                setCreateModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
                        >
                            <UserPlus className="w-4 h-4" /> Create Member
                        </button>
                    </div>

                    {success && (
                        <div className="mb-6 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 p-4 rounded-2xl shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{success}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 text-red-655 dark:text-red-300 rounded-2xl backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="font-bold text-sm">{error}</p>
                            </div>
                            <button
                                onClick={fetchUsers}
                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Filter controls */}
                    <div className="bg-card border border-slate-200 dark:border-border rounded-2xl p-4 shadow-sm mb-4 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative w-full md:flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    updateUrlParams(1, pageSize);
                                }}
                                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                        </div>

                        <div className="flex gap-4 w-full md:w-auto flex-wrap">
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    updateUrlParams(1, pageSize);
                                }}
                                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-foreground/70 focus:outline-none cursor-pointer"
                            >
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="lecturer">Lecturer</option>
                                <option value="student">Student</option>
                                <option value="maintenance">Maintenance</option>
                            </select>

                            <select
                                value={deptFilter}
                                onChange={(e) => {
                                    setDeptFilter(e.target.value);
                                    updateUrlParams(1, pageSize);
                                }}
                                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-foreground/70 focus:outline-none cursor-pointer max-w-[200px]"
                            >
                                <option value="">All Departments</option>
                                {departments.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            <select
                                value={approvalFilter}
                                onChange={(e) => {
                                    setApprovalFilter(e.target.value);
                                    updateUrlParams(1, pageSize);
                                }}
                                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-foreground/70 focus:outline-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="Approved">Approved</option>
                                <option value="Pending">Pending</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Saved Searches & CSV Export */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <SavedSearches
                            pageKey="users"
                            currentFilters={{
                                searchTerm,
                                roleFilter,
                                deptFilter,
                                approvalFilter,
                            }}
                            onLoadFilters={(filters) => {
                                if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
                                if (filters.roleFilter !== undefined) setRoleFilter(filters.roleFilter);
                                if (filters.deptFilter !== undefined) setDeptFilter(filters.deptFilter);
                                if (filters.approvalFilter !== undefined) setApprovalFilter(filters.approvalFilter);
                                updateUrlParams(1, pageSize);
                            }}
                        />
                        <button
                            onClick={() => {
                                exportToCSV(
                                    filteredUsers,
                                    ["Name", "Email Address", "Role", "Faculty / Department", "Phone Number", "Joined Date"],
                                    ["name", "email", "role", "department", "phone", "created_at"],
                                    "users"
                                );
                            }}
                            className="inline-flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 active:scale-95 text-slate-700 dark:text-foreground/80 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 text-sm"
                        >
                            <DownloadCloud className="w-4 h-4 text-emerald-500" />
                            <span>Export CSV</span>
                        </button>
                    </div>

                    {/* Users Directory List */}
                    <div className="bg-card border border-slate-200 dark:border-border rounded-3xl overflow-hidden shadow-xl">
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                                <p className="text-slate-400 font-semibold text-sm">Loading directory records…</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-2">
                                <Users className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                                <p className="text-slate-500 font-bold">No members found</p>
                                <p className="text-slate-400 text-xs">Try matching alternate keywords or filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-border/80 bg-slate-50 dark:bg-slate-950/20 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="py-4 px-6">Name</th>
                                            <th className="py-4 px-6">Email Address</th>
                                            <th className="py-4 px-6">Role</th>
                                            <th className="py-4 px-6">Faculty / Department</th>
                                            <th className="py-4 px-6">Phone</th>
                                            <th className="py-4 px-6">Status</th>
                                            <th className="py-4 px-6">Joined Date</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-150 dark:divide-border/40">
                                        {paginatedUsers.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-foreground/[0.01] transition-colors">
                                                <td className="py-4.5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary/10 to-indigo-500/10 flex items-center justify-center text-sm font-black text-brand-primary">
                                                            {item.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4.5 px-6 text-sm font-semibold text-slate-655 dark:text-slate-400">
                                                    {item.email}
                                                </td>
                                                <td className="py-4.5 px-6">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${roleBadges[item.role] || "bg-slate-100 border-slate-200 text-slate-600"}`}>
                                                        {item.role}
                                                    </span>
                                                </td>
                                                <td className="py-4.5 px-6 text-xs font-bold text-slate-500 dark:text-foreground/50">
                                                    {item.department || "—"}
                                                </td>
                                                <td className="py-4.5 px-6 text-xs font-bold text-slate-500 dark:text-foreground/50">
                                                    {item.phone || "—"}
                                                </td>
                                                <td className="py-4.5 px-6">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${approvalStatusBadges[item.approval_status || "Approved"]}`}>
                                                        {item.approval_status || "Approved"}
                                                    </span>
                                                </td>
                                                <td className="py-4.5 px-6 text-xs font-bold text-slate-500 dark:text-foreground/50">
                                                    {new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                                </td>
                                                <td className="py-4.5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {item.approval_status !== "Approved" && (
                                                            <button
                                                                onClick={() => handleSetApprovalStatus(item, "Approved")}
                                                                className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg text-emerald-600 hover:bg-emerald-200 dark:text-emerald-450 dark:hover:bg-emerald-550/20 transition-colors"
                                                                title="Approve Member"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {item.approval_status !== "Rejected" && (
                                                            <button
                                                                onClick={() => handleSetApprovalStatus(item, "Rejected")}
                                                                className="p-2 bg-rose-100 dark:bg-rose-500/10 rounded-lg text-rose-600 hover:bg-rose-200 dark:text-rose-400 dark:hover:bg-rose-550/20 transition-colors"
                                                                title="Reject Member"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="p-2 bg-slate-100 dark:bg-foreground/5 rounded-lg text-slate-600 hover:text-brand-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                                                            title="Edit user details"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(item)}
                                                            className="p-2 bg-slate-100 dark:bg-foreground/5 rounded-lg text-slate-600 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <Pagination
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                    totalItems={filteredUsers.length}
                                    onPageChange={(p) => updateUrlParams(p, pageSize)}
                                    onPageSizeChange={(sz) => updateUrlParams(1, sz)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* MODALS */}
                <AnimatePresence>
                    {/* Create / Edit User Modal */}
                    {(createModalOpen || editModalOpen) && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); setShowFormPassword(false); }}
                                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            />

                            {/* Modal Box */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="bg-card border border-slate-200 dark:border-border rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative z-10 overflow-hidden"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-brand-primary" />
                                        {createModalOpen ? "Register Member" : "Update Member"}
                                    </h3>
                                    <button
                                        onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); setShowFormPassword(false); }}
                                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-foreground/10 text-slate-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {formError && (
                                    <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        <p className="text-xs font-bold text-red-500 leading-tight">{formError}</p>
                                    </div>
                                )}

                                <form onSubmit={createModalOpen ? handleCreateSubmit : handleUpdateSubmit} className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Jane Doe"
                                            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-foreground focus:outline-none"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            disabled={editModalOpen} // Disable email change during edit
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="jane@university.ac.lk"
                                            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-foreground focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Select Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                                        >
                                            <option value="student">Student</option>
                                            <option value="lecturer">Lecturer</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    {/* Approval Status (Edit mode only) */}
                                    {editModalOpen && (
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Approval Status</label>
                                            <select
                                                value={formData.approval_status}
                                                onChange={(e) => setFormData({ ...formData, approval_status: e.target.value as any })}
                                                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                                            >
                                                <option value="Approved">Approved</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Faculty / Dept */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Faculty / Department</label>
                                        <select
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            required
                                            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select Department</option>
                                            {departments.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+1234567890"
                                            className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-foreground focus:outline-none"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">
                                            {createModalOpen ? "Credentials Password" : "New Password (optional)"}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showFormPassword ? "text" : "password"}
                                                required={createModalOpen}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder={createModalOpen ? "Min 8 characters" : "Leave blank to keep unchanged"}
                                                className="block w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-border rounded-xl text-xs font-bold text-foreground focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowFormPassword(!showFormPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                title={showFormPassword ? "Hide password" : "Show password"}
                                            >
                                                {showFormPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={formLoading}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
                                        >
                                            {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {createModalOpen ? "Create" : "Save Changes"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setCreateModalOpen(false); setEditModalOpen(false); setShowFormPassword(false); }}
                                            className="px-5 py-3 border border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-foreground/5 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {deleteModalOpen && selectedUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setDeleteModalOpen(false)}
                                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                            />

                            {/* Modal Box */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="bg-card border border-slate-200 dark:border-border rounded-[2rem] w-full max-w-sm p-8 shadow-2xl relative z-10"
                            >
                                <div className="text-center space-y-4">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-500 flex items-center justify-center rounded-2xl mx-auto shadow-md">
                                        <Trash2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-foreground">Confirm Deletion</h3>
                                        <p className="text-slate-500 dark:text-foreground/50 text-xs font-semibold mt-1">
                                            Are you sure you want to delete <strong>{selectedUser.name}</strong> ({selectedUser.email})?
                                        </p>
                                    </div>
                                    <div className="p-3 bg-red-500/5 rounded-xl border border-red-5500/10">
                                        <p className="text-[10px] text-red-655 dark:text-red-400 font-bold leading-normal">
                                            Warning: This action will permanently remove this account from Firebase Auth and the database, and nullify/cascade references in bookings or tickets.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleDeleteSubmit}
                                            disabled={formLoading}
                                            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-500/10"
                                        >
                                            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Delete"}
                                        </button>
                                        <button
                                            onClick={() => setDeleteModalOpen(false)}
                                            className="flex-1 py-3 border border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-foreground/5 text-slate-655 dark:text-slate-400 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}

export default function UserManagementPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-background/20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                    <p className="text-slate-400 font-semibold text-sm">Loading User Directory…</p>
                </div>
            </div>
        }>
            <UserManagementPageContent />
        </Suspense>
    );
}
