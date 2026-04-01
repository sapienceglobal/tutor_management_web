'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
    CheckCircle, XCircle, Home, RotateCcw, Award, Download,
    TrendingUp, Sparkles, Brain, FileText, ChevronDown, ChevronUp, Star, Target, Zap, AlertCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Custom Premium Colors for Result ─────────────────────────────────────────
const themeBg = '#dfdaf3';
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getStatus = (item) => {
    if (item?.status) return item.status;
    const hasAnswer = item?.selectedIndex !== undefined && item?.selectedIndex !== null && item?.selectedIndex >= 0;
    if (!hasAnswer) return 'unanswered';
    return item?.isCorrect ? 'correct' : 'incorrect';
};

const getOptionText = (option) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return option.text || '';
};

const getGradeInfo = (pct) => {
    if (pct >= 90) return { grade: 'A+', color: '#059669', bg: '#d1fae5', label: 'Outstanding' };
    if (pct >= 80) return { grade: 'A', color: '#059669', bg: '#d1fae5', label: 'Excellent' };
    if (pct >= 70) return { grade: 'B+', color: '#2563eb', bg: '#dbeafe', label: 'Very Good' };
    if (pct >= 60) return { grade: 'B', color: '#2563eb', bg: '#dbeafe', label: 'Good' };
    if (pct >= 50) return { grade: 'C', color: '#d97706', bg: '#fef3c7', label: 'Average' };
    return { grade: 'F', color: '#dc2626', bg: '#fee2e2', label: 'Needs Work' };
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function MetaChip({ label, value }) {
    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
            <span className="uppercase tracking-wider" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>{label}:</span>
            <span className="font-bold" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.heading }}>{value}</span>
        </div>
    );
}

function StatBox({ label, children, gradient }) {
    return (
        <div className={`rounded-2xl p-5 border transition-transform hover:-translate-y-1 shadow-sm`}
            style={gradient ? { background: 'linear-gradient(135deg, #1E1B4B, #4338CA)', borderColor: 'rgba(255,255,255,0.1)' } : { backgroundColor: outerCard, borderColor: C.cardBorder }}>
            <p className={`font-bold uppercase mb-2 tracking-wider`}
                style={{ fontFamily: T.fontFamily, fontSize: '10px', color: gradient ? 'rgba(255,255,255,0.6)' : C.textMuted }}>
                {label}
            </p>
            {children}
        </div>
    );
}

