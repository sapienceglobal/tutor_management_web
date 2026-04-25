'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, CheckCircle, Calendar, FileText,
    Upload, Clock, Award, Download, MessageSquare,
    Send, AlertCircle, Trash2, ClipboardList
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const themeBg = '#dfdaf3';
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';

// gradient shorthand
const GS = { background: C.gradientBtn };

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

export default function StudentAssignmentDetailsPage({ params }) {
    const router = useRouter();
    const { id: courseId, assignmentId } = use(params);

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [content, setContent]       = useState('');
    const [attachments, setAttachments] = useState([]);
    const [dragOver, setDragOver]     = useState(false);

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

    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer?.files[0];
        if (file) handleFileUpload({ target: { files: [file] } });
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily }}>
            <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading assignment details...</p>
        </div>
    );

    if (!assignment) return (
        <div className="flex h-screen items-center justify-center" style={{ backgroundColor: themeBg }}>
            <div className="text-center rounded-3xl p-10 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: innerBox }}>
                    <AlertCircle className="w-8 h-8" style={{ color: C.textMuted }} />
                </div>
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, marginBottom: 12 }}>Assignment Not Found</h2>
                <button onClick={() => router.push(`/student/courses/${courseId}`)}
                    className="px-6 py-2.5 rounded-xl transition-colors font-bold border cursor-pointer"
                    style={{ backgroundColor: innerBox, borderColor: C.cardBorder, color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.sm }}>
                    Back to Course
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 space-y-6" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily, color: C.text }}>
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Header ───────────────────────────────────────────── */}
                <div className="p-6 md:p-8 rounded-3xl shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <button onClick={() => router.push(`/student/courses/${courseId}`)}
                                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm border cursor-pointer"
                                style={{ backgroundColor: innerBox, borderColor: C.cardBorder, color: C.heading }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = innerBox; }}>
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, marginBottom: 12, lineHeight: 1.2 }}>
                                    {assignment.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    {assignment.dueDate && (
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                                            style={{ backgroundColor: C.warningBg, color: '#B45309', border: `1px solid ${C.warningBorder}`, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                            <Calendar className="w-3.5 h-3.5" /> Due: {new Date(assignment.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                                        style={{ backgroundColor: innerBox, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                        <Award className="w-3.5 h-3.5" /> {assignment.totalMarks} Points
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="px-5 py-3 rounded-2xl text-center shadow-sm shrink-0 border"
                            style={isGraded
                                ? { backgroundColor: C.successBg, color: '#059669', borderColor: C.successBorder }
                                : isSubmitted
                                    ? { backgroundColor: C.warningBg, color: '#B45309', borderColor: C.warningBorder }
                                    : { backgroundColor: innerBox, color: C.heading, borderColor: C.cardBorder }}>
                            {isGraded ? (
                                <div className="flex items-center gap-2 font-bold" style={{ fontSize: T.size.sm }}>
                                    <CheckCircle className="w-5 h-5" style={{ color: C.success }} />
                                    <span>Graded: {submission.grade} / {assignment.totalMarks}</span>
                                </div>
                            ) : isSubmitted ? (
                                <div className="flex items-center gap-2 font-bold" style={{ fontSize: T.size.sm }}>
                                    <Clock className="w-5 h-5" style={{ color: '#F59E0B' }} />
                                    <span>Submitted, Pending Grade</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 font-bold" style={{ fontSize: T.size.sm }}>
                                    <AlertCircle className="w-5 h-5" style={{ color: C.textMuted }} />
                                    <span>Pending Submission</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Details & Rubric ────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Instructions */}
                        <div className="rounded-3xl shadow-sm border overflow-hidden" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                            <div className="p-6 border-b flex items-center gap-3" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm border" style={{ borderColor: C.cardBorder }}>
                                    <FileText className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                </div>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                    Instructions
                                </h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <p className="leading-relaxed whitespace-pre-wrap" style={{ fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.medium, margin: 0 }}>
                                    {assignment.description}
                                </p>

                                {assignment.attachments?.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="mb-4 uppercase" style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, letterSpacing: '1px' }}>
                                            Reference Materials
                                        </h3>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {assignment.attachments.map((file, idx) => (
                                                <a key={idx} href={resolveMediaUrl(file.url)} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 rounded-2xl transition-all border text-decoration-none group"
                                                    style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = S.cardHover; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="p-2.5 rounded-xl bg-white shadow-sm shrink-0">
                                                            {String(file.type || '').toLowerCase().startsWith('image/')
                                                                ? <img src={resolveMediaUrl(file.url)} alt={file.name || 'attachment'} className="w-10 h-10 rounded-lg object-cover" />
                                                                : <FileText className="w-4 h-4" style={{ color: C.btnPrimary }} />}
                                                        </div>
                                                        <p className="truncate m-0" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                            {file.name}
                                                        </p>
                                                    </div>
                                                    <Download className="w-4 h-4 shrink-0 transition-colors group-hover:text-indigo-600" style={{ color: C.textMuted }} />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grading Rubric */}
                        {assignment.rubric?.length > 0 && (
                            <div className="rounded-3xl shadow-sm border overflow-hidden" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                <div className="p-6 border-b flex items-center gap-3" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm border" style={{ borderColor: C.cardBorder }}>
                                        <Award className="w-4 h-4" style={{ color: C.warning }} />
                                    </div>
                                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                        Grading Rubric
                                    </h2>
                                </div>
                                <div className="divide-y" style={{ borderColor: C.cardBorder }}>
                                    {assignment.rubric.map((item, idx) => {
                                        const gradedScore = isGraded ? submission.rubricScores?.find(rs => rs.criterionId === item._id) : null;
                                        return (
                                            <div key={idx} className="p-6 transition-colors" style={{ backgroundColor: gradedScore ? 'rgba(16,185,129,0.05)' : 'transparent' }}>
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{item.criterion}</h3>
                                                    <span className="px-3 py-1 rounded-lg shrink-0 border"
                                                        style={gradedScore
                                                            ? { backgroundColor: C.successBg, color: '#059669', borderColor: C.successBorder, fontSize: '11px', fontWeight: T.weight.black }
                                                            : { backgroundColor: innerBox, color: C.textMuted, borderColor: C.cardBorder, fontSize: '11px', fontWeight: T.weight.black }}>
                                                        {gradedScore ? `${gradedScore.points} / ` : ''}{item.points} pts
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.medium, margin: 0, lineHeight: 1.5 }}>{item.description}</p>
                                                
                                                {gradedScore?.comments && (
                                                    <div className="mt-4 p-4 rounded-xl flex items-start gap-3 border" style={{ backgroundColor: C.surfaceWhite, borderColor: C.successBorder }}>
                                                        <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.success }} />
                                                        <div>
                                                            <p className="mb-1 uppercase tracking-wider" style={{ fontSize: '10px', fontWeight: T.weight.black, color: '#059669', margin: '0 0 2px 0' }}>
                                                                Tutor Feedback
                                                            </p>
                                                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{gradedScore.comments}</p>
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

                    {/* ── Right: Submission Panel ─────────────────────────────── */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Overall Feedback if Graded */}
                        {isGraded && submission.feedback && (
                            <div className="rounded-3xl p-6 shadow-sm border" style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderColor: C.successBorder }}>
                                <h2 className="flex items-center gap-2 mb-3" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: '#065F46', margin: '0 0 12px 0' }}>
                                    <MessageSquare className="w-5 h-5" /> Overall Feedback
                                </h2>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, lineHeight: 1.6, color: '#065F46', margin: 0 }}>
                                    {submission.feedback}
                                </p>
                            </div>
                        )}

                        {/* Submission Form Area */}
                        <div className="rounded-3xl overflow-hidden shadow-md border sticky top-24" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b" style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                    Your Work
                                </h2>
                                {isSubmitted && !isGraded && (
                                    <button onClick={() => assignmentService.submitAssignment(assignmentId, { content, attachments }).then(() => toast.success('Updated!'))}
                                        className="px-4 py-2 rounded-xl transition-all cursor-pointer border shadow-sm hover:scale-105"
                                        style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderColor: C.cardBorder, fontSize: '11px', fontWeight: T.weight.black }}>
                                        Update Submission
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    
                                    {/* Text Response */}
                                    <div>
                                        <label className="block mb-2" style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Text Response
                                        </label>
                                        <textarea rows={6} value={content}
                                            onChange={e => setContent(e.target.value)} disabled={isGraded}
                                            placeholder="Type your answer or paste links here..."
                                            className="w-full px-4 py-3 rounded-2xl resize-none outline-none transition-all disabled:opacity-60"
                                            style={{ border: `1px solid ${C.cardBorder}`, color: C.heading, backgroundColor: innerBox, fontSize: T.size.sm, fontWeight: T.weight.bold }}
                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        />
                                    </div>

                                    {/* File Upload Area */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Attached Files
                                            </label>
                                            {!isGraded && (
                                                <button type="button" onClick={() => document.getElementById('file-upload').click()}
                                                    className="text-xs font-bold transition-colors cursor-pointer border-none bg-transparent hover:underline" style={{ color: C.btnPrimary }}>
                                                    + Add File
                                                </button>
                                            )}
                                        </div>

                                        {!isGraded && (
                                            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                                                className="border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer mb-4"
                                                style={{ borderColor: dragOver ? C.btnPrimary : C.cardBorder, backgroundColor: dragOver ? `${C.btnPrimary}10` : innerBox }}
                                                onClick={() => document.getElementById('file-upload').click()}>
                                                <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
                                                <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: C.textMuted }} />
                                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Drag & drop or click to attach files</p>
                                            </div>
                                        )}

                                        {attachments.length > 0 && (
                                            <div className="space-y-2">
                                                {attachments.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border transition-colors" style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="p-2 rounded-lg bg-white shadow-sm shrink-0">
                                                                {String(file.type || '').toLowerCase().startsWith('image/')
                                                                    ? <img src={resolveMediaUrl(file.url)} alt={file.name || 'attachment'} className="w-10 h-10 rounded-lg object-cover" />
                                                                    : <FileText className="w-4 h-4" style={{ color: C.btnPrimary }} />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate m-0" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>{file.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <a href={resolveMediaUrl(file.url)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-colors hover:bg-white cursor-pointer" style={{ color: C.btnPrimary }}>
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                            {!isGraded && (
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }} className="p-2 rounded-lg transition-colors hover:bg-red-50 cursor-pointer border-none bg-transparent" style={{ color: C.danger }}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    {!isGraded && (
                                        <button type="submit" disabled={submitting}
                                            className="w-full py-4 text-white rounded-2xl flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer border-none shadow-md"
                                            style={{ ...GS, fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                            {submitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : isSubmitted ? (
                                                <><CheckCircle className="w-5 h-5" /> Saved & Submitted</>
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
