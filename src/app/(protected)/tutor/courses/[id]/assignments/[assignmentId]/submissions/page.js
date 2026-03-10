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
        } catch { toast.error("Failed to load submissions"); }
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
                toast.success("Grade submitted successfully");
                setSubmissions(prev => prev.map(s => s._id === selectedSubmission._id ? res.submission : s));
                setIsGradeModalOpen(false);
            }
        } catch { toast.error("Failed to submit grade"); }
        finally { setSubmittingGrade(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading submissions...</p>
            </div>
        );
    }

    const totalRubricPts = rubricScores.reduce((a, c) => a + Number(c.points || 0), 0);

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center gap-3">
                <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments`)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                </button>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                            <ClipboardList className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-800">{assignment?.title} — Submissions</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">
                        {submissions.length} total submission{submissions.length !== 1 && 's'}
                    </p>
                </div>
            </div>

            {/* Submissions */}
            {submissions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-slate-50">
                        <User className="w-7 h-7 text-slate-300" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 mb-1">No Submissions Yet</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">Students have not submitted any work for this assignment yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                        {['Student', 'Submitted At', 'Status', 'Score', 'Actions'].map(h => (
                            <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</span>
                        ))}
                    </div>
                    <div className="divide-y divide-slate-50">
                        {submissions.map(sub => (
                            <div key={sub._id} className="grid grid-cols-5 gap-4 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors">
                                {/* Student */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                        {sub.studentId?.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{sub.studentId?.name || 'Unknown'}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{sub.studentId?.email}</p>
                                    </div>
                                </div>
                                {/* Submitted */}
                                <p className="text-xs text-slate-500">{new Date(sub.submittedAt).toLocaleString()}</p>
                                {/* Status */}
                                <div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border
                                        ${sub.status === 'graded'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {sub.status === 'graded' && <CheckCircle className="w-3 h-3" />}
                                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                    </span>
                                </div>
                                {/* Score */}
                                <div>
                                    {sub.status === 'graded' ? (
                                        <span className="text-sm font-bold text-slate-800">
                                            {sub.grade} <span className="text-xs font-normal text-slate-400">/ {assignment?.totalMarks}</span>
                                        </span>
                                    ) : <span className="text-slate-300">—</span>}
                                </div>
                                {/* Action */}
                                <div>
                                    <button onClick={() => openGradeModal(sub)}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                                        style={sub.status === 'graded'
                                            ? { border: '1px solid #e2e8f0', color: '#64748b', backgroundColor: 'white' }
                                            : { backgroundColor: 'var(--theme-primary)', color: 'white' }}>
                                        {sub.status === 'graded' ? 'Update Grade' : 'Grade Now'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Grading Modal (slide-in panel) ──────────────────────────── */}
            {isGradeModalOpen && selectedSubmission && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between flex-shrink-0">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Grading: {selectedSubmission.studentId?.name}</p>
                                <p className="text-xs text-slate-400">{selectedSubmission.studentId?.email}</p>
                            </div>
                            <button onClick={() => setIsGradeModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-7">

                            {/* Student's Work */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                                    Student's Work
                                </h3>
                                {selectedSubmission.content && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm whitespace-pre-wrap mb-3">
                                        {selectedSubmission.content}
                                    </div>
                                )}
                                {selectedSubmission.attachments?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedSubmission.attachments.map((file, idx) => (
                                            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-[var(--theme-primary)] hover:shadow-sm rounded-xl transition-all group">
                                                <div className="p-2 rounded-lg transition-colors"
                                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                                    <Download className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700 group-hover:text-[var(--theme-primary)] transition-colors flex-1">{file.name}</p>
                                            </a>
                                        ))}
                                    </div>
                                ) : !selectedSubmission.content && (
                                    <p className="text-xs text-slate-400 italic">No text or files in this submission.</p>
                                )}
                            </section>

                            {/* Rubric */}
                            <section>
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rubric Evaluation</h3>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', color: 'var(--theme-primary)' }}>
                                        {totalRubricPts} / {assignment?.totalMarks} pts
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {rubricScores.map((score, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-slate-800">{score.criterionName}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <input type="number" min="0" max={score.maxPoints} value={score.points}
                                                        onChange={(e) => handleUpdateScore(idx, 'points', e.target.value)}
                                                        className="w-16 text-right text-sm font-bold px-2 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[var(--theme-primary)] transition-colors" />
                                                    <span className="text-xs text-slate-400">/ {score.maxPoints}</span>
                                                </div>
                                            </div>
                                            <textarea rows={2} value={score.comments}
                                                onChange={(e) => handleUpdateScore(idx, 'comments', e.target.value)}
                                                placeholder={`Feedback for ${score.criterionName}...`}
                                                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] bg-white resize-none transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Overall Feedback */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                                    Overall Feedback
                                </h3>
                                <textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide comprehensive feedback for the student..."
                                    className="w-full px-3.5 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] resize-none transition-colors" />
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 flex-shrink-0">
                            <button onClick={submitGrade} disabled={submittingGrade}
                                className="w-full py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-opacity disabled:opacity-60"
                                style={{ backgroundColor: 'var(--theme-primary)' }}>
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