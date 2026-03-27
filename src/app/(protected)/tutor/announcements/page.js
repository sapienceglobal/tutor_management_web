'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Megaphone,
    Bell,
    Loader2,
    BookOpen,
    Users,
    ArrowRight,
    CheckCheck,
    Check,
    Trash2,
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, FX, pageStyle } from '@/constants/tutorTokens';

const formatDate = (value) => {
    try {
        return new Date(value).toLocaleString();
    } catch {
        return '-';
    }
};

export default function TutorAnnouncementsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('announcements');
    const [loading, setLoading] = useState(true);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const [announcements, setAnnouncements] = useState([]);
    const [announcementStats, setAnnouncementStats] = useState({ total: 0, course: 0, batch: 0 });
    const [announcementFilter, setAnnouncementFilter] = useState('all');

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'notifications') setActiveTab('notifications');
        else setActiveTab('announcements');
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [announcementsRes, notificationsRes] = await Promise.all([
                    api.get('/tutors/announcements?limit=200'),
                    api.get('/notifications?limit=30'),
                ]);

                setAnnouncements(announcementsRes.data?.announcements || []);
                setAnnouncementStats(announcementsRes.data?.stats || { total: 0, course: 0, batch: 0 });

                setNotifications(notificationsRes.data?.notifications || []);
                setUnreadCount(notificationsRes.data?.unreadCount || 0);
            } catch {
                toast.error('Failed to load announcements');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const filteredAnnouncements = useMemo(() => {
        if (announcementFilter === 'all') return announcements;
        return announcements.filter((item) => item.sourceType === announcementFilter);
    }, [announcements, announcementFilter]);

    const markNotificationRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item))
            );
            setUnreadCount((count) => Math.max(0, count - 1));
        } catch {
            toast.error('Failed to mark notification as read');
        }
    };

    const markAllNotificationsRead = async () => {
        setLoadingNotifications(true);
        try {
            await api.patch('/notifications/read-all');
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch {
            toast.error('Failed to mark notifications as read');
        } finally {
            setLoadingNotifications(false);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
            toast.success('Notification deleted');
        } catch {
            toast.error('Failed to delete notification');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>Loading communication hub...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={pageStyle}>
            <div
                className="rounded-2xl px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                        <Megaphone className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            Announcements & Notifications
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Manage communication updates for courses and batches
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 flex overflow-x-auto">
                {[
                    { key: 'announcements', label: 'Announcements', icon: Megaphone },
                    { key: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: Bell },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex-1 justify-center"
                        style={activeTab === key ? { borderColor: C.btnPrimary, color: C.btnPrimary } : { borderColor: 'transparent', color: '#94a3b8' }}
                    >
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            {activeTab === 'announcements' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: `All (${announcementStats.total || 0})` },
                            { key: 'course', label: `Course (${announcementStats.course || 0})` },
                            { key: 'batch', label: `Batch (${announcementStats.batch || 0})` },
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setAnnouncementFilter(item.key)}
                                className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={
                                    announcementFilter === item.key
                                        ? { backgroundColor: C.btnPrimary, color: C.surfaceWhite }
                                        : { backgroundColor: C.innerBg, color: C.textMuted, border: `1px solid ${C.cardBorder}` }
                                }
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {filteredAnnouncements.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                            <Megaphone className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm text-slate-500">No announcements found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAnnouncements.map((item, index) => (
                                <div key={`${item.sourceType}-${item.sourceId}-${item.createdAt}-${index}`} className="bg-white rounded-xl border border-slate-100 p-4">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{formatDate(item.createdAt)}</p>
                                        </div>
                                        <span
                                            className="text-[10px] px-2.5 py-1 rounded-full font-bold border capitalize flex items-center gap-1"
                                            style={{
                                                borderColor: item.sourceType === 'course' ? C.successBorder : C.warningBorder,
                                                color: item.sourceType === 'course' ? C.success : C.warning,
                                                backgroundColor: item.sourceType === 'course' ? C.successBg : C.warningBg,
                                            }}
                                        >
                                            {item.sourceType === 'course' ? <BookOpen className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                                            {item.sourceType}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.message}</p>

                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <p className="text-xs text-slate-400 truncate">
                                            {item.sourceType === 'batch' && item.courseTitle ? `${item.sourceTitle} · ${item.courseTitle}` : item.sourceTitle}
                                        </p>
                                        <button
                                            onClick={() =>
                                                router.push(
                                                    item.sourceType === 'course'
                                                        ? `/tutor/courses/${item.sourceId}`
                                                        : `/tutor/batches/${item.sourceId}`
                                                )
                                            }
                                            className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all"
                                            style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary06 }}
                                        >
                                            Open Source <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={markAllNotificationsRead}
                            disabled={loadingNotifications || unreadCount === 0}
                            className="px-4 py-2 text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                            style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite }}
                        >
                            {loadingNotifications ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                            Mark All Read
                        </button>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm text-slate-500">No notifications found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className="bg-white rounded-xl border p-4"
                                    style={{ borderColor: notification.isRead ? C.cardBorder : C.btnPrimary }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-slate-800">{notification.title}</h3>
                                            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{notification.message}</p>
                                            <p className="text-xs text-slate-400 mt-2">{formatDate(notification.createdAt)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => markNotificationRead(notification._id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
                                                    style={{ borderColor: C.successBorder, color: C.success, backgroundColor: C.successBg }}
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification._id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
                                                style={{ borderColor: C.dangerBorder, color: C.danger, backgroundColor: C.dangerBg }}
                                                title="Delete notification"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
