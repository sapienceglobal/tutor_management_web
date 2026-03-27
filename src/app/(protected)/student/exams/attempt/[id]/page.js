'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    CheckCircle, XCircle, AlertCircle, Clock,
    ArrowLeft, Download, TrendingUp, ClipboardCheck, Send
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S } from '@/constants/studentTokens';

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
            } catch {
                // optional widget; ignore network errors here
            }
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
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
        </div>
    );

    if (!result) return null;

    const hiddenAnswers = (result.analysis || []).some(item => item.canViewCorrectAnswer === false);
    const hiddenSolutions = (result.analysis || []).some(item => item.canViewSolution === false);

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
            <div className="max-w-4xl mx-auto space-y-8">

                {/* ── Nav ──────────────────────────────────────────────── */}
                <div className="flex justify-between items-center">
                    <button onClick={() => router.push('/student/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                        style={{ color: C.text, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                        style={{ border: `1px solid ${C.cardBorder}`, color: C.text, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        <Download className="w-4 h-4" /> Download Report
                    </button>
                </div>

                {/* ── Score card ───────────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="h-2" style={{ backgroundColor: result.isPassed ? C.success : C.danger }} />

                    <div className="p-8 md:p-12 text-center">
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>
                            {result.examTitle}
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.50, marginBottom: 32 }}>
                            completed on {new Date(result.submittedAt).toLocaleDateString()}
                        </p>

                        {/* Score circle */}
                        <div className="flex flex-col items-center justify-center mb-8">
                            <div className="w-40 h-40 rounded-full flex flex-col items-center justify-center border-8 mb-4"
                                style={result.isPassed
                                    ? { borderColor: C.successBg, backgroundColor: C.successBg, color: '#059669', boxShadow: `0 8px 32px ${C.success}30` }
                                    : { borderColor: C.dangerBg, backgroundColor: C.dangerBg, color: C.danger, boxShadow: `0 8px 32px ${C.danger}30` }}>
                                <span style={{ fontFamily: T.fontFamily, fontSize: '48px', fontWeight: T.weight.black, lineHeight: 1 }}>
                                    {Math.round(result.percentage)}%
                                </span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginTop: 4 }}>
                                    {result.isPassed ? 'Passed' : 'Failed'}
                                </span>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.medium, color: C.text }}>
                                Score: <span style={{ fontWeight: T.weight.bold, color: C.heading }}>{result.score}</span> / {result.totalMarks}
                            </p>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-8"
                            style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            {[
                                { label: 'Time Taken', value: formatTime(result.timeSpent), icon: Clock, bg: C.innerBg, color: C.text },
                                { label: 'Correct', value: result.correctCount, icon: CheckCircle, bg: C.successBg, color: '#059669' },
                                { label: 'Incorrect', value: result.incorrectCount, icon: XCircle, bg: C.dangerBg, color: C.danger },
                                { label: 'Unattempted', value: result.unansweredCount, icon: AlertCircle, bg: C.innerBg, color: C.text },
                                { label: 'Percentile', value: result.percentile != null ? `Top ${100 - result.percentile}%` : 'N/A', icon: TrendingUp, bg: C.btnViewAllBg, color: C.btnViewAllText },
                            ].map((stat, i) => (
                                <div key={i} className="p-4 rounded-xl text-center"
                                    style={{ backgroundColor: stat.bg }}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: stat.color, opacity: 0.70, marginBottom: 4 }}>
                                        {stat.label}
                                    </p>
                                    <p className="flex items-center justify-center gap-2"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: stat.color }}>
                                        <stat.icon className="w-4 h-4" />
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Detailed Analysis ─────────────────────────────────── */}
                <div className="rounded-2xl p-5"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: C.btnViewAllBg, color: C.btnPrimary }}>
                                <ClipboardCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                                    Re-evaluation Request
                                </h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                                    If you think scoring needs review, submit your reason for tutor verification.
                                </p>
                            </div>
                        </div>
                    </div>

                    {reevaluationRequest ? (
                        <div className="rounded-xl px-3 py-2.5 border inline-flex items-center gap-2"
                            style={{
                                backgroundColor:
                                    reevaluationRequest.status === 'approved' ? C.successBg :
                                        reevaluationRequest.status === 'rejected' ? C.dangerBg : C.warningBg,
                                borderColor:
                                    reevaluationRequest.status === 'approved' ? C.successBorder :
                                        reevaluationRequest.status === 'rejected' ? C.dangerBorder : C.warningBorder,
                                color:
                                    reevaluationRequest.status === 'approved' ? C.success :
                                        reevaluationRequest.status === 'rejected' ? C.danger : C.warning,
                            }}>
                            {reevaluationRequest.status === 'approved' && <CheckCircle className="w-4 h-4" />}
                            {reevaluationRequest.status === 'rejected' && <XCircle className="w-4 h-4" />}
                            {reevaluationRequest.status === 'pending' && <Clock className="w-4 h-4" />}
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'capitalize' }}>
                                {reevaluationRequest.status} request {reevaluationRequest.status === 'pending' ? 'in review' : ''}
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {!showRequestBox ? (
                                <button
                                    onClick={() => setShowRequestBox(true)}
                                    className="px-4 h-9 rounded-xl"
                                    style={{
                                        backgroundColor: C.btnViewAllBg,
                                        color: C.btnPrimary,
                                        border: `1px solid ${C.cardBorder}`,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.sm,
                                        fontWeight: T.weight.bold,
                                    }}>
                                    Request Re-evaluation
                                </button>
                            ) : (
                                <div className="space-y-2.5">
                                    <textarea
                                        value={requestReason}
                                        onChange={(e) => setRequestReason(e.target.value)}
                                        placeholder="Explain what should be re-evaluated (minimum 15 characters)..."
                                        rows={3}
                                        className="w-full rounded-xl border px-3 py-2 resize-y"
                                        style={{
                                            borderColor: C.cardBorder,
                                            backgroundColor: C.surfaceWhite,
                                            color: C.heading,
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.sm,
                                        }}
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSubmitReevaluation}
                                            disabled={requestLoading}
                                            className="px-4 h-9 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-60"
                                            style={{
                                                backgroundColor: C.btnPrimary,
                                                color: C.btnPrimaryText,
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.sm,
                                                fontWeight: T.weight.bold,
                                            }}>
                                            {requestLoading ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                            Submit Request
                                        </button>
                                        <button
                                            onClick={() => { setShowRequestBox(false); setRequestReason(''); }}
                                            className="px-4 h-9 rounded-xl border"
                                            style={{
                                                borderColor: C.cardBorder,
                                                backgroundColor: C.surfaceWhite,
                                                color: C.text,
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.sm,
                                                fontWeight: T.weight.semibold,
                                            }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading }}>
                        Detailed Analysis
                    </h2>
                    {hiddenAnswers && (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.warning }}>
                            Answer key hidden by tutor for some/all questions.
                        </p>
                    )}
                    {hiddenSolutions && (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.warning }}>
                            Solution hidden by tutor for some/all questions.
                        </p>
                    )}

                    {result.analysis?.map((item, index) => {
                        const status = getStatus(item);
                        const selectedAnswer = item.selectedAnswerText || getOptionText(item.options?.[item.userSelectedOption]) || '-';
                        const correctAnswer = item.canViewCorrectAnswer
                            ? (item.correctAnswerText || getOptionText(item.options?.[item.correctOption]) || '-')
                            : 'Hidden';

                        const statusCfg = {
                            correct: { bg: C.successBg, color: '#059669', border: C.successBorder },
                            incorrect: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
                            unanswered: { bg: C.innerBg, color: C.text, border: C.cardBorder },
                        }[status] || { bg: C.innerBg, color: C.text, border: C.cardBorder };

                        return (
                            <div key={item._id || index} className="rounded-2xl p-6"
                                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                                {/* Question row */}
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full"
                                            style={{ backgroundColor: C.innerBg, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.text }}>
                                            {item.questionNumber || index + 1}
                                        </span>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.medium, color: C.heading, paddingTop: 2 }}>
                                            {item.question}
                                        </p>
                                    </div>
                                    <span className="flex-shrink-0 px-3 py-1 rounded-full"
                                        style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                                        {status}
                                    </span>
                                </div>

                                {/* Answer info */}
                                <div className="ml-11 space-y-2">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                        <span style={{ fontWeight: T.weight.semibold }}>Your Answer:</span> {selectedAnswer}
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: item.canViewCorrectAnswer ? '#059669' : C.textMuted }}>
                                        <span style={{ fontWeight: T.weight.semibold }}>Correct Answer:</span> {correctAnswer}
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                        Marks: {item.pointsEarned ?? 0} / {item.pointsPossible ?? item.points ?? 1}
                                    </p>
                                </div>

                                {/* Options */}
                                <div className="grid gap-2 ml-11 mt-4">
                                    {(item.options || []).map((opt, optIdx) => {
                                        const text = getOptionText(opt);
                                        const isSelected = item.userSelectedOption === optIdx;
                                        const isCorrectOpt = item.canViewCorrectAnswer && item.correctOption === optIdx;

                                        let bg = C.surfaceWhite, border = C.cardBorder, textColor = C.text;
                                        let badgeBg = C.innerBg, badgeColor = C.text;

                                        if (isCorrectOpt) {
                                            bg = C.successBg; border = C.success; textColor = '#065F46';
                                            badgeBg = C.success; badgeColor = '#ffffff';
                                        } else if (isSelected && status === 'incorrect') {
                                            bg = C.dangerBg; border = C.danger; textColor = '#7F1D1D';
                                            badgeBg = C.danger; badgeColor = '#ffffff';
                                        } else if (isSelected) {
                                            bg = C.btnViewAllBg; border = C.btnPrimary; textColor = C.heading;
                                            badgeBg = C.btnPrimary; badgeColor = '#ffffff';
                                        }

                                        return (
                                            <div key={optIdx} className="flex items-center p-3 rounded-xl border"
                                                style={{ backgroundColor: bg, borderColor: border }}>
                                                <span className="w-6 h-6 flex items-center justify-center rounded-full border mr-3 flex-shrink-0"
                                                    style={{ backgroundColor: badgeBg, color: badgeColor, borderColor: badgeBg, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: textColor }}>
                                                    {text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Solution toggle */}
                                <div className="ml-11 mt-4">
                                    {item.canViewSolution && item.solutionText ? (
                                        <button onClick={() => setViewingSolution(viewingSolution === index ? null : index)}
                                            className="px-3 py-1.5 rounded-lg transition-all"
                                            style={{ backgroundColor: C.innerBg, color: C.text, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}>
                                            {viewingSolution === index ? 'Hide Solution' : 'View Solution'}
                                        </button>
                                    ) : (
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                            Solution hidden
                                        </span>
                                    )}
                                </div>

                                {viewingSolution === index && item.canViewSolution && item.solutionText && (
                                    <div className="ml-11 mt-3 p-4 rounded-xl"
                                        style={{ backgroundColor: C.btnViewAllBg, border: `1px solid ${C.cardBorder}` }}>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.btnPrimary, marginBottom: 6 }}>
                                            Solution Explanation
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: T.leading.relaxed }}>
                                            {item.solutionText}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
