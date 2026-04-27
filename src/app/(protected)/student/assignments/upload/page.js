'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload as UploadIcon, FileText, Loader2, X, ArrowLeft, Send, Sparkles, Brain } from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import AiTutorWidget from '@/components/AiTutorWidget';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme Colors ─────────────────────────────────────────────────────────────

const MAX_SIZE_MB  = 20;
const ALLOWED_EXT  = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

// Base style for all inputs, selects, and textareas
const baseInputStyle = {
    backgroundColor: C.innerBox, // Updated to match theme instead of white
    border: `1px solid ${C.cardBorder}`,
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.bold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

export default function UploadAssignmentPage() {
    const router = useRouter();
    const [enrollments, setEnrollments]           = useState([]);
    const [assignments, setAssignments]           = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [files, setFiles]         = useState([]);
    const [comments, setComments]   = useState('');
    const [dragOver, setDragOver]   = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get('/enrollments/my-enrollments')
            .then(res => { if (res.data?.enrollments) setEnrollments(res.data.enrollments); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedCourseId) { setAssignments([]); setSelectedAssignmentId(''); return; }
        assignmentService.getCourseAssignments(selectedCourseId)
            .then(res => { setAssignments(res.assignments || []); setSelectedAssignmentId(''); })
            .catch(() => setAssignments([]));
    }, [selectedCourseId]);

    const validateFile = (file) => {
        const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_EXT.includes(ext))                    { toast.error('Allowed: PDF, DOC, DOCX, TXT, PNG, JPG'); return false; }
        if (file.size > MAX_SIZE_MB * 1024 * 1024)        { toast.error(`Max file size: ${MAX_SIZE_MB}MB`);         return false; }
        return true;
    };

    const onFiles = useCallback((list) => {
        const valid = [];
        list.forEach(f => { if (validateFile(f)) valid.push(f); });
        setFiles(prev => [...prev, ...valid]);
    }, []);

    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        onFiles(Array.from(e.dataTransfer?.files || []));
    };

    const handleFileInput = (e) => {
        onFiles(Array.from(e.target.files || []));
        e.target.value = '';
    };

    const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAssignmentId) { toast.error('Please select an assignment'); return; }
        if (files.length === 0)    { toast.error('Please add at least one file');  return; }
        setSubmitting(true);
        try {
            const attachments = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post('/upload/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (res.data?.fileUrl) attachments.push({ name: file.name, url: res.data.fileUrl, type: res.data.type || file.type });
            }
            const res = await assignmentService.submitAssignment(selectedAssignmentId, {
                content: comments.trim() || undefined,
                attachments,
            });
            if (res?.success) {
                toast.success('Assignment submitted successfully! 🎉');
                router.push('/student/assignments');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: C.pageBgAlt, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <Link href="/student/assignments" className="text-decoration-none">
                        <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0 shadow-sm"
                            style={{ backgroundColor: C.innerBox, borderRadius: R.full, border: `1px solid ${C.cardBorder}` }}>
                            <ArrowLeft size={18} color={C.heading} />
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Upload Assignment
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                            Select your course, choose the assignment, and submit your work.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Form Area ─────────────────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="rounded-3xl overflow-hidden shadow-sm" style={{ backgroundColor: C.outerCard, border: `1px solid ${C.cardBorder}` }}>
                        <div className="px-6 py-5 border-b" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBox }}>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Submission Details</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* Selectors */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course *</label>
                                    <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                                        style={{ ...baseInputStyle, cursor: 'pointer' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                        <option value="">Select Course</option>
                                        {enrollments.map(e => (
                                            <option key={e.courseId?._id || e.courseId} value={e.courseId?._id || e.courseId}>
                                                {e.courseId?.title || 'Course'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2.5">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assignment *</label>
                                    <select value={selectedAssignmentId} onChange={e => setSelectedAssignmentId(e.target.value)} disabled={!selectedCourseId}
                                        style={{ ...baseInputStyle, cursor: 'pointer', opacity: !selectedCourseId ? 0.6 : 1 }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                        <option value="">Select Assignment</option>
                                        {assignments.map(a => (
                                            <option key={a._id} value={a._id}>{a.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Drop Zone */}
                            <div className="space-y-2.5">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upload Files *</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    className="rounded-2xl p-10 text-center transition-all border-2 border-dashed cursor-pointer"
                                    style={{
                                        borderColor: dragOver ? C.btnPrimary : C.cardBorder,
                                        backgroundColor: dragOver ? `${C.btnPrimary}10` : C.innerBox,
                                    }}
                                    onClick={() => document.getElementById('upload-files').click()}
                                >
                                    <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleFileInput} className="hidden" id="upload-files" />
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: C.outerCard, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                        <UploadIcon className="w-8 h-8" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>
                                        Drag & drop files here
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 4, fontWeight: T.weight.medium }}>
                                        or click to browse from your computer
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Supported: PDF, DOCX, TXT, JPG, PNG (Max {MAX_SIZE_MB}MB)
                                    </p>
                                </div>

                                {/* File list */}
                                {files.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {files.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border transition-colors"
                                                style={{ backgroundColor: C.innerBox, borderColor: C.cardBorder }}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.outerCard }}>
                                                        <FileText size={16} color={C.btnPrimary} />
                                                    </div>
                                                    <span className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {f.name}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold }}>
                                                        {(f.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                </div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer border-none"
                                                    style={{ color: C.danger, backgroundColor: 'transparent' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.dangerBg}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Comments */}
                            <div className="space-y-2.5">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Comments <span style={{ textTransform: 'none', fontWeight: T.weight.medium }}>(Optional)</span>
                                </label>
                                <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Add any notes for your instructor..."
                                    rows={4} style={{ ...baseInputStyle, resize: 'vertical' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <Link href="/student/assignments" className="text-decoration-none">
                                    <button type="button" className="px-6 py-3 rounded-xl transition-all cursor-pointer border border-transparent"
                                        style={{ backgroundColor: C.innerBox, color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = C.cardBorder}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                                        Cancel
                                    </button>
                                </Link>
                                <button type="submit" disabled={submitting || files.length === 0 || !selectedAssignmentId}
                                    className="flex items-center gap-2 px-8 py-3 text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer border-none shadow-md"
                                    style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {submitting ? 'Submitting…' : 'Submit Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── AI Widget Sidebar (Themed) ─────────────────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <div className="rounded-3xl shadow-sm border overflow-hidden" style={{ backgroundColor: C.outerCard, borderColor: C.cardBorder }}>
                            {/* Inner Box Header */}
                            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBox }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: C.outerCard }}>
                                    <Sparkles className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>AI Assistant</h3>
                                    <p style={{ fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', margin: 0 }}>Need help?</p>
                                </div>
                            </div>
                            
                            {/* Widget Wrapper */}
                            <div className="p-4" style={{ minHeight: '300px' }}>
                                {/* Note: Assuming AiTutorWidget adapts to its container. If it renders its own white box, 
                                    it will sit cleanly inside this C.outerCard background. */}
                                <AiTutorWidget
                                    context={{ pageType: 'assignment_upload', courseId: selectedCourseId, assignmentId: selectedAssignmentId }}
                                    recommendedTopics={[
                                        'What are the key requirements for this type of assignment?',
                                        'Can you help me structure my essay/report?',
                                        'What should I double check before submitting?'
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}