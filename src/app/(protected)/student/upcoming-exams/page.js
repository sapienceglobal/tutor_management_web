'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Calendar, Clock, ChevronLeft, ChevronRight, FileText, CheckCircle,
    User, ArrowRight, BookOpen, Target, Zap
} from 'lucide-react';
import api from '@/lib/axios';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const themeBg = '#dfdaf3';
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';

export default function UpcomingExamsPage() {
    const [exams, setExams]                 = useState([]);
    const [loading, setLoading]             = useState(true);
    const [completedCount, setCompletedCount] = useState(0);
    const [calendarDate, setCalendarDate]   = useState(new Date());

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/student/all');
                if (res.data?.success) {
                    const all = res.data.exams || [];
                    setExams(all.filter(e => !e.isCompleted));
                    setCompletedCount(all.filter(e => e.isCompleted).length);
                }
            } catch (error) { console.error('Failed to load exams', error); }
            finally { setLoading(false); }
        };
        fetchExams();
    }, []);

    const stats = useMemo(() => {
        const now = new Date();
        const today = exams.filter(e => {
            const d = new Date(e.startDate || e.createdAt);
            return d.toDateString() === now.toDateString();
        });
        const thisWeek = exams.filter(e => {
            const d = new Date(e.startDate || e.createdAt);
            const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
            return d >= now && d <= weekEnd;
        });
        return { upcoming: exams.length, today: today.length, thisWeek: thisWeek.length };
    }, [exams]);

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthName = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();

    const examDates = useMemo(() => {
        const dates = new Set();
        exams.forEach(e => {
            const d = new Date(e.startDate || e.createdAt);
            if (d.getMonth() === month && d.getFullYear() === year) dates.add(d.getDate());
        });
        return dates;
    }, [exams, month, year]);

    const timeline = useMemo(() => {
        const now = new Date();
        const groups = [];
        const todayExams = exams.filter(e => new Date(e.startDate || e.createdAt).toDateString() === now.toDateString());
        if (todayExams.length) groups.push({ label: 'Today', color: '#10b981', exams: todayExams });

        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowExams = exams.filter(e => new Date(e.startDate || e.createdAt).toDateString() === tomorrow.toDateString());
        if (tomorrowExams.length) groups.push({
            label: `${tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — Tomorrow`,
            color: '#f59e0b', exams: tomorrowExams
        });

        const nextWeekExams = exams.filter(e => {
            const d = new Date(e.startDate || e.createdAt);
            const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
            return d > tomorrow && d <= weekEnd;
        });
        if (nextWeekExams.length) groups.push({ label: 'This Week', color: C.btnPrimary, exams: nextWeekExams });

        const laterExams = exams.filter(e => {
            const d = new Date(e.startDate || e.createdAt);
            const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
            return d > weekEnd;
        });
        if (laterExams.length) groups.push({ label: 'Later', color: '#94a3b8', exams: laterExams });

        return groups;
    }, [exams]);

    const getUrgencyBadge = (date) => {
        const diff = new Date(date) - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days <= 0)  return { bg: C.successBg, color: C.success, border: C.successBorder, label: 'Today' };
        if (days === 1) return { bg: C.warningBg, color: C.warning, border: C.warningBorder, label: 'Tomorrow' };
        if (days <= 3)  return { bg: C.dangerBg,  color: C.danger,  border: C.dangerBorder,  label: `${days}d` };
        return {
            bg: innerBox, color: C.btnPrimary, border: C.btnPrimary, label: `${days}d`,
        };
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: themeBg }}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                    Loading your exams…
                </p>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl" style={{ backgroundColor: outerCard, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div>
                    <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, letterSpacing: T.tracking.tight, color: C.heading }}>
                        Upcoming Exams
                    </h1>
                    <p style={{ fontSize: T.size.sm, color: C.textMuted, fontWeight: T.weight.medium, marginTop: 2 }}>
                        Track your scheduled assessments and timeline.
                    </p>
                </div>
                <Link href="/student/history" className="text-decoration-none">
                    <button className="flex items-center gap-2 px-4 h-10 rounded-xl cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                        style={{ backgroundColor: C.surfaceWhite, color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                        <FileText size={16} color={C.btnPrimary} /> Exam History
                    </button>
                </Link>
            </div>

            {/* ── Stat Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Upcoming',  value: stats.upcoming, icon: Calendar, color: C.btnPrimary, bg: innerBox },
                    { label: 'Today',     value: stats.today,    icon: Zap,      color: C.warning, bg: C.warningBg },
                    { label: 'This Week', value: stats.thisWeek, icon: Target,   color: C.success, bg: C.successBg },
                    { label: 'Completed', value: completedCount, icon: CheckCircle, color: C.textMuted, bg: C.surfaceWhite },
                ].map(stat => (
                    <div key={stat.label} className="rounded-2xl p-5 border flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
                        style={{ backgroundColor: outerCard, borderColor: C.cardBorder, boxShadow: S.card }}>
                        <div className="flex items-center justify-between">
                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>
                                {stat.label}
                            </p>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg }}>
                                <stat.icon size={16} style={{ color: stat.color }} />
                            </div>
                        </div>
                        <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, lineHeight: 1, color: C.heading }}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Main Grid ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Exam List */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center gap-3">
                        <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>
                            All Upcoming Exams
                        </h2>
                        {exams.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: C.btnPrimary, color: '#fff', fontSize: '11px', fontWeight: T.weight.black }}>
                                {exams.length}
                            </span>
                        )}
                    </div>

                    {exams.length === 0 ? (
                        <div className="rounded-3xl p-14 text-center border border-dashed" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: innerBox }}>
                                <Calendar className="w-7 h-7" style={{ color: C.btnPrimary, opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>No Upcoming Exams</h3>
                            <p style={{ fontSize: T.size.sm, color: C.textMuted, marginTop: 4 }}>You're all caught up — great work!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {exams.map(exam => {
                                const badge = getUrgencyBadge(exam.startDate || exam.createdAt);
                                return (
                                    <div key={exam._id} className="rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200"
                                        style={{ backgroundColor: outerCard, borderColor: C.cardBorder, boxShadow: S.card }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}>
                                        
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: innerBox }}>
                                            <BookOpen className="w-6 h-6" style={{ color: C.btnPrimary }} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h3 className="truncate mb-1.5" style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                                                {exam.title}
                                            </h3>
                                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                                                <span className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>
                                                    <User size={14} />{exam.tutorName || 'Tutor'}
                                                </span>
                                                <span className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>
                                                    <Calendar size={14} />
                                                    {new Date(exam.startDate || exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                {exam.startTime && (
                                                    <span className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>
                                                        <Clock size={14} />{exam.startTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 shrink-0 sm:w-auto w-full justify-between sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-none" style={{ borderColor: C.cardBorder }}>
                                            <span className="px-3 py-1 rounded-lg border" style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border, fontSize: '11px', fontWeight: T.weight.black, textTransform: 'uppercase' }}>
                                                {badge.label}
                                            </span>
                                            <Link href={`/student/exams/${exam._id}`} className="text-decoration-none">
                                                <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-white transition-opacity hover:opacity-90 shadow-sm border-none cursor-pointer"
                                                    style={{ backgroundColor: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                    Attempt <ArrowRight size={14} />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Calendar + Timeline */}
                <div className="space-y-6">

                    {/* Calendar */}
                    <div className="rounded-3xl p-6 border shadow-sm" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>{monthName}</h3>
                            <div className="flex items-center gap-1">
                                {[{ dir: -1, Icon: ChevronLeft }, { dir: 1, Icon: ChevronRight }].map(({ dir, Icon }) => (
                                    <button key={dir} onClick={() => setCalendarDate(new Date(year, month + dir, 1))}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border-none"
                                        style={{ backgroundColor: innerBox, color: C.heading }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = innerBox; e.currentTarget.style.color = C.heading; }}>
                                        <Icon size={16} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-7 text-center mb-2">
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                                <div key={d} className="py-1" style={{ fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', color: C.textMuted }}>{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-1 text-center">
                            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const isToday   = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                                const hasExam   = examDates.has(day);
                                return (
                                    <div key={day} className="flex flex-col items-center justify-center h-10 w-10 mx-auto relative">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                            style={isToday
                                                ? { backgroundColor: C.btnPrimary, color: 'white', fontSize: T.size.sm, fontWeight: T.weight.black }
                                                : hasExam
                                                ? { backgroundColor: innerBox, color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.bold, border: `1px solid ${C.btnPrimary}` }
                                                : { color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                                            {day}
                                        </div>
                                        {hasExam && !isToday && (
                                            <div className="absolute bottom-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.btnPrimary }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-3xl p-6 border shadow-sm" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                        <h3 className="mb-5" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>Exam Timeline</h3>
                        {timeline.length === 0 ? (
                            <p className="text-center py-6" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No upcoming exams scheduled.</p>
                        ) : (
                            <div className="space-y-6">
                                {timeline.map((group, gi) => (
                                    <div key={gi}>
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                                            <span style={{ fontSize: '11px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '1px', color: C.textMuted }}>
                                                {group.label}
                                            </span>
                                        </div>
                                        <div className="ml-[5px] pl-5 space-y-4" style={{ borderLeft: `2px solid ${group.color}40` }}>
                                            {group.exams.slice(0, 3).map((exam, ei) => (
                                                <div key={ei} className="p-3 rounded-xl border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                    <p className="truncate mb-1" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{exam.title}</p>
                                                    <p className="flex items-center gap-1.5" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                                        <Clock size={12} />
                                                        {new Date(exam.startDate || exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            ))}
                                            {group.exams.length > 3 && (
                                                <p style={{ fontSize: '11px', fontWeight: T.weight.black, color: C.btnPrimary }}>+{group.exams.length - 3} more exams</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}