'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdArrowBack,
    MdHourglassEmpty,
    MdPerson,
    MdDownload,
    MdClose,
    MdCalculate,
    MdAssignment,
} from 'react-icons/md';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow   = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow   = 'none';
};

// baseInputStyle — white bg for slide panel (cleaner on C.cardBg surface)
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    borderRadius:    '10px',
    color:           C.heading,
    fontFamily:      T.fontFamily,
    fontSize:        T.size.base,
    fontWeight:      T.weight.medium,
    outline:         'none',
    width:           '100%',
    padding:         '10px 16px',
    transition:      'all 0.2s ease',
};

// ─── Shared card style ────────────────────────────────────────────────────────
const sectionCard = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    boxShadow:       S.card,
    borderRadius:    R['2xl'],
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssignmentSubmissionsPage({ params }) {
    const router                                = useRouter();
    const { id: courseId, assignmentId }        = use(params);

    const [assignment, setAssignment]           = useState(null);
    const [submissions, setSubmissions]         = useState([]);
    const [loading, setLoading]                 = useState(true);

    const [isGradeModalOpen, setIsGradeModalOpen]     = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [feedback, setFeedback]                     = useState('');
    const [rubricScores, setRubricScores]             = useState([]);
    const [submittingGrade, setSubmittingGrade]       = useState(false);

    useEffect(() => { loadData(); }, [assignmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assignRes, subsRes] = await Promise.all([
                assignmentService.getAssignmentDetails(assignmentId),
                assignmentService.getSubmissions(assignmentId),
            ]);
            if (assignRes.success) setAssignment(assignRes.assignment);
            if (subsRes.success)  setSubmissions(subsRes.submissions);
        } catch {
            toast.error('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const openGradeModal = (submission) => {
        setSelectedSubmission(submission);
        setFeedback(submission.feedback || '');
        if (assignment?.rubric) {
            setRubricScores(assignment.rubric.map(crit => {
                const existing = submission.rubricScores?.find(rs => rs.criterionId === crit._id);
                return {
                    criterionId:   crit._id,
                    criterionName: crit.criterion,
                    maxPoints:     crit.points,
                    points:        existing?.points  || 0,
                    comments:      existing?.comments || '',
                };
            }));
        }
        setIsGradeModalOpen(true);
    };

    const handleUpdateScore = (idx, field, value) => {
        setRubricScores(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value }; return n; });
    };

    const submitGrade = async (e) => {
        e.preventDefault();
        const total = rubricScores.reduce((a, c) => a + Number(c.points || 0), 0);
        setSubmittingGrade(true);
        try {
            const res = await assignmentService.gradeSubmission(selectedSubmission._id, {
                grade:       total,
                feedback,
                rubricScores: rubricScores.map(rs => ({ criterionId: rs.criterionId, points: rs.points, comments: rs.comments })),
            });
            if (res.success) {
                toast.success('Grade submitted successfully');
                setSubmissions(prev => prev.map(s => s._id === selectedSubmission._id ? res.submission : s));
                setIsGradeModalOpen(false);
            }
        } catch {
            toast.error('Failed to submit grade');
        } finally {
            setSubmittingGrade(false);
        }
    };

    const totalRubricPts = rubricScores.reduce((a, c) => a + Number(c.points || 0), 0);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="relative w-12 h-12">
                <div
                    className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
            </div>
            <p style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium }}>
                Loading submissions...
            </p>
        </div>
    );

    return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                style={sectionCard}
            >
                <div className="flex items-center gap-3">
                    {/* Back */}
                    <button
                        onClick={() => router.push(`/tutor/courses/${courseId}/assignments`)}
                        className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                    >
                        <MdArrowBack style={{ width: 18, height: 18, color: C.heading }} />
                    </button>

                    {/* Icon Pill */}
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdAssignment style={{ width: 20, height: 20, color: C.iconColor }} />
                    </div>

                    <div>
                        <h1
                            style={{
                                fontFamily:  T.fontFamily,
                                color:       C.heading,
                                fontSize:    T.size['2xl'],
                                fontWeight:  T.weight.bold,
                                margin:      '0 0 2px 0',
                                lineHeight:  T.leading.tight,
                            }}
                        >
                            {assignment?.title || 'Submissions'}
                        </h1>
                        <p
                            style={{
                                fontFamily:  T.fontFamily,
                                color:       C.text,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.medium,
                                margin:      0,
                            }}
                        >
                            {submissions.length} total submission{submissions.length !== 1 && 's'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Submissions Table ────────────────────────────────────────── */}
            <div className="p-5 overflow-x-auto" style={sectionCard}>
                {submissions.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16 flex flex-col items-center">
                        <div
                            className="flex items-center justify-center mb-4"
                            style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: R.lg }}
                        >
                            <MdPerson style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                        </div>
                        <h3
                            style={{
                                fontFamily:   T.fontFamily,
                                fontSize:     T.size.lg,
                                fontWeight:   T.weight.bold,
                                color:        C.heading,
                                margin:       '0 0 4px 0',
                            }}
                        >
                            No Submissions Yet
                        </h3>
                        <p
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.medium,
                                color:       C.text,
                                margin:      0,
                            }}
                        >
                            Students have not submitted any work for this assignment yet.
                        </p>
                    </div>
                ) : (
                    <div className="min-w-[800px]">
                        {/* Table Header */}
                        <div
                            className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-4 pb-3 mb-2"
                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                        >
                            {['Student', 'Submitted At', 'Status', 'Score', 'Actions'].map(h => (
                                <span
                                    key={h}
                                    style={{
                                        fontFamily:    T.fontFamily,
                                        fontSize:      T.size.xs,
                                        fontWeight:    T.weight.bold,
                                        color:         C.text,
                                        textTransform: 'uppercase',
                                        letterSpacing: T.tracking.wider,
                                    }}
                                >
                                    {h}
                                </span>
                            ))}
                        </div>

                        {/* Table Rows */}
                        <div className="flex flex-col gap-2">
                            {submissions.map(sub => (
                                <div
                                    key={sub._id}
                                    className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 items-center transition-all duration-150"
                                    style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = C.btnPrimary}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}
                                >
                                    {/* Student */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="flex items-center justify-center shrink-0"
                                            style={{
                                                width:      32,
                                                height:     32,
                                                background: C.gradientBtn,
                                                color:      '#fff',
                                                borderRadius: '10px',
                                                fontFamily:  T.fontFamily,
                                                fontSize:    T.size.base,
                                                fontWeight:  T.weight.bold,
                                            }}
                                        >
                                            {sub.studentId?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, margin: '0 0 2px 0' }}>
                                                {sub.studentId?.name || 'Unknown'}
                                            </p>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                {sub.studentId?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Submitted At */}
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                            {new Date(sub.submittedAt).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <div>
                                        <span
                                            className="uppercase"
                                            style={{
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.bold,
                                                padding:         '4px 10px',
                                                borderRadius:    '10px',
                                                backgroundColor: sub.status === 'graded' ? C.successBg  : C.warningBg,
                                                color:           sub.status === 'graded' ? C.success     : C.warning,
                                                border:          `1px solid ${sub.status === 'graded' ? C.successBorder : C.warningBorder}`,
                                            }}
                                        >
                                            {sub.status === 'graded' ? 'Graded' : 'Pending'}
                                        </span>
                                    </div>

                                    {/* Score */}
                                    <div>
                                        {sub.status === 'graded' ? (
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                {sub.grade}{' '}
                                                <span style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text }}>
                                                    / {assignment?.totalMarks}
                                                </span>
                                            </span>
                                        ) : (
                                            <span style={{ fontFamily: T.fontFamily, color: C.text, fontWeight: T.weight.medium }}>—</span>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div>
                                        <button
                                            onClick={() => openGradeModal(sub)}
                                            className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 w-full md:w-auto"
                                            style={{
                                                backgroundColor: sub.status === 'graded' ? C.cardBg     : C.btnPrimary,
                                                color:           sub.status === 'graded' ? C.btnPrimary : '#ffffff',
                                                border:          sub.status === 'graded' ? `1px solid ${C.cardBorder}` : 'none',
                                                borderRadius:    '10px',
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.bold,
                                                boxShadow:       S.card,
                                            }}
                                        >
                                            {sub.status === 'graded' ? 'Update Grade' : 'Grade Now'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Grading Slide-in Panel ───────────────────────────────────── */}
            {isGradeModalOpen && selectedSubmission && (
                <div
                    className="fixed inset-0 z-50 flex justify-end"
                    style={{ backgroundColor: 'rgba(21,22,86,0.4)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setIsGradeModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                        style={{ backgroundColor: C.cardBg }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Panel Header */}
                        <div
                            className="p-6 flex items-center justify-between shrink-0"
                            style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex items-center justify-center rounded-lg shrink-0"
                                    style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                                >
                                    <MdAssignment style={{ width: 18, height: 18, color: C.iconColor }} />
                                </div>
                                <div>
                                    <h3
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            fontSize:    T.size.lg,
                                            fontWeight:  T.weight.bold,
                                            color:       C.heading,
                                            margin:      '0 0 2px 0',
                                        }}
                                    >
                                        Grading: {selectedSubmission.studentId?.name}
                                    </h3>
                                    <p
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            fontSize:    T.size.xs,
                                            fontWeight:  T.weight.medium,
                                            color:       C.text,
                                            margin:      0,
                                        }}
                                    >
                                        {selectedSubmission.studentId?.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsGradeModalOpen(false)}
                                className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-70"
                                style={{ width: 32, height: 32, backgroundColor: C.cardBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                            >
                                <MdClose style={{ width: 16, height: 16, color: C.heading }} />
                            </button>
                        </div>

                        {/* Panel Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                            {/* Student Work */}
                            <div>
                                <h4
                                    style={{
                                        fontFamily:    T.fontFamily,
                                        fontSize:      T.size.base,
                                        fontWeight:    T.weight.bold,
                                        color:         C.heading,
                                        margin:        '0 0 12px 0',
                                        paddingBottom: '8px',
                                        borderBottom:  `1px solid ${C.cardBorder}`,
                                    }}
                                >
                                    Student's Work
                                </h4>
                                {selectedSubmission.content && (
                                    <div
                                        className="p-4 whitespace-pre-wrap mb-4"
                                        style={{
                                            backgroundColor: C.innerBg,
                                            borderRadius:    '10px',
                                            border:          `1px solid ${C.cardBorder}`,
                                            fontFamily:      T.fontFamily,
                                            fontSize:        T.size.base,
                                            color:           C.text,
                                            lineHeight:      T.leading.relaxed,
                                        }}
                                    >
                                        {selectedSubmission.content}
                                    </div>
                                )}
                                {selectedSubmission.attachments?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedSubmission.attachments.map((file, idx) => (
                                            <a
                                                key={idx}
                                                href={resolveMediaUrl(file.url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 transition-opacity hover:opacity-80 no-underline"
                                                style={{
                                                    backgroundColor: C.innerBg,
                                                    borderRadius:    '10px',
                                                    border:          `1px solid ${C.cardBorder}`,
                                                }}
                                            >
                                                <div
                                                    className="flex items-center justify-center p-2"
                                                    style={{ backgroundColor: C.cardBg, borderRadius: '10px' }}
                                                >
                                                    {String(file.type || '').toLowerCase().startsWith('image/')
                                                        ? <img src={resolveMediaUrl(file.url)} alt={file.name || 'attachment'} className="w-8 h-8 object-cover" style={{ borderRadius: '8px' }} />
                                                        : <MdDownload style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                    }
                                                </div>
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                                    {file.name}
                                                </p>
                                            </a>
                                        ))}
                                    </div>
                                ) : !selectedSubmission.content && (
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontStyle: 'italic', color: C.text, margin: 0 }}>
                                        No text or files in this submission.
                                    </p>
                                )}
                            </div>

                            {/* Rubric Evaluation */}
                            <div>
                                <div
                                    className="flex items-center justify-between mb-4 pb-2"
                                    style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                >
                                    <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                        Rubric Evaluation
                                    </h4>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                        {totalRubricPts} / {assignment?.totalMarks} pts
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {rubricScores.map((score, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 space-y-3"
                                            style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                                    {score.criterionName}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number" min="0" max={score.maxPoints}
                                                        value={score.points}
                                                        onChange={e => handleUpdateScore(idx, 'points', e.target.value)}
                                                        style={{ ...baseInputStyle, width: '70px', paddingRight: '8px', textAlign: 'right', fontWeight: T.weight.bold }}
                                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                    />
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text }}>
                                                        / {score.maxPoints}
                                                    </span>
                                                </div>
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={score.comments}
                                                onChange={e => handleUpdateScore(idx, 'comments', e.target.value)}
                                                placeholder={`Feedback for ${score.criterionName}...`}
                                                style={{ ...baseInputStyle, resize: 'none' }}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Overall Feedback */}
                            <div>
                                <h4
                                    style={{
                                        fontFamily:    T.fontFamily,
                                        fontSize:      T.size.base,
                                        fontWeight:    T.weight.bold,
                                        color:         C.heading,
                                        margin:        '0 0 12px 0',
                                        paddingBottom: '8px',
                                        borderBottom:  `1px solid ${C.cardBorder}`,
                                    }}
                                >
                                    Overall Feedback
                                </h4>
                                <textarea
                                    rows={4}
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="Provide comprehensive feedback..."
                                    style={{ ...baseInputStyle, resize: 'none' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        </div>

                        {/* Panel Footer */}
                        <div
                            className="p-6 shrink-0"
                            style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.cardBg }}
                        >
                            <button
                                onClick={submitGrade}
                                disabled={submittingGrade}
                                className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60"
                                style={{
                                    background:   C.gradientBtn,
                                    color:        '#ffffff',
                                    borderRadius: '10px',
                                    boxShadow:    S.btn,
                                    fontFamily:   T.fontFamily,
                                    fontSize:     T.size.base,
                                    fontWeight:   T.weight.bold,
                                }}
                            >
                                {submittingGrade
                                    ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />
                                    : <MdCalculate style={{ width: 18, height: 18 }} />
                                }
                                Submit Final Grade ({totalRubricPts} pts)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}