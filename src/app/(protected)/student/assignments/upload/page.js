'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    MdUpload,
    MdArticle,
    MdHourglassEmpty,
    MdClose,
    MdArrowBack,
    MdSend,
    MdAutoAwesome,
    MdPsychology,
    MdAssignment,
} from 'react-icons/md';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import AiTutorWidget from '@/components/AiTutorWidget';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_SIZE_MB = 20;
const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow   = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow   = 'none';
};

const baseInputStyle = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    borderRadius:    '10px',
    color:           C.heading,
    fontFamily:      T.fontFamily,
    fontSize:        T.size.base,
    fontWeight:      T.weight.semibold,
    outline:         'none',
    width:           '100%',
    padding:         '12px 16px',
    transition:      'all 0.2s ease',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UploadAssignmentPage() {
    const router = useRouter();

    const [enrollments, setEnrollments]                   = useState([]);
    const [assignments, setAssignments]                   = useState([]);
    const [selectedCourseId, setSelectedCourseId]         = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [files, setFiles]                               = useState([]);
    const [comments, setComments]                         = useState('');
    const [dragOver, setDragOver]                         = useState(false);
    const [submitting, setSubmitting]                     = useState(false);

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
        if (!ALLOWED_EXT.includes(ext))             { toast.error('Allowed: PDF, DOC, DOCX, TXT, PNG, JPG'); return false; }
        if (file.size > MAX_SIZE_MB * 1024 * 1024)  { toast.error(`Max file size: ${MAX_SIZE_MB}MB`);         return false; }
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
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                style={{
                    backgroundColor: C.cardBg,
                    borderRadius:    R['2xl'],
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                }}
            >
                <div className="flex items-center gap-3">
                    {/* Back button */}
                    <Link href="/student/assignments">
                        <button
                            className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                            style={{
                                width:           40,
                                height:          40,
                                backgroundColor: C.innerBg,
                                borderRadius:    '10px',
                                border:          `1px solid ${C.cardBorder}`,
                            }}
                        >
                            <MdArrowBack style={{ width: 18, height: 18, color: C.heading }} />
                        </button>
                    </Link>

                    {/* Icon Pill + Title */}
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
                            Upload Assignment
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
                            Select your course, choose the assignment, and submit your work.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Form Area ───────────────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div
                        className="overflow-hidden"
                        style={{
                            backgroundColor: C.cardBg,
                            border:          `1px solid ${C.cardBorder}`,
                            boxShadow:       S.card,
                            borderRadius:    R['2xl'],
                        }}
                    >
                        {/* Card Header */}
                        <div
                            className="px-6 py-4 flex items-center gap-2.5"
                            style={{
                                borderBottom:    `1px solid ${C.cardBorder}`,
                                backgroundColor: C.innerBg,
                            }}
                        >
                            <div
                                className="flex items-center justify-center rounded-lg shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                            >
                                <MdArticle style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <h2
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size.xl,
                                    fontWeight:  T.weight.semibold,
                                    color:       C.heading,
                                    margin:      0,
                                }}
                            >
                                Submission Details
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {/* ── Selectors ─────────────────────────────── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                                {/* Course */}
                                <div className="space-y-2">
                                    <label
                                        style={{
                                            display:       'block',
                                            fontFamily:    T.fontFamily,
                                            fontSize:      T.size.xs,
                                            fontWeight:    T.weight.bold,
                                            color:         C.text,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                        }}
                                    >
                                        Course *
                                    </label>
                                    <select
                                        value={selectedCourseId}
                                        onChange={e => setSelectedCourseId(e.target.value)}
                                        style={{ ...baseInputStyle, cursor: 'pointer' }}
                                        onFocus={onFocusHandler}
                                        onBlur={onBlurHandler}
                                    >
                                        <option value="">Select Course</option>
                                        {enrollments.map(e => (
                                            <option key={e.courseId?._id || e.courseId} value={e.courseId?._id || e.courseId}>
                                                {e.courseId?.title || 'Course'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Assignment */}
                                <div className="space-y-2">
                                    <label
                                        style={{
                                            display:       'block',
                                            fontFamily:    T.fontFamily,
                                            fontSize:      T.size.xs,
                                            fontWeight:    T.weight.bold,
                                            color:         C.text,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                        }}
                                    >
                                        Assignment *
                                    </label>
                                    <select
                                        value={selectedAssignmentId}
                                        onChange={e => setSelectedAssignmentId(e.target.value)}
                                        disabled={!selectedCourseId}
                                        style={{
                                            ...baseInputStyle,
                                            cursor:  'pointer',
                                            opacity: !selectedCourseId ? 0.55 : 1,
                                        }}
                                        onFocus={onFocusHandler}
                                        onBlur={onBlurHandler}
                                    >
                                        <option value="">Select Assignment</option>
                                        {assignments.map(a => (
                                            <option key={a._id} value={a._id}>{a.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ── Drop Zone ─────────────────────────────── */}
                            <div className="space-y-2">
                                <label
                                    style={{
                                        display:       'block',
                                        fontFamily:    T.fontFamily,
                                        fontSize:      T.size.xs,
                                        fontWeight:    T.weight.bold,
                                        color:         C.text,
                                        textTransform: 'uppercase',
                                        letterSpacing: T.tracking.wider,
                                    }}
                                >
                                    Upload Files *
                                </label>
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('upload-files').click()}
                                    className="p-10 text-center transition-all border-2 border-dashed cursor-pointer"
                                    style={{
                                        borderColor:     dragOver ? C.btnPrimary : C.cardBorder,
                                        backgroundColor: dragOver ? `${C.btnPrimary}0d` : C.innerBg,
                                        borderRadius:    '10px',
                                    }}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                        onChange={handleFileInput}
                                        className="hidden"
                                        id="upload-files"
                                    />

                                    {/* Upload Icon */}
                                    <div
                                        className="flex items-center justify-center mx-auto mb-4"
                                        style={{
                                            width:           56,
                                            height:          56,
                                            backgroundColor: C.cardBg,
                                            border:          `1px solid ${C.cardBorder}`,
                                            boxShadow:       S.card,
                                            borderRadius:    '10px',
                                        }}
                                    >
                                        <MdUpload style={{ width: 28, height: 28, color: C.btnPrimary }} />
                                    </div>

                                    <p
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            fontSize:    T.size.lg,
                                            fontWeight:  T.weight.bold,
                                            color:       C.heading,
                                            margin:      0,
                                        }}
                                    >
                                        Drag & drop files here
                                    </p>
                                    <p
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            fontSize:    T.size.base,
                                            color:       C.text,
                                            marginTop:   4,
                                            fontWeight:  T.weight.medium,
                                        }}
                                    >
                                        or click to browse from your computer
                                    </p>
                                    <p
                                        style={{
                                            fontFamily:    T.fontFamily,
                                            fontSize:      T.size.xs,
                                            fontWeight:    T.weight.bold,
                                            color:         C.text,
                                            marginTop:     12,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                        }}
                                    >
                                        Supported: PDF, DOCX, TXT, JPG, PNG (Max {MAX_SIZE_MB}MB)
                                    </p>
                                </div>

                                {/* File List */}
                                {files.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {files.map((f, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between p-3.5 transition-colors"
                                                style={{
                                                    backgroundColor: C.innerBg,
                                                    border:          `1px solid ${C.cardBorder}`,
                                                    borderRadius:    '10px',
                                                }}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        className="flex items-center justify-center shrink-0"
                                                        style={{
                                                            width:           32,
                                                            height:          32,
                                                            backgroundColor: C.cardBg,
                                                            borderRadius:    '10px',
                                                        }}
                                                    >
                                                        <MdArticle style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                    </div>
                                                    <span
                                                        className="truncate"
                                                        style={{
                                                            fontFamily:  T.fontFamily,
                                                            fontSize:    T.size.base,
                                                            fontWeight:  T.weight.semibold,
                                                            color:       C.heading,
                                                        }}
                                                    >
                                                        {f.name}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontFamily:  T.fontFamily,
                                                            fontSize:    T.size.xs,
                                                            color:       C.text,
                                                            fontWeight:  T.weight.medium,
                                                            whiteSpace:  'nowrap',
                                                        }}
                                                    >
                                                        {(f.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                                    className="flex items-center justify-center cursor-pointer border-none transition-colors"
                                                    style={{
                                                        width:           32,
                                                        height:          32,
                                                        color:           C.danger,
                                                        backgroundColor: 'transparent',
                                                        borderRadius:    '10px',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.dangerBg}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <MdClose style={{ width: 16, height: 16 }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Comments ──────────────────────────────── */}
                            <div className="space-y-2">
                                <label
                                    style={{
                                        display:       'block',
                                        fontFamily:    T.fontFamily,
                                        fontSize:      T.size.xs,
                                        fontWeight:    T.weight.bold,
                                        color:         C.text,
                                        textTransform: 'uppercase',
                                        letterSpacing: T.tracking.wider,
                                    }}
                                >
                                    Comments{' '}
                                    <span
                                        style={{
                                            textTransform: 'none',
                                            fontWeight:    T.weight.medium,
                                            color:         C.text,
                                        }}
                                    >
                                        (Optional)
                                    </span>
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={e => setComments(e.target.value)}
                                    placeholder="Add any notes for your instructor..."
                                    rows={4}
                                    style={{ ...baseInputStyle, resize: 'vertical' }}
                                    onFocus={onFocusHandler}
                                    onBlur={onBlurHandler}
                                />
                            </div>

                            {/* ── Actions ───────────────────────────────── */}
                            <div
                                className="flex justify-end gap-3 pt-5"
                                style={{ borderTop: `1px solid ${C.cardBorder}` }}
                            >
                                {/* Cancel */}
                                <Link href="/student/assignments">
                                    <button
                                        type="button"
                                        className="px-6 py-2.5 cursor-pointer transition-all"
                                        style={{
                                            backgroundColor: C.btnViewAllBg,
                                            color:           C.btnViewAllText,
                                            fontFamily:      T.fontFamily,
                                            fontSize:        T.size.base,
                                            fontWeight:      T.weight.bold,
                                            borderRadius:    '10px',
                                            border:          `1px solid ${C.cardBorder}`,
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        Cancel
                                    </button>
                                </Link>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting || files.length === 0 || !selectedAssignmentId}
                                    className="flex items-center gap-2 px-8 py-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer border-none"
                                    style={{
                                        background:   C.gradientBtn,
                                        fontFamily:   T.fontFamily,
                                        fontSize:     T.size.base,
                                        fontWeight:   T.weight.bold,
                                        borderRadius: '10px',
                                        boxShadow:    S.btn,
                                    }}
                                >
                                    {submitting
                                        ? <><MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" /> Submitting…</>
                                        : <><MdSend style={{ width: 16, height: 16 }} /> Submit Assignment</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ── AI Widget Sidebar ───────────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <div
                            className="overflow-hidden"
                            style={{
                                backgroundColor: C.cardBg,
                                border:          `1px solid ${C.cardBorder}`,
                                boxShadow:       S.card,
                                borderRadius:    R['2xl'],
                            }}
                        >
                            {/* Sidebar Header */}
                            <div
                                className="px-5 py-4 flex items-center gap-2.5"
                                style={{
                                    borderBottom:    `1px solid ${C.cardBorder}`,
                                    backgroundColor: C.innerBg,
                                }}
                            >
                                <div
                                    className="flex items-center justify-center rounded-lg shrink-0"
                                    style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                                >
                                    <MdAutoAwesome style={{ width: 20, height: 20, color: C.iconColor }} />
                                </div>
                                <div>
                                    <h3
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            fontSize:    T.size.lg,
                                            fontWeight:  T.weight.semibold,
                                            color:       C.heading,
                                            margin:      '0 0 2px 0',
                                        }}
                                    >
                                        AI Assistant
                                    </h3>
                                    <p
                                        style={{
                                            fontFamily:    T.fontFamily,
                                            fontSize:      T.size.xs,
                                            color:         C.text,
                                            fontWeight:    T.weight.medium,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                            margin:        0,
                                        }}
                                    >
                                        Need help?
                                    </p>
                                </div>
                            </div>

                            {/* Widget Body */}
                            <div className="p-4" style={{ minHeight: '300px' }}>
                                <AiTutorWidget
                                    context={{
                                        pageType:     'assignment_upload',
                                        courseId:     selectedCourseId,
                                        assignmentId: selectedAssignmentId,
                                    }}
                                    recommendedTopics={[
                                        'What are the key requirements for this type of assignment?',
                                        'Can you help me structure my essay/report?',
                                        'What should I double check before submitting?',
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