function StatusPill({ status }) {
    const cfg = {
        correct: { bg: '#d1fae5', color: '#059669', label: 'Correct', icon: CheckCircle },
        incorrect: { bg: '#fee2e2', color: '#dc2626', label: 'Incorrect', icon: XCircle },
        unanswered: { bg: innerBox, color: C.textMuted, label: 'Skipped', icon: AlertCircle },
    }[status] || { bg: innerBox, color: C.textMuted, label: status, icon: AlertCircle };
    
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap border"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '40', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <cfg.icon size={12} /> {cfg.label}
        </span>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function ExamResultPageClient() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attemptId');

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [detailedResults, setDetailedResults] = useState([]);
    const [examTitle, setExamTitle] = useState('');
    const [examData, setExamData] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [qFilter, setQFilter] = useState('all');

    useEffect(() => {
        const fetchResult = async () => {
            if (!attemptId) {
                router.push('/student/exams');
                return;
            }
            try {
                const res = await api.get(`/student/exams/attempt/${attemptId}`);
                if (res.data?.success) {
                    const attempt = res.data.attempt;
                    setResult(attempt);
                    setDetailedResults(Array.isArray(attempt.analysis) ? attempt.analysis : []);
                    setExamTitle(attempt.examTitle || '');
                    setExamData({ duration: attempt.duration || null, totalMarks: attempt.totalMarks });
                    if (attempt.isPassed) triggerConfetti();
                }
            } catch {
                toast.error('Failed to load result details');
                router.push('/student/exams');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [attemptId, router]);

    const triggerConfetti = () => {
        const end = Date.now() + 3000;
        const rand = (a, b) => Math.random() * (b - a) + a;
        const t = setInterval(() => {
            if (Date.now() > end) return clearInterval(t);
            confetti({ particleCount: 40, startVelocity: 30, spread: 360, origin: { x: rand(0.1, 0.9), y: rand(0.1, 0.5) } });
        }, 250);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{ backgroundColor: themeBg }}>
            <div className="relative w-12 h-12">
                <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#4F46E5] animate-pulse" />
                </div>
            </div>
            <p className="text-sm font-bold text-slate-500" style={{ fontFamily: T.fontFamily }}>Analyzing your results…</p>
        </div>
    );

    if (!result) return <div className="p-10 text-center text-slate-500 font-bold min-h-screen" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily }}>Result not found</div>;

    const isPassed = result.isPassed;
    const percentage = result.percentage || (result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0);
    const allResults = detailedResults || [];
    const correctCount = allResults.filter(i => getStatus(i) === 'correct').length;
    const incorrectCount = allResults.filter(i => getStatus(i) === 'incorrect').length;
    const unansweredCount = allResults.filter(i => getStatus(i) === 'unanswered').length;
    const hiddenAnswers = allResults.some(i => i.canViewCorrectAnswer === false);
    const hiddenSolutions = allResults.some(i => i.canViewSolution === false);
    const gradeInfo = getGradeInfo(percentage);
    const accuracy = allResults.length > 0 ? Math.round((correctCount / allResults.length) * 100) : 0;

    const filteredQuestions = allResults.filter(q => qFilter === 'all' || getStatus(q) === qFilter);

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily }}>
            {/* Removed max-w-6xl so it takes full available space with nice padding */}
            <div className="w-full space-y-6">

                {/* ── Breadcrumb & Actions ──────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Link href="/student/dashboard" className="hover:text-[#4F46E5] transition-colors flex items-center gap-1.5"><Home size={16}/> Home</Link>
                        <span className="text-slate-300">/</span>
                        <Link href="/student/exams" className="hover:text-[#4F46E5] transition-colors">Exams</Link>
                        <span className="text-slate-300">/</span>
                        <span style={{ color: C.heading }}>Scorecard</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => toast('Certificate download coming soon!')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                            <Award className="w-4 h-4 text-amber-500" /> Certificate
                        </button>
                        <button onClick={() => toast('Report download coming soon!')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                            <Download className="w-4 h-4 text-blue-500" /> Report
                        </button>
                        {!isPassed && (
                            <button onClick={() => router.push(`/student/exams/${params.id}/take`)}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:opacity-90"
                                style={{ background: C.gradientBtn }}>
                                <RotateCcw className="w-4 h-4" /> Retake Test
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Exam Header Card ───────────────────────────────────────── */}
                <div className="rounded-3xl p-6 md:p-8 shadow-sm border overflow-hidden relative" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: isPassed ? '#10b981' : '#ef4444' }} />
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-1">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border mt-1" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                <Award className="w-7 h-7 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black mb-3" style={{ color: C.heading }}>{examTitle}</h1>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <MetaChip label="Date" value={new Date(result.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} />
                                    <MetaChip label="Duration" value={`${examData?.duration || '-'} mins`} />
                                    <MetaChip label="Total Marks" value={result.totalMarks} />
                                    <MetaChip label="Attempt" value={`#${result.attemptNumber || 1}`} />
                                </div>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-black border shadow-sm shrink-0
                            ${isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            <span className={`w-3 h-3 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                            {isPassed ? 'STATUS: PASSED' : 'STATUS: FAILED'}
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards Row ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatBox label="Score Obtained">
                        <div className="flex items-end gap-1.5">
                            <span className="text-4xl font-black leading-none" style={{ color: C.heading }}>{result.score}</span>
                            <span className="text-sm font-bold text-slate-400 mb-0.5">/ {result.totalMarks}</span>
                        </div>
                    </StatBox>
                    <StatBox label="Percentage">
                        <span className={`text-4xl font-black leading-none ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>{percentage}%</span>
                        <p className={`text-xs mt-2 font-bold ${isPassed ? 'text-emerald-500' : 'text-red-400'}`}>
                            {isPassed ? '✓ Above cutoff' : '✕ Below cutoff'}
                        </p>
                    </StatBox>
                    <StatBox label="Accuracy">
                        <span className="text-4xl font-black leading-none" style={{ color: C.heading }}>{accuracy}%</span>
                        <p className="text-xs mt-2 font-bold text-slate-400">{correctCount} of {allResults.length} correct</p>
                    </StatBox>
                    <StatBox label="Grade">
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-3xl font-black px-4 py-1 rounded-xl border"
                                style={{ backgroundColor: gradeInfo.bg, color: gradeInfo.color, borderColor: gradeInfo.color }}>
                                {gradeInfo.grade}
                            </span>
                        </div>
                    </StatBox>
                    <StatBox label="Overall Status">
                        <div className={`flex items-center gap-2 mt-1 ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isPassed ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                            <span className="text-2xl font-black uppercase tracking-wide">{isPassed ? 'Passed' : 'Failed'}</span>
                        </div>
                    </StatBox>
                </div>

                {/* ── Main Layout Split ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Left 2/3 - Charts & Breakdown */}
                    <div className="xl:col-span-2 space-y-6">
                        
                        {/* Performance Analytics */}
                        <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                    <TrendingUp className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                </div>
                                <h2 className="text-xl font-black" style={{ color: C.heading }}>Performance Analytics</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    {/* 3-box counts */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Correct', count: correctCount, bg: '#d1fae5', color: '#059669', border: '#a7f3d0' },
                                            { label: 'Incorrect', count: incorrectCount, bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
                                            { label: 'Skipped', count: unansweredCount, bg: innerBox, color: C.textMuted, border: C.cardBorder },
                                        ].map(b => (
                                            <div key={b.label} className="rounded-2xl p-4 text-center border transition-transform hover:-translate-y-1"
                                                style={{ background: b.bg, borderColor: b.border }}>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: b.color, marginBottom: 6 }}>
                                                    {b.label}
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: b.color, lineHeight: 1 }}>{b.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>Score Progress</span>
                                            <span className={`text-xs font-black ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>{percentage}%</span>
                                        </div>
                                        <div className="h-3 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: innerBox }}>
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                                className="h-full rounded-full"
                                                style={{ background: isPassed ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f97316)' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center">
                                    <div className="relative w-44 h-44">
                                        <svg className="w-full h-full -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={innerBox} strokeWidth="3" />
                                            <motion.path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none" stroke={isPassed ? '#10b981' : '#ef4444'} strokeWidth="3.5" strokeLinecap="round"
                                                initial={{ strokeDasharray: '0, 100' }} animate={{ strokeDasharray: `${percentage}, 100` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black leading-none" style={{ color: C.heading }}>{result.score}</span>
                                            <span className="text-sm font-bold mt-1" style={{ color: C.textMuted }}>out of {result.totalMarks}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Question Review (Flexbox / Grid Layout - NO HORIZONTAL SCROLL) */}
                        <div className="rounded-3xl shadow-sm border overflow-hidden" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                            
                            {/* Review Header & Filters */}
                            <div className="px-6 py-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm">
                                        <FileText className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black" style={{ color: C.heading }}>Question Review</h2>
                                        {(hiddenAnswers || hiddenSolutions) && (
                                            <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.warning, margin: '2px 0 0 0' }}>Some answers/solutions are hidden.</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Smart Correct/Wrong Filter */}
                                <div className="flex p-1 rounded-xl shrink-0" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'correct', label: 'Correct' },
                                        { id: 'incorrect', label: 'Incorrect' },
                                        { id: 'unanswered', label: 'Skipped' }
                                    ].map(f => (
                                        <button key={f.id} onClick={() => setQFilter(f.id)}
                                            className="px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all"
                                            style={qFilter === f.id 
                                                ? { backgroundColor: C.btnPrimary, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } 
                                                : { color: C.textMuted, backgroundColor: 'transparent' }}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Questions List Area */}
                            <div className="p-4 space-y-4">
                                {filteredQuestions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.textMuted }}>No questions match this filter.</p>
                                    </div>
                                ) : (
                                    filteredQuestions.map((item, idx) => {
                                        const status = getStatus(item);
                                        const selectedAnswer = item.selectedAnswerText || getOptionText(item.options?.[item.selectedIndex]) || 'Not Answered';
                                        const correctAnswer = item.canViewCorrectAnswer
                                            ? (item.correctAnswerText || getOptionText(item.options?.[item.correctIndex]) || '—')
                                            : 'Hidden by Instructor';
                                        const isExpanded = expandedRow === item._id || expandedRow === idx;

                                        // Left border color for quick visual
                                        const rowBorderColor = status === 'correct' ? '#10b981' : status === 'incorrect' ? '#ef4444' : C.cardBorder;

                                        return (
                                            <div key={item._id || idx} className="rounded-2xl transition-colors border overflow-hidden"
                                                style={{ backgroundColor: isExpanded ? C.surfaceWhite : innerBox, borderColor: C.cardBorder, borderLeft: `6px solid ${rowBorderColor}` }}>
                                                
                                                {/* Visible Row Header (Flex wrapping ensures no horizontal scroll) */}
                                                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:bg-white/40 transition-colors"
                                                    onClick={() => setExpandedRow(isExpanded ? null : (item._id || idx))}>
                                                    
                                                    {/* Q Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: C.btnPrimary }}>Q{item.questionNumber || idx + 1}</span>
                                                            <StatusPill status={status} />
                                                        </div>
                                                        <p className="font-bold leading-snug" style={{ fontSize: T.size.sm, color: C.heading }}>
                                                            {item.question}
                                                        </p>
                                                    </div>

                                                    {/* Score & Button Area */}
                                                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-none" style={{ borderColor: C.cardBorder }}>
                                                        <div className="text-left md:text-right">
                                                            <span className="text-lg font-black" style={{ color: item.pointsEarned > 0 ? C.success : C.textMuted }}>{item.pointsEarned}</span>
                                                            <span className="text-xs font-bold" style={{ color: C.textMuted }}> / {item.pointsPossible} pts</span>
                                                        </div>
                                                        <button className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                                                            style={isExpanded 
                                                                ? { backgroundColor: C.btnPrimary, color: '#fff', fontSize: '11px', fontWeight: T.weight.bold }
                                                                : { backgroundColor: C.surfaceWhite, color: C.textMuted, border: `1px solid ${C.cardBorder}`, fontSize: '11px', fontWeight: T.weight.bold }}>
                                                            {isExpanded ? 'Hide' : 'Review'}
                                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Animated Explanation Block (Your signature red/green style) */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                            className="border-t" style={{ borderColor: C.cardBorder }}>
                                                            <div className="p-5 md:p-6" style={{ backgroundColor: C.surfaceWhite }}>
                                                                
                                                                {/* Answer Comparison Boxes */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                                    {/* Your Answer */}
                                                                    <div className="p-4 rounded-xl border" style={{ backgroundColor: status === 'correct' ? C.successBg : status === 'incorrect' ? C.dangerBg : innerBox, borderColor: status === 'correct' ? C.successBorder : status === 'incorrect' ? C.dangerBorder : C.cardBorder }}>
                                                                        <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: status === 'correct' ? C.success : status === 'incorrect' ? C.danger : C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Your Answer</p>
                                                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: status === 'correct' ? '#065F46' : status === 'incorrect' ? '#7F1D1D' : C.heading, lineHeight: 1.5 }}>
                                                                            {selectedAnswer}
                                                                        </p>
                                                                    </div>
                                                                    {/* Correct Answer */}
                                                                    <div className="p-4 rounded-xl border shadow-sm" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                                        <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Correct Answer / Feedback</p>
                                                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: item.canViewCorrectAnswer ? C.btnPrimary : C.textMuted, lineHeight: 1.5 }}>
                                                                            {item.aiFeedback || correctAnswer}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Solution Explanation (If available) */}
                                                                {item.canViewSolution && item.solutionText && (
                                                                    <div className="flex items-start gap-3 p-5 rounded-xl border" style={{ backgroundColor: innerBox, borderColor: `rgba(90,114,212,0.2)` }}>
                                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white shadow-sm mt-0.5">
                                                                            <Sparkles className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                                                        </div>
                                                                        <div>
                                                                            <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Solution Explanation</p>
                                                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                                                                                {item.solutionText}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right 1/3 - Recommendations & Actions */}
                    <div className="space-y-6">
                        
                        {/* Perfect Score Celebration */}
                        {allResults.length > 0 && incorrectCount === 0 && unansweredCount === 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                className="rounded-3xl p-8 text-center relative overflow-hidden shadow-lg border border-emerald-400"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <div className="absolute -right-6 -top-6 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    <div className="text-5xl mb-4">🏆</div>
                                    <h3 className="text-2xl font-black text-white tracking-wide">Flawless Victory!</h3>
                                    <p className="text-sm font-bold text-emerald-100 mt-2">100% Accuracy. Outstanding work.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Weakness / Insights */}
                        {(incorrectCount > 0 || unansweredCount > 0) && (
                            <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <Target className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>Areas to Improve</h3>
                                </div>
                                <div className="space-y-3">
                                    {incorrectCount > 0 && (
                                        <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
                                            <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0 shadow-sm" style={{ backgroundColor: C.danger }}>{incorrectCount}</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Incorrect answers need review</span>
                                        </div>
                                    )}
                                    {unansweredCount > 0 && (
                                        <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                            <span className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 text-lg font-black shrink-0 shadow-sm">{unansweredCount}</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Questions left unattempted</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI Recommendation Box */}
                        <div className="relative rounded-3xl p-8 overflow-hidden shadow-xl border border-white/10"
                            style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)' }}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 pointer-events-none" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-5 border border-white/20 shadow-inner">
                                    <Brain className="w-6 h-6 text-amber-300" />
                                </div>
                                <h2 className="text-xl font-black text-white mb-3">AI Next Steps</h2>
                                <div className="space-y-4 mb-8">
                                    {isPassed ? (
                                        <div className="flex items-start gap-3 p-4 bg-white/10 rounded-xl border border-white/5 shadow-sm">
                                            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                            <span className="text-sm font-medium text-white/90 leading-relaxed">Strong performance! You are ready to move on to the next module.</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 p-4 bg-white/10 rounded-xl border border-white/5 shadow-sm">
                                            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                            <span className="text-sm font-medium text-white/90 leading-relaxed">Review incorrect answers and practice weak topics with the AI Tutor.</span>
                                        </div>
                                    )}
                                </div>
                                <Link href="/student/ai-analytics" className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white text-indigo-900 transition-transform hover:scale-[1.02] shadow-[0_8px_20px_rgba(255,255,255,0.2)] text-base font-black">
                                    <Sparkles className="w-5 h-5" /> Go to AI Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function ExamResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#dfdaf3]" />}>
            <ExamResultPageClient />
        </Suspense>
    );
}