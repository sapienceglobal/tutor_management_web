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
    RefreshCw,
    MessageSquareWarning,
    BellRing
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, FX } from '@/constants/tutorTokens';

const formatDate = (value) => {
    try {
        return new Date(value).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    } catch {
        return '-';
    }
};

export default function TutorAnnouncementsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('announcements');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
        loadData();
    }, []);

    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [announcementsRes, notificationsRes] = await Promise.all([
                api.get('/tutors/announcements?limit=200'),
                api.get('/notifications?limit=30'),
            ]);

            setAnnouncements(announcementsRes.data?.announcements || []);
            setAnnouncementStats(announcementsRes.data?.stats || { total: 0, course: 0, batch: 0 });

            setNotifications(notificationsRes.data?.notifications || []);
            setUnreadCount(notificationsRes.data?.unreadCount || 0);
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading communication hub...</p>
            </div>
        );
    }

    const TABS = [
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'notifications', label: `Notifications${unreadCount ? ` (${unreadCount})` : ''}`, icon: Bell },
    ];

    const FILTER_TABS = [
        { key: 'all', label: 'All', count: announcementStats.total || 0 },
        { key: 'course', label: 'Course', count: announcementStats.course || 0 },
        { key: 'batch', label: 'Batch', count: announcementStats.batch || 0 },
    ];

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Megaphone size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Announcements & Alerts
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                            Manage communication updates for courses and batches.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                    style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
                </button>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-2 p-1 w-full sm:w-max" style={{ backgroundColor: '#EAE8FA', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-all relative"
                        style={{
                            backgroundColor: activeTab === tab.id ? C.surfaceWhite : 'transparent',
                            color: activeTab === tab.id ? C.btnPrimary : C.textMuted,
                            borderRadius: R.lg, boxShadow: activeTab === tab.id ? S.card : 'none',
                            fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily
                        }}>
                        <tab.icon size={16} /> {tab.label}
                        {tab.id === 'notifications' && unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                TAB 1: ANNOUNCEMENTS
            ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'announcements' && (
                <div className="space-y-4">
                    
                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto w-full custom-scrollbar pb-2 sm:pb-0">
                        {FILTER_TABS.map(({ key, label, count }) => {
                            const isActive = announcementFilter === key;
                            return (
                                <button key={key} onClick={() => setAnnouncementFilter(key)}
                                    className="flex items-center gap-2 px-4 py-2 cursor-pointer border-none transition-all shrink-0"
                                    style={{
                                        backgroundColor: isActive ? C.btnPrimary : '#EAE8FA',
                                        color: isActive ? '#fff' : C.textMuted,
                                        borderRadius: R.lg,
                                        fontSize: T.size.sm,
                                        fontWeight: T.weight.bold,
                                        fontFamily: T.fontFamily,
                                        boxShadow: isActive ? S.card : 'none',
                                        border: isActive ? 'none' : `1px solid ${C.cardBorder}`
                                    }}>
                                    {label}
                                    <span style={{
                                        backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : C.surfaceWhite,
                                        color: isActive ? '#fff' : C.heading,
                                        padding: '2px 8px', borderRadius: R.md, fontSize: '10px', fontWeight: T.weight.black
                                    }}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Posted Announcements</h2>
                        </div>
                        
                        {filteredAnnouncements.length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center">
                                <MessageSquareWarning size={40} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No announcements found</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>You haven't posted any announcements matching this filter.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredAnnouncements.map((item, index) => {
                                    const isCourse = item.sourceType === 'course';
                                    const sourceColor = isCourse ? C.success : C.warning;
                                    const sourceBg = isCourse ? C.successBg : C.warningBg;
                                    const sourceBorder = isCourse ? C.successBorder : C.warningBorder;

                                    return (
                                        <div key={`${item.sourceType}-${item.sourceId}-${index}`} className="p-5 transition-colors hover:opacity-90"
                                            style={{ backgroundColor: '#E3DFF8', borderBottom: index !== filteredAnnouncements.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <span className="flex items-center gap-1.5" style={{
                                                            fontSize: '10px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: R.md, textTransform: 'uppercase',
                                                            backgroundColor: sourceBg, color: sourceColor, border: `1px solid ${sourceBorder}`
                                                        }}>
                                                            {isCourse ? <BookOpen size={12} /> : <Users size={12} />} {item.sourceType}
                                                        </span>
                                                        <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, backgroundColor: C.surfaceWhite, padding: '4px 8px', borderRadius: R.md, border: `1px solid ${C.cardBorder}` }}>
                                                            {formatDate(item.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0', lineHeight: 1.4 }}>
                                                        {item.title}
                                                    </h3>
                                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>
                                                        {item.sourceType === 'batch' && item.courseTitle ? `${item.sourceTitle} · ${item.courseTitle}` : item.sourceTitle}
                                                    </p>
                                                </div>
                                                
                                                <button onClick={() => router.push(isCourse ? `/tutor/courses/${item.sourceId}` : `/tutor/batches/${item.sourceId}`)}
                                                    className="flex items-center justify-center gap-2 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0 w-full sm:w-auto"
                                                    style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                                    Open Source <ArrowRight size={14} />
                                                </button>
                                            </div>

                                            <div className="p-4" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                    {item.message}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                TAB 2: NOTIFICATIONS
            ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'notifications' && (
                <div className="space-y-4">
                    
                    <div className="flex justify-end">
                        <button onClick={markAllNotificationsRead} disabled={loadingNotifications || unreadCount === 0}
                            className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto disabled:opacity-50"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            {loadingNotifications ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />} Mark All Read
                        </button>
                    </div>

                    <div className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Recent Alerts</h2>
                        </div>
                        
                        {notifications.length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center">
                                <BellRing size={40} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>All Caught Up!</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>You have no new notifications.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notif, index) => (
                                    <div key={notif._id} className="p-4 sm:p-5 transition-colors"
                                        style={{ 
                                            backgroundColor: notif.isRead ? '#E3DFF8' : C.surfaceWhite, 
                                            borderBottom: index !== notifications.length - 1 ? `1px solid ${C.cardBorder}` : 'none' 
                                        }}>
                                        <div className="flex items-start gap-4">
                                            {/* Unread Indicator */}
                                            <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: notif.isRead ? 'transparent' : C.danger }} />
                                            
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h3 style={{ fontSize: T.size.sm, fontWeight: notif.isRead ? T.weight.bold : T.weight.black, color: C.heading, margin: 0, lineHeight: 1.4 }}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="shrink-0" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                                        {formatDate(notif.createdAt)}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0, whiteSpace: 'pre-wrap', opacity: notif.isRead ? 0.7 : 1 }}>
                                                    {notif.message}
                                                </p>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                                                {!notif.isRead && (
                                                    <button onClick={() => markNotificationRead(notif._id)} title="Mark as read"
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                                        style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` }}>
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteNotification(notif._id)} title="Delete notification"
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                                    style={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}