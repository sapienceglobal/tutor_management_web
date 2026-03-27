'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, CheckCircle, User,
    Download, X, Calculator, ClipboardList
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/tutorTokens';

export default function AssignmentSubmissionsPage({ params }) {
    const router = useRouter();
    const { id: courseId, assignmentId } = use(params);

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [rubricScores, setRubricScores] = useState([]);
    const [submittingGrade, setSubmittingGrade] = useState(false);

    useEffect(() => { loadData(); }, [assignmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assignRes, subsRes] = await Promise.all([
                assignmentService.getAssignmentDetails(assignmentId),
                assignmentService.getSubmissions(assignmentId)
            ]);
            if (assignRes.success) setAssignment(assignRes.assignment);
            if (subsRes.success) setSubmissions(subsRes.submissions);
        } catch { toast.error('Failed to load submissions'); }
        finally { setLoading(false); }
    };

    const openGradeModal = (submission) => {
        setSelectedSubmission(submission);
        setFeedback(submission.feedback || '');
        if (assignment?.rubric) {
            setRubricScores(assignment.rubric.map(crit => {
                const existing = submission.rubricScores?.find(rs => rs.criterionId === crit._id);
                return { criterionId: crit._id, criterionName: crit.criterion, maxPoints: crit.points, points: existing?.points || 0, comments: existing?.comments || '' };
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
                grade: total, feedback,
                rubricScores: rubricScores.map(rs => ({ criterionId: rs.criterionId, points: rs.points, comments: rs.comments }))
            });
            if (res.success) {
                toast.success('Grade submitted successfully');
                setSubmissions(prev => prev.map(s => s._id === selectedSubmission._id ? res.submission : s));
                setIsGradeModalOpen(false);
            }
        } catch { toast.error('Failed to submit grade'); }
        finally { setSubmittingGrade(false); }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                style={{ borderColor: FX.primary25Transparent, borderTopColor: C.btnPrimary }} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>Loading submissions…</p>
        </div>
    );

    const totalRubricPts = rubricScores.reduce((a, c) => a + Number(c.points || 0), 0);

    const inp = { ...cx.input(), width: '100%', padding: '10px 14px' };
    const applyFocus = (e) => Object.assign(e.target.style, cx.inputFocus);
    const removeFocus = (e) => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; };

    return (
        <div className="space-y-5" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments`)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: C.innerBg, color: C.textMuted }}>
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: FX.primary15, border: `1px solid ${FX.primary25}` }}>
                            <ClipboardList className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                        </div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            {assignment?.title} — Submissions
                        </h1>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        {submissions.length} total submission{submissions.length !== 1 && 's'}
                    </p>
                </div>
            </div>

            {/* ── Submissions table ─────────────────────────────────────── */}
            {submissions.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: C.cardBorder, backgroundColor: C.cardBg }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: C.innerBg }}>
                        <User className="w-7 h-7" style={{ color: C.cardBorder }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, marginBottom: 4 }}>
                        No Submissions Yet
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, maxWidth: 300, margin: '0 auto' }}>
                        Students have not submitted any work for this assignment yet.
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    {/* Table head */}
                    <div className="grid grid-cols-5 gap-4 px-5 py-3"
                        style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                        {['Student', 'Submitted At', 'Status', 'Score', 'Actions'].map(h => (
                            <span key={h} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                {h}
                            </span>
                        ))}
                    </div>
                    {/* Rows */}
                    {submissions.map(sub => (
                        <div key={sub._id} className="grid grid-cols-5 gap-4 px-5 py-3.5 items-center transition-all"
                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>

                            {/* Student */}
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                    style={{ background: C.gradientBtn }}>
                                    {sub.studentId?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text }}>
                                        {sub.studentId?.name || 'Unknown'}
                                    </p>
                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>
                                        {sub.studentId?.email}
                                    </p>
                                </div>
                            </div>

                            {/* Date */}
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                {new Date(sub.submittedAt).toLocaleString()}
                            </p>

                            {/* Status */}
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                    style={sub.status === 'graded'
                                        ? { backgroundColor: C.successBg, color: C.success, borderColor: C.successBorder, fontFamily: T.fontFamily }
                                        : { backgroundColor: C.warningBg, color: C.warning, borderColor: C.warningBorder, fontFamily: T.fontFamily }}>
                                    {sub.status === 'graded' && <CheckCircle className="w-3 h-3" />}
                                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                </span>
                            </div>

                            {/* Score */}
                            <div>
                                {sub.status === 'graded' ? (
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                        {sub.grade} <span style={{ fontSize: T.size.xs, fontWeight: T.weight.regular, color: C.textMuted }}>/ {assignment?.totalMarks}</span>
                                    </span>
                                ) : <span style={{ color: C.cardBorder }}>—</span>}
                            </div>

                            {/* Action */}
                            <div>
                                <button onClick={() => openGradeModal(sub)}
                                    className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all hover:opacity-80"
                                    style={sub.status === 'graded'
                                        ? { ...cx.btnSecondary(), fontFamily: T.fontFamily }
                                        : { backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily }}>
                                    {sub.status === 'graded' ? 'Update Grade' : 'Grade Now'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Grading Slide-in Panel ────────────────────────────────── */}
            {isGradeModalOpen && selectedSubmission && (
                <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-lg h-full shadow-2xl flex flex-col"
                        style={{ backgroundColor: C.surfaceWhite }}>

                        {/* Panel header */}
                        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                            style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                    Grading: {selectedSubmission.studentId?.name}
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                    {selectedSubmission.studentId?.email}
                                </p>
                            </div>
                            <button onClick={() => setIsGradeModalOpen(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
                                style={{ backgroundColor: C.cardBg }}>
                                <X className="w-4 h-4" style={{ color: C.textMuted }} />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-7">

                            {/* Student's Work */}
                            <section>
                                <h3 className="pb-2 mb-3"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>
                                    Student's Work
                                </h3>
                                {selectedSubmission.content && (
                                    <div className="p-4 rounded-2xl mb-3 whitespace-pre-wrap"
                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                        {selectedSubmission.content}
                                    </div>
                                )}
                                {selectedSubmission.attachments?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedSubmission.attachments.map((file, idx) => (
                                            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-2xl border transition-all group hover:shadow-sm"
                                                style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}>
                                                <div className="p-2 rounded-xl" style={{ backgroundColor: FX.primary12 }}>
                                                    <Download className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                                </div>
                                                <p className="flex-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text }}>
                                                    {file.name}
                                                </p>
                                            </a>
                                        ))}
                                    </div>
                                ) : !selectedSubmission.content && (
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontStyle: 'italic' }}>
                                        No text or files in this submission.
                                    </p>
                                )}
                            </section>

                            {/* Rubric */}
                            <section>
                                <div className="flex items-center justify-between pb-2 mb-3"
                                    style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                        Rubric Evaluation
                                    </h3>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                                        style={{ backgroundColor: FX.primary12, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                        {totalRubricPts} / {assignment?.totalMarks} pts
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {rubricScores.map((score, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl space-y-2.5"
                                            style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex items-center justify-between">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {score.criterionName}
                                                </p>
                                                <div className="flex items-center gap-1.5">
                                                    <input type="number" min="0" max={score.maxPoints} value={score.points}
                                                        onChange={e => handleUpdateScore(idx, 'points', e.target.value)}
                                                        style={{ ...cx.input(), width: 64, height: 32, padding: '0 8px', textAlign: 'right', fontWeight: T.weight.bold }}
                                                        onFocus={applyFocus} onBlur={removeFocus} />
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                        / {score.maxPoints}
                                                    </span>
                                                </div>
                                            </div>
                                            <textarea rows={2} value={score.comments}
                                                onChange={e => handleUpdateScore(idx, 'comments', e.target.value)}
                                                placeholder={`Feedback for ${score.criterionName}...`}
                                                style={{ ...cx.input(), width: '100%', padding: '8px 12px', resize: 'none', fontSize: T.size.xs }}
                                                onFocus={applyFocus} onBlur={removeFocus} />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Overall Feedback */}
                            <section>
                                <h3 className="pb-2 mb-3"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>
                                    Overall Feedback
                                </h3>
                                <textarea rows={4} value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="Provide comprehensive feedback for the student..."
                                    style={{ ...inp, resize: 'none' }}
                                    onFocus={applyFocus} onBlur={removeFocus} />
                            </section>
                        </div>

                        {/* Panel footer */}
                        <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            <button onClick={submitGrade} disabled={submittingGrade}
                                className="w-full py-3 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60 hover:opacity-90"
                                style={{ background: C.gradientBtn, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                {submittingGrade ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                                Submit Final Grade ({totalRubricPts} pts)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
