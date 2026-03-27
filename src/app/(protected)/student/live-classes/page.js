'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, Clock, Video, Users,
    ChevronLeft, ChevronRight, PlayCircle, Bell, Repeat,
} from 'lucide-react';
import api from '@/lib/axios';
import { getAudienceDisplay } from '@/lib/audienceDisplay';
import { C, T, S } from '@/constants/studentTokens';

const SCHEDULE_PAGE_SIZE = 4;

export default function LiveClassesPage() {
    const [liveClasses, setLiveClasses]     = useState([]);
    const [loading, setLoading]             = useState(true);
    const [selectedDate, setSelectedDate]   = useState(() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d;
    });
    const [schedulePage, setSchedulePage]   = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/live-classes');
                if (res.data.success && res.data.liveClasses) setLiveClasses(res.data.liveClasses);
            } catch (error) { console.error('Error fetching live classes:', error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const now = new Date();

    const getClassesForDate = (date) => {
        const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
        return liveClasses.filter(c => {
            const dt = new Date(c.dateTime);
            return dt >= dayStart && dt < dayEnd;
        }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    };

    const todayClasses    = getClassesForDate(selectedDate);
    const upcomingClasses = liveClasses.filter(c => new Date(c.dateTime) >= now).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime)).slice(0, 5);
    const pastClasses     = liveClasses.filter(c => new Date(c.dateTime) < now).sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 5);

    const allScheduled      = liveClasses.filter(c => new Date(c.dateTime) >= now).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    const scheduleTotalPages = Math.max(1, Math.ceil(allScheduled.length / SCHEDULE_PAGE_SIZE));
    const scheduleSlice     = allScheduled.slice((schedulePage - 1) * SCHEDULE_PAGE_SIZE, schedulePage * SCHEDULE_PAGE_SIZE);

    const isLive = (c) => {
        const start = new Date(c.dateTime);
        const end   = new Date(start.getTime() + (c.duration || 60) * 60 * 1000);
        return now >= start && now <= end;
    };

    const joinClass = async (c) => {
        try {
            await api.post(`/live-classes/${c._id}/attendance`).catch(() => {});
            if (c.meetingId)       window.open(`https://meet.jit.si/${c.meetingId}`, '_blank');
            else if (c.meetingLink) window.open(c.meetingLink, '_blank');
        } catch (e) {
            if (c.meetingLink) window.open(c.meetingLink, '_blank');
        }
    };

    const formatDisplayDate = (d) =>
        d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const shiftDate = (delta) => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + delta);
        setSelectedDate(next);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
            </div>
        </div>
    );

    return (
        <div className="space-y-6" style={{ fontFamily: T.fontFamily }}>

            {/* ── Banner ──────────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 lg:p-8">
                    <div className="space-y-2">
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                            Live Classes
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.60, maxWidth: 480 }}>
                            Join your live classes and interact with instructors in real-time to enhance your learning.
                        </p>
                    </div>
                    <div className="hidden md:flex w-48 h-32 rounded-xl items-center justify-center"
                        style={{ background: C.gradientBtn }}>
                        <Video className="w-16 h-16 text-white opacity-60" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Today's Classes + Schedule Table ─────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Today's Classes */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center justify-between px-6 py-4"
                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                Today's Classes
                            </h2>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => shiftDate(-1)}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: C.text }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, minWidth: 200, textAlign: 'center' }}>
                                    {formatDisplayDate(selectedDate)}
                                </span>
                                <button type="button" onClick={() => shiftDate(1)}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: C.text }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {todayClasses.length > 0 ? todayClasses.map(c => (
                                <div key={c._id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl transition-colors"
                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                {c.title}
                                            </h3>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getAudienceDisplay(c).badgeClass}`}>
                                                {getAudienceDisplay(c).label}
                                            </span>
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.60, marginTop: 4 }}>
                                            {c.tutorId?.userId?.name || 'Instructor'}
                                            {c.courseId?.title && ` (${c.courseId.title})`}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.50 }}>
                                                <Clock className="w-4 h-4" /> {c.duration || 60} min
                                            </span>
                                            <span className="flex items-center gap-1"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.50 }}>
                                                <Users className="w-4 h-4" /> — students
                                            </span>
                                            {c.scheduleDescription && (
                                                <span className="flex items-center gap-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.50 }}>
                                                    <Repeat className="w-4 h-4" /> {c.scheduleDescription}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isLive(c) && (
                                            <span className="px-2 py-1 rounded text-xs font-semibold"
                                                style={{ backgroundColor: C.warningBg, color: C.warning }}>
                                                In Progress
                                            </span>
                                        )}
                                        <button onClick={() => joinClass(c)}
                                            className="px-4 py-2 text-white rounded-xl transition-colors"
                                            style={{ backgroundColor: isLive(c) ? C.warning : C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                            Join Class
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center py-8"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.45 }}>
                                    No classes scheduled for this day.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 className="px-6 py-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                            My Live Classes Schedule
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                        {['#', 'Class Name', 'Instructor', 'Date', 'Time', 'Action'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, opacity: 0.55, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheduleSlice.length > 0 ? scheduleSlice.map((c, idx) => (
                                        <tr key={c._id}
                                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <td className="px-6 py-4"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                                                {(schedulePage - 1) * SCHEDULE_PAGE_SIZE + idx + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading }}>{c.title}</p>
                                                <span className={`inline-flex mt-1 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getAudienceDisplay(c).badgeClass}`}>
                                                    {getAudienceDisplay(c).label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                {c.tutorId?.userId?.name || '—'}
                                            </td>
                                            <td className="px-6 py-4"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.70 }}>
                                                {new Date(c.dateTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </td>
                                            <td className="px-6 py-4"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.70 }}>
                                                {new Date(c.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors"
                                                    style={{ border: `1px solid ${C.cardBorder}`, color: C.btnPrimary, backgroundColor: C.btnViewAllBg, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#ffffff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; e.currentTarget.style.color = C.btnPrimary; }}>
                                                    <Bell className="w-3.5 h-3.5" /> Remind Me
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.45 }}>
                                                No upcoming live classes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {scheduleTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 px-6 py-4"
                                style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <button disabled={schedulePage <= 1} onClick={() => setSchedulePage(p => p - 1)}
                                    className="px-4 py-2 rounded-xl disabled:opacity-40 transition-colors"
                                    style={{ border: `1px solid ${C.cardBorder}`, color: C.text, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                    Previous
                                </button>
                                {Array.from({ length: scheduleTotalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setSchedulePage(p)}
                                        className="w-9 h-9 rounded-lg transition-all"
                                        style={schedulePage === p
                                            ? { background: C.gradientBtn, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black }
                                            : { backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                        {p}
                                    </button>
                                ))}
                                <button disabled={schedulePage >= scheduleTotalPages} onClick={() => setSchedulePage(p => p + 1)}
                                    className="px-4 py-2 rounded-xl disabled:opacity-40 transition-colors"
                                    style={{ border: `1px solid ${C.cardBorder}`, color: C.text, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Upcoming + Past ──────────────────────────────── */}
                <div className="space-y-4">

                    {/* Upcoming */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between"
                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                Upcoming Live Classes
                            </h2>
                            {upcomingClasses.length > 3 && (
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.btnPrimary, cursor: 'pointer' }}>
                                    View All
                                </span>
                            )}
                        </div>
                        <div className="p-4 space-y-2">
                            {upcomingClasses.length > 0 ? upcomingClasses.slice(0, 4).map(c => (
                                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                                        {c.tutorId?.userId?.name?.charAt(0) || 'I'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading }}>{c.title}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.50 }}>
                                            {new Date(c.dateTime).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} –{' '}
                                            {new Date(c.dateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center py-4"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.45 }}>
                                    No upcoming classes.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Past */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 className="px-6 py-4"
                            style={{ borderBottom: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                            Past Live Classes
                        </h2>
                        <div className="p-4 space-y-2">
                            {pastClasses.length > 0 ? pastClasses.slice(0, 4).map(c => (
                                <div key={c._id} className="flex items-center justify-between gap-3 p-3 rounded-xl transition-colors"
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: C.innerBg, color: C.text, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                                            {c.tutorId?.userId?.name?.charAt(0) || 'I'}
                                        </div>
                                        <div>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading }}>{c.title}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.50 }}>{c.tutorId?.userId?.name || 'Instructor'}</p>
                                        </div>
                                    </div>
                                    {c.recordingLink ? (
                                        <button onClick={() => window.open(c.recordingLink, '_blank')}
                                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors"
                                            style={{ border: `1px solid ${C.warningBorder}`, color: C.warning, backgroundColor: C.warningBg, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                            <PlayCircle className="w-3.5 h-3.5" /> View Recording
                                        </button>
                                    ) : (
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.40, flexShrink: 0 }}>No recording</span>
                                    )}
                                </div>
                            )) : (
                                <p className="text-center py-4"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.45 }}>
                                    No past classes.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}