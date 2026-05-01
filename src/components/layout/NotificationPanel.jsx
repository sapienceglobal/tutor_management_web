'use client';

import { useState, useEffect, useRef } from 'react';
import {
    MdClose, MdNotifications, MdDoneAll, MdMenuBook, MdHelpOutline, MdCampaign,
    MdErrorOutline, MdSchool, MdHourglassEmpty, MdOpenInNew, MdAccessTime, MdMessage
} from 'react-icons/md';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { C, T, S, R } from '@/constants/studentTokens';

const CATEGORY_META = {
    exam:           { icon: MdHelpOutline,  color: C.warning,    bg: C.warningBg,    label: 'Exam' },
    course:         { icon: MdMenuBook,     color: C.btnPrimary, bg: C.btnViewAllBg, label: 'Course' },
    announcement:   { icon: MdCampaign,     color: C.success,    bg: C.successBg,    label: 'Announcement' },
    result:         { icon: MdSchool,       color: C.chartLine,  bg: C.innerBox,     label: 'Result' },
    alert:          { icon: MdErrorOutline, color: C.danger,     bg: C.dangerBg,     label: 'Alert' },
    direct_message: { icon: MdMessage,      color: C.btnPrimary, bg: C.btnViewAllBg, label: 'Message' },
};

function NotifIcon({ type }) {
    const meta = CATEGORY_META[type] || CATEGORY_META.announcement;
    const Icon = meta.icon;
    return (
        <div className="flex items-center justify-center shrink-0" 
            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: meta.bg }}>
            <Icon style={{ width: 16, height: 16, color: meta.color }} />
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
            <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onClose} />

            {/* Panel */}
            <div ref={panelRef}
                className="fixed top-14 right-4 z-50 flex flex-col overflow-hidden"
                style={{ 
                    width: '384px',
                    maxHeight: '85vh',
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    borderRadius: R['2xl'],
                    boxShadow: S.cardHover,
                    fontFamily: T.fontFamily
                }}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ background: C.gradientBtn, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, backgroundColor: C.surfaceWhite, borderRadius: '10px' }}>
                            <MdNotifications style={{ width: 14, height: 14, color: C.btnPrimary }} />
                        </div>
                        <div>
                            <p style={{ fontSize: T.size.base, fontWeight: T.weight.black, color: '#ffffff', margin: 0, lineHeight: 1 }}>Notifications</p>
                            {unreadCount > 0 && <p style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#ffffff', margin: '4px 0 0 0' }}>{unreadCount} unread</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} disabled={markingAll}
                                className="flex items-center gap-1 px-2.5 py-1.5 transition-colors cursor-pointer border-none"
                                style={{ backgroundColor: C.surfaceWhite, borderRadius: '10px', color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.black, fontFamily: T.fontFamily }}>
                                {markingAll ? <MdHourglassEmpty className="animate-spin" style={{ width: 12, height: 12 }} /> : <MdDoneAll style={{ width: 12, height: 12 }} />}
                                Mark all read
                            </button>
                        )}
                        <button onClick={onClose} className="flex items-center justify-center cursor-pointer transition-colors border-none" style={{ width: 28, height: 28, backgroundColor: C.surfaceWhite, borderRadius: '10px' }}>
                            <MdClose style={{ width: 14, height: 14, color: C.btnPrimary }} />
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 px-3 py-2 overflow-x-auto shrink-0 custom-scrollbar" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                    {filters.map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)}
                            className="px-3 py-1.5 cursor-pointer transition-all border-none flex items-center shrink-0"
                            style={{
                                backgroundColor: activeFilter === f ? C.btnPrimary : 'transparent',
                                color: activeFilter === f ? '#ffffff' : C.textSlate,
                                borderRadius: '10px',
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                textTransform: 'uppercase',
                                letterSpacing: T.tracking.wider,
                                fontFamily: T.fontFamily
                            }}>
                            {f}
                            {f === 'all' && unreadCount > 0 && (
                                <span style={{ 
                                    marginLeft: 6, 
                                    padding: '2px 6px', 
                                    backgroundColor: activeFilter === f ? C.surfaceWhite : C.btnPrimary, 
                                    color: activeFilter === f ? C.btnPrimary : '#ffffff', 
                                    borderRadius: R.full, 
                                    fontSize: '9px',
                                    fontWeight: T.weight.black 
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: C.cardBg }}>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <MdHourglassEmpty className="animate-spin" style={{ width: 24, height: 24, color: C.btnPrimary }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                            <div className="flex items-center justify-center mb-3" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdNotifications style={{ width: 28, height: 28, color: C.textMuted }} />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, textAlign: 'center', margin: 0 }}>No notifications yet</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, textAlign: 'center', margin: '4px 0 0 0' }}>We'll notify you when something happens</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {filtered.map(n => (
                                <button key={n._id} onClick={() => handleClick(n)}
                                    className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-none cursor-pointer"
                                    style={{ 
                                        backgroundColor: !isNotificationRead(n) ? C.btnViewAllBg : 'transparent',
                                        borderBottom: `1px solid ${C.cardBorder}`
                                    }}
                                    onMouseEnter={(e) => { if (isNotificationRead(n)) e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={(e) => { if (isNotificationRead(n)) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                    
                                    <NotifIcon type={n.type} />
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p style={{ 
                                                fontFamily: T.fontFamily, 
                                                fontSize: T.size.sm, 
                                                fontWeight: !isNotificationRead(n) ? T.weight.bold : T.weight.semibold, 
                                                color: !isNotificationRead(n) ? C.heading : C.textSlate, 
                                                margin: 0,
                                                lineHeight: T.leading.snug
                                            }}>
                                                {n.title}
                                            </p>
                                            {!isNotificationRead(n) && <span className="shrink-0 mt-1" style={{ width: 8, height: 8, borderRadius: R.full, backgroundColor: C.btnPrimary }} />}
                                        </div>
                                        {n.message && (
                                            <p className="line-clamp-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: '4px 0 0 0' }}>
                                                {n.message}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <MdAccessTime style={{ width: 12, height: 12, color: C.textMuted }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{fmtTime(n.createdAt)}</span>
                                            {resolveNotificationLink(n) && <MdOpenInNew style={{ width: 12, height: 12, color: C.textMuted, marginLeft: 'auto' }} />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 shrink-0" style={{ backgroundColor: C.innerBg, borderTop: `1px solid ${C.cardBorder}` }}>
                    <button onClick={() => { router.push('/student/profile/notifications'); onClose?.(); }}
                        className="w-full py-2 cursor-pointer transition-colors border-none"
                        style={{
                            backgroundColor: 'transparent',
                            color: C.btnPrimary,
                            fontSize: T.size.sm,
                            fontWeight: T.weight.bold,
                            fontFamily: T.fontFamily,
                            borderRadius: '10px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        View all notifications →
                    </button>
                </div>
            </div>
        </>
    );
}