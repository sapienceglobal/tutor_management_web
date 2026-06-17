'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    MdCalendarMonth,
    MdAccessTime,
    MdChevronLeft,
    MdChevronRight,
    MdArticle,
    MdCheckCircle,
    MdPerson,
    MdArrowForward,
    MdMenuBook,
    MdTrackChanges,
    MdBolt,
    MdEventNote,
    MdClose,
} from 'react-icons/md';
import api from '@/lib/axios';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';
import { getAudienceDisplay, getAudienceScope } from '@/lib/audienceDisplay';

export default function UpcomingExamsPage() {
    const [exams, setExams]                   = useState([]);
    const [loading, setLoading]               = useState(true);
    const [completedCount, setCompletedCount] = useState(0);
    const [calendarDate, setCalendarDate]     = useState(new Date());
    const [activeTab, setActiveTab]           = useState('all');
    const [selectedExam, setSelectedExam]     = useState(null);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/student/all');
                if (res.data?.success) {
                    const all = res.data.exams || [];
                    const now = new Date();
                    setExams(all.filter(e => !e.isCompleted && e.startDate && new Date(e.startDate) > now));
                    setCompletedCount(all.filter(e => e.isCompleted).length);
                }
            } catch (error) { console.error('Failed to load exams', error); }
            finally { setLoading(false); }
        };
        fetchExams();
    }, []);

    const filteredExams = useMemo(() => {
        return exams.filter(e => {
            const scope = getAudienceScope(e);
            if (activeTab === 'institute') return scope === 'institute' || scope === 'batch' || scope === 'private';
            if (activeTab === 'global') return scope === 'global';
            return true;
        });
    }, [exams, activeTab]);

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

    const year        = calendarDate.getFullYear();
    const month       = calendarDate.getMonth();
    const monthName   = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const today       = new Date();

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
        const todayExams = exams.filter(e =>
            new Date(e.startDate || e.createdAt).toDateString() === now.toDateString()
        );
        if (todayExams.length) groups.push({ label: 'Today', color: C.success, exams: todayExams });

        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowExams = exams.filter(e =>
            new Date(e.startDate || e.createdAt).toDateString() === tomorrow.toDateString()
        );
        if (tomorrowExams.length) groups.push({
            label: `${tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — Tomorrow`,
            color: C.warning, exams: tomorrowExams,
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
        if (laterExams.length) groups.push({ label: 'Later', color: C.textMuted, exams: laterExams });

        return groups;
    }, [exams]);

    const getUrgencyBadge = (date) => {
        const diff = new Date(date) - new Date();
        const days  = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days <= 0)  return { bg: C.successBg, color: C.success, border: C.successBorder, label: 'Today' };
        if (days === 1) return { bg: C.warningBg, color: C.warning, border: C.warningBorder, label: 'Tomorrow' };
        if (days <= 3)  return { bg: C.dangerBg,  color: C.danger,  border: C.dangerBorder,  label: `${days}d` };
        return { bg: C.innerBg, color: C.btnPrimary, border: C.cardBorder, label: `${days}d` };
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex items-center justify-center min-h-screen"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div
                        className="w-12 h-12 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                    />
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                    Loading your exams…
                </p>
            </div>
        </div>
    );

    return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 lg:p-8"
                style={{
                    backgroundColor: C.cardBg,
                    border: `1px solid ${C.cardBorder}`,
                    boxShadow: S.card,
                    borderRadius: R['2xl'],
                }}
            >
                <div className="flex items-center gap-3">
                    {/* Icon Pill */}
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdEventNote style={{ width: 20, height: 20, color: C.iconColor }} />
                    </div>
                    <div>
                        <h1
                            style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size['2xl'],
                                fontWeight: T.weight.bold,
                                letterSpacing: T.tracking.tight,
                                color: C.heading,
                                lineHeight: T.leading.tight,
                            }}
                        >
                            Upcoming Exams
                        </h1>
                        <p
                            style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                color: C.text,
                                fontWeight: T.weight.medium,
                                marginTop: 2,
                            }}
                        >
                            Track your scheduled assessments and timeline.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Tab Toggles */}
                    <div
                        className="flex items-center p-1 w-full sm:w-auto"
                        style={{
                            backgroundColor: C.innerBg,
                            borderRadius: R.xl,
                            border: `1px solid ${C.cardBorder}`,
                        }}
                    >
                        {[
                            { id: 'all', label: 'All Exams' },
                            { id: 'institute', label: 'My Institute' },
                            { id: 'global', label: 'Global' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex-1 sm:flex-none px-4 py-2 cursor-pointer border-none transition-all"
                                style={{
                                    backgroundColor: activeTab === tab.id ? C.surfaceWhite : 'transparent',
                                    color: activeTab === tab.id ? C.btnPrimary : C.textMuted,
                                    borderRadius: R.lg,
                                    boxShadow: activeTab === tab.id ? S.card : 'none',
                                    fontSize: T.size.sm,
                                    fontWeight: T.weight.bold,
                                    fontFamily: T.fontFamily,
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <Link href="/student/history" className="w-full sm:w-auto shrink-0">
                        <button
                            className="flex items-center justify-center gap-2 px-4 h-10 w-full cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                                backgroundColor: C.btnViewAllBg,
                                color: C.btnViewAllText,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: '10px',
                            }}
                        >
                            <MdArticle style={{ width: 16, height: 16, color: C.btnPrimary }} />
                            Exam History
                        </button>
                    </Link>
                </div>
            </div>

            {/* ── Stat Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={MdCalendarMonth}
                    value={stats.upcoming}
                    label="Upcoming"
                    iconBg="#EEF2FF"
                    iconColor="#4F46E5"
                />
                <StatCard
                    icon={MdBolt}
                    value={stats.today}
                    label="Today"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard
                    icon={MdTrackChanges}
                    value={stats.thisWeek}
                    label="This Week"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard
                    icon={MdCheckCircle}
                    value={completedCount}
                    label="Completed"
                    iconBg={C.innerBg}
                    iconColor={C.text}
                />
            </div>

            {/* ── Main Grid ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* ── Left: Exam List ────────────────────────────────────── */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Section heading */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="flex items-center justify-center rounded-lg shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                            >
                                <MdMenuBook style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h2
                                style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xl,
                                    fontWeight: T.weight.semibold,
                                    color: C.heading,
                                }}
                            >
                                All Upcoming Exams
                            </h2>
                            {filteredExams.length > 0 && (
                                <span
                                    className="px-2.5 py-0.5 rounded-lg"
                                    style={{
                                        backgroundColor: C.btnPrimary,
                                        color: '#fff',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                    }}
                                >
                                    {filteredExams.length}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Empty State */}
                    {filteredExams.length === 0 ? (
                        <div
                            className="p-14 text-center border border-dashed"
                            style={{
                                backgroundColor: C.cardBg,
                                borderColor: C.cardBorder,
                                borderRadius: R['2xl'],
                            }}
                        >
                            <div
                                className="flex items-center justify-center mx-auto mb-4"
                                style={{
                                    width: 56,
                                    height: 56,
                                    backgroundColor: C.innerBg,
                                    borderRadius: R.lg,
                                }}
                            >
                                <MdCalendarMonth
                                    style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }}
                                />
                            </div>
                            <h3
                                style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.lg,
                                    fontWeight: T.weight.bold,
                                    color: C.heading,
                                }}
                            >
                                No Upcoming Exams
                            </h3>
                            <p
                                style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    color: C.text,
                                    marginTop: 4,
                                }}
                            >
                                {activeTab === 'all'
                                    ? "You're all caught up — great work!"
                                    : `No exams available in the "${activeTab === 'institute' ? 'My Institute' : 'Global'}" scope.`}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredExams.map(exam => {
                                const badge = getUrgencyBadge(exam.startDate || exam.createdAt);
                                const aud = getAudienceDisplay(exam);
                                return (
                                    <div
                                        key={exam._id}
                                        className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200"
                                        style={{
                                            backgroundColor: C.cardBg,
                                            border: `1px solid ${C.cardBorder}`,
                                            boxShadow: S.card,
                                            borderRadius: '10px',
                                        }}
                                    >
                                        {/* Icon */}
                                        <div
                                            className="flex items-center justify-center shrink-0"
                                            style={{
                                                width: 44,
                                                height: 44,
                                                backgroundColor: C.innerBg,
                                                borderRadius: '10px',
                                            }}
                                        >
                                            <MdMenuBook
                                                style={{ width: 22, height: 22, color: C.btnPrimary }}
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3
                                                    className="truncate"
                                                    style={{
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.md,
                                                        fontWeight: T.weight.bold,
                                                        color: C.heading,
                                                        margin: 0,
                                                    }}
                                                >
                                                    {exam.title}
                                                </h3>
                                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold ${aud.badgeClass}`}>
                                                    {aud.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                                                <span
                                                    className="flex items-center gap-1.5"
                                                    style={{
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.base,
                                                        fontWeight: T.weight.medium,
                                                        color: C.text,
                                                    }}
                                                >
                                                    <MdPerson style={{ width: 14, height: 14 }} />
                                                    {exam.tutorName || 'Tutor'}
                                                </span>
                                                <span
                                                    className="flex items-center gap-1.5"
                                                    style={{
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.base,
                                                        fontWeight: T.weight.medium,
                                                        color: C.text,
                                                    }}
                                                >
                                                    <MdCalendarMonth style={{ width: 14, height: 14 }} />
                                                    {new Date(exam.startDate || exam.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                    })}
                                                </span>
                                                {exam.startTime && (
                                                    <span
                                                        className="flex items-center gap-1.5"
                                                        style={{
                                                            fontFamily: T.fontFamily,
                                                            fontSize: T.size.base,
                                                            fontWeight: T.weight.medium,
                                                            color: C.text,
                                                        }}
                                                    >
                                                        <MdAccessTime style={{ width: 14, height: 14 }} />
                                                        {exam.startTime}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Badge + CTA */}
                                        <div
                                            className="flex items-center gap-3 shrink-0 sm:w-auto w-full justify-between sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 sm:border-none"
                                            style={{ borderTop: '1px solid transparent' }}
                                        >
                                            <span
                                                className="px-3 py-1"
                                                style={{
                                                    backgroundColor: badge.bg,
                                                    color: badge.color,
                                                    border: `1px solid ${badge.border}`,
                                                    fontFamily: T.fontFamily,
                                                    fontSize: T.size.xs,
                                                    fontWeight: T.weight.bold,
                                                    textTransform: 'uppercase',
                                                    borderRadius: '10px',
                                                }}
                                            >
                                                {badge.label}
                                            </span>
                                            <button
                                                onClick={() => setSelectedExam(exam)}
                                                className="flex items-center gap-1.5 h-9 px-4 text-white transition-opacity hover:opacity-90 cursor-pointer border-none"
                                                style={{
                                                    backgroundColor: C.btnPrimary,
                                                    fontFamily: T.fontFamily,
                                                    fontSize: T.size.base,
                                                    fontWeight: T.weight.bold,
                                                    borderRadius: '10px',
                                                    boxShadow: `0 4px 14px ${C.btnPrimary}40`,
                                                }}
                                            >
                                                View Info <MdArrowForward style={{ width: 14, height: 14 }} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right: Calendar + Timeline ─────────────────────────── */}
                <div className="space-y-5">

                    {/* Calendar */}
                    <div
                        className="p-5"
                        style={{
                            backgroundColor: C.cardBg,
                            border: `1px solid ${C.cardBorder}`,
                            boxShadow: S.card,
                            borderRadius: R['2xl'],
                        }}
                    >
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h3
                                style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.lg,
                                    fontWeight: T.weight.semibold,
                                    color: C.heading,
                                }}
                            >
                                {monthName}
                            </h3>
                            <div className="flex items-center gap-1">
                                {[{ dir: -1, Icon: MdChevronLeft }, { dir: 1, Icon: MdChevronRight }].map(({ dir, Icon }) => (
                                    <button
                                        key={dir}
                                        onClick={() => setCalendarDate(new Date(year, month + dir, 1))}
                                        className="flex items-center justify-center transition-colors cursor-pointer border-none"
                                        style={{
                                            width: 32,
                                            height: 32,
                                            backgroundColor: C.innerBg,
                                            color: C.heading,
                                            borderRadius: '10px',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.backgroundColor = C.btnPrimary;
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.backgroundColor = C.innerBg;
                                            e.currentTarget.style.color = C.heading;
                                        }}
                                    >
                                        <Icon style={{ width: 18, height: 18 }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 text-center mb-1">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div
                                    key={d}
                                    className="py-1"
                                    style={{
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        textTransform: 'uppercase',
                                        color: C.text,
                                    }}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Day Cells */}
                        <div className="grid grid-cols-7 gap-y-1 text-center">
                            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day     = i + 1;
                                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                                const hasExam = examDates.has(day);
                                return (
                                    <div
                                        key={day}
                                        className="flex flex-col items-center justify-center relative"
                                        style={{ height: 40 }}
                                    >
                                        <div
                                            className="flex items-center justify-center transition-all"
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '10px',
                                                fontFamily: T.fontFamily,
                                                ...(isToday
                                                    ? {
                                                        backgroundColor: C.btnPrimary,
                                                        color: '#ffffff',
                                                        fontSize: T.size.base,
                                                        fontWeight: T.weight.bold,
                                                    }
                                                    : hasExam
                                                    ? {
                                                        backgroundColor: C.innerBg,
                                                        color: C.btnPrimary,
                                                        fontSize: T.size.base,
                                                        fontWeight: T.weight.bold,
                                                        border: `1px solid ${C.btnPrimary}`,
                                                    }
                                                    : {
                                                        color: C.text,
                                                        fontSize: T.size.base,
                                                        fontWeight: T.weight.medium,
                                                    }
                                                ),
                                            }}
                                        >
                                            {day}
                                        </div>
                                        {hasExam && !isToday && (
                                            <div
                                                className="absolute bottom-0 rounded-full"
                                                style={{
                                                    width: 5,
                                                    height: 5,
                                                    backgroundColor: C.btnPrimary,
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div
                        className="p-5"
                        style={{
                            backgroundColor: C.cardBg,
                            border: `1px solid ${C.cardBorder}`,
                            boxShadow: S.card,
                            borderRadius: R['2xl'],
                        }}
                    >
                        {/* Timeline Header */}
                        <div className="flex items-center gap-2.5 mb-5">
                            <div
                                className="flex items-center justify-center rounded-lg shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                            >
                                <MdAccessTime style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h3
                                style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xl,
                                    fontWeight: T.weight.semibold,
                                    color: C.heading,
                                }}
                            >
                                Exam Timeline
                            </h3>
                        </div>

                        {timeline.length === 0 ? (
                            <p
                                className="text-center py-6"
                                style={{
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    fontWeight: T.weight.medium,
                                    color: C.text,
                                }}
                            >
                                No upcoming exams scheduled.
                            </p>
                        ) : (
                            <div className="space-y-5">
                                {timeline.map((group, gi) => (
                                    <div key={gi}>
                                        {/* Group Label */}
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div
                                                className="rounded-full shrink-0"
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    backgroundColor: group.color,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontFamily: T.fontFamily,
                                                    fontSize: T.size.xs,
                                                    fontWeight: T.weight.bold,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: T.tracking.wider,
                                                    color: C.text,
                                                }}
                                            >
                                                {group.label}
                                            </span>
                                        </div>

                                        {/* Timeline Items */}
                                        <div
                                            className="ml-[5px] pl-5 space-y-3"
                                            style={{ borderLeft: `2px solid ${group.color}40` }}
                                        >
                                            {group.exams.slice(0, 3).map((exam, ei) => (
                                                <div
                                                    key={ei}
                                                    className="p-3"
                                                    style={{
                                                        backgroundColor: C.innerBg,
                                                        border: `1px solid ${C.cardBorder}`,
                                                        borderRadius: '10px',
                                                    }}
                                                >
                                                    <p
                                                        className="truncate mb-1"
                                                        style={{
                                                            fontFamily: T.fontFamily,
                                                            fontSize: T.size.base,
                                                            fontWeight: T.weight.semibold,
                                                            color: C.heading,
                                                        }}
                                                    >
                                                        {exam.title}
                                                    </p>
                                                    <p
                                                        className="flex items-center gap-1.5"
                                                        style={{
                                                            fontFamily: T.fontFamily,
                                                            fontSize: T.size.xs,
                                                            fontWeight: T.weight.medium,
                                                            color: C.text,
                                                        }}
                                                    >
                                                        <MdAccessTime style={{ width: 12, height: 12 }} />
                                                        {new Date(exam.startDate || exam.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                            ))}
                                            {group.exams.length > 3 && (
                                                <p
                                                    style={{
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.xs,
                                                        fontWeight: T.weight.bold,
                                                        color: C.btnPrimary,
                                                    }}
                                                >
                                                    +{group.exams.length - 3} more exams
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
            {selectedExam && (
                <ExamInfoModal exam={selectedExam} onClose={() => setSelectedExam(null)} />
            )}
        </div>
    );
}

function ExamInfoModal({ exam, onClose }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(exam.startDate) - +new Date();
            if (difference <= 0) return null;
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [exam.startDate]);

    const aud = getAudienceDisplay(exam);
    const formattedStartDate = new Date(exam.startDate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="shadow-2xl max-w-md w-full p-6 relative overflow-hidden transition-all duration-300"
                style={{ 
                    backgroundColor: C.cardBg, 
                    borderRadius: R['2xl'], 
                    border: `1px solid ${C.cardBorder}`,
                    animation: 'modalSlideIn 0.3s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* CSS animation inline declaration */}
                <style>{`
                    @keyframes modalSlideIn {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}</style>

                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg" style={{ backgroundColor: C.innerBg }}>
                            <MdEventNote style={{ width: 20, height: 20, color: C.btnPrimary }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            Exam Scheduled
                        </h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center cursor-pointer border-none transition-colors"
                        style={{ backgroundColor: C.innerBg, color: C.heading, borderRadius: '8px', border: `1px solid ${C.cardBorder}` }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnPrimary + '15'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}
                    >
                        <MdClose style={{ width: 16, height: 16 }} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4 mb-6">
                    <div>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 6px 0', lineHeight: T.leading.snug }}>
                            {exam.title}
                        </h2>
                        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-extrabold ${aud.badgeClass}`}>
                            {aud.label} Scope
                        </span>
                    </div>

                    {exam.description ? (
                        <div className="p-3.5 rounded-lg border italic" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, color: C.text, fontSize: T.size.base, lineHeight: T.leading.normal }}>
                            {exam.description}
                        </div>
                    ) : (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, margin: '4px 0', fontStyle: 'italic' }}>
                            No description provided for this exam.
                        </p>
                    )}

                    {/* Countdown */}
                    <div className="p-4 rounded-lg border text-center" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 8, marginTop: 0 }}>
                            Countdown to Start
                        </p>
                        {timeLeft ? (
                            <div className="grid grid-cols-4 gap-2">
                                {[['Days', timeLeft.days], ['Hours', timeLeft.hours], ['Mins', timeLeft.minutes], ['Secs', timeLeft.seconds]].map(([label, val]) => (
                                    <div key={label} className="p-2 bg-white rounded-md border shadow-sm" style={{ borderColor: C.cardBorder }}>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.btnPrimary, margin: 0 }}>
                                            {String(val).padStart(2, '0')}
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: 0, marginTop: 2 }}>
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.success, margin: 0 }}>
                                Exam is starting now! Refresh the page.
                            </p>
                        )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: 'Starts At', value: formattedStartDate, icon: MdCalendarMonth },
                            { label: 'Duration', value: `${exam.duration} Minutes`, icon: MdAccessTime },
                            { label: 'Questions', value: `${exam.totalQuestions} Questions`, icon: MdArticle },
                            { label: 'Course', value: exam.courseTitle || 'General', icon: MdMenuBook },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="p-3 border rounded-lg flex items-start gap-2.5" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder }}>
                                    <Icon style={{ width: 16, height: 16, color: C.btnPrimary, marginTop: 2, flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0 }}>
                                            {item.label}
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.heading, fontWeight: T.weight.bold, margin: '2px 0 0 0', lineHeight: T.leading.snug }}>
                                            {item.value}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Audience reason info */}
                    <div className="p-3.5 rounded-lg border text-xs" style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', color: '#3730A3', fontWeight: T.weight.semibold }}>
                        {aud.reason}
                    </div>
                </div>

                {/* Footer action */}
                <button 
                    onClick={onClose}
                    className="w-full py-3 text-white cursor-pointer border-none transition-all hover:opacity-90 font-bold"
                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.base, borderRadius: '10px', boxShadow: S.btn }}
                >
                    Okay, Got It
                </button>
            </div>
        </div>
    );
}