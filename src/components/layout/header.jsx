'use client';

import { Bell, Search, User, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
            fetchNotifications();
        }

        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data.success) {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.notifications.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
            <div className="flex h-16 items-center gap-4 px-6">
                {/* Search Bar */}
                <div className="flex-1 max-w-2xl">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                className="w-full h-10 bg-slate-50 border-slate-200 pl-10 pr-4 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                placeholder="Search courses, students, or lessons..."
                                type="search"
                            />
                        </div>
                    </form>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <div className="relative" ref={notificationRef}>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="relative h-10 w-10 hover:bg-slate-100 transition-colors"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell className="h-5 w-5 text-slate-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white shadow-lg">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50">
                                    <div>
                                        <h3 className="font-bold text-slate-900">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <p className="text-xs text-slate-600 mt-0.5">{unreadCount} unread</p>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Bell className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium">No notifications yet</p>
                                            <p className="text-slate-400 text-xs mt-1">We'll notify you when something arrives</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification._id}
                                                    className={cn(
                                                        "p-4 hover:bg-slate-50 transition-all duration-150 flex gap-3 items-start cursor-pointer group",
                                                        !notification.read ? "bg-indigo-50/50" : ""
                                                    )}
                                                    onClick={() => markAsRead(notification._id)}
                                                >
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-all",
                                                        !notification.read ? "bg-indigo-600 shadow-lg shadow-indigo-500/50" : "bg-slate-300"
                                                    )} />
                                                    <div className="flex-1 space-y-1 min-w-0">
                                                        <p className={cn(
                                                            "text-sm leading-snug",
                                                            !notification.read ? "font-semibold text-slate-900" : "text-slate-700"
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-slate-600 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 pt-1">
                                                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="p-3 border-t border-slate-100 bg-slate-50">
                                        <button
                                            onClick={() => {
                                                setShowNotifications(false);
                                                router.push('/notifications');
                                            }}
                                            className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                        >
                                            View all notifications
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Profile Section */}
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Guest'}</p>
                        </div>
                        <button
                            onClick={() => router.push('/tutor/settings')}
                            className="relative group"
                        >
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-white shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group-hover:scale-105">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-5 w-5" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}