'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    FileText, Timer, CheckCircle, ArrowRight, Clock, Search, Filter, Sparkles, Calendar, BookOpen, PlayCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { getAudienceDisplay } from '@/lib/audienceDisplay';
import { C, T, S, R, FX } from '@/constants/studentTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
    return (
        <div className="p-5 flex flex-col justify-between transition-transform hover:-translate-y-0.5" 
            style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, minHeight: '120px' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', margin: 0 }}>
                    {label}
                </p>
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg, borderRadius: R.xl }}>
                    <Icon size={20} color={iconColor} />
                </div>
            </div>
            <div className="mt-auto">
                <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
            </div>
        </div>
    );
}

export default function StudentExamsPage() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/student/all');
                if (res.data.success) setExams(res.data.exams);
            } catch (error) {
                console.error('Failed to load exams', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const getStatus = (exam) => {
        if (exam.isCompleted) return 'completed';
        if (exam.isScheduled) {
            const now = new Date();
            const start = new Date(exam.startDate);
            const end = new Date(exam.endDate);
            if (now < start) return 'upcoming';
            if (now > end) return 'expired';
        }
        return 'available';
    };

    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            const status = getStatus(exam);
            const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
            if (filter === 'all') return matchesSearch;
            return status === filter && matchesSearch;
        });
    }, [exams, filter, searchTerm]);

    const stats = useMemo(() => ({
        all: exams.length,
        available: exams.filter(e => getStatus(e) === 'available').length,
        upcoming: exams.filter(e => getStatus(e) === 'upcoming').length,
        completed: exams.filter(e => getStatus(e) === 'completed').length,
    }), [exams]);

    const statusConfig = {
        available: { label: 'Available', bg: C.successBg, text: C.success, border: C.successBorder },
        upcoming:  { label: 'Upcoming',  bg: C.warningBg, text: C.warning, border: C.warningBorder },
        completed: { label: 'Completed', bg: C.btnViewAllBg, text: C.btnPrimary, border: C.btnPrimary },
        expired:   { label: 'Expired',   bg: C.dangerBg, text: C.danger, border: C.dangerBorder },
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <div className="w-12 h-12 rounded-full border-[3px] animate-spin" style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading your exams...</p>
            </div>
        );
    }

    const FILTER_TABS = [
        { key: 'all', label: `All (${stats.all})` },
        { key: 'available', label: `Available (${stats.available})` },
        { key: 'upcoming', label: `Upcoming (${stats.upcoming})` },
        { key: 'completed', label: `Completed (${stats.completed})` },
    ];

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <FileText size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            My Exams
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                            Access and attempt exams from your enrolled courses.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Exams" value={stats.all} icon={FileText} iconBg="#E3DFF8" iconColor={C.btnPrimary} />
                <StatCard label="Available Now" value={stats.available} icon={PlayCircle} iconBg={C.successBg} iconColor={C.success} />
                <StatCard label="Upcoming" value={stats.upcoming} icon={Calendar} iconBg={C.warningBg} iconColor={C.warning} />
                <StatCard label="Completed" value={stats.completed} icon={CheckCircle} iconBg="rgba(79, 70, 229, 0.1)" iconColor="#4F46E5" />
            </div>

            {/* Main Area */}
            <div className="overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="p-5" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        
                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto custom-scrollbar pb-2 lg:pb-0">
                            {FILTER_TABS.map(({ key, label }) => {
                                const isActive = filter === key;
                                return (
                                    <button key={key} onClick={() => setFilter(key)}
                                        className="flex items-center gap-2 px-4 py-2 cursor-pointer border-none transition-all shrink-0"
                                        style={{
                                            backgroundColor: isActive ? C.btnPrimary : C.surfaceWhite,
                                            color: isActive ? '#fff' : C.textMuted,
                                            borderRadius: R.lg, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily,
                                            boxShadow: isActive ? S.card : 'none', border: isActive ? 'none' : `1px solid ${C.cardBorder}`
                                        }}>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search */}
                        <div className="relative w-full lg:w-72 shrink-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textMuted }} />
                            <input type="text" placeholder="Search exams..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ ...baseInputStyle, paddingLeft: '36px', height: '40px' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[900px]">
                        {/* Header Row */}
                        <div className="grid grid-cols-[40px_2.5fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            {['#', 'Exam Details', 'Duration', 'Questions', 'Status', 'Action'].map((h, i) => (
                                <span key={i} className={i === 5 ? 'text-right' : ''} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                            ))}
                        </div>

                        {/* List */}
                        {filteredExams.length > 0 ? (
                            <div className="flex flex-col">
                                {filteredExams.map((exam, idx) => {
                                    const status = getStatus(exam);
                                    const cfg = statusConfig[status] || statusConfig.available;
                                    const audienceInfo = getAudienceDisplay(exam);

                                    return (
                                        <div key={exam._id} className="grid grid-cols-[40px_2.5fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4 items-center transition-colors hover:bg-white/40" 
                                            style={{ borderBottom: idx !== filteredExams.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                            
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>{idx + 1}</span>
                                            
                                            <div className="min-w-0 pr-4">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <p className="truncate" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                                        {exam.title}
                                                    </p>
                                                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${audienceInfo.badgeClass}`}>
                                                        {audienceInfo.label}
                                                    </span>
                                                    {exam.isFree && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-md uppercase tracking-wider border border-emerald-200">Free</span>
                                                    )}
                                                </div>
                                                {exam.courseTitle && <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '0 0 2px 0' }}>{exam.courseTitle}</p>}
                                                <p className="truncate" style={{ fontSize: '10px', color: C.text, opacity: 0.5, margin: 0 }}>{audienceInfo.reason}</p>
                                            </div>

                                            <div className="flex items-center gap-1.5" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                <Timer size={14} color={C.textMuted} /> {exam.duration} mins
                                            </div>

                                            <div style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                {exam.totalQuestions || exam.questions?.length || '—'} Qs
                                            </div>

                                            <div>
                                                <span style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: R.full, textTransform: 'uppercase', backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                                                    {cfg.label}
                                                </span>
                                            </div>

                                            <div className="text-right">
                                                {status === 'available' ? (
                                                    <Link href={`/student/exams/${exam._id}/take`} className="text-decoration-none">
                                                        <button className="h-9 w-full rounded-xl cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                                            style={{ background: C.gradientBtn, color: '#fff', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                            Start Exam
                                                        </button>
                                                    </Link>
                                                ) : status === 'completed' ? (
                                                    <Link href={`/student/exams/${exam._id}/result${exam.lastAttemptId ? `?attemptId=${exam.lastAttemptId}` : ''}`} className="text-decoration-none">
                                                        <button className="h-9 w-full rounded-xl cursor-pointer transition-colors hover:bg-slate-50 shadow-sm"
                                                            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                            View Result
                                                        </button>
                                                    </Link>
                                                ) : status === 'upcoming' ? (
                                                    <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, display: 'block', textAlign: 'center', backgroundColor: '#E3DFF8', padding: '6px', borderRadius: R.md }}>
                                                        {new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.danger, display: 'block', textAlign: 'center', backgroundColor: C.dangerBg, padding: '6px', borderRadius: R.md, border: `1px solid ${C.dangerBorder}` }}>
                                                        Expired
                                                    </span>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA' }}>
                                <FileText size={48} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No exams found</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Enroll in courses or adjust your filters to see exams.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}