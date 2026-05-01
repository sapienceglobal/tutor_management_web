'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdArrowBack,
    MdHourglassEmpty,
    MdCheckCircle,
    MdCalendarMonth,
    MdArticle,
    MdUpload,
    MdAccessTime,
    MdEmojiEvents,
    MdDownload,
    MdMessage,
    MdSend,
    MdWarning,
    MdDelete,
    MdAssignment,
    MdAutoAwesome,
} from 'react-icons/md';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow   = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow   = 'none';
};

// ─── Shared card style ────────────────────────────────────────────────────────
const sectionCard = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    boxShadow:       S.card,
    borderRadius:    R['2xl'],
};

// ─── Icon Pill ────────────────────────────────────────────────────────────────
function IconPill({ icon: Icon, bg, color, size = 16 }) {
    return (
        <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{ width: 40, height: 40, backgroundColor: bg || C.iconBg }}
        >
            <Icon style={{ width: size, height: size, color: color || C.iconColor }} />
        </div>
    );
}

// ─── Card Section Header ──────────────────────────────────────────────────────
function CardHeader({ icon: Icon, title, iconBg, iconColor, right }) {
    return (
        <div
            className="px-5 py-4 flex items-center justify-between gap-3 shrink-0"
            style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}
        >
            <div className="flex items-center gap-2.5">
                <IconPill icon={Icon} bg={iconBg} color={iconColor} />
                <h2
                    style={{
                        fontFamily:  T.fontFamily,
                        fontSize:    T.size.xl,
                        fontWeight:  T.weight.semibold,
                        color:       C.heading,
                        margin:      0,
                    }}
                >
                    {title}
                </h2>
            </div>
            {right}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentAssignmentDetailsPage({ params }) {
    const router = useRouter();
    const { id: courseId, assignmentId } = use(params);

    const [assignment, setAssignment]   = useState(null);
    const [loading, setLoading]         = useState(true);
    const [submitting, setSubmitting]   = useState(false);
    const [content, setContent]         = useState('');
    const [attachments, setAttachments] = useState([]);
    const [dragOver, setDragOver]       = useState(false);

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
                <div className="absolute inset-0 flex items-center justify-center">
                    <MdAutoAwesome className="animate-pulse" style={{ width: 18, height: 18, color: C.btnPrimary }} />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium }}>
                Loading assignment details...
            </p>
        </div>
    );

    // ── Not Found ────────────────────────────────────────────────────────────
    if (!assignment) return (
        <div
            className="flex h-screen items-center justify-center"
            style={{ backgroundColor: C.pageBg }}
        >
            <div
                className="text-center p-10"
                style={sectionCard}
            >
                <div
                    className="flex items-center justify-center mx-auto mb-4"
                    style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: R.lg }}
                >
                    <MdWarning style={{ width: 28, height: 28, color: C.text, opacity: 0.5 }} />
                </div>
                <h2
                    style={{
                        fontFamily:   T.fontFamily,
                        fontSize:     T.size.lg,
                        fontWeight:   T.weight.bold,
                        color:        C.heading,
                        marginBottom: 12,
                    }}
                >
                    Assignment Not Found
                </h2>
                <button
                    onClick={() => router.push(`/student/courses/${courseId}`)}
                    className="px-6 py-2.5 transition-opacity hover:opacity-80 cursor-pointer border-none"
                    style={{
                        backgroundColor: C.btnViewAllBg,
                        color:           C.btnViewAllText,
                        fontFamily:      T.fontFamily,
                        fontSize:        T.size.base,
                        fontWeight:      T.weight.bold,
                        borderRadius:    '10px',
                        border:          `1px solid ${C.cardBorder}`,
                    }}
                >
                    Back to Course
                </button>
            </div>
        </div>
    );

    return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            <div className="max-w-6xl mx-auto space-y-5">

                {/* ── Header Card ─────────────────────────────────────────── */}
                <div className="p-5 md:p-6" style={sectionCard}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">

                        {/* Left: Back + Title */}
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => router.push(`/student/courses/${courseId}`)}
                                className="flex items-center justify-center transition-colors shrink-0 cursor-pointer border-none"
                                style={{
                                    width:           40,
                                    height:          40,
                                    backgroundColor: C.innerBg,
                                    borderRadius:    '10px',
                                    border:          `1px solid ${C.cardBorder}`,
                                    marginTop:       2,
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}
                            >
                                <MdArrowBack style={{ width: 18, height: 18, color: C.heading }} />
                            </button>

                            <div>
                                <h1
                                    style={{
                                        fontFamily:   T.fontFamily,
                                        fontSize:     T.size['2xl'],
                                        fontWeight:   T.weight.bold,
                                        color:        C.heading,
                                        marginBottom: 10,
                                        lineHeight:   T.leading.tight,
                                    }}
                                >
                                    {assignment.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    {assignment.dueDate && (
                                        <span
                                            className="flex items-center gap-1.5 px-3 py-1.5"
                                            style={{
                                                backgroundColor: C.warningBg,
                                                color:           C.warning,
                                                border:          `1px solid ${C.warningBorder}`,
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.bold,
                                                borderRadius:    '10px',
                                            }}
                                        >
                                            <MdCalendarMonth style={{ width: 14, height: 14 }} />
                                            Due: {new Date(assignment.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                    <span
                                        className="flex items-center gap-1.5 px-3 py-1.5"
                                        style={{
                                            backgroundColor: C.innerBg,
                                            color:           C.btnPrimary,
                                            border:          `1px solid ${C.cardBorder}`,
                                            fontFamily:      T.fontFamily,
                                            fontSize:        T.size.xs,
                                            fontWeight:      T.weight.bold,
                                            borderRadius:    '10px',
                                        }}
                                    >
                                        <MdEmojiEvents style={{ width: 14, height: 14 }} />
                                        {assignment.totalMarks} Points
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Status Badge */}
                        <div
                            className="px-5 py-3 text-center shrink-0"
                            style={{
                                borderRadius:    '10px',
                                border:          `1px solid ${
                                    isGraded    ? C.successBorder  :
                                    isSubmitted ? C.warningBorder  :
                                    C.cardBorder
                                }`,
                                backgroundColor:
                                    isGraded    ? C.successBg  :
                                    isSubmitted ? C.warningBg  :
                                    C.innerBg,
                            }}
                        >
                            {isGraded ? (
                                <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.success }}>
                                    <MdCheckCircle style={{ width: 20, height: 20 }} />
                                    <span>Graded: {submission.grade} / {assignment.totalMarks}</span>
                                </div>
                            ) : isSubmitted ? (
                                <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.warning }}>
                                    <MdAccessTime style={{ width: 20, height: 20 }} />
                                    <span>Submitted, Pending Grade</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>
                                    <MdWarning style={{ width: 20, height: 20 }} />
                                    <span>Pending Submission</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Main Grid ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Left: Instructions + Rubric ─────────────────────── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Instructions Card */}
                        <div className="overflow-hidden" style={sectionCard}>
                            <CardHeader icon={MdArticle} title="Instructions" />
                            <div className="p-5 md:p-6">
                                <p
                                    className="leading-relaxed whitespace-pre-wrap"
                                    style={{
                                        fontFamily:  T.fontFamily,
                                        fontSize:    T.size.base,
                                        color:       C.heading,
                                        fontWeight:  T.weight.medium,
                                        margin:      0,
                                        lineHeight:  T.leading.relaxed,
                                    }}
                                >
                                    {assignment.description}
                                </p>

                                {/* Reference Materials */}
                                {assignment.attachments?.length > 0 && (
                                    <div className="mt-6">
                                        <p
                                            className="mb-3 uppercase"
                                            style={{
                                                fontFamily:    T.fontFamily,
                                                fontSize:      T.size.xs,
                                                fontWeight:    T.weight.bold,
                                                color:         C.text,
                                                letterSpacing: T.tracking.wider,
                                            }}
                                        >
                                            Reference Materials
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {assignment.attachments.map((file, idx) => (
                                                <a
                                                    key={idx}
                                                    href={resolveMediaUrl(file.url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-3.5 transition-all no-underline"
                                                    style={{
                                                        backgroundColor: C.innerBg,
                                                        border:          `1px solid ${C.cardBorder}`,
                                                        borderRadius:    '10px',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = S.cardHover; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className="flex items-center justify-center p-2 shrink-0"
                                                            style={{ backgroundColor: C.cardBg, borderRadius: '10px' }}
                                                        >
                                                            {String(file.type || '').toLowerCase().startsWith('image/')
                                                                ? <img src={resolveMediaUrl(file.url)} alt={file.name || 'attachment'} className="w-8 h-8 object-cover" style={{ borderRadius: '8px' }} />
                                                                : <MdArticle style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                            }
                                                        </div>
                                                        <p className="truncate m-0" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                                            {file.name}
                                                        </p>
                                                    </div>
                                                    <MdDownload style={{ width: 16, height: 16, color: C.text, flexShrink: 0 }} />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grading Rubric Card */}
                        {assignment.rubric?.length > 0 && (
                            <div className="overflow-hidden" style={sectionCard}>
                                <CardHeader icon={MdEmojiEvents} title="Grading Rubric" iconBg={C.warningBg} iconColor={C.warning} />
                                <div style={{ borderColor: C.cardBorder }}>
                                    {assignment.rubric.map((item, idx) => {
                                        const gradedScore = isGraded
                                            ? submission.rubricScores?.find(rs => rs.criterionId === item._id)
                                            : null;
                                        return (
                                            <div
                                                key={idx}
                                                className="p-5 transition-colors"
                                                style={{
                                                    borderBottom:    idx < assignment.rubric.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
                                                    backgroundColor: gradedScore ? `${C.success}08` : 'transparent',
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3
                                                        style={{
                                                            fontFamily:  T.fontFamily,
                                                            fontSize:    T.size.base,
                                                            fontWeight:  T.weight.semibold,
                                                            color:       C.heading,
                                                            margin:      0,
                                                        }}
                                                    >
                                                        {item.criterion}
                                                    </h3>
                                                    <span
                                                        className="px-3 py-1 shrink-0"
                                                        style={{
                                                            fontFamily:      T.fontFamily,
                                                            fontSize:        T.size.xs,
                                                            fontWeight:      T.weight.bold,
                                                            borderRadius:    '10px',
                                                            border:          `1px solid ${gradedScore ? C.successBorder : C.cardBorder}`,
                                                            backgroundColor: gradedScore ? C.successBg   : C.innerBg,
                                                            color:           gradedScore ? C.success      : C.text,
                                                        }}
                                                    >
                                                        {gradedScore ? `${gradedScore.points} / ` : ''}{item.points} pts
                                                    </span>
                                                </div>
                                                <p
                                                    style={{
                                                        fontFamily:  T.fontFamily,
                                                        fontSize:    T.size.xs,
                                                        color:       C.text,
                                                        fontWeight:  T.weight.medium,
                                                        margin:      0,
                                                        lineHeight:  T.leading.relaxed,
                                                    }}
                                                >
                                                    {item.description}
                                                </p>

                                                {/* Tutor Feedback on criterion */}
                                                {gradedScore?.comments && (
                                                    <div
                                                        className="mt-4 p-4 flex items-start gap-3"
                                                        style={{
                                                            backgroundColor: C.successBg,
                                                            border:          `1px solid ${C.successBorder}`,
                                                            borderRadius:    '10px',
                                                        }}
                                                    >
                                                        <MdMessage style={{ width: 16, height: 16, color: C.success, flexShrink: 0, marginTop: 2 }} />
                                                        <div>
                                                            <p
                                                                style={{
                                                                    fontFamily:    T.fontFamily,
                                                                    fontSize:      T.size.xs,
                                                                    fontWeight:    T.weight.bold,
                                                                    color:         C.success,
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: T.tracking.wider,
                                                                    margin:        '0 0 2px 0',
                                                                }}
                                                            >
                                                                Tutor Feedback
                                                            </p>
                                                            <p
                                                                style={{
                                                                    fontFamily:  T.fontFamily,
                                                                    fontSize:    T.size.base,
                                                                    fontWeight:  T.weight.semibold,
                                                                    color:       C.heading,
                                                                    margin:      0,
                                                                }}
                                                            >
                                                                {gradedScore.comments}
                                                            </p>
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

                    {/* ── Right: Submission Panel ──────────────────────────── */}
                    <div className="lg:col-span-1 space-y-5">

                        {/* Overall Feedback (graded) */}
                        {isGraded && submission.feedback && (
                            <div
                                className="p-5"
                                style={{
                                    background:   'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                                    border:       `1px solid ${C.successBorder}`,
                                    borderRadius: R['2xl'],
                                    boxShadow:    S.card,
                                }}
                            >
                                <h2
                                    className="flex items-center gap-2 mb-3"
                                    style={{
                                        fontFamily:  T.fontFamily,
                                        fontSize:    T.size.lg,
                                        fontWeight:  T.weight.bold,
                                        color:       '#065F46',
                                        margin:      '0 0 12px 0',
                                    }}
                                >
                                    <MdMessage style={{ width: 20, height: 20 }} /> Overall Feedback
                                </h2>
                                <p
                                    style={{
                                        fontFamily:  T.fontFamily,
                                        fontSize:    T.size.base,
                                        fontWeight:  T.weight.semibold,
                                        lineHeight:  T.leading.relaxed,
                                        color:       '#065F46',
                                        margin:      0,
                                    }}
                                >
                                    {submission.feedback}
                                </p>
                            </div>
                        )}

                        {/* Submission Form Card */}
                        <div className="overflow-hidden sticky top-24" style={sectionCard}>
                            <CardHeader
                                icon={MdAssignment}
                                title="Your Work"
                                right={
                                    isSubmitted && !isGraded ? (
                                        <button
                                            onClick={() => assignmentService.submitAssignment(assignmentId, { content, attachments }).then(() => toast.success('Updated!'))}
                                            className="px-3 py-1.5 transition-all cursor-pointer border hover:opacity-80"
                                            style={{
                                                backgroundColor: C.cardBg,
                                                color:           C.btnPrimary,
                                                borderColor:     C.cardBorder,
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.bold,
                                                borderRadius:    '10px',
                                            }}
                                        >
                                            Update Submission
                                        </button>
                                    ) : null
                                }
                            />

                            <div className="p-5">
                                <form onSubmit={handleSubmit} className="space-y-5">

                                    {/* Text Response */}
                                    <div>
                                        <label
                                            style={{
                                                display:       'block',
                                                fontFamily:    T.fontFamily,
                                                fontSize:      T.size.xs,
                                                fontWeight:    T.weight.bold,
                                                color:         C.text,
                                                textTransform: 'uppercase',
                                                letterSpacing: T.tracking.wider,
                                                marginBottom:  8,
                                            }}
                                        >
                                            Text Response
                                        </label>
                                        <textarea
                                            rows={6}
                                            value={content}
                                            onChange={e => setContent(e.target.value)}
                                            disabled={isGraded}
                                            placeholder="Type your answer or paste links here..."
                                            className="w-full outline-none transition-all disabled:opacity-60"
                                            style={{
                                                border:          `1px solid ${C.cardBorder}`,
                                                color:           C.heading,
                                                backgroundColor: C.innerBg,
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.base,
                                                fontWeight:      T.weight.medium,
                                                borderRadius:    '10px',
                                                padding:         '12px 16px',
                                                resize:          'none',
                                            }}
                                            onFocus={onFocusHandler}
                                            onBlur={onBlurHandler}
                                        />
                                    </div>

                                    {/* Attached Files */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label
                                                style={{
                                                    fontFamily:    T.fontFamily,
                                                    fontSize:      T.size.xs,
                                                    fontWeight:    T.weight.bold,
                                                    color:         C.text,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: T.tracking.wider,
                                                }}
                                            >
                                                Attached Files
                                            </label>
                                            {!isGraded && (
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('file-upload').click()}
                                                    className="cursor-pointer border-none bg-transparent hover:opacity-70"
                                                    style={{
                                                        fontFamily:  T.fontFamily,
                                                        fontSize:    T.size.xs,
                                                        fontWeight:  T.weight.bold,
                                                        color:       C.btnPrimary,
                                                    }}
                                                >
                                                    + Add File
                                                </button>
                                            )}
                                        </div>

                                        {/* Drop Zone */}
                                        {!isGraded && (
                                            <div
                                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                                onDragLeave={() => setDragOver(false)}
                                                onDrop={handleDrop}
                                                onClick={() => document.getElementById('file-upload').click()}
                                                className="border-2 border-dashed p-5 text-center transition-colors cursor-pointer mb-3"
                                                style={{
                                                    borderColor:     dragOver ? C.btnPrimary : C.cardBorder,
                                                    backgroundColor: dragOver ? `${C.btnPrimary}0d` : C.innerBg,
                                                    borderRadius:    '10px',
                                                }}
                                            >
                                                <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
                                                <MdUpload style={{ width: 22, height: 22, color: C.text, margin: '0 auto 6px' }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                    Drag & drop or click to attach files
                                                </p>
                                            </div>
                                        )}

                                        {/* File List */}
                                        {attachments.length > 0 && (
                                            <div className="space-y-2">
                                                {attachments.map((file, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-3"
                                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div
                                                                className="flex items-center justify-center p-2 shrink-0"
                                                                style={{ backgroundColor: C.cardBg, borderRadius: '10px' }}
                                                            >
                                                                {String(file.type || '').toLowerCase().startsWith('image/')
                                                                    ? <img src={resolveMediaUrl(file.url)} alt={file.name || 'attachment'} className="w-8 h-8 object-cover" style={{ borderRadius: '8px' }} />
                                                                    : <MdArticle style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                                }
                                                            </div>
                                                            <p className="truncate m-0" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.heading }}>
                                                                {file.name}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1 shrink-0">
                                                            <a
                                                                href={resolveMediaUrl(file.url)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center cursor-pointer transition-colors"
                                                                style={{ width: 32, height: 32, borderRadius: '10px', color: C.btnPrimary }}
                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <MdDownload style={{ width: 16, height: 16 }} />
                                                            </a>
                                                            {!isGraded && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                                                                    className="flex items-center justify-center cursor-pointer border-none bg-transparent transition-colors"
                                                                    style={{ width: 32, height: 32, borderRadius: '10px', color: C.danger }}
                                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.dangerBg}
                                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                >
                                                                    <MdDelete style={{ width: 16, height: 16 }} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    {!isGraded && (
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-3.5 text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer border-none"
                                            style={{
                                                background:   C.gradientBtn,
                                                fontFamily:   T.fontFamily,
                                                fontSize:     T.size.base,
                                                fontWeight:   T.weight.bold,
                                                borderRadius: '10px',
                                                boxShadow:    S.btn,
                                            }}
                                        >
                                            {submitting ? (
                                                <MdHourglassEmpty style={{ width: 20, height: 20 }} className="animate-spin" />
                                            ) : isSubmitted ? (
                                                <><MdCheckCircle style={{ width: 20, height: 20 }} /> Saved & Submitted</>
                                            ) : (
                                                <><MdSend style={{ width: 20, height: 20 }} /> Submit Assignment</>
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