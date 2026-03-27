'use client';

import { useState, useEffect, useRef } from 'react';
import {
    X, Bell, CheckCheck, BookOpen, FileQuestion, Megaphone,
    AlertCircle, GraduationCap, Loader2, ExternalLink, Clock, MessageSquare
} from 'lucide-react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

const dg = { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' };

const CATEGORY_META = {
    exam:         { icon: FileQuestion, color: '#f59e0b', bg: 'bg-amber-500/15',  label: 'Exam' },
    course:       { icon: BookOpen,     color: 'var(--theme-primary)', bg: 'bg-[var(--theme-primary)]/15', label: 'Course' },
    announcement: { icon: Megaphone,    color: '#10b981', bg: 'bg-emerald-500/15',label: 'Announcement' },
    result:       { icon: GraduationCap,color: '#8b5cf6', bg: 'bg-[var(--theme-accent)]/15', label: 'Result' },
    alert:        { icon: AlertCircle,  color: '#ef4444', bg: 'bg-red-500/15',    label: 'Alert' },
    direct_message: { icon: MessageSquare, color: '#6366f1', bg: 'bg-indigo-500/15', label: 'Message' },
};

function NotifIcon({ type }) {
    const meta = CATEGORY_META[type] || CATEGORY_META.announcement;
    const Icon = meta.icon;
    return (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
            <Icon className="w-4 h-4" style={{ color: meta.color }} />
        </div>
    );
}

export default function NotificationPanel({ onClose }) {
    const router = useRouter();
    const panelRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [activeFilter, setActiveFilter]   = useState('all');
    const [markingAll, setMarkingAll]       = useState(false);

    const filters = ['all', 'exam', 'course', 'announcement', 'result'];
    const normalizeNotification = (item) => {
        const readState = Boolean(item?.isRead ?? item?.read);
        return {
            ...item,
            isRead: readState,
            read: readState,
        };
    };
    const isNotificationRead = (item) => Boolean(item?.isRead ?? item?.read);
    const resolveNotificationLink = (item) => {
        if (item?.link) return item.link;
        if (item?.type === 'direct_message') return '/student/messages';

        const courseId = item?.data?.courseId?._id || item?.data?.courseId;
        const lessonId = item?.data?.lessonId?._id || item?.data?.lessonId;

        if (item?.type === 'tutor_reply' && courseId) {
            return `/student/courses/${courseId}${lessonId ? `?lesson=${lessonId}` : ''}`;
        }
        if (item?.type === 'assignment_created' || item?.type === 'assignment_graded') {
            return '/student/assignments';
        }
        return null;
    };

    useEffect(() => {
        fetchNotifications();
        // Close on outside click
        const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.(); };
        setTimeout(() => document.addEventListener('mousedown', handler), 100);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            if (res.data?.success) {
                setNotifications((res.data.notifications || []).map(normalizeNotification));
            }
        } catch (_) {
            // fallback demo
            setNotifications([]);
        } finally { setLoading(false); }
    };

    const markRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map((n) => (
                n._id === id
                    ? normalizeNotification({ ...n, read: true, isRead: true })
                    : n
            )));
        } catch (_) {}
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map((n) => normalizeNotification({ ...n, read: true, isRead: true })));
        } catch (_) {}
        finally { setMarkingAll(false); }
    };

    const handleClick = (n) => {
        markRead(n._id);
        const target = resolveNotificationLink(n);
        if (target) {
            router.push(target);
            onClose?.();
        }
    };

    const filtered = activeFilter === 'all' ? notifications : notifications.filter(n => n.type === activeFilter);
    const unreadCount = notifications.filter((n) => !isNotificationRead(n)).length;

    const fmtTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div ref={panelRef}
                className="fixed top-14 right-4 z-50 w-96 max-h-[85vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)", background: 'var(--theme-muted)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8 shrink-0" style={dg}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-white/15 rounded-xl flex items-center justify-center">
                            <Bell className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white">Notifications</p>
                            {unreadCount > 0 && <p className="text-[10px] text-white/60 font-medium">{unreadCount} unread</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} disabled={markingAll}
                                className="flex items-center gap-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-xl text-[11px] font-black text-white transition-colors">
                                {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                                Mark all read
                            </button>
                        )}
                        <button onClick={onClose} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition-colors">
                            <X className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 px-3 py-2 border-b border-white/8 overflow-x-auto shrink-0 scrollbar-hide" style={{ background: 'var(--theme-background)' }}>
                    {filters.map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.05em] whitespace-nowrap transition-all
                                ${activeFilter === f
                                    ? 'text-white'
                                    : 'text-slate-500 hover:text-slate-300 bg-white/4 hover:bg-white/8'}`}
                            style={activeFilter === f ? dg : {}}>
                            {f}
                            {f === 'all' && unreadCount > 0 && (
                                <span className="ml-1.5 px-1 py-0.5 bg-white/20 rounded-full text-[9px]">{unreadCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-accent)]" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-3">
                                <Bell className="w-7 h-7 text-slate-600" />
                            </div>
                            <p className="text-slate-400 text-sm font-bold text-center">No notifications yet</p>
                            <p className="text-slate-600 text-xs text-center mt-1">We'll notify you when something happens</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filtered.map(n => (
                                <button key={n._id} onClick={() => handleClick(n)}
                                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all hover:bg-white/5
                                        ${!isNotificationRead(n) ? 'bg-[var(--theme-accent)]/5' : ''}`}>
                                    <NotifIcon type={n.type} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-xs leading-snug ${!isNotificationRead(n) ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                                                {n.title}
                                            </p>
                                            {!isNotificationRead(n) && <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: 'var(--theme-accent)' }} />}
                                        </div>
                                        {n.message && (
                                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-2">{n.message}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Clock className="w-3 h-3 text-slate-600" />
                                            <span className="text-[10px] text-slate-600 font-medium">{fmtTime(n.createdAt)}</span>
                                            {resolveNotificationLink(n) && <ExternalLink className="w-3 h-3 text-slate-600 ml-auto" />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-white/8 shrink-0" style={{ background: 'var(--theme-background)' }}>
                    <button onClick={() => { router.push('/student/profile/notifications'); onClose?.(); }}
                        className="w-full py-2 rounded-xl text-[11px] font-black text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 transition-colors">
                        View all notifications →
                    </button>
                </div>
            </div>
        </>
    );
}
