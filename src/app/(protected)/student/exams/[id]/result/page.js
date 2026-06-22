'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
    MdCheckCircle, MdCancel, MdHome, MdReplay, MdEmojiEvents, MdDownload, MdPrint,
    MdTrendingUp, MdAutoAwesome, MdArticle, MdKeyboardArrowDown, 
    MdKeyboardArrowUp, MdStar, MdTrackChanges, MdErrorOutline, 
    MdClose, MdChatBubbleOutline, MdInsertChartOutlined, MdMenuBook, MdWarning, MdSend
} from 'react-icons/md';
import { Loader2 } from 'lucide-react'; // Loader ke liye spinner
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';
import { Modal } from '@/components/ui/modal';

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
        <div className="flex items-center gap-1.5 px-3 py-1.5 border" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, borderRadius: '8px' }}>
            <span className="uppercase tracking-wider" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>{label}:</span>
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{value}</span>
        </div>
    );
}

function StatusPill({ status }) {
    const cfg = {
        correct: { bg: '#d1fae5', color: '#059669', label: 'Correct', icon: MdCheckCircle },
        incorrect: { bg: '#fee2e2', color: '#dc2626', label: 'Incorrect', icon: MdCancel },
        unanswered: { bg: C.innerBg, color: C.textMuted, label: 'Skipped', icon: MdErrorOutline },
    }[status] || { bg: C.innerBg, color: C.textMuted, label: status, icon: MdErrorOutline };
    
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 whitespace-nowrap border"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '40', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '8px' }}>
            <cfg.icon size={12} /> {cfg.label}
        </span>
    );
}

