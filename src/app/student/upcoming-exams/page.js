'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Calendar, Clock, ChevronLeft, ChevronRight, FileText, CheckCircle,
    Timer, User, Sparkles, ArrowRight
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

export default function UpcomingExamsPage() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completedCount, setCompletedCount] = useState(0);
    const [calendarDate, setCalendarDate] = useState(new Date());

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/student/all');
                if (res.data.success) {
                    const all = res.data.exams || [];
                    setExams(all.filter(e => !e.isCompleted));
                    setCompletedCount(all.filter(e => e.isCompleted).length);
                }
            } catch (error) {
                console.error('Failed to load exams', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        const today = exams.filter(e => {
            const d = new Date(e.startDate || e.createdAt);
            return d.toDateString() === now.toDateString();
        });
        const thisWeek = exams.filter(e => {
            const d = new Date(e.startDate || e.createdAt);
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return d >= now && d <= weekEnd;
        });
        return { upcoming: exams.length, today: today.length, thisWeek: thisWeek.length };
    }, [exams]);

    // Calendar helpers
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
            if (d.getMonth() === month && d.getFullYear() === year) {
                dates.add(d.getDate());
            }
        });
        return dates;
    }, [exams, month, year]);

    // Timeline grouping
    const timeline = useMemo(() => {
        const now = new Date();
        const groups = [];
        const todayExams = exams.filter(e => new Date(e.startDate || e.createdAt).toDateString() === now.toDateString());
        if (todayExams.length) groups.push({ label: 'Today', color: 'bg-emerald-500', exams: todayExams });

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowExams = exams.filter(e => new Date(e.startDate || e.createdAt).toDateString() === tomorrow.toDateString());
        if (tomorrowExams.length) groups.push({ label: `${tomorrow.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (Tomorrow)`, color: 'bg-amber-500', exams: tomorrowExams });

        const nextWeekExams = exams.filter(e => {
            const d = new Date(e.startDate || e.createdAt);
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return d > tomorrow && d <= weekEnd;
        });
        if (nextWeekExams.length) groups.push({ label: 'Next Week', color: 'bg-indigo-500', exams: nextWeekExams });

        const laterExams = exams.filter(e => {
            const d = new Date(e.startDate || e.createdAt);
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return d > weekEnd;
        });
        if (laterExams.length) groups.push({ label: 'Later', color: 'bg-orange-500', exams: laterExams });

        return groups;
    }, [exams]);

    const getTimeUntil = (date) => {
        const diff = new Date(date) - new Date();
        if (diff < 0) return 'Scheduled';
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        return `Starts in ${days} days`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading exams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Upcoming Exams</h1>
                <Link href="/student/history" className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    <FileText className="w-4 h-4" /> View Exam History
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Upcoming Exams', count: stats.upcoming, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                    { label: 'Today Exams', count: stats.today, icon: Clock, color: 'text-red-600', bg: 'bg-red-100' },
                    { label: 'This Week', count: stats.thisWeek, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
                    { label: 'Completed Exams', count: completedCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Exam List */}
                <div className="xl:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-slate-800">All Upcoming Exams</h2>

                    {exams.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
                            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <h3 className="font-bold text-slate-700">No Upcoming Exams</h3>
                            <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {exams.map((exam) => (
                                <div key={exam._id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{exam.title}</h3>
                                            <p className="text-xs text-slate-500">{exam.courseTitle || 'General'}</p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {exam.tutorName || 'Tutor'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(exam.startDate || exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        {exam.startTime && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {exam.startTime}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        <Link href={`/student/exams/${exam._id}`}>
                                            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4">
                                                Attempt Test <ArrowRight className="w-3 h-3 ml-1" />
                                            </Button>
                                        </Link>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                            {getTimeUntil(exam.startDate || exam.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Calendar + Timeline */}
                <div className="space-y-4">
                    {/* Calendar */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-800">{monthName}</h3>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCalendarDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded">
                                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                                </button>
                                <button onClick={() => setCalendarDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded">
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="py-1 text-slate-400 font-semibold">{d}</div>
                            ))}
                            {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                                const hasExam = examDates.has(day);
                                return (
                                    <div
                                        key={day}
                                        className={`py-1.5 rounded-full text-xs font-medium transition-colors
                                            ${isToday ? 'bg-indigo-600 text-white font-bold' : ''}
                                            ${hasExam && !isToday ? 'bg-emerald-100 text-emerald-700 font-bold' : ''}
                                            ${!isToday && !hasExam ? 'text-slate-600 hover:bg-slate-50' : ''}
                                        `}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">Upcoming Exams Timeline</h3>
                        {timeline.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No upcoming exams</p>
                        ) : (
                            <div className="space-y-4">
                                {timeline.map((group, gi) => (
                                    <div key={gi}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${group.color}`}></span>
                                            <span className="text-xs font-bold text-slate-700">{group.label}</span>
                                        </div>
                                        {group.exams.slice(0, 2).map((exam, ei) => (
                                            <div key={ei} className="ml-5 pl-3 border-l-2 border-slate-100 pb-3">
                                                <p className="text-sm font-semibold text-slate-700">{exam.title}</p>
                                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(exam.startDate || exam.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        ))}
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
