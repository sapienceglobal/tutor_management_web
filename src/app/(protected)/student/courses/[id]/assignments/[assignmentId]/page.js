'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, CheckCircle, Calendar, FileText,
    Upload, Clock, Award, Download, MessageSquare,
    Send, AlertCircle, Trash2
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { C, T, S } from '@/constants/studentTokens';

export default function StudentAssignmentDetailsPage({ params }) {
    const router = useRouter();
    const { id: courseId, assignmentId } = use(params);

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [content, setContent]       = useState('');
    const [attachments, setAttachments] = useState([]);

    const isSubmitted = assignment?.mySubmission?.status === 'submitted';
    const isGraded    = assignment?.mySubmission?.status === 'graded';
    const submission  = assignment?.mySubmission;

    useEffect(() => { loadData(); }, [assignmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await assignmentService.getAssignmentDetails(assignmentId);
            if (res.success) {
                setAssignment(res.assignment);
                if (res.mySubmission) {
                    setContent(res.mySubmission.content || '');
                    setAttachments(res.mySubmission.attachments || []);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load assignment details');
        } finally { setLoading(false); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);
        try {
            const res = await api.post('/upload/file', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setAttachments(prev => [...prev, { name: res.data.name, url: res.data.fileUrl, type: res.data.type }]);
                toast.success('File attached');
            }
        } catch (error) { console.error('Upload failed:', error); toast.error('Failed to attach file'); }
    };

    const removeAttachment = (index) => setAttachments(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && attachments.length === 0) return toast.error('Please add some text or attach a file.');
        setSubmitting(true);
        try {
            const res = await assignmentService.submitAssignment(assignmentId, { content, attachments });
            if (res.success) { toast.success('Assignment submitted successfully!'); loadData(); }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to submit assignment');
        } finally { setSubmitting(false); }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>Loading assignment…</p>
            </div>
        </div>
    );

    if (!assignment) return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <AlertCircle className="w-16 h-16" style={{ color: C.text, opacity: 0.25 }} />
            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading }}>
                Assignment Not Found
            </h2>
            <button onClick={() => router.push(`/student/courses/${courseId}`)}
                className="px-6 py-2 text-white rounded-xl"
                style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium }}>
                Back to Course
            </button>
        </div>
    );

    return (
        <div className="min-h-screen p-6" style={{ fontFamily: T.fontFamily }}>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ── Header ───────────────────────────────────────────── */}
                <div className="p-6 rounded-2xl"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <button onClick={() => router.push(`/student/courses/${courseId}`)}
                                className="p-2 rounded-xl transition-colors shrink-0"
                                style={{ color: C.text }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, marginBottom: 8 }}>
                                    {assignment.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4">
                                    {assignment.dueDate && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
                                            style={{ backgroundColor: C.warningBg, color: '#B45309', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium }}>
                                            <Calendar className="w-4 h-4" />
                                            Due: {new Date(assignment.dueDate).toLocaleString()}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
                                        style={{ backgroundColor: C.successBg, color: '#059669', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium }}>
                                        <Award className="w-4 h-4" />
                                        {assignment.totalMarks} Points
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="px-4 py-2 rounded-xl text-center shadow-sm shrink-0"
                            style={isGraded
                                ? { backgroundColor: C.successBg, color: '#059669', border: `1px solid ${C.successBorder}`, fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                                : isSubmitted
                                    ? { backgroundColor: C.warningBg, color: '#B45309', border: `1px solid ${C.warningBorder}`, fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                                    : { backgroundColor: C.innerBg, color: C.text, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                            {isGraded ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" style={{ color: C.success }} />
                                    <span>Graded: {submission.grade} / {assignment.totalMarks}</span>
                                </div>
                            ) : isSubmitted ? (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" style={{ color: '#F59E0B' }} />
                                    <span>Submitted, Pending Grade</span>
                                </div>
                            ) : (
                                <span>Pending Submission</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Details & Rubric ────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Instructions */}
                        <div className="rounded-2xl overflow-hidden"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                <h2 className="flex items-center gap-2"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.iconBg }}>
                                        <FileText className="w-4 h-4 text-white" />
                                    </div>
                                    Instructions
                                </h2>
                            </div>
                            <div className="p-6">
                                <p className="leading-relaxed whitespace-pre-wrap"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, lineHeight: T.leading.relaxed }}>
                                    {assignment.description}
                                </p>

                                {assignment.attachments?.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="mb-4 uppercase"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, opacity: 0.65, letterSpacing: T.tracking.wider }}>
                                            Reference Materials
                                        </h3>
                                        <div className="grid gap-3">
                                            {assignment.attachments.map((file, idx) => (
                                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 rounded-xl transition-all"
                                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg" style={{ backgroundColor: C.btnViewAllBg }}>
                                                            <FileText className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                                        </div>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                            {file.name}
                                                        </p>
                                                    </div>
                                                    <Download className="w-4 h-4" style={{ color: C.text, opacity: 0.35 }} />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grading Rubric */}
                        {assignment.rubric?.length > 0 && (
                            <div className="rounded-2xl overflow-hidden"
                                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                    <h2 className="flex items-center gap-2"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.iconBg }}>
                                            <Award className="w-4 h-4 text-white" />
                                        </div>
                                        Grading Rubric
                                    </h2>
                                </div>
                                <div>
                                    {assignment.rubric.map((item, idx) => {
                                        const gradedScore = isGraded ? submission.rubricScores?.find(rs => rs.criterionId === item._id) : null;
                                        return (
                                            <div key={idx} className="p-6" style={{
                                                borderTop: idx > 0 ? `1px solid ${C.cardBorder}` : 'none',
                                                backgroundColor: gradedScore ? 'rgba(16,185,129,0.04)' : 'transparent',
                                            }}>
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3 style={{ fontFamily: T.fontFamily, fontWeight: T.weight.bold, color: C.heading }}>{item.criterion}</h3>
                                                    <span className="px-3 py-1 rounded-full"
                                                        style={gradedScore
                                                            ? { backgroundColor: C.successBg, color: '#059669', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }
                                                            : { backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                                        {gradedScore ? `${gradedScore.points} / ` : ''}{item.points} pts
                                                    </span>
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.65 }}>{item.description}</p>
                                                {gradedScore?.comments && (
                                                    <div className="mt-4 p-3 rounded-xl flex items-start gap-3"
                                                        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.successBorder}` }}>
                                                        <MessageSquare className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.success }} />
                                                        <div>
                                                            <p className="mb-1 uppercase"
                                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#059669', letterSpacing: T.tracking.wider }}>
                                                                Tutor Feedback
                                                            </p>
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{gradedScore.comments}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Submission ─────────────────────────────── */}
                    <div className="space-y-6">
                        {isGraded && submission.feedback && (
                            <div className="rounded-2xl p-6"
                                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.12))', border: `1px solid ${C.successBorder}` }}>
                                <h2 className="flex items-center gap-2 mb-4"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: '#065F46' }}>
                                    <MessageSquare className="w-5 h-5" />
                                    Overall Feedback
                                </h2>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, lineHeight: T.leading.relaxed, color: '#065F46' }}>
                                    {submission.feedback}
                                </p>
                            </div>
                        )}

                        <div className="rounded-2xl overflow-hidden sticky top-6"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="p-6 flex items-center justify-between"
                                style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                    Your Work
                                </h2>
                                {isSubmitted && !isGraded && (
                                    <button
                                        onClick={() => assignmentService.submitAssignment(assignmentId, { content, attachments }).then(() => toast.success('Updated!'))}
                                        className="px-3 py-1 rounded-lg transition-colors"
                                        style={{ backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#ffffff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; e.currentTarget.style.color = C.btnPrimary; }}>
                                        Update Submission
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block mb-2"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, opacity: 0.70 }}>
                                            Text Response (Optional)
                                        </label>
                                        <textarea rows={6} value={content}
                                            onChange={e => setContent(e.target.value)}
                                            disabled={isGraded}
                                            placeholder="Type your answer or paste links here..."
                                            className="w-full px-4 py-3 rounded-xl resize-none focus:outline-none transition-all disabled:opacity-60"
                                            style={{ border: `1.5px solid ${C.cardBorder}`, color: C.heading, backgroundColor: isGraded ? C.innerBg : C.surfaceWhite, fontFamily: T.fontFamily, fontSize: T.size.sm }}
                                            onFocus={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}12`; }}
                                            onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, opacity: 0.70 }}>
                                            Attached Files
                                        </label>

                                        {attachments.length > 0 && (
                                            <div className="space-y-3 mb-4">
                                                {attachments.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg" style={{ backgroundColor: C.btnViewAllBg }}>
                                                                <FileText className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                                            </div>
                                                            <p className="truncate max-w-[150px]"
                                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                                {file.name}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <a href={file.url} target="_blank" rel="noopener noreferrer"
                                                                className="p-1.5 rounded-lg transition-colors"
                                                                style={{ color: C.text, opacity: 0.40 }}
                                                                onMouseEnter={e => { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                                onMouseLeave={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.opacity = '0.40'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                            {!isGraded && (
                                                                <button type="button" onClick={() => removeAttachment(idx)}
                                                                    className="p-1.5 rounded-lg transition-colors"
                                                                    style={{ color: C.text, opacity: 0.40 }}
                                                                    onMouseEnter={e => { e.currentTarget.style.color = C.danger; e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = C.dangerBg; }}
                                                                    onMouseLeave={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.opacity = '0.40'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!isGraded && (
                                            <div>
                                                <input type="file" onChange={handleFileUpload} className="hidden" id="student-attachment-upload" />
                                                <label htmlFor="student-attachment-upload"
                                                    className="flex items-center justify-center gap-2 w-full p-3 rounded-xl cursor-pointer transition-all"
                                                    style={{ border: `2px dashed ${C.cardBorder}`, color: C.text, opacity: 0.65, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.text; e.currentTarget.style.opacity = '0.65'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                    <Upload className="w-4 h-4" />
                                                    Upload File
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {!isGraded && (
                                        <button type="submit" disabled={submitting}
                                            className="w-full py-3 text-white rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                            style={{ background: C.gradientBtn, boxShadow: S.btn, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                            {submitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : isSubmitted ? (
                                                <><CheckCircle className="w-5 h-5" /> Saved</>
                                            ) : (
                                                <><Send className="w-5 h-5" /> Submit Assignment</>
                                            )}
                                        </button>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}