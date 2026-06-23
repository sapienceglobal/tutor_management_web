'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Trophy, Users, CheckCircle, XCircle, Clock,
    Search, Download, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
    Minus, Calendar, Eye, BarChart3, FileQuestion, Loader2, X
} from 'lucide-react';
import api from '@/lib/axios';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';
import AttemptDetailsModal from '@/components/tutor/AttemptDetailsModal';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1px solid ${C.cardBorder}`,
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

export default function ExamResultsPage({ params }) {
    const { examId } = use(params);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStudents, setExpandedStudents] = useState(new Set());
    const [selectedAttemptId, setSelectedAttemptId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/exams/${examId}/all-attempts`);
                if (res?.data?.success) setData(res.data);
            } catch (error) {
                console.error('Error fetching results:', error);
            } finally {
                setLoading(false);
            }
        };
        if (examId) fetchData();
    }, [examId]);

    const toggleStudentExpansion = (studentId) => {
        const newExpanded = new Set(expandedStudents);
        if (newExpanded.has(studentId)) newExpanded.delete(studentId);
        else newExpanded.add(studentId);
        setExpandedStudents(newExpanded);
    };

    const getScoreTrend = (attempts) => {
        if (attempts.length < 2) return null;
        const sorted = [...attempts].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
        const diff = sorted[sorted.length - 1].percentage - sorted[0].percentage;
        if (diff > 5) return { icon: TrendingUp, color: C.success, label: 'Improving' };
        if (diff < -5) return { icon: TrendingDown, color: C.danger, label: 'Declining' };
        return { icon: Minus, color: C.textMuted, label: 'Stable' };
    };

    const filteredStudents = data?.attempts.filter(item =>
        item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading results...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <p style={{ color: C.danger, fontSize: T.size.md, fontWeight: T.weight.bold }}>Error loading results</p>
                <Link href="/tutor/quizzes" className="text-decoration-none">
                    <button className="px-5 py-2 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-md"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        Go Back
                    </button>
                </Link>
            </div>
        );
    }

    const { exam, overallStats } = data;

    const statsConfig = [
        { label: 'Average Score', value: `${overallStats.averageScore}%`, sub: 'Class average', icon: Trophy, color: C.warning, bg: C.warningBg },
        { label: 'Pass Rate', value: `${overallStats.passRate}%`, sub: `${overallStats.passedCount} students passed`, icon: CheckCircle, color: C.success, bg: C.successBg },
        { label: 'Total Attempts', value: overallStats.totalAttempts, sub: `Across ${overallStats.uniqueStudents} students`, icon: Clock, color: C.danger, bg: C.dangerBg },
        { label: 'Unique Students', value: overallStats.uniqueStudents, sub: 'Participated', icon: Users, color: C.btnPrimary, bg: C.innerBg },
    ];

    return (
        <div className="w-full min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <Link href="/tutor/quizzes" className="text-decoration-none">
                        <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                            style={{ backgroundColor: C.innerBg, borderRadius: R.full }}>
                            <ArrowLeft size={18} color={C.heading} />
                        </button>
                    </Link>
                    <div>
                        <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            <BarChart3 size={20} color={C.btnPrimary} /> {exam.title}
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>Performance Overview & Student Results</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Link href={`/tutor/quizzes/re-evaluations?examId=${examId}`} className="text-decoration-none flex-1 md:flex-none">
                        <button className="w-full flex items-center justify-center h-10 px-4 gap-2 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-md"
                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <FileQuestion size={16} /> Re-evaluation Queue
                        </button>
                    </Link>
                    <button className="flex-1 md:flex-none flex items-center justify-center h-10 px-4 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsConfig.map((stat, i) => (
                    <StatCard
                        key={i}
                        label={stat.label}
                        value={stat.value}
                        subtext={stat.sub}
                        icon={stat.icon}
                        iconBg={stat.bg}
                        iconColor={stat.color}
                    />
                ))}
            </div>

            {/* Students Table */}
            <div className="p-5 overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Student Performance</h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                        <input placeholder="Search student..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...baseInputStyle, paddingLeft: '36px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-[40px_2.5fr_1fr_1.5fr_1.5fr_1fr_100px] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            {['', 'Student', 'Attempts', 'Best Score', 'Trend', 'Status', 'Actions'].map((h, i) => (
                                <span key={i} className={i === 2 || i === 3 || i === 4 || i === 5 ? 'text-center' : i === 6 ? 'text-right' : ''} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                            ))}
                        </div>

                        {filteredStudents.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {filteredStudents.map((item) => {
                                    const trend = getScoreTrend(item.attempts);
                                    const isExpanded = expandedStudents.has(item.student._id);
                                    const sortedAttempts = [...item.attempts].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

                                    return (
                                        <div key={item.student._id} className="flex flex-col transition-colors hover:opacity-90" style={{ backgroundColor: C.innerBg, borderRadius: R.xl }}>
                                            <div className="grid grid-cols-[40px_2.5fr_1fr_1.5fr_1.5fr_1fr_100px] gap-4 px-4 py-3 items-center">
                                                <button onClick={() => toggleStudentExpansion(item.student._id)} className="w-8 h-8 flex items-center justify-center cursor-pointer border-none bg-transparent hover:opacity-70" style={{ borderRadius: R.sm }}>
                                                    {isExpanded ? <ChevronUp size={16} color={C.heading} /> : <ChevronDown size={16} color={C.textMuted} />}
                                                </button>
                                                
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: C.gradientBtn, color: '#fff', borderRadius: R.full, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                                        {item.student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{item.student.name}</p>
                                                        <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{item.student.email}</p>
                                                    </div>
                                                </div>

                                                <div className="text-center">
                                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, backgroundColor: C.surfaceWhite, padding: '2px 10px', borderRadius: R.full, border: `1px solid ${C.cardBorder}` }}>
                                                        {item.totalAttempts}
                                                    </span>
                                                </div>

                                                <div className="text-center flex flex-col items-center">
                                                    <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, lineHeight: 1 }}>{item.bestScore}</span>
                                                    <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>/ {exam.totalMarks || exam.passingMarks}</span>
                                                </div>

                                                <div className="text-center">
                                                    {trend && (
                                                        <div className="inline-flex items-center gap-1.5" style={{ color: trend.color, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                                            <trend.icon size={14} /> {trend.label}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-center">
                                                    <span style={{ 
                                                        fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: R.md, textTransform: 'uppercase',
                                                        backgroundColor: item.passed ? C.successBg : C.dangerBg, 
                                                        color: item.passed ? C.success : C.danger, 
                                                        border: `1px solid ${item.passed ? C.successBorder : C.dangerBorder}`
                                                    }}>
                                                        {item.passed ? 'Passed' : 'Failed'}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <button onClick={() => toggleStudentExpansion(item.student._id)} className="px-3 py-1.5 cursor-pointer border-none transition-opacity hover:opacity-80 w-full"
                                                        style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                                        {isExpanded ? 'Hide' : 'View'}
                                                    </button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-4" style={{ backgroundColor: C.surfaceWhite, borderTop: `1px solid ${C.cardBorder}`, borderBottomLeftRadius: R.xl, borderBottomRightRadius: R.xl }}>
                                                    <h4 className="flex items-center gap-2 mb-3" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: '0 0 12px 0' }}>
                                                        <Calendar size={16} color={C.btnPrimary} /> Attempt History ({sortedAttempts.length} total)
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {sortedAttempts.map((attempt) => (
                                                            <div key={attempt._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 transition-colors hover:opacity-90"
                                                                style={{ backgroundColor: C.innerBg, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                                                
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0"
                                                                        style={{ backgroundColor: attempt.isPassed ? C.success : C.textMuted, color: '#fff', borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.black }}>
                                                                        #{attempt.attemptNumber}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{attempt.percentage}%</span>
                                                                            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>({attempt.score}/{exam.totalMarks || exam.passingMarks})</span>
                                                                            <span style={{ 
                                                                                fontSize: '9px', fontWeight: T.weight.black, padding: '2px 6px', borderRadius: R.md, textTransform: 'uppercase',
                                                                                backgroundColor: attempt.isPassed ? C.successBg : C.dangerBg, 
                                                                                color: attempt.isPassed ? C.success : C.danger, 
                                                                                border: `1px solid ${attempt.isPassed ? C.successBorder : C.dangerBorder}`
                                                                            }}>
                                                                                {attempt.isPassed ? 'Passed' : 'Failed'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 flex-wrap">
                                                                            <span className="flex items-center gap-1" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                                                                <Calendar size={10} /> {new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                            <span className="flex items-center gap-1" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                                                                <Clock size={10} /> {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <button onClick={() => setSelectedAttemptId(attempt._id)} className="flex items-center justify-center gap-1.5 h-8 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 w-full sm:w-auto"
                                                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.card }}>
                                                                    <Eye size={12} /> View Details
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 flex flex-col items-center">
                                <Users size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No students found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Attempt Details Modal */}
            {selectedAttemptId && (
                <AttemptDetailsModal attemptId={selectedAttemptId} examTitle={exam.title} onClose={() => setSelectedAttemptId(null)} />
            )}
        </div>
    );
}