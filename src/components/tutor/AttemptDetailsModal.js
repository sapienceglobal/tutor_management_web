import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2, X, XCircle } from 'lucide-react';
import api from '@/lib/axios';
import { C, T, S, R } from '@/constants/studentTokens';

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
                className="relative group inline-block px-1 py-0.5 rounded cursor-help border-b-2"
                style={{
                    backgroundColor: style.bg,
                    borderColor: style.textColor,
                    color: style.textColor,
                }}
            >
                {interval.phrase}
                
                {/* Tooltip */}
                <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-64 -translate-x-2 scale-0 rounded-lg p-2.5 text-xs text-white opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 shadow-lg text-left"
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
                    <span className="absolute top-full left-6 h-1.5 w-1.5 -translate-x-1/2 -translate-y-[3px] rotate-45" style={{ backgroundColor: '#1E293B' }} />
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

export default function AttemptDetailsModal({ attemptId, examTitle, onClose }) {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);

    useEffect(() => {
        if (!attemptId) return;
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/exams/tutor/attempt/${attemptId}`);
                if (res?.data?.success) setDetails(res.data);
            } catch (error) { 
                console.error('Error fetching attempt details:', error); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchDetails();
    }, [attemptId]);

    if (!attemptId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
            <div className="w-full max-w-4xl p-0 flex flex-col max-h-[90vh] overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }} onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="p-6 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl }}>
                            <BarChart3 size={20} color={C.btnPrimary} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Detailed Performance Report</h3>
                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>{examTitle || details?.attempt?.examId?.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center" style={{ width: '32px', height: '32px', backgroundColor: C.surfaceWhite, borderRadius: R.md }}>
                        <X size={16} color={C.heading} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '32px', height: '32px' }} />
                            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading detailed analytics...</p>
                        </div>
                    ) : details ? (
                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Status', value: details.attempt.isPassed ? '✓ Passed' : '✗ Failed', color: details.attempt.isPassed ? C.success : C.danger, bg: details.attempt.isPassed ? C.successBg : C.dangerBg, border: details.attempt.isPassed ? C.successBorder : C.dangerBorder },
                                    { label: 'Score', value: `${details.attempt.score}/${details.attempt.examId?.totalMarks || details.attempt.examId?.passingMarks || details.attempt.examId}`, sub: `${details.attempt.percentage}%`, color: C.btnPrimary, bg: 'rgba(117, 115, 232, 0.12)', border: 'rgba(117, 115, 232, 0.25)' },
                                    { label: 'Time Spent', value: `${Math.floor(details.attempt.timeSpent / 60)}m ${details.attempt.timeSpent % 60}s`, color: C.warning, bg: C.warningBg, border: C.warningBorder },
                                    { label: 'Attempt', value: `#${details.attempt.attemptNumber}`, color: C.textMuted, bg: C.surfaceWhite, border: C.cardBorder },
                                ].map((item, i) => (
                                    <div key={i} className="p-4 text-center" style={{ backgroundColor: item.bg, border: `1px solid ${item.border}`, borderRadius: R.xl }}>
                                        <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', margin: '0 0 4px 0', opacity: 0.7 }}>{item.label}</p>
                                        <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: item.color, margin: 0 }}>{item.value}</p>
                                        {item.sub && <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: item.color, margin: '2px 0 0 0', opacity: 0.8 }}>{item.sub}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Question Breakdown */}
                            {details.detailedResults && details.detailedResults.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <h3 className="flex items-center gap-2" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                            <BarChart3 size={18} color={C.btnPrimary} /> Question Analysis
                                        </h3>
                                        <div className="flex gap-2">
                                            <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.success, backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, padding: '4px 8px', borderRadius: R.md }}>
                                                ✓ {details.detailedResults.filter(q => q.isCorrect).length} Correct
                                            </span>
                                            <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.danger, backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}`, padding: '4px 8px', borderRadius: R.md }}>
                                                ✗ {details.detailedResults.filter(q => !q.isCorrect).length} Wrong
                                            </span>
                                        </div>
                                    </div>

                                    {details.detailedResults.map((q, idx) => (
                                        <div key={idx} className="p-5" style={{ backgroundColor: q.isCorrect ? C.successBg : C.dangerBg, border: `2px solid ${q.isCorrect ? C.successBorder : C.dangerBorder}`, borderRadius: R.xl }}>
                                            <div className="flex justify-between items-start mb-4 gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ backgroundColor: q.isCorrect ? C.success : C.danger, color: '#fff', borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                                        {idx + 1}
                                                    </div>
                                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1.5 }}>{q.question}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <span style={{ fontSize: '11px', fontWeight: T.weight.black, color: q.isCorrect ? C.success : C.danger, backgroundColor: C.surfaceWhite, padding: '4px 8px', borderRadius: R.full }}>
                                                        {q.pointsEarned}/{q.pointsPossible} pts
                                                    </span>
                                                    {q.timeTaken !== undefined && (
                                                        <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                                            ⏱️ {Math.floor(q.timeTaken / 60) > 0 ? `${Math.floor(q.timeTaken / 60)}m ` : ''}${q.timeTaken % 60}s
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="ml-11 space-y-3">
                                                {/* Student Answer Box */}
                                                <div className="p-3" style={{ backgroundColor: q.isCorrect ? C.successBg : C.dangerBg, border: `1px solid ${q.isCorrect ? C.successBorder : C.dangerBorder}`, borderRadius: R.lg }}>
                                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: q.isCorrect ? C.success : C.danger, textTransform: 'uppercase', margin: '0 0 4px 0' }}>{"Student's Answer"}</p>
                                                    {q.questionType === 'subjective' && q.aiHighlights && q.aiHighlights.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-3 mt-1 p-2 bg-black/5 rounded-lg text-[10px] font-semibold text-slate-700">
                                                            <span className="text-slate-500 mr-1 self-center">AI Analysis Legend:</span>
                                                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">📝 Grammar</span>
                                                            <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">✏️ Spelling</span>
                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">💎 Key Term</span>
                                                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">💡 Phrasing</span>
                                                            <span className="px-1.5 py-0.5 rounded bg-red-200 text-red-950 border border-red-300">⚠️ Factual Error</span>
                                                        </div>
                                                    )}
                                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: q.isCorrect ? C.success : C.danger, margin: 0, lineHeight: 1.5 }}>
                                                        {q.questionType === 'subjective' && q.selectedText
                                                            ? renderHighlightedText(q.selectedText, q.aiHighlights)
                                                            : (q.selectedText || "Not Answered")}
                                                    </p>
                                                </div>

                                                {/* Correct / Ideal Answer Box */}
                                                {(q.aiFeedback || q.correctAnswerText || (!q.isCorrect && q.correctIndex !== undefined && q.correctIndex !== -1 && q.options?.[q.correctIndex])) && (
                                                    <div className="p-3" style={{ backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: R.lg }}>
                                                        <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.success, textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                                                            {q.questionType === 'subjective' ? 'Ideal Answer / Feedback' : 'Correct Answer'}
                                                        </p>
                                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.success, margin: 0, lineHeight: 1.5 }}>
                                                            {q.aiFeedback || q.correctAnswerText || q.options?.[q.correctIndex]?.text || q.options?.[q.correctIndex] || "—"}
                                                        </p>
                                                    </div>
                                                )}

                                                {q.explanation && (
                                                    <div className="p-3" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: R.lg }}>
                                                        <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Explanation</p>
                                                        <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.5 }}>{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <XCircle size={48} color={C.danger} style={{ opacity: 0.5, margin: '0 auto 12px' }} />
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.danger }}>Failed to load attempt details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
