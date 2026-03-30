'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, User, Download, X, Calculator, ClipboardList } from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

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
    backgroundColor: '#ffffff', // For the slide in panel, white background looks cleaner
    border: `1.5px solid ${C.cardBorder}`,
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

export default function AssignmentSubmissionsPage({ params }) {
    const router = useRouter();
    const { id: courseId, assignmentId } = use(params);

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Grading Modal States
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [rubricScores, setRubricScores] = useState([]);
    const [submittingGrade, setSubmittingGrade] = useState(false);

    useEffect(() => { 
        loadData(); 
    }, [assignmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assignRes, subsRes] = await Promise.all([
                assignmentService.getAssignmentDetails(assignmentId),
                assignmentService.getSubmissions(assignmentId)
            ]);
            if (assignRes.success) setAssignment(assignRes.assignment);
            if (subsRes.success) setSubmissions(subsRes.submissions);
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
                    criterionId: crit._id, 
                    criterionName: crit.criterion, 
                    maxPoints: crit.points, 
                    points: existing?.points || 0, 
                    comments: existing?.comments || '' 
                };
            }));
        }
        setIsGradeModalOpen(true);
    };

    const handleUpdateScore = (idx, field, value) => {
        setRubricScores(prev => { 
            const n = [...prev]; 
            n[idx] = { ...n[idx], [field]: value }; 
            return n; 
        });
    };

    const submitGrade = async (e) => {
        e.preventDefault();
        const total = rubricScores.reduce((a, c) => a + Number(c.points || 0), 0);
        setSubmittingGrade(true);
        try {
            const res = await assignmentService.gradeSubmission(selectedSubmission._id, {
                grade: total, 
                feedback,
                rubricScores: rubricScores.map(rs => ({ 
                    criterionId: rs.criterionId, 
                    points: rs.points, 
                    comments: rs.comments 
                }))
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading submissions...</p>
            </div>
        );
    }

    const totalRubricPts = rubricScores.reduce((a, c) => a + Number(c.points || 0), 0);

    return (
        <div className="w-full min-h-screen p-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments`)} className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                        <ArrowLeft size={18} color={C.heading} />
                    </button>
                    <div>
                        <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            <ClipboardList size={20} color={C.btnPrimary} /> {assignment?.title || 'Submissions'}
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                            {submissions.length} total submission{submissions.length !== 1 && 's'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Submissions Table ───────────────────────────────────────────── */}
            <div className="p-5 overflow-x-auto" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                {submissions.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center">
                        <div className="w-14 h-14 flex items-center justify-center mb-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                            <User size={28} color={C.btnPrimary} />
                        </div>
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No Submissions Yet</h3>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Students have not submitted any work for this assignment yet.</p>
                    </div>
                ) : (
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            {['Student', 'Submitted At', 'Status', 'Score', 'Actions'].map(h => (
                                <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                            ))}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            {submissions.map(sub => (
                                <div key={sub._id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 items-center"
                                    style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                    
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex items-center justify-center shrink-0 w-8 h-8"
                                            style={{ background: C.gradientBtn, color: '#fff', borderRadius: R.full, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                            {sub.studentId?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{sub.studentId?.name || 'Unknown'}</p>
                                            <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{sub.studentId?.email}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                            {new Date(sub.submittedAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="uppercase" style={{ 
                                            fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: R.md,
                                            backgroundColor: sub.status === 'graded' ? C.successBg : C.warningBg, 
                                            color: sub.status === 'graded' ? C.success : C.warning, 
                                            border: `1px solid ${sub.status === 'graded' ? C.successBorder : C.warningBorder}`
                                        }}>
                                            {sub.status === 'graded' ? 'Graded' : 'Pending'}
                                        </span>
                                    </div>

                                    <div>
                                        {sub.status === 'graded' ? (
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                                {sub.grade} <span style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>/ {assignment?.totalMarks}</span>
                                            </span>
                                        ) : <span style={{ color: C.textMuted, fontWeight: T.weight.bold }}>—</span>}
                                    </div>

                                    <div>
                                        <button onClick={() => openGradeModal(sub)}
                                            className="flex items-center justify-center gap-1.5 h-9 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 w-full md:w-auto"
                                            style={{ 
                                                backgroundColor: sub.status === 'graded' ? '#ffffff' : C.btnPrimary, 
                                                color: sub.status === 'graded' ? C.btnPrimary : '#ffffff', 
                                                border: sub.status === 'graded' ? `1px solid ${C.cardBorder}` : 'none',
                                                borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.card 
                                            }}>
                                            {sub.status === 'graded' ? 'Update Grade' : 'Grade Now'}
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Grading Slide-in Panel ──────────────────────────────────────── */}
            {isGradeModalOpen && selectedSubmission && (
                <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setIsGradeModalOpen(false)}>
                    <div className="w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                        style={{ backgroundColor: '#EAE8FA' }} onClick={e => e.stopPropagation()}>

                        {/* Panel Header */}
                        <div className="p-6 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            <div>
                                <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Grading: {selectedSubmission.studentId?.name}</h3>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>{selectedSubmission.studentId?.email}</p>
                            </div>
                            <button onClick={() => setIsGradeModalOpen(false)} className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center" style={{ width: '32px', height: '32px', backgroundColor: '#ffffff', borderRadius: R.md }}>
                                <X size={16} color={C.heading} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            
                            {/* Student Work */}
                            <div>
                                <h4 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 12px 0', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '8px' }}>Student's Work</h4>
                                {selectedSubmission.content && (
                                    <div className="p-4 whitespace-pre-wrap" style={{ backgroundColor: '#ffffff', borderRadius: R.xl, border: `1px solid ${C.cardBorder}`, fontSize: T.size.sm, color: C.text, lineHeight: 1.5, marginBottom: '16px' }}>
                                        {selectedSubmission.content}
                                    </div>
                                )}
                                {selectedSubmission.attachments?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedSubmission.attachments.map((file, idx) => (
                                            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 transition-opacity hover:opacity-80 text-decoration-none"
                                                style={{ backgroundColor: '#ffffff', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                                <div className="p-2" style={{ backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                                    <Download size={16} color={C.btnPrimary} />
                                                </div>
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{file.name}</p>
                                            </a>
                                        ))}
                                    </div>
                                ) : !selectedSubmission.content && (
                                    <p style={{ fontSize: T.size.sm, fontStyle: 'italic', color: C.textMuted, margin: 0 }}>No text or files in this submission.</p>
                                )}
                            </div>

                            {/* Rubric */}
                            <div>
                                <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <h4 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Rubric Evaluation</h4>
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.btnPrimary }}>{totalRubricPts} / {assignment?.totalMarks} pts</span>
                                </div>
                                <div className="space-y-4">
                                    {rubricScores.map((score, idx) => (
                                        <div key={idx} className="p-4 space-y-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex items-center justify-between">
                                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{score.criterionName}</p>
                                                <div className="flex items-center gap-2">
                                                    <input type="number" min="0" max={score.maxPoints} value={score.points}
                                                        onChange={e => handleUpdateScore(idx, 'points', e.target.value)}
                                                        style={{ ...baseInputStyle, width: '70px', paddingRight: '8px', textAlign: 'right', fontWeight: T.weight.black }}
                                                        onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                                    <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>/ {score.maxPoints}</span>
                                                </div>
                                            </div>
                                            <textarea rows={2} value={score.comments} onChange={e => handleUpdateScore(idx, 'comments', e.target.value)}
                                                placeholder={`Feedback for ${score.criterionName}...`}
                                                style={{ ...baseInputStyle, resize: 'none' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Overall Feedback */}
                            <div>
                                <h4 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 12px 0', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '8px' }}>Overall Feedback</h4>
                                <textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)}
                                    placeholder="Provide comprehensive feedback..."
                                    style={{ ...baseInputStyle, resize: 'none' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                        </div>

                        {/* Panel Footer */}
                        <div className="p-6 shrink-0" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: '#EAE8FA' }}>
                            <button onClick={submitGrade} disabled={submittingGrade}
                                className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {submittingGrade ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                                Submit Final Grade ({totalRubricPts} pts)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}