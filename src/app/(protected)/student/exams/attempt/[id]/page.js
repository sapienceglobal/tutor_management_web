'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    CheckCircle, XCircle, AlertCircle, Clock,
    ArrowLeft, Download, TrendingUp, ClipboardCheck, Send, Check
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, FX } from '@/constants/studentTokens';

const getOptionText = (option) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return option.text || '';
};

const getStatus = (item) => {
    if (item?.status) return item.status;
    if (item?.userSelectedOption === -1 || item?.userSelectedOption === undefined) return 'unanswered';
    return item?.isCorrect ? 'correct' : 'incorrect';
};

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

export default function ExamResultPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewingSolution, setViewingSolution] = useState(null);
    const [showRequestBox, setShowRequestBox] = useState(false);
    const [requestReason, setRequestReason] = useState('');
    const [requestLoading, setRequestLoading] = useState(false);
    const [reevaluationRequest, setReevaluationRequest] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await api.get(`/student/exams/attempt/${id}`);
                if (res.data.success) setResult(res.data.attempt);
            } catch (error) {
                console.error('Failed to load result', error);
                toast.error('Failed to load result.');
                router.push('/student/dashboard');
            } finally { setLoading(false); }
        };
        fetchResult();
    }, [id, router]);

    useEffect(() => {
        const fetchReevaluationRequest = async () => {
            try {
                const res = await api.get('/student/exams/re-evaluation-requests', {
                    params: { attemptId: id, limit: 1 },
                });
                if (res.data?.success && Array.isArray(res.data.requests) && res.data.requests.length > 0) {
                    setReevaluationRequest(res.data.requests[0]);
                }
            } catch {}
        };
        fetchReevaluationRequest();
    }, [id]);

    const handleSubmitReevaluation = async () => {
        if (!requestReason.trim() || requestReason.trim().length < 15) {
            toast.error('Please enter at least 15 characters.');
            return;
        }
        try {
            setRequestLoading(true);
            const res = await api.post(`/student/exams/attempt/${id}/re-evaluation-request`, {
                reason: requestReason.trim(),
            });
            if (res.data?.success) {
                setReevaluationRequest(res.data.request);
                setShowRequestBox(false);
                setRequestReason('');
                toast.success('Re-evaluation request submitted.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setRequestLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
            <div className="w-12 h-12 rounded-full border-[3px] animate-spin" style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Analyzing your performance...</p>
        </div>
    );

    if (!result) return null;

    const hiddenAnswers = (result.analysis || []).some(item => item.canViewCorrectAnswer === false);
    const hiddenSolutions = (result.analysis || []).some(item => item.canViewSolution === false);
    
    const themeColor = result.isPassed ? C.success : C.danger;
    const themeBg = result.isPassed ? C.successBg : C.dangerBg;
    const themeBorder = result.isPassed ? C.successBorder : C.dangerBorder;

    return (
        <div className="w-full min-h-screen p-6 pb-24 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Nav Row */}
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                <button onClick={() => router.push('/student/dashboard')}
                    className="flex items-center gap-2 h-10 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                    style={{ backgroundColor: '#EAE8FA', color: C.heading, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
                <button className="hidden sm:flex items-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                    style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                    <Download size={16} /> Download Report
                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* ── Main Score Card (Bento Hero) ───────────────────────────────────────── */}
                <div className="rounded-[32px] overflow-hidden relative" style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="h-3" style={{ backgroundColor: themeColor }} />
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: themeColor }} />
                    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none" style={{ backgroundColor: C.btnPrimary }} />

                    <div className="p-8 md:p-12 flex flex-col items-center text-center relative z-10">
                        <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, marginBottom: 4, lineHeight: 1.2 }}>
                            {result.examTitle}
                        </h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, marginBottom: 32 }}>
                            Completed on {new Date(result.submittedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>

                        <div className="w-48 h-48 rounded-full flex flex-col items-center justify-center border-[8px] mb-6 shadow-xl"
                            style={{ borderColor: themeBg, backgroundColor: C.surfaceWhite, color: themeColor, boxShadow: `0 0 40px ${themeColor}40` }}>
                            <span style={{ fontSize: '56px', fontWeight: T.weight.black, lineHeight: 1 }}>
                                {Math.round(result.percentage)}<span style={{ fontSize: '28px' }}>%</span>
                            </span>
                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>
                                {result.isPassed ? 'Passed' : 'Failed'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white shadow-sm border border-slate-100">
                            <span style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.textMuted }}>Total Score:</span>
                            <span style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>{result.score} <span style={{ fontSize: T.size.sm, color: C.textMuted }}>/ {result.totalMarks}</span></span>
                        </div>

                        {/* Stats Grid inside Hero */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full mt-10">
                            {[
                                { label: 'Time Taken', value: formatTime(result.timeSpent), icon: Clock, bg: '#E3DFF8', color: C.heading },
                                { label: 'Correct', value: result.correctCount, icon: CheckCircle, bg: C.successBg, color: C.success },
                                { label: 'Incorrect', value: result.incorrectCount, icon: XCircle, bg: C.dangerBg, color: C.danger },
                                { label: 'Skipped', value: result.unansweredCount, icon: AlertCircle, bg: C.surfaceWhite, color: C.textMuted },
                                { label: 'Percentile', value: result.percentile != null ? `Top ${100 - result.percentile}%` : 'N/A', icon: TrendingUp, bg: '#EAE8FA', color: C.btnPrimary },
                            ].map((stat, i) => (
                                <div key={i} className="p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-100/50 transition-transform hover:-translate-y-1"
                                    style={{ backgroundColor: stat.bg }}>
                                    <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
                                    <p style={{ fontSize: T.size['xl'], fontWeight: T.weight.black, color: stat.color, lineHeight: 1, marginBottom: 4 }}>{stat.value}</p>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.text, opacity: 0.6, textTransform: 'uppercase' }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Re-evaluation Box ─────────────────────────────────── */}
                <div className="rounded-3xl p-6" style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8' }}>
                            <ClipboardCheck size={20} color={C.btnPrimary} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Re-evaluation Request</h3>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Think scoring needs a review? Submit a request.</p>
                        </div>
                    </div>

                    {reevaluationRequest ? (
                        <div className="p-4 rounded-xl flex items-center gap-3 w-fit"
                            style={{ 
                                backgroundColor: reevaluationRequest.status === 'approved' ? C.successBg : reevaluationRequest.status === 'rejected' ? C.dangerBg : C.warningBg,
                                border: `1px solid ${reevaluationRequest.status === 'approved' ? C.successBorder : reevaluationRequest.status === 'rejected' ? C.dangerBorder : C.warningBorder}`,
                                color: reevaluationRequest.status === 'approved' ? C.success : reevaluationRequest.status === 'rejected' ? C.danger : C.warning
                            }}>
                            {reevaluationRequest.status === 'approved' && <CheckCircle size={18} />}
                            {reevaluationRequest.status === 'rejected' && <XCircle size={18} />}
                            {reevaluationRequest.status === 'pending' && <Clock size={18} />}
                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, textTransform: 'capitalize' }}>
                                Status: {reevaluationRequest.status} {reevaluationRequest.status === 'pending' ? '(In Review)' : ''}
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {!showRequestBox ? (
                                <button onClick={() => setShowRequestBox(true)}
                                    className="h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm rounded-xl"
                                    style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                                    Request Re-evaluation
                                </button>
                            ) : (
                                <div className="space-y-3" style={{ backgroundColor: '#E3DFF8', padding: '16px', borderRadius: R.xl }}>
                                    <textarea
                                        value={requestReason}
                                        onChange={(e) => setRequestReason(e.target.value)}
                                        placeholder="Explain your reasoning (min 15 chars)..."
                                        rows={3}
                                        style={{ ...baseInputStyle, resize: 'vertical', minHeight: '80px' }}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    />
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleSubmitReevaluation} disabled={requestLoading}
                                            className="h-10 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md rounded-xl flex items-center gap-2"
                                            style={{ background: C.gradientBtn, color: '#fff', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            {requestLoading ? <Clock size={16} className="animate-spin" /> : <Send size={16} />} Submit Request
                                        </button>
                                        <button onClick={() => { setShowRequestBox(false); setRequestReason(''); }}
                                            className="h-10 px-4 cursor-pointer bg-transparent border-none transition-opacity hover:opacity-70"
                                            style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Detailed Analysis (Questions List) ─────────────────────────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Detailed Analysis</h2>
                    </div>

                    {(hiddenAnswers || hiddenSolutions) && (
                        <div className="p-4 rounded-xl flex items-start gap-3 bg-amber-50 border border-amber-200">
                            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.warning, margin: 0, lineHeight: 1.4 }}>
                                Note: The tutor has hidden the correct answers or solutions for some questions.
                            </p>
                        </div>
                    )}

                    {result.analysis?.map((item, index) => {
                        const status = getStatus(item);
                        const selectedAnswer = item.selectedAnswerText || getOptionText(item.options?.[item.userSelectedOption]) || '-';
                        const correctAnswer = item.canViewCorrectAnswer ? (item.correctAnswerText || getOptionText(item.options?.[item.correctOption]) || '-') : 'Hidden by Tutor';

                        const statusCfg = {
                            correct: { bg: C.successBg, color: C.success, border: C.successBorder },
                            incorrect: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
                            unanswered: { bg: C.surfaceWhite, color: C.textMuted, border: C.cardBorder },
                        }[status] || { bg: C.surfaceWhite, color: C.textMuted, border: C.cardBorder };

                        return (
                            <div key={item._id || index} className="rounded-3xl p-6 md:p-8"
                                style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                                {/* Question Header */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-xl"
                                            style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, fontSize: T.size.md, fontWeight: T.weight.black }}>
                                            Q{item.questionNumber || index + 1}
                                        </div>
                                        <p style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1.5, paddingTop: '2px' }}>
                                            {item.question}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                        <span className="px-3 py-1 rounded-lg" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {status}
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                            {item.pointsEarned ?? 0} / {item.pointsPossible ?? item.points ?? 1} Marks
                                        </span>
                                    </div>
                                </div>

                                {/* Options List */}
                                <div className="space-y-3 sm:ml-14">
                                    {(item.options || []).map((opt, optIdx) => {
                                        const text = getOptionText(opt);
                                        const isSelected = item.userSelectedOption === optIdx;
                                        const isCorrectOpt = item.canViewCorrectAnswer && item.correctOption === optIdx;

                                        let optBg = C.surfaceWhite, optBorder = C.cardBorder, optText = C.heading;
                                        let badgeBg = '#EAE8FA', badgeText = C.textMuted, badgeBorder = C.cardBorder;

                                        if (isCorrectOpt) {
                                            optBg = C.successBg; optBorder = C.successBorder; optText = '#065F46';
                                            badgeBg = C.success; badgeText = '#fff'; badgeBorder = C.success;
                                        } else if (isSelected && status === 'incorrect') {
                                            optBg = C.dangerBg; optBorder = C.dangerBorder; optText = '#7F1D1D';
                                            badgeBg = C.danger; badgeText = '#fff'; badgeBorder = C.danger;
                                        } else if (isSelected) {
                                            optBg = '#E3DFF8'; optBorder = C.btnPrimary; optText = C.btnPrimary;
                                            badgeBg = C.btnPrimary; badgeText = '#fff'; badgeBorder = C.btnPrimary;
                                        }

                                        return (
                                            <div key={optIdx} className="flex items-center p-4 rounded-2xl transition-all"
                                                style={{ backgroundColor: optBg, border: `2px solid ${optBorder}` }}>
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mr-4"
                                                    style={{ backgroundColor: badgeBg, color: badgeText, border: `1px solid ${badgeBorder}`, fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </div>
                                                <span style={{ fontSize: T.size.sm, fontWeight: isSelected || isCorrectOpt ? T.weight.bold : T.weight.medium, color: optText }}>
                                                    {text}
                                                </span>
                                                {isCorrectOpt && <Check size={18} className="ml-auto" color="#059669" />}
                                                {isSelected && status === 'incorrect' && <XCircle size={18} className="ml-auto" color={C.danger} />}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Correct Answer Summary & Solution */}
                                <div className="sm:ml-14 mt-6 space-y-4">
                                    <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Your Answer:</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: status === 'correct' ? C.success : status === 'incorrect' ? C.danger : C.heading }}>{selectedAnswer}</span>
                                        </div>
                                        <div className="w-px h-4 bg-slate-200 hidden sm:block" />
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Correct Answer:</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: item.canViewCorrectAnswer ? C.success : C.warning }}>{correctAnswer}</span>
                                        </div>
                                    </div>

                                    {item.canViewSolution && item.solutionText && (
                                        <div className="space-y-3">
                                            <button onClick={() => setViewingSolution(viewingSolution === index ? null : index)}
                                                className="flex items-center gap-2 px-4 h-10 rounded-xl cursor-pointer border-none transition-colors"
                                                style={{ backgroundColor: viewingSolution === index ? C.btnPrimary : '#E3DFF8', color: viewingSolution === index ? '#fff' : C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                                <ClipboardCheck size={14} /> {viewingSolution === index ? 'Hide Solution' : 'View Full Solution'}
                                            </button>

                                            {viewingSolution === index && (
                                                <div className="p-5 rounded-2xl" style={{ backgroundColor: '#E3DFF8', border: `1px solid ${C.cardBorder}` }}>
                                                    <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                                                        Explanation
                                                    </p>
                                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.heading, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                                                        {item.solutionText}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}