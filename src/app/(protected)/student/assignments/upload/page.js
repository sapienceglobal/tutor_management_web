'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload as UploadIcon, FileText, Loader2, X } from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import AiTutorWidget from '@/components/AiTutorWidget';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

const MAX_SIZE_MB  = 20;
const ALLOWED_EXT  = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

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
                toast.success('Assignment submitted successfully!');
                router.push('/student/assignments');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Shared input style ───────────────────────────────────────────────────
    const inputSt = { ...cx.input(), width: '100%', padding: '10px 14px' };
    const labelSt = {
        display: 'block',
        fontFamily: T.fontFamily,
        fontSize: T.size.xs,
        fontWeight: T.weight.bold,
        color: C.statLabel,
        textTransform: 'uppercase',
        letterSpacing: T.tracking.wider,
        marginBottom: 6,
    };

    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div>
                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                    Upload Assignment
                </h1>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55, marginTop: 2 }}>
                    Select your course and assignment, then attach your files
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Form ─────────────────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl p-6"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${C.cardBorder}` }}>
                            Submission Details
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Course */}
                            <div>
                                <label style={labelSt}>Course</label>
                                <select value={selectedCourseId}
                                    onChange={e => setSelectedCourseId(e.target.value)}
                                    style={{ ...inputSt, cursor: 'pointer', appearance: 'none' }}>
                                    <option value="">Select Course</option>
                                    {enrollments.map(e => (
                                        <option key={e.courseId?._id || e.courseId} value={e.courseId?._id || e.courseId}>
                                            {e.courseId?.title || 'Course'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignment */}
                            <div>
                                <label style={labelSt}>Assignment</label>
                                <select value={selectedAssignmentId}
                                    onChange={e => setSelectedAssignmentId(e.target.value)}
                                    style={{ ...inputSt, cursor: 'pointer', appearance: 'none' }}>
                                    <option value="">Select Assignment</option>
                                    {assignments.map(a => (
                                        <option key={a._id} value={a._id}>{a.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Drop Zone */}
                            <div>
                                <label style={labelSt}>Files</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    className="rounded-2xl p-8 text-center transition-all"
                                    style={{
                                        border: `2px dashed ${dragOver ? C.btnPrimary : C.cardBorder}`,
                                        backgroundColor: dragOver ? `${C.btnPrimary}08` : C.innerBg,
                                    }}>
                                    <input type="file" multiple
                                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                        onChange={handleFileInput}
                                        className="hidden" id="upload-files" />
                                    <label htmlFor="upload-files" className="cursor-pointer block">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                                            style={{ backgroundColor: `${C.btnPrimary}15` }}>
                                            <UploadIcon className="w-7 h-7" style={{ color: C.btnPrimary }} />
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                            Drag & drop or click to upload
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 4 }}>
                                            PDF, DOC, DOCX, TXT, PNG, JPG · Max {MAX_SIZE_MB}MB
                                        </p>
                                    </label>
                                </div>

                                {/* File list */}
                                {files.length > 0 && (
                                    <ul className="mt-3 space-y-2">
                                        {files.map((f, i) => (
                                            <li key={i} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl"
                                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: C.btnPrimary }} />
                                                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                        {f.name}
                                                    </span>
                                                </div>
                                                <button type="button" onClick={() => removeFile(i)}
                                                    className="p-1 rounded-lg transition-all hover:opacity-70 flex-shrink-0"
                                                    style={{ color: C.danger }}>
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Comments */}
                            <div>
                                <label style={labelSt}>Comments <span style={{ textTransform: 'none', fontWeight: T.weight.medium, color: C.textMuted }}>(Optional)</span></label>
                                <textarea value={comments}
                                    onChange={e => setComments(e.target.value)}
                                    placeholder="Add any comments or additional information…"
                                    rows={4}
                                    style={{ ...inputSt, resize: 'none' }}
                                    onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <Link href="/student/assignments">
                                    <button type="button"
                                        className="px-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                                        style={cx.btnSecondary()}>
                                        Cancel
                                    </button>
                                </Link>
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm disabled:opacity-50 transition-all hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {submitting ? 'Submitting…' : 'Submit Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── AI Widget ─────────────────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <AiTutorWidget
                            title="Submission Assistant"
                            subtitle="Need help with this assignment? Ask me!"
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
    );
}