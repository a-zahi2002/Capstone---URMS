"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { Bell, Check, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    createdAt: string;
    read: boolean;
}

export default function NotificationBell() {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch historical notifications from database
    useEffect(() => {
        if (!profile?.id) return;

        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('timestamp', { ascending: false })
                    .limit(20);

                if (error) throw error;

                if (data) {
                    const mapped: Notification[] = data.map((n: any) => ({
                        id: n.id,
                        title: n.title || (n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1) : 'Notification'),
                        message: n.message,
                        type: (n.type === 'alert' ? 'warning' : n.type) as any || 'info',
                        createdAt: n.timestamp || new Date().toISOString(),
                        read: n.is_read ?? false
                    }));
                    setNotifications(mapped);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        fetchNotifications();
    }, [profile?.id]);

    // Initialize socket connection for real-time notifications
    useEffect(() => {
        if (!profile?.id) return;

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        socketRef.current = io(backendUrl, {
            withCredentials: true,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to notification server');
            socket.emit('join_user_room', profile.id);
        });

        socket.on('notification', (newNotification: any) => {
            const mapped: Notification = {
                id: newNotification.id,
                title: newNotification.title || (newNotification.type ? newNotification.type.charAt(0).toUpperCase() + newNotification.type.slice(1) : 'Notification'),
                message: newNotification.message,
                type: (newNotification.type === 'alert' ? 'warning' : newNotification.type) as any || 'info',
                createdAt: newNotification.createdAt || new Date().toISOString(),
                read: newNotification.read ?? false
            };
            setNotifications((prev) => [mapped, ...prev]);
        });

        return () => {
            socket.disconnect();
        };
    }, [profile?.id]);

    // Update unread count
    useEffect(() => {
        setUnreadCount(notifications.filter((n) => !n.read).length);
    }, [notifications]);

    const markAsRead = async (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        if (!profile?.id) return;
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    const removeNotification = async (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', id);
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = (type: string, read: boolean) => {
        if (read) return 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/5';
        switch (type) {
            case 'success': return 'bg-green-500/10 hover:bg-green-500/20';
            case 'warning': return 'bg-amber-500/10 hover:bg-amber-500/20';
            case 'error': return 'bg-red-500/10 hover:bg-red-500/20';
            default: return 'bg-blue-500/10 hover:bg-blue-500/20';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-slate-500 dark:text-foreground/60 hover:bg-slate-100 dark:hover:bg-foreground/5 hover:text-foreground transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-slate-200 dark:border-border rounded-2xl shadow-xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 flex flex-col max-h-[85vh]">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-border flex items-center justify-between bg-slate-50 dark:bg-foreground/5">
                        <h3 className="font-bold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1 max-h-80">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 dark:text-foreground/40">
                                <Bell className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-medium">No notifications yet</p>
                                <p className="text-xs mt-1">We'll let you know when something arrives.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-border/50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 transition-colors relative group flex gap-3 ${getBgColor(notification.type, notification.read)}`}
                                    >
                                        {!notification.read && (
                                            <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                        )}
                                        
                                        <div className="shrink-0 mt-0.5">
                                            {getIcon(notification.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0" onClick={() => markAsRead(notification.id)}>
                                            <p className={`text-sm font-semibold truncate ${notification.read ? 'text-slate-600 dark:text-foreground/70' : 'text-foreground'}`}>
                                                {notification.title}
                                            </p>
                                            <p className={`text-xs mt-0.5 line-clamp-2 ${notification.read ? 'text-slate-500 dark:text-foreground/50' : 'text-slate-600 dark:text-foreground/80'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] mt-2 font-medium text-slate-400 dark:text-foreground/40">
                                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                                            className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-foreground transition-all"
                                            aria-label="Remove notification"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View All Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-200 dark:border-border bg-slate-50 dark:bg-foreground/5 text-center">
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors inline-block w-full py-1"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
