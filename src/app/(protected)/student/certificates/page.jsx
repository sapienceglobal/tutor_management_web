'use client';

import { useState, useEffect, useRef } from 'react';
import {
    MdEmojiEvents, MdDownload, MdShare, MdCheckCircle, MdLock, MdOpenInNew,
    MdSearch, MdHourglassEmpty, MdCalendarMonth, MdMenuBook, MdStar,
    MdVisibility, MdContentCopy, MdQrCode, MdShield, MdNotifications,
    MdDoneAll, MdClose, MdHelpOutline, MdCampaign, MdSchool, MdErrorOutline, MdMessage, MdAccessTime
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── NOTIFICATION PANEL ───────────────────────────────────────────────────────

const CATEGORY_META = {
    exam:           { icon: MdHelpOutline,  color: '#ffffff', bg: C.warningBg,    label: 'Exam' },
    course:         { icon: MdMenuBook,     color: '#ffffff', bg: C.btnPrimary,   label: 'Course' },
    announcement:   { icon: MdCampaign,     color: '#ffffff', bg: C.successBg,    label: 'Announcement' },
    result:         { icon: MdSchool,       color: '#ffffff', bg: C.iconBg,       label: 'Result' },
    alert:          { icon: MdErrorOutline, color: '#ffffff', bg: C.dangerBg,     label: 'Alert' },
    direct_message: { icon: MdMessage,      color: '#ffffff', bg: C.btnPrimary,   label: 'Message' },
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

export function NotificationPanel({ onClose }) {
    const router = useRouter();
    const panelRef = useRef(null);

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [activeFilter, setActiveFilter]   = useState('all');
    const [markingAll, setMarkingAll]       = useState(false);

    const filters = ['all', 'exam', 'course', 'announcement', 'result'];
    
    const normalizeNotification = (item) => {
        const readState = Boolean(item?.isRead ?? item?.read);
        return { ...item, isRead: readState, read: readState };
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
                n._id === id ? normalizeNotification({ ...n, read: true, isRead: true }) : n
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
            <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
            <div ref={panelRef}
                className="fixed top-14 right-4 z-50 flex flex-col overflow-hidden"
                style={{ 
                    width: '384px', maxHeight: '85vh', backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'],
                    boxShadow: S.cardHover, fontFamily: T.fontFamily
                }}>
                <div className="flex items-center justify-between px-4 py-3.5 shrink-0" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                            <MdNotifications style={{ width: 14, height: 14, color: C.iconColor }} />
                        </div>
                        <div>
                            <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1 }}>Notifications</p>
                            {unreadCount > 0 && <p style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: '4px 0 0 0' }}>{unreadCount} unread</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} disabled={markingAll}
                                className="flex items-center gap-1 px-2.5 py-1.5 transition-colors cursor-pointer border-none"
                                style={{ backgroundColor: C.btnViewAllBg, borderRadius: '10px', color: C.btnViewAllText, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {markingAll ? <MdHourglassEmpty className="animate-spin" style={{ width: 12, height: 12 }} /> : <MdDoneAll style={{ width: 12, height: 12 }} />}
                                Mark all read
                            </button>
                        )}
                        <button onClick={onClose} className="flex items-center justify-center cursor-pointer transition-colors border-none" style={{ width: 28, height: 28, backgroundColor: C.btnViewAllBg, borderRadius: '10px' }}>
                            <MdClose style={{ width: 14, height: 14, color: C.btnViewAllText }} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-1 px-3 py-2 overflow-x-auto shrink-0 custom-scrollbar" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                    {filters.map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)}
                            className="px-3 py-1.5 cursor-pointer transition-all border-none flex items-center shrink-0"
                            style={{
                                backgroundColor: activeFilter === f ? C.btnPrimary : 'transparent',
                                color: activeFilter === f ? '#ffffff' : C.textSlate,
                                borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold,
                                textTransform: 'uppercase', letterSpacing: T.tracking.wider, fontFamily: T.fontFamily
                            }}>
                            {f}
                            {f === 'all' && unreadCount > 0 && (
                                <span style={{ marginLeft: 6, padding: '2px 6px', backgroundColor: activeFilter === f ? C.surfaceWhite : C.btnPrimary, color: activeFilter === f ? C.btnPrimary : '#ffffff', borderRadius: R.full, fontSize: '9px', fontWeight: T.weight.black }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

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
                                    style={{ backgroundColor: !isNotificationRead(n) ? C.innerBg : 'transparent', borderBottom: `1px solid ${C.cardBorder}` }}
                                    onMouseEnter={(e) => { if (isNotificationRead(n)) e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={(e) => { if (isNotificationRead(n)) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                    
                                    <NotifIcon type={n.type} />
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: !isNotificationRead(n) ? T.weight.bold : T.weight.semibold, color: !isNotificationRead(n) ? C.heading : C.textSlate, margin: 0, lineHeight: T.leading.snug }}>
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

                <div className="px-4 py-3 shrink-0" style={{ backgroundColor: C.innerBg, borderTop: `1px solid ${C.cardBorder}` }}>
                    <button onClick={() => { router.push('/student/profile/notifications'); onClose?.(); }}
                        className="w-full py-2 cursor-pointer transition-colors border-none"
                        style={{ backgroundColor: 'transparent', color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        View all notifications →
                    </button>
                </div>
            </div>
        </>
    );
}

// ─── CERTIFICATES SECTION ─────────────────────────────────────────────────────

function CertCard({ cert }) {
    const [showShare, setShowShare] = useState(false);
    const issued = new Date(cert.issuedAt || cert.completedAt);

    const handleCopyLink = () => {
        const url = `${window.location.origin}/verify/${cert.credentialId || cert._id}`;
        navigator.clipboard.writeText(url);
        toast.success('Verification link copied!');
    };

    return (
        <div className="overflow-hidden transition-all group"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
            onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}>

            {/* Certificate preview */}
            <div className="relative h-44 overflow-hidden flex flex-col items-center justify-center" style={{ backgroundColor: C.innerBox }}>
                <div className="w-16 h-16 flex items-center justify-center rounded-full" style={{ backgroundColor: C.surfaceWhite, border: `2px solid ${C.cardBorder}` }}>
                    <MdEmojiEvents style={{ width: 32, height: 32, color: C.btnPrimary }} />
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginTop: 8, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                    Certificate of Completion
                </p>

                {/* Verified badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1" style={{ backgroundColor: C.successBg, borderRadius: '10px', border: `1px solid ${C.successBorder}` }}>
                    <MdShield style={{ width: 12, height: 12, color: '#ffffff' }} />
                    <span style={{ fontSize: '9px', fontWeight: T.weight.bold, color: '#ffffff', textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Verified</span>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="line-clamp-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, lineHeight: T.leading.snug }}>
                        {cert.courseName || cert.title}
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2 }}>
                        {cert.instituteName || 'Sapience LMS'} · Issued {issued.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>

                {cert.credentialId && (
                    <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                        <MdQrCode style={{ width: 14, height: 14, color: C.textMuted, flexShrink: 0 }} />
                        <span className="truncate" style={{ fontFamily: T.fontFamilyMono, fontSize: '10px', color: C.textMuted }}>
                            {cert.credentialId}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {cert.downloadUrl ? (
                        <a href={cert.downloadUrl} target="_blank" rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 text-decoration-none"
                            style={{ background: C.gradientBtn, color: '#ffffff', padding: '8px 0', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                            <MdDownload style={{ width: 14, height: 14 }} /> Download
                        </a>
                    ) : (
                        <button disabled className="flex-1 flex items-center justify-center gap-1.5 border-none"
                            style={{ backgroundColor: C.innerBg, color: C.textMuted, padding: '8px 0', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                            <MdHourglassEmpty className="animate-spin" style={{ width: 14, height: 14 }} /> Generating…
                        </button>
                    )}
                    <button onClick={handleCopyLink}
                        className="flex items-center justify-center cursor-pointer border-none transition-colors shrink-0"
                        style={{ width: 36, height: 36, backgroundColor: C.btnViewAllBg, borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}>
                        <MdContentCopy style={{ width: 16, height: 16, color: C.btnViewAllText }} />
                    </button>
                    <button onClick={() => {
                        const url = `${window.location.origin}/verify/${cert.credentialId || cert._id}`;
                        if (navigator.share) navigator.share({ title: cert.courseName, url });
                        else { navigator.clipboard.writeText(url); toast.success('Link copied!'); }
                    }}
                        className="flex items-center justify-center cursor-pointer border-none transition-colors shrink-0"
                        style={{ width: 36, height: 36, backgroundColor: C.btnViewAllBg, borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}>
                        <MdShare style={{ width: 16, height: 16, color: C.btnViewAllText }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function LockedCertCard({ course }) {
    const pct = course.progress || 0;
    return (
        <div className="overflow-hidden" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}>
            <div className="relative h-32 flex items-center justify-center" style={{ backgroundColor: C.innerBg }}>
                <div className="flex flex-col items-center gap-2 opacity-60">
                    <MdLock style={{ width: 32, height: 32, color: C.textMuted }} />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{pct}% complete</p>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: C.cardBorder }}>
                    <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: C.btnPrimary }} />
                </div>
            </div>
            <div className="p-4">
                <h3 className="line-clamp-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{course.title}</h3>
                <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2 }}>Complete course to earn certificate</p>
                <div className="mt-2 flex items-center justify-between" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted }}>
                    <span style={{ color: C.btnPrimary }}>{pct}% done</span>
                    <span>{100 - pct}% remaining</span>
                </div>
            </div>
        </div>
    );
}

export default function CertificatesPage() {
    const [certs, setCerts]             = useState([]);
    const [inProgress, setInProgress]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [tab, setTab]                 = useState('earned');
    const [search, setSearch]           = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, pRes] = await Promise.all([
                api.get('/certificates/student'),
                api.get('/courses/in-progress').catch(() => ({ data: { courses: [] } })),
            ]);
            if (cRes.data?.success) setCerts(cRes.data.certificates || []);
            if (pRes.data?.courses) setInProgress(pRes.data.courses.filter(c => (c.progress || 0) < 100));
        } catch (e) { toast.error('Failed to load certificates'); }
        finally { setLoading(false); }
    };

    const filtered = certs.filter(c =>
        !search || c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
        c.instituteName?.toLowerCase().includes(search.toLowerCase())
    );

    const tabs = [
        { key: 'earned',      label: 'Earned',       count: certs.length },
        { key: 'in-progress', label: 'In Progress',  count: inProgress.length },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center shrink-0" style={{ width: 48, height: 48, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                            <MdEmojiEvents style={{ width: 24, height: 24, color: C.iconColor }} />
                        </div>
                        <div>
                            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                Certificates & Achievements
                            </h1>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                                {certs.length} certificate{certs.length !== 1 ? 's' : ''} earned
                            </p>
                        </div>
                    </div>

                    {/* Tab switcher */}
                    <div className="relative flex items-center p-1 self-start md:self-auto"
                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                        <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] transition-transform duration-300 ease-in-out z-0"
                            style={{
                                backgroundColor: C.btnPrimary,
                                transform: tab === 'earned' ? 'translateX(0)' : 'translateX(100%)',
                                boxShadow: `0 2px 10px ${C.btnPrimary}40`,
                                borderRadius: '8px'
                            }} />
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className="flex-1 relative z-10 px-4 py-1.5 capitalize transition-colors duration-300 border-none cursor-pointer flex items-center justify-center gap-2"
                                style={{
                                    fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold,
                                    color: tab === t.key ? '#ffffff' : C.text,
                                    background: 'transparent', borderRadius: '10px'
                                }}>
                                {t.label}
                                {t.count > 0 && (
                                    <span style={{
                                        backgroundColor: tab === t.key ? 'rgba(255,255,255,0.2)' : C.cardBg,
                                        color: tab === t.key ? '#ffffff' : C.btnPrimary,
                                        minWidth: '20px', height: '20px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '0 4px'
                                    }}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[40vh]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-12 h-12">
                                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                                Loading certificates...
                            </p>
                        </div>
                    </div>
                ) : tab === 'earned' ? (
                    filtered.length === 0 ? (
                        <div className="p-14 text-center border border-dashed animate-in fade-in duration-500"
                            style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                            <div className="flex items-center justify-center mx-auto mb-4"
                                style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdEmojiEvents style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                No certificates yet
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>
                                Complete a course to earn your first certificate!
                            </p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            {filtered.map(c => <CertCard key={c._id} cert={c} />)}
                        </div>
                    )
                ) : (
                    inProgress.length === 0 ? (
                        <div className="p-14 text-center border border-dashed animate-in fade-in duration-500"
                            style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                            <div className="flex items-center justify-center mx-auto mb-4"
                                style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdMenuBook style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                No courses in progress
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>
                                Start learning a course to track your progress here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                            {inProgress.map(c => <LockedCertCard key={c._id} course={c} />)}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}