// Helper to render word-by-word subjective highlights
const renderHighlightedText = (text, highlights) => {
    if (!text) return '';
    if (!highlights || !Array.isArray(highlights) || highlights.length === 0) {
        return <span>{text}</span>;
    }

    // Step 1: Find all match intervals in the text
    const intervals = [];
    highlights.forEach((h, hIdx) => {
        if (!h.phrase || typeof h.phrase !== 'string') return;
        const phrase = h.phrase.trim();
        if (!phrase) return;

        let startIndex = 0;
        const lowerText = text.toLowerCase();
        const lowerPhrase = phrase.toLowerCase();

        while (true) {
            const index = lowerText.indexOf(lowerPhrase, startIndex);
            if (index === -1) break;
            
            intervals.push({
                start: index,
                end: index + phrase.length,
                phrase: text.substring(index, index + phrase.length),
                type: h.type,
                comment: h.comment,
                hIdx
            });
            
            startIndex = index + phrase.length;
        }
    });

    // Step 2: Sort intervals
    intervals.sort((a, b) => {
        if (a.start !== b.start) {
            return a.start - b.start;
        }
        return b.end - a.end;
    });

    // Step 3: Resolve overlaps
    const nonOverlapping = [];
    let lastEnd = 0;
    for (const interval of intervals) {
        if (interval.start >= lastEnd) {
            nonOverlapping.push(interval);
            lastEnd = interval.end;
        }
    }

    // Step 4: Construct the final parts to render
    const parts = [];
    let currentIndex = 0;
    
    const getHighlightStyles = (type) => {
        switch (type) {
            case 'grammar':
                return {
                    bg: 'rgba(239, 68, 68, 0.15)',
                    border: '1px dashed rgba(239, 68, 68, 0.4)',
                    underline: 'border-b-2 border-red-500 border-dashed pb-0.5',
                    textColor: '#DC2626',
                    icon: '📝'
                };
            case 'spelling':
                return {
                    bg: 'rgba(249, 115, 22, 0.15)',
                    border: '1px dashed rgba(249, 115, 22, 0.4)',
                    underline: 'border-b-2 border-orange-500 border-dashed pb-0.5',
                    textColor: '#D97706',
                    icon: '✏️'
                };
            case 'key_term':
                return {
                    bg: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    underline: 'border-b-2 border-emerald-500 pb-0.5',
                    textColor: '#059669',
                    icon: '💎'
                };
            case 'poor_phrasing':
                return {
                    bg: 'rgba(59, 130, 246, 0.15)',
                    border: '1px dashed rgba(59, 130, 246, 0.4)',
                    underline: 'border-b-2 border-blue-500 border-dotted pb-0.5',
                    textColor: '#2563EB',
                    icon: '💡'
                };
            case 'factual_error':
                return {
                    bg: 'rgba(220, 38, 38, 0.25)',
                    border: '1px solid rgba(220, 38, 38, 0.5)',
                    underline: 'border-b-2 border-red-700 pb-0.5',
                    textColor: '#B91C1C',
                    icon: '⚠️'
                };
            default:
                return {
                    bg: 'rgba(156, 163, 175, 0.15)',
                    border: '1px solid rgba(156, 163, 175, 0.4)',
                    underline: 'border-b border-gray-500 pb-0.5',
                    textColor: '#4B5563',
                    icon: '📌'
                };
        }
    };

    nonOverlapping.forEach((interval, index) => {
        if (interval.start > currentIndex) {
            parts.push(
                <span key={`text-${currentIndex}`}>
                    {text.substring(currentIndex, interval.start)}
                </span>
            );
        }

        const style = getHighlightStyles(interval.type);
        parts.push(
            <span
                key={`highlight-${index}`}
                className={`relative group inline-block px-1 py-0.5 rounded cursor-help ${style.underline}`}
                style={{
                    backgroundColor: style.bg,
                    color: style.textColor,
                }}
            >
                {interval.phrase}
                
                {/* Tooltip */}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 scale-0 rounded-lg p-2.5 text-xs text-white opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 shadow-lg text-left"
                    style={{
                        backgroundColor: '#1E293B',
                        lineHeight: '1.4',
                        fontWeight: 'normal',
                        whiteSpace: 'normal',
                    }}
                >
                    <span className="font-bold flex items-center gap-1.5 border-b pb-1 mb-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <span>{style.icon}</span>
                        <span className="uppercase tracking-wider" style={{ fontSize: '9px' }}>{interval.type.replace('_', ' ')}</span>
                    </span>
                    <span>{interval.comment}</span>
                    <span className="absolute top-full left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-[3px] rotate-45" style={{ backgroundColor: '#1E293B' }} />
                </span>
            </span>
        );

        currentIndex = interval.end;
    });

    if (currentIndex < text.length) {
        parts.push(
            <span key={`text-${currentIndex}`}>
                {text.substring(currentIndex)}
            </span>
        );
    }

    return <span>{parts}</span>;
};

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

    // Re-evaluation state
    const [isRevalOpen, setIsRevalOpen] = useState(false);
    const [revalReason, setRevalReason] = useState('');
    const [revalLoading, setRevalLoading] = useState(false);
    const [hasRevalReq, setHasRevalReq] = useState(false);

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

                try {
                    const revalRes = await api.get(`/student/exams/re-evaluation-requests?attemptId=${attemptId}`);
                    if (revalRes.data?.success && revalRes.data.requests.length > 0) {
                        setHasRevalReq(true);
                    }
                } catch (e) {
                    // Ignore
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

    const submitRevaluation = async () => {
        if (!revalReason || revalReason.trim().length < 15) {
            toast.error("Please provide a reason of at least 15 characters.");
            return;
        }
        setRevalLoading(true);
        try {
            const res = await api.post(`/student/exams/attempt/${attemptId}/re-evaluation-request`, { reason: revalReason });
            if (res.data?.success) {
                toast.success('Re-evaluation request submitted successfully!');
                setIsRevalOpen(false);
                setHasRevalReq(true);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to submit request');
        } finally {
            setRevalLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{ backgroundColor: C.pageBg }}>
            <div className="relative w-12 h-12">
                <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <MdAutoAwesome className="w-4 h-4 text-[#4F46E5] animate-pulse" />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>Analyzing your results…</p>
        </div>
    );

    if (!result) return <div className="p-10 text-center min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, fontWeight: T.weight.bold, color: C.textMuted }}>Result not found</div>;

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
        <div className="min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
            <div className="w-full space-y-5 printable-area">

                {/* ── Breadcrumb & Actions ──────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border shadow-sm no-print" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                    <div className="flex items-center gap-2" style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>
                        <Link href="/student/dashboard" className="hover:text-[#4F46E5] transition-colors flex items-center gap-1.5 text-decoration-none" style={{ color: C.textMuted }}><MdHome size={16}/> Home</Link>
                        <span className="text-slate-300">/</span>
                        <Link href="/student/exams" className="hover:text-[#4F46E5] transition-colors text-decoration-none" style={{ color: C.textMuted }}>Exams</Link>
                        <span className="text-slate-300">/</span>
                        <span style={{ color: C.heading }}>Scorecard</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => toast('Certificate download coming soon!')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                            style={{ borderColor: C.cardBorder, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <MdEmojiEvents className="w-4 h-4 text-amber-500" /> Certificate
                        </button>
                        <button onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-white border text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                            style={{ borderColor: C.cardBorder, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <MdPrint className="w-4 h-4 text-blue-500" /> Print Report
                        </button>
                        {!isPassed && (
                            <button onClick={() => router.push(`/student/exams/${params.id}/take`)}
                                className="flex items-center gap-2 px-5 py-2 text-white transition-all shadow-md hover:opacity-90 border-none cursor-pointer"
                                style={{ background: C.gradientBtn, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <MdReplay className="w-4 h-4" /> Retake Test
                            </button>
                        )}
                        {!hasRevalReq ? (
                            <button onClick={() => { setRevalReason(''); setIsRevalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors shadow-sm cursor-pointer"
                                style={{ borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <MdWarning className="w-4 h-4" /> Request Re-evaluation
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 text-amber-600 bg-amber-50 border border-amber-200 shadow-sm"
                                style={{ borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <MdWarning className="w-4 h-4" /> Re-evaluation Pending
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Exam Header Card ───────────────────────────────────────── */}
                <div className="p-6 md:p-8 shadow-sm border overflow-hidden relative" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: isPassed ? '#10b981' : '#ef4444' }} />
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-1">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 flex items-center justify-center shrink-0 border mt-1" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                                <MdEmojiEvents className="w-7 h-7 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl mb-3" style={{ color: C.heading, fontWeight: T.weight.bold }}>{examTitle}</h1>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <MetaChip label="Date" value={new Date(result.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} />
                                    <MetaChip label="Duration" value={`${examData?.duration || '-'} mins`} />
                                    <MetaChip label="Total Marks" value={result.totalMarks} />
                                    <MetaChip label="Attempt" value={`#${result.attemptNumber || 1}`} />
                                </div>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2.5 px-6 py-3 border shadow-sm shrink-0
                            ${isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                            style={{ fontSize: T.size.base, fontWeight: T.weight.bold, borderRadius: '10px' }}>
                            <span className={`w-3 h-3 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                            {isPassed ? 'STATUS: PASSED' : 'STATUS: FAILED'}
                        </div>
                    </div>
                </div>

                {/* ── Top 5 Stat Cards (Using Global Component) ────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard label="Score" value={result.score} subtext={`out of ${result.totalMarks}`} icon={MdTrendingUp} iconBg="#EEF2FF" iconColor={C.btnPrimary} />
                    <StatCard label="Percentage" value={`${percentage}%`} subtext={isPassed ? 'Above cutoff' : 'Below cutoff'} icon={MdInsertChartOutlined} iconBg={isPassed ? C.successBg : C.dangerBg} iconColor={isPassed ? C.success : C.danger} />
                    <StatCard label="Accuracy" value={`${accuracy}%`} subtext={`${correctCount} correct`} icon={MdTrackChanges} iconBg="#FFF7ED" iconColor="#F59E0B" />
                    <StatCard label="Grade" value={gradeInfo.grade} subtext={gradeInfo.label} icon={MdStar} iconBg={gradeInfo.bg} iconColor={gradeInfo.color} />
                    <StatCard label="Status" value={isPassed ? 'PASSED' : 'FAILED'} subtext="Overall" icon={isPassed ? MdCheckCircle : MdCancel} iconBg={isPassed ? C.successBg : C.dangerBg} iconColor={isPassed ? C.success : C.danger} />
                </div>

                {/* ── Main Layout Split ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                    {/* Left 2/3 - Charts & Breakdown */}
                    <div className="xl:col-span-2 space-y-5">
                        
                        {/* Performance Analytics */}
                        <div className="p-6 shadow-sm border" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 flex items-center justify-center border" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                                    <MdTrendingUp className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                </div>
                                <h2 className="text-xl" style={{ color: C.heading, fontWeight: T.weight.bold }}>Performance Analytics</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    {/* 3-box counts */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Correct', count: correctCount, bg: '#d1fae5', color: '#059669', border: '#a7f3d0' },
                                            { label: 'Incorrect', count: incorrectCount, bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
                                            { label: 'Skipped', count: unansweredCount, bg: C.innerBg, color: C.textMuted, border: C.cardBorder },
                                        ].map(b => (
                                            <div key={b.label} className="p-4 text-center border transition-transform hover:-translate-y-1"
                                                style={{ background: b.bg, borderColor: b.border, borderRadius: '10px' }}>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: b.color, marginBottom: 6 }}>
                                                    {b.label}
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.bold, color: b.color, lineHeight: 1 }}>{b.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-xs uppercase tracking-wider" style={{ color: C.textMuted, fontWeight: T.weight.bold }}>Score Progress</span>
                                            <span className={`text-xs ${isPassed ? 'text-emerald-600' : 'text-red-500'}`} style={{ fontWeight: T.weight.bold }}>{percentage}%</span>
                                        </div>
                                        <div className="h-3 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: C.innerBg }}>
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
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={C.innerBg} strokeWidth="3" />
                                            <motion.path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none" stroke={isPassed ? '#10b981' : '#ef4444'} strokeWidth="3.5" strokeLinecap="round"
                                                initial={{ strokeDasharray: '0, 100' }} animate={{ strokeDasharray: `${percentage}, 100` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl leading-none" style={{ color: C.heading, fontWeight: T.weight.bold }}>{result.score}</span>
                                            <span className="mt-1" style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.bold }}>out of {result.totalMarks}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Question Review */}
                        <div className="shadow-sm border overflow-hidden" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                            
                            {/* Review Header & Filters */}
                            <div className="px-6 py-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 flex items-center justify-center bg-white shadow-sm" style={{ borderRadius: '10px' }}>
                                        <MdArticle className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl" style={{ color: C.heading, fontWeight: T.weight.bold }}>Question Review</h2>
                                        {(hiddenAnswers || hiddenSolutions) && (
                                            <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.warning, margin: '2px 0 0 0' }}>Some answers/solutions are hidden.</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Smart Correct/Wrong Filter */}
                                <div className="flex p-1 shrink-0" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'correct', label: 'Correct' },
                                        { id: 'incorrect', label: 'Incorrect' },
                                        { id: 'unanswered', label: 'Skipped' }
                                    ].map(f => (
                                        <button key={f.id} onClick={() => setQFilter(f.id)}
                                            className="px-4 py-2 text-xs capitalize transition-all border-none cursor-pointer"
                                            style={qFilter === f.id 
                                                ? { backgroundColor: C.btnPrimary, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontWeight: T.weight.bold, borderRadius: '8px' } 
                                                : { color: C.textMuted, backgroundColor: 'transparent', fontWeight: T.weight.bold, borderRadius: '8px' }}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Questions List Area */}
                            <div className="p-4 space-y-4">
                                {filteredQuestions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>No questions match this filter.</p>
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
                                            <div key={item._id || idx} className="transition-colors border overflow-hidden"
                                                style={{ backgroundColor: isExpanded ? C.surfaceWhite : C.innerBg, borderColor: C.cardBorder, borderLeft: `6px solid ${rowBorderColor}`, borderRadius: '10px' }}>
                                                
                                                {/* Visible Row Header */}
                                                <div className="p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:bg-white/40 transition-colors"
                                                    onClick={() => setExpandedRow(isExpanded ? null : (item._id || idx))}>
                                                    
                                                    {/* Q Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-xs uppercase tracking-wider" style={{ color: C.btnPrimary, fontWeight: T.weight.bold }}>Q{item.questionNumber || idx + 1}</span>
                                                            <StatusPill status={status} />
                                                        </div>
                                                        <p className="leading-snug" style={{ fontSize: T.size.base, color: C.heading, fontWeight: T.weight.bold }}>
                                                            {item.question}
                                                        </p>
                                                    </div>

                                                    {/* Score & Button Area */}
                                                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-none" style={{ borderColor: C.cardBorder }}>
                                                        <div className="text-left md:text-right">
                                                            <span className="text-lg" style={{ color: item.pointsEarned > 0 ? C.success : C.textMuted, fontWeight: T.weight.bold }}>{item.pointsEarned}</span>
                                                            <span className="text-xs" style={{ color: C.textMuted, fontWeight: T.weight.bold }}> / {item.pointsPossible} pts</span>
                                                        </div>
                                                        <button className="flex items-center gap-2 px-3 py-2 transition-all cursor-pointer border-none"
                                                            style={isExpanded 
                                                                ? { backgroundColor: C.btnPrimary, color: '#fff', fontSize: '11px', fontWeight: T.weight.bold, borderRadius: '8px' }
                                                                : { backgroundColor: C.surfaceWhite, color: C.textMuted, border: `1px solid ${C.cardBorder}`, fontSize: '11px', fontWeight: T.weight.bold, borderRadius: '8px' }}>
                                                            {isExpanded ? 'Hide' : 'Review'}
                                                            {isExpanded ? <MdKeyboardArrowUp size={14} /> : <MdKeyboardArrowDown size={14} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Animated Explanation Block */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                            className="border-t" style={{ borderColor: C.cardBorder }}>
                                                            <div className="p-5 md:p-6" style={{ backgroundColor: C.surfaceWhite }}>
                                                                
                                                                {/* Answer Comparison Boxes */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                                    {/* Your Answer */}
                                                                     <div className="p-4 border" style={{ backgroundColor: status === 'correct' ? C.successBg : status === 'incorrect' ? C.dangerBg : C.innerBg, borderColor: status === 'correct' ? C.successBorder : status === 'incorrect' ? C.dangerBorder : C.cardBorder, borderRadius: '10px' }}>
                                                                         <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: status === 'correct' ? C.success : status === 'incorrect' ? C.danger : C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Your Answer</p>
                                                                         {item.questionType === 'subjective' && item.aiHighlights && item.aiHighlights.length > 0 && (
                                                                             <div className="flex flex-wrap gap-1.5 mb-3 mt-1 p-2 bg-black/5 rounded-lg text-[10px] font-semibold text-slate-700">
                                                                                 <span className="text-slate-500 mr-1 self-center">AI Analysis Legend:</span>
                                                                                 <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">📝 Grammar</span>
                                                                                 <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">✏️ Spelling</span>
                                                                                 <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">💎 Key Term</span>
                                                                                 <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">💡 Phrasing</span>
                                                                                 <span className="px-1.5 py-0.5 rounded bg-red-200 text-red-950 border border-red-300">⚠️ Factual Error</span>
                                                                             </div>
                                                                         )}
                                                                         <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: status === 'correct' ? '#065F46' : status === 'incorrect' ? '#7F1D1D' : C.heading, lineHeight: 1.5 }}>
                                                                             {item.questionType === 'subjective' ? renderHighlightedText(selectedAnswer, item.aiHighlights) : selectedAnswer}
                                                                         </p>
                                                                     </div>
                                                                    {/* Correct Answer */}
                                                                    <div className="p-4 border shadow-sm" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                                                                        <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Correct Answer / Feedback</p>
                                                                        <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: item.canViewCorrectAnswer ? C.btnPrimary : C.textMuted, lineHeight: 1.5 }}>
                                                                            {item.aiFeedback || correctAnswer}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Solution Explanation (If available) */}
                                                                {item.canViewSolution && item.solutionText && (
                                                                    <div className="flex items-start gap-3 p-5 border" style={{ backgroundColor: C.innerBg, borderColor: `rgba(90,114,212,0.2)`, borderRadius: '10px' }}>
                                                                        <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-white shadow-sm mt-0.5" style={{ borderRadius: '8px' }}>
                                                                            <MdAutoAwesome className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                                                        </div>
                                                                        <div>
                                                                            <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Solution Explanation</p>
                                                                            <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                                                                                {item.solutionText}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Report Issue Button for Question */}
                                                                {!hasRevalReq && (
                                                                    <div className="mt-4 flex justify-end border-t pt-4" style={{ borderColor: C.cardBorder }}>
                                                                        <button onClick={() => {
                                                                            setRevalReason(`Regarding Q${item.questionNumber || idx + 1}: `);
                                                                            setIsRevalOpen(true);
                                                                        }}
                                                                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-200"
                                                                        style={{ borderRadius: '6px', fontWeight: T.weight.bold }}>
                                                                            <MdWarning className="w-3 h-3" /> Report Issue in Evaluation
                                                                        </button>
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
                                className="p-8 text-center relative overflow-hidden shadow-lg border border-emerald-400"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '10px' }}>
                                <div className="absolute -right-6 -top-6 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                                <div className="relative z-10">
                                    <div className="text-5xl mb-4">🏆</div>
                                    <h3 className="text-2xl text-white tracking-wide" style={{ fontWeight: T.weight.bold }}>Flawless Victory!</h3>
                                    <p className="mt-2 text-emerald-100" style={{ fontSize: T.size.base, fontWeight: T.weight.bold }}>100% Accuracy. Outstanding work.</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Weakness / Insights */}
                        {(incorrectCount > 0 || unansweredCount > 0) && (
                            <div className="p-6 shadow-sm border" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: '10px' }}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 bg-amber-100 flex items-center justify-center" style={{ borderRadius: '10px' }}>
                                        <MdTrackChanges className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>Areas to Improve</h3>
                                </div>
                                <div className="space-y-3">
                                    {incorrectCount > 0 && (
                                        <div className="flex items-center gap-4 p-4" style={{ backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: '10px' }}>
                                            <span className="w-10 h-10 flex items-center justify-center text-white text-lg shrink-0 shadow-sm" style={{ backgroundColor: C.danger, fontWeight: T.weight.bold, borderRadius: '10px' }}>{incorrectCount}</span>
                                            <span style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Incorrect answers need review</span>
                                        </div>
                                    )}
                                    {unansweredCount > 0 && (
                                        <div className="flex items-center gap-4 p-4" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                            <span className="w-10 h-10 bg-slate-200 flex items-center justify-center text-slate-600 text-lg shrink-0 shadow-sm" style={{ fontWeight: T.weight.bold, borderRadius: '10px' }}>{unansweredCount}</span>
                                            <span style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Questions left unattempted</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI Recommendation Box using global StatCard */}
                        <StatCard
                            isAI
                            label="AI Study Buddy"
                            value="Next Steps"
                            subtext={isPassed ? "Ready for next module" : "Review weak topics"}
                            href="/student/ai-analytics"
                        />

                    </div>
                </div>
            </div>

            {/* ── Re-evaluation Modal ── */}
            <Modal isOpen={isRevalOpen} onClose={() => setIsRevalOpen(false)} title="Request Re-evaluation">
                <div style={{ backgroundColor: C.cardBg, padding: 24, borderRadius: R['2xl'] }}>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                            <MdWarning className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 m-0 leading-relaxed font-medium">
                                If you feel there was an error in grading, please provide a clear reason. Note that re-evaluation can take up to 48 hours and the tutor's decision will be final.
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Reason for Re-evaluation <span className="text-red-500">*</span></label>
                            <textarea
                                value={revalReason}
                                onChange={(e) => setRevalReason(e.target.value)}
                                placeholder="E.g., Regarding Q3: The correct answer should be option B according to chapter 4 of the textbook..."
                                style={{
                                    width: '100%',
                                    minHeight: 120,
                                    backgroundColor: C.innerBg,
                                    border: `1px solid ${C.cardBorder}`,
                                    borderRadius: '10px',
                                    padding: 16,
                                    color: C.heading,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.base,
                                    resize: 'vertical',
                                    outline: 'none'
                                }}
                            />
                            <p className="text-xs text-right text-gray-400 font-medium">
                                Minimum 15 characters
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setIsRevalOpen(false)}
                                className="px-5 py-2.5 rounded-lg border text-sm font-bold transition-colors cursor-pointer"
                                style={{ backgroundColor: C.surfaceWhite, color: C.textMuted, borderColor: C.cardBorder }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRevaluation}
                                disabled={revalLoading}
                                className="px-6 py-2.5 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100 border-none cursor-pointer"
                                style={{ background: C.gradientBtn, boxShadow: S.btn }}
                            >
                                {revalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MdSend className="w-4 h-4" />}
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function ExamResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: C.pageBg }} />} >
            <ExamResultPageClient />
        </Suspense>
    );
}