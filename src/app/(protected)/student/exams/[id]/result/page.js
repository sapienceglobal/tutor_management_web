'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
    CheckCircle, XCircle, Home, RotateCcw, Award, Download,
    TrendingUp, Sparkles, Brain, FileText, ChevronDown, ChevronUp, Star, Target, Zap
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

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
    if (pct >= 90) return { grade: 'A+', color: '#10b981', bg: '#ecfdf5', label: 'Outstanding' };
    if (pct >= 80) return { grade: 'A',  color: '#10b981', bg: '#ecfdf5', label: 'Excellent' };
    if (pct >= 70) return { grade: 'B+', color: '#3b82f6', bg: '#eff6ff', label: 'Very Good' };
    if (pct >= 60) return { grade: 'B',  color: '#3b82f6', bg: '#eff6ff', label: 'Good' };
    if (pct >= 50) return { grade: 'C',  color: '#f59e0b', bg: '#fffbeb', label: 'Average' };
    return               { grade: 'D',  color: '#ef4444', bg: '#fef2f2', label: 'Needs Work' };
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function MetaChip({ label, value }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs">{label}:</span>
            <span className="text-slate-600 text-xs font-semibold">{value}</span>
        </div>
    );
}

function StatBox({ label, children, gradient }) {
    return (
        <div className={`rounded-2xl p-4 border shadow-sm ${gradient ? 'border-[var(--theme-primary)]/20 text-white' : 'bg-white border-slate-100'}`}
            style={gradient ? { background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' } : {}}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.08em] mb-1.5 ${gradient ? 'text-[var(--theme-primary)]/70' : 'text-slate-400'}`}>
                {label}
            </p>
            {children}
        </div>
    );
}

function StatusPill({ status }) {
    const cfg = {
        correct:    { bg: '#ecfdf5', color: '#059669', label: 'Correct' },
        incorrect:  { bg: '#fef2f2', color: '#dc2626', label: 'Incorrect' },
        unanswered: { bg: 'var(--theme-background)', color: '#94a3b8', label: 'Skipped' },
    }[status] || { bg: 'var(--theme-background)', color: '#94a3b8', label: status };
    return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full whitespace-nowrap"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.label}
        </span>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function ExamResultPageClient() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attemptId');
    const examId = params.id;

    const [loading, setLoading]                 = useState(true);
    const [result, setResult]                   = useState(null);
    const [detailedResults, setDetailedResults] = useState([]);
    const [examTitle, setExamTitle]             = useState('');
    const [examData, setExamData]               = useState(null);
    const [expandedRow, setExpandedRow]         = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!attemptId) { setLoading(false); return; }
            try {
                const res = await api.get(`/exams/attempt/${attemptId}`);
                if (res.data.success) {
                    setResult(res.data.attempt);
                    setDetailedResults(Array.isArray(res.data.detailedResults) ? res.data.detailedResults : []);
                    setExamTitle(res.data.exam?.title || '');
                    setExamData(res.data.exam || null);
                    if (res.data.attempt?.isPassed) triggerConfetti();
                }
            } catch {
                toast.error('Failed to load result details');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [attemptId]);

    const triggerConfetti = () => {
        const end = Date.now() + 3000;
        const rand = (a, b) => Math.random() * (b - a) + a;
        const t = setInterval(() => {
            if (Date.now() > end) return clearInterval(t);
            confetti({ particleCount: 40, startVelocity: 30, spread: 360, origin: { x: rand(0.1, 0.9), y: rand(0.1, 0.5) } });
        }, 250);
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                    </div>
                </div>
                <p className="text-sm text-slate-400 font-medium">Calculating Results…</p>
            </div>
        </div>
    );

    if (!result) return <div className="p-10 text-center text-slate-400 text-sm">Result not found</div>;

    const isPassed          = result.isPassed;
    const percentage        = result.percentage || (result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0);
    const allResults        = detailedResults || [];
    const correctCount      = allResults.filter(i => getStatus(i) === 'correct').length;
    const incorrectCount    = allResults.filter(i => getStatus(i) === 'incorrect').length;
    const unansweredCount   = allResults.filter(i => getStatus(i) === 'unanswered').length;
    const hiddenAnswers     = allResults.some(i => i.canViewCorrectAnswer === false);
    const hiddenSolutions   = allResults.some(i => i.canViewSolution === false);
    const gradeInfo         = getGradeInfo(percentage);
    const accuracy          = allResults.length > 0 ? Math.round((correctCount / allResults.length) * 100) : 0;

    return (
        <div className="space-y-4 pb-10" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Breadcrumb + actions ─────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Link href="/student/dashboard" className="hover:text-[var(--theme-primary)] transition-colors">Home</Link>
                    <span className="text-slate-300">›</span>
                    <Link href="/student/exams" className="hover:text-[var(--theme-primary)] transition-colors">Tests</Link>
                    <span className="text-slate-300">›</span>
                    <span className="font-semibold text-slate-700">Test Results</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => toast('Certificate download coming soon!')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                        <Download className="w-3.5 h-3.5" /> Certificate
                    </button>
                    <button onClick={() => toast('Report download coming soon!')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                        <Download className="w-3.5 h-3.5" /> Report
                    </button>
                    {!isPassed && (
                        <button onClick={() => router.push(`/student/exams/${examId}`)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                            <RotateCcw className="w-3.5 h-3.5" /> Retake Test
                        </button>
                    )}
                </div>
            </div>

            {/* ── Exam header card ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <Award className="w-5 h-5 text-[var(--theme-primary)]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 mb-1.5">{examTitle}</h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                <MetaChip label="Date" value={new Date(result.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} />
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <MetaChip label="Duration" value={`${examData?.duration || '-'} mins`} />
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <MetaChip label="Total Marks" value={result.totalMarks} />
                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                <MetaChip label="Attempt" value={`#${result.attemptNumber || 1}`} />
                            </div>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border
                        ${isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {isPassed ? `Passed · ${result.score} / ${result.totalMarks}` : `Failed · ${result.score} / ${result.totalMarks}`}
                    </div>
                </div>
            </div>

            {/* ── Stat cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatBox label="Score Obtained">
                    <div className="flex items-end gap-1">
                        <span className="text-2xl font-black text-slate-800">{result.score}</span>
                        <span className="text-sm text-slate-400 font-medium mb-0.5">/ {result.totalMarks}</span>
                    </div>
                </StatBox>

                <StatBox label="Percentage">
                    <span className={`text-2xl font-black ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>{percentage}%</span>
                    <p className={`text-[11px] mt-0.5 font-medium ${isPassed ? 'text-emerald-500' : 'text-red-400'}`}>
                        {isPassed ? 'Above cutoff' : 'Below cutoff'}
                    </p>
                </StatBox>

                <StatBox label="Accuracy">
                    <span className="text-2xl font-black text-slate-800">{accuracy}%</span>
                    <p className="text-[11px] mt-0.5 font-medium text-slate-400">{correctCount} of {allResults.length}</p>
                </StatBox>

                <StatBox label="Grade">
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xl font-black px-2 py-0.5 rounded-xl"
                            style={{ background: gradeInfo.bg, color: gradeInfo.color }}>
                            {gradeInfo.grade}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{gradeInfo.label}</span>
                    </div>
                </StatBox>

                <StatBox label="Status">
                    <div className={`flex items-center gap-1.5 mt-0.5 ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isPassed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="text-lg font-black">{isPassed ? 'Passed' : 'Failed'}</span>
                    </div>
                </StatBox>
            </div>

            {/* ── Main grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* ── Left 2/3 ─────────────────────────────────────────────── */}
                <div className="xl:col-span-2 space-y-4">

                    {/* Performance Analytics */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-[var(--theme-primary)]" />
                            </div>
                            <h2 className="text-base font-bold text-slate-800">Performance Analytics</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left: breakdown */}
                            <div className="space-y-4">
                                {/* 3-box counts */}
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[
                                        { label: 'Correct',   count: correctCount,    bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
                                        { label: 'Incorrect', count: incorrectCount,  bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
                                        { label: 'Skipped',   count: unansweredCount, bg: 'var(--theme-background)', color: '#64748b', border: '#e2e8f0' },
                                    ].map(b => (
                                        <div key={b.label} className="rounded-2xl p-3 text-center border"
                                            style={{ background: b.bg, borderColor: b.border }}>
                                            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: b.color }}>{b.label}</p>
                                            <p className="text-2xl font-black" style={{ color: b.color }}>{b.count}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Score progress bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                                        <span>Score Progress</span>
                                        <span className={isPassed ? 'text-emerald-600' : 'text-red-500'}>{percentage}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ background: isPassed
                                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                : 'linear-gradient(90deg, #ef4444, #f97316)' }}
                                        />
                                    </div>
                                </div>

                                {/* Mini bars */}
                                {allResults.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        {[
                                            { label: 'Correct',   count: correctCount,    color: '#10b981' },
                                            { label: 'Incorrect', count: incorrectCount,  color: '#ef4444' },
                                            { label: 'Skipped',   count: unansweredCount, color: '#cbd5e1' },
                                        ].map(b => (
                                            <div key={b.label} className="flex items-center gap-3">
                                                <span className="w-16 text-xs text-slate-500 font-medium shrink-0">{b.label}</span>
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${allResults.length > 0 ? (b.count / allResults.length) * 100 : 0}%` }}
                                                        transition={{ duration: 0.8, delay: 0.6 }}
                                                        className="h-full rounded-full"
                                                        style={{ background: b.color }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 w-5 text-right shrink-0">{b.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: SVG ring */}
                            <div className="flex items-center justify-center">
                                <div className="relative w-36 h-36">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none" stroke="#e8e4ff" strokeWidth="3" />
                                        <motion.path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={isPassed ? '#10b981' : '#ef4444'}
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            initial={{ strokeDasharray: '0, 100' }}
                                            animate={{ strokeDasharray: `${percentage}, 100` }}
                                            transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
                                        <span className="text-2xl font-black text-slate-800 leading-tight">
                                            {result.score}
                                            <span className="text-sm text-slate-400 font-medium">/{result.totalMarks}</span>
                                        </span>
                                        <span className={`text-base font-black ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Perfect score banner */}
                    {allResults.length > 0 && incorrectCount === 0 && unansweredCount === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-2xl p-5 border border-emerald-200 text-center overflow-hidden relative"
                            style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-200/30 rounded-full" />
                            <div className="relative">
                                <div className="text-3xl mb-1">🎉</div>
                                <h3 className="text-base font-black text-emerald-800">Perfect Score!</h3>
                                <p className="text-sm text-emerald-600 mt-1">You answered all questions correctly. Exceptional work!</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Question Review table */}
                    {allResults.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-[var(--theme-primary)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">Question Review</h2>
                                        {(hiddenAnswers || hiddenSolutions) && (
                                            <p className="text-[11px] text-amber-600 mt-0.5">
                                                {hiddenAnswers && 'Answer key hidden for some questions. '}
                                                {hiddenSolutions && 'Solution hidden for some questions.'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-100">
                                            {['Q.No', 'Question', 'Status', 'Your Answer', 'Correct Answer', 'Marks', 'Action'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allResults.map((item, idx) => {
                                            const status        = getStatus(item);
                                            const selectedAnswer = item.selectedAnswerText || getOptionText(item.options?.[item.selectedIndex]) || '—';
                                            const correctAnswer  = item.canViewCorrectAnswer
                                                ? (item.correctAnswerText || getOptionText(item.options?.[item.correctIndex]) || '—')
                                                : 'Hidden';
                                            const isExpanded = expandedRow === idx;
                                            const hasSolution = item.canViewSolution && item.solutionText;
                                            const leftBorder = status === 'correct' ? '#10b981' : status === 'incorrect' ? '#ef4444' : '#e2e8f0';

                                            return (
                                                <React.Fragment key={item.questionId || idx}>
                                                    <tr
                                                        style={{ borderLeft: `3px solid ${leftBorder}` }}
                                                        className={`border-b border-slate-50 transition-colors ${isExpanded ? 'bg-[var(--theme-primary)]/20/40' : 'hover:bg-slate-50/60'}`}>
                                                        <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">
                                                            Q{item.questionNumber || idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-slate-700 max-w-[180px]">
                                                            <p className="truncate font-medium">{item.question}</p>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <StatusPill status={status} />
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px]">
                                                            <p className="truncate font-medium">{selectedAnswer}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs max-w-[120px]">
                                                            <p className={`truncate font-semibold ${item.canViewCorrectAnswer ? 'text-emerald-700' : 'text-slate-300 italic'}`}>
                                                                {correctAnswer}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs font-bold whitespace-nowrap">
                                                            <span className={item.pointsEarned > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                                                                {item.pointsEarned}
                                                            </span>
                                                            <span className="text-slate-300"> / {item.pointsPossible}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {hasSolution ? (
                                                                <button
                                                                    onClick={() => setExpandedRow(isExpanded ? null : idx)}
                                                                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all
                                                                        ${isExpanded
                                                                            ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)]'
                                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                                    {isExpanded ? 'Hide' : 'Solution'}
                                                                </button>
                                                            ) : (
                                                                <span className="text-[11px] text-slate-300 italic">Hidden</span>
                                                            )}
                                                        </td>
                                                    </tr>

                                                    {/* Inline solution expansion */}
                                                    <AnimatePresence>
                                                        {isExpanded && hasSolution && (
                                                            <motion.tr
                                                                key={`sol-${idx}`}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                className="border-b border-[var(--theme-primary)]/30">
                                                                <td colSpan={7} className="px-6 py-4 bg-[var(--theme-primary)]/20/60">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-6 h-6 bg-[var(--theme-primary)]/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                                                            <Sparkles className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-[var(--theme-primary)] uppercase tracking-wider mb-1">Solution Explanation</p>
                                                                            <p className="text-sm text-slate-700 leading-relaxed">{item.solutionText}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </motion.tr>
                                                        )}
                                                    </AnimatePresence>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right sidebar ────────────────────────────────────────── */}
                <div className="space-y-4">

                    {/* Question Analysis */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                                <Target className="w-4 h-4 text-[var(--theme-primary)]" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Question Analysis</h3>
                        </div>
                        <div className="space-y-2">
                            {isPassed ? (
                                <>
                                    <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="text-xs font-medium text-slate-700">Strong performance overall</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <Star className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="text-xs font-medium text-slate-700">Excellent accuracy rate</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2.5 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                                        <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-xs font-medium text-slate-700">Room for improvement</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-xs font-medium text-slate-700">Review incorrect answers</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Weakness */}
                    {(incorrectCount > 0 || unansweredCount > 0) && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-7 h-7 bg-red-50 rounded-xl flex items-center justify-center">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">Weakness</h3>
                            </div>
                            <div className="space-y-2">
                                {incorrectCount > 0 && (
                                    <div className="flex items-center gap-2.5 p-2.5 bg-red-50 border border-red-100 rounded-xl">
                                        <span className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                            {incorrectCount}
                                        </span>
                                        <span className="text-xs font-medium text-slate-600">incorrect questions</span>
                                    </div>
                                )}
                                {unansweredCount > 0 && (
                                    <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                                        <span className="w-6 h-6 rounded-lg bg-slate-400 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                            {unansweredCount}
                                        </span>
                                        <span className="text-xs font-medium text-slate-600">unanswered questions</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Recommendation */}
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-[var(--theme-primary)]/20 relative"
                        style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' }}>
                        {/* dot grid */}
                        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        {/* glow */}
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[var(--theme-accent)]/20 blur-2xl pointer-events-none" />

                        <div className="relative p-5">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-7 h-7 bg-white/15 rounded-xl flex items-center justify-center">
                                    <Brain className="w-4 h-4 text-[var(--theme-primary)]/70" />
                                </div>
                                <h3 className="text-sm font-bold text-white">AI Recommendation</h3>
                            </div>

                            <div className="space-y-2 mb-4">
                                {isPassed ? (
                                    <div className="flex items-center gap-2 p-2.5 bg-white/10 rounded-xl">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-xs text-[var(--theme-primary)]/70 font-medium">Move on to next module</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 p-2.5 bg-white/10 rounded-xl">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span className="text-xs text-[var(--theme-primary)]/70 font-medium">Practice similar questions</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2.5 bg-white/10 rounded-xl">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span className="text-xs text-[var(--theme-primary)]/70 font-medium">Revise weak topics with AI Tutor</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Link href="/student/ai-analytics"
                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-colors">
                                <Sparkles className="w-3.5 h-3.5" /> Generate AI Study Plan
                            </Link>
                        </div>
                    </div>

                    {/* CTA buttons */}
                    <div className="space-y-2.5">
                        <button onClick={() => router.push('/student/dashboard')}
                            className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-bold rounded-2xl transition-all"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                            <Home className="w-4 h-4" /> Back to Dashboard
                        </button>
                        {!isPassed && (
                            <button onClick={() => router.push(`/student/exams/${examId}`)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-2xl transition-colors">
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ExamResultPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh]" />}>
            <ExamResultPageClient />
        </Suspense>
    );
}