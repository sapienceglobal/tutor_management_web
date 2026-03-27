'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Calendar, Clock, ChevronLeft, ChevronRight, FileText, CheckCircle,
    User, ArrowRight, BookOpen, Target, Zap
} from 'lucide-react';
import api from '@/lib/axios';
import { T } from '@/constants/studentTokens';

// Note: This page uses var(--theme-*) CSS variables set by ThemeContext.
// T.fontFamily is the only token imported — all colors use CSS vars directly.

export default function UpcomingExamsPage() {
    const [exams, setExams]                 = useState([]);
    const [loading, setLoading]             = useState(true);
    const [completedCount, setCompletedCount] = useState(0);
    const [calendarDate, setCalendarDate]   = useState(new Date());

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/student/all');
                if (res.data.success) {
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
        if (nextWeekExams.length) groups.push({ label: 'This Week', color: 'var(--theme-primary)', exams: nextWeekExams });

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
        if (days <= 0)  return { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Today' };
        if (days === 1) return { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Tomorrow' };
        if (days <= 3)  return { bg: 'rgba(239,68,68,0.10)',   color: '#ef4444', label: `${days}d` };
        return {
            bg: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)',
            color: 'var(--theme-primary)',
            label: `${days}d`,
        };
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', borderTopColor: 'var(--theme-primary)' }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: 'var(--theme-foreground)', opacity: 0.45 }}>
                    Loading your exams…
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6" style={{ fontFamily: T.fontFamily }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, letterSpacing: T.tracking.tight, color: 'var(--theme-foreground)' }}>
                        Upcoming Exams
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'var(--theme-foreground)', opacity: 0.45, marginTop: 2 }}>
                        Track your scheduled assessments and timeline
                    </p>
                </div>
                <Link href="/student/history"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all"
                    style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-primary) 40%, transparent)'; e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-primary) 5%, var(--theme-background))'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--theme-border)'; e.currentTarget.style.backgroundColor = 'var(--theme-background)'; }}>
                    <FileText className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    Exam History
                </Link>
            </div>

            {/* ── Stat Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Upcoming',  value: stats.upcoming, icon: Calendar,    opacity: 1   },
                    { label: 'Today',     value: stats.today,    icon: Zap,         opacity: 0.8 },
                    { label: 'This Week', value: stats.thisWeek, icon: Target,      opacity: 0.6 },
                    { label: 'Completed', value: completedCount, icon: CheckCircle, opacity: 0.4 },
                ].map(stat => (
                    <div key={stat.label} className="rounded-2xl p-4 border flex items-center gap-3"
                        style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
                            <stat.icon className="w-5 h-5" style={{ color: 'var(--theme-primary)', opacity: stat.opacity }} />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: 'var(--theme-foreground)', opacity: 0.45 }}>
                                {stat.label}
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, lineHeight: T.leading.tight, marginTop: 2, color: 'var(--theme-primary)' }}>
                                {stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Grid ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Exam List */}
                <div className="xl:col-span-2 space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: 'var(--theme-foreground)' }}>
                            All Upcoming Exams
                        </h2>
                        {exams.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)', color: 'var(--theme-primary)', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                {exams.length}
                            </span>
                        )}
                    </div>

                    {exams.length === 0 ? (
                        <div className="rounded-2xl p-14 text-center border"
                            style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)' }}>
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}>
                                <Calendar className="w-7 h-7" style={{ color: 'var(--theme-primary)', opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: 'var(--theme-foreground)' }}>
                                No Upcoming Exams
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'var(--theme-foreground)', opacity: 0.40, marginTop: 4 }}>
                                You're all caught up — great work!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {exams.map(exam => {
                                const badge = getUrgencyBadge(exam.startDate || exam.createdAt);
                                return (
                                    <div key={exam._id}
                                        className="rounded-2xl p-4 border flex items-center gap-4 transition-all duration-200"
                                        style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-primary) 35%, transparent)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--theme-border)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}>
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
                                            <BookOpen className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: 'var(--theme-foreground)' }}>
                                                {exam.title}
                                            </h3>
                                            <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                                <span className="flex items-center gap-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'var(--theme-foreground)', opacity: 0.40 }}>
                                                    <User className="w-3 h-3" />{exam.tutorName || 'Tutor'}
                                                </span>
                                                <span className="flex items-center gap-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'var(--theme-foreground)', opacity: 0.40 }}>
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(exam.startDate || exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                {exam.startTime && (
                                                    <span className="flex items-center gap-1"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'var(--theme-foreground)', opacity: 0.40 }}>
                                                        <Clock className="w-3 h-3" />{exam.startTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg shrink-0"
                                            style={{ backgroundColor: badge.bg, color: badge.color, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black }}>
                                            {badge.label}
                                        </span>
                                        <Link href={`/student/exams/${exam._id}`}>
                                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white shrink-0 transition-all"
                                                style={{ backgroundColor: 'var(--theme-primary)', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}>
                                                Attempt <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Calendar + Timeline */}
                <div className="space-y-4">

                    {/* Calendar */}
                    <div className="rounded-2xl p-5 border"
                        style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: 'var(--theme-foreground)' }}>
                                {monthName}
                            </h3>
                            <div className="flex items-center gap-0.5">
                                {[{ dir: -1, Icon: ChevronLeft }, { dir: 1, Icon: ChevronRight }].map(({ dir, Icon }) => (
                                    <button key={dir}
                                        onClick={() => setCalendarDate(new Date(year, month + dir, 1))}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                        style={{ color: 'var(--theme-foreground)' }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-primary) 10%, transparent)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-7 text-center mb-1">
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                                <div key={d} className="py-0.5"
                                    style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: 'var(--theme-foreground)', opacity: 0.30 }}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-0.5 text-center">
                            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const isToday   = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                                const hasExam   = examDates.has(day);
                                return (
                                    <div key={day} className="flex flex-col items-center py-1">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                            style={
                                                isToday
                                                    ? { backgroundColor: 'var(--theme-primary)', color: 'white', fontFamily: T.fontFamily, fontSize: '12px', fontWeight: T.weight.black }
                                                    : hasExam
                                                        ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 14%, transparent)', color: 'var(--theme-primary)', fontFamily: T.fontFamily, fontSize: '12px', fontWeight: T.weight.bold }
                                                        : { color: 'var(--theme-foreground)', opacity: 0.55, fontFamily: T.fontFamily, fontSize: '12px', fontWeight: T.weight.semibold }
                                            }>
                                            {day}
                                        </div>
                                        {hasExam && !isToday && (
                                            <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: 'var(--theme-primary)' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--theme-primary)' }} />
                                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: 'var(--theme-foreground)', opacity: 0.45 }}>Today</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 18%, transparent)', outline: '1.5px solid var(--theme-primary)' }} />
                                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: 'var(--theme-foreground)', opacity: 0.45 }}>Has Exam</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="rounded-2xl p-5 border"
                        style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <h3 className="mb-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: 'var(--theme-foreground)' }}>
                            Exam Timeline
                        </h3>
                        {timeline.length === 0 ? (
                            <p className="text-center py-6"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'var(--theme-foreground)', opacity: 0.30 }}>
                                No upcoming exams scheduled
                            </p>
                        ) : (
                            <div className="space-y-5">
                                {timeline.map((group, gi) => (
                                    <div key={gi}>
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: 'var(--theme-foreground)', opacity: 0.40 }}>
                                                {group.label}
                                            </span>
                                        </div>
                                        <div className="ml-3.5 pl-4 space-y-3" style={{ borderLeft: `2px solid ${group.color}28` }}>
                                            {group.exams.slice(0, 3).map((exam, ei) => (
                                                <div key={ei}>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, lineHeight: T.leading.snug, color: 'var(--theme-foreground)' }}>
                                                        {exam.title}
                                                    </p>
                                                    <p className="flex items-center gap-1 mt-0.5"
                                                        style={{ fontFamily: T.fontFamily, fontSize: '11px', color: 'var(--theme-foreground)', opacity: 0.38 }}>
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(exam.startDate || exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            ))}
                                            {group.exams.length > 3 && (
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.semibold, color: 'var(--theme-primary)', opacity: 0.65 }}>
                                                    +{group.exams.length - 3} more
                                                </p>
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