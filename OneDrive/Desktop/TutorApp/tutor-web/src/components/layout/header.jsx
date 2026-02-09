'use client';

import { Bell, Search, User, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

        // Close dropdown when clicking outside
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
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm w-full sticky top-0 z-50">
            <div className="w-full flex-1">
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            className="w-full bg-slate-50 border-none shadow-none appearance-none pl-9 md:w-2/3 lg:w-1/3 focus-visible:ring-1 focus-visible:ring-blue-500"
                            placeholder="Search courses..."
                            type="search"
                        />
                    </div>
                </form>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
                <Button
                    size="icon"
                    variant="ghost"
                    className="relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>

                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No notifications yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={cn(
                                                "p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start cursor-pointer",
                                                !notification.read ? "bg-blue-50/30" : ""
                                            )}
                                            onClick={() => markAsRead(notification._id)}
                                        >
                                            <div className={cn(
                                                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                                !notification.read ? "bg-blue-500" : "bg-slate-300"
                                            )} />
                                            <div className="flex-1 space-y-1">
                                                <p className={cn(
                                                    "text-sm leading-none",
                                                    !notification.read ? "font-semibold text-slate-900" : "text-slate-600"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-slate-500 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l">
                <div className="flex flex-col text-right hidden sm:block">
                    <span className="text-sm font-medium text-slate-900">{user?.name || 'User'}</span>
                    <span className="text-xs text-slate-500 capitalize">{user?.role || 'Guest'}</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm overflow-hidden">
                    {user?.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-5 w-5" />
                    )}
                </div>
            </div>
        </header>
    );
}
