'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdArrowBack,
    MdHourglassEmpty,
    MdCalendarMonth,
    MdArticle,
    MdDelete,
    MdSave,
    MdUpload,
    MdAssignment,
    MdAdd,
} from 'react-icons/md';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
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

const baseInputStyle = {
    backgroundColor: C.innerBg,
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

// ─── Section Header (inside cards) ───────────────────────────────────────────
function CardSectionHeader({ title, right }) {
    return (
        <div
            className="flex items-center justify-between pb-3 mb-4"
            style={{ borderBottom: `1px solid ${C.cardBorder}` }}
        >
            <h3
                style={{
                    fontFamily:  T.fontFamily,
                    fontSize:    T.size.lg,
                    fontWeight:  T.weight.semibold,
                    color:       C.heading,
                    margin:      0,
                }}
            >
                {title}
            </h3>
            {right}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NewAssignmentPage({ params }) {
    const router            = useRouter();
    const { id: courseId }  = use(params);
    const { institute }     = useInstitute();

    const [submitting, setSubmitting]             = useState(false);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [dragOver, setDragOver]                 = useState(false);

    const [formData, setFormData] = useState({
        title: '', description: '', dueDate: '', totalMarks: 100,
        status: 'published', attachments: [],
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
        rubric: [
            { criterion: 'Originality',   description: "Student's work is original",               points: 20 },
            { criterion: 'Completeness',  description: 'All parts of the assignment are addressed', points: 80 },
        ],
    });

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            try {
                const [batchesRes, studentsRes] = await Promise.all([
                    api.get('/batches'),
                    api.get(`/enrollments/students/${courseId}`),
                ]);
                const batchList = (batchesRes.data?.batches || []).filter(b => {
                    const bId = b.courseId?._id || b.courseId;
                    return bId === courseId;
                });
                setAvailableBatches(batchList);
                setAvailableStudents(
                    (studentsRes.data?.students || [])
                        .map(item => ({ _id: item.studentId?._id, name: item.studentId?.name, email: item.studentId?.email }))
                        .filter(i => i._id)
                );
            } catch { console.error('Failed to fetch audience targets'); }
        };
        if (courseId) fetchAudienceTargets();
    }, [courseId]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            audience: { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null },
        }));
    }, [institute?._id]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error('Title is required');
        setSubmitting(true);
        try {
            const data = {
                ...formData, courseId,
                totalMarks: formData.rubric.reduce((acc, c) => acc + Number(c.points), 0),
                audience:   { ...formData.audience, instituteId: formData.audience?.instituteId || institute?._id || null },
                scope:      formData.audience?.scope,
                batchId:    formData.audience?.scope === 'batch' ? (formData.audience.batchIds?.[0] || null) : null,
            };
            await assignmentService.createAssignment(data);
            toast.success('Assignment created successfully');
            router.push(`/tutor/courses/${courseId}/assignments`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create assignment');
        } finally { setSubmitting(false); }
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || e.dataTransfer?.files || []);
        if (files.length === 0) return;
        setSubmitting(true);
        const newAttachments = [];
        for (const file of files) {
            if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name} is too large (Max 20MB)`); continue; }
            const uploadData = new FormData();
            uploadData.append('file', file);
            try {
                const res = await api.post('/upload/file', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (res.data?.success || res.data?.fileUrl)
                    newAttachments.push({ name: res.data.name || file.name, url: res.data.fileUrl || res.data.url, type: res.data.type || file.type });
            } catch { toast.error(`Failed to attach ${file.name}`); }
        }
        if (newAttachments.length > 0) {
            setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] }));
            toast.success('Files attached successfully!');
        }
        setSubmitting(false);
        if (e.target) e.target.value = '';
    };

    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e); };

    const addRubric    = () => setFormData(prev => ({ ...prev, rubric: [...prev.rubric, { criterion: '', description: '', points: 0 }] }));
    const removeRubric = (idx) => setFormData(prev => ({ ...prev, rubric: prev.rubric.filter((_, i) => i !== idx) }));
    const updateRubric = (idx, field, value) => setFormData(prev => { const r = [...prev.rubric]; r[idx][field] = value; return { ...prev, rubric: r }; });

    const totalRubricPts = formData.rubric.reduce((a, c) => a + Number(c.points || 0), 0);

    return (
        <div
            className="w-full min-h-screen pb-24 space-y-5"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5"
                style={sectionCard}
            >
                <div className="flex items-center gap-3">
                    {/* Back */}
                    <button
                        type="button"
                        onClick={() => router.back()}
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
                            Create Assignment
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
                            Configure and publish a new assignment
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 md:flex-none h-10 px-6 cursor-pointer border-none transition-opacity hover:opacity-80"
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
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={submitting}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60"
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
                        {submitting
                            ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />
                            : <MdSave style={{ width: 16, height: 16 }} />
                        }
                        Create Assignment
                    </button>
                </div>
            </div>

            {/* ── Form Grid ───────────────────────────────────────────────── */}
            <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left: Main Details ──────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Assignment Details Card */}
                    <div className="p-6 space-y-5" style={sectionCard}>
                        <CardSectionHeader title="Assignment Details" />

                        {/* Title */}
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
                                Assignment Title *
                            </label>
                            <input
                                type="text" required
                                value={formData.title}
                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Business Ethics Case Study"
                                style={baseInputStyle}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>

                        {/* Description */}
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
                                Description *
                            </label>
                            <textarea
                                required rows={5}
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                placeholder="Write the assignment details here..."
                                style={{ ...baseInputStyle, resize: 'vertical', minHeight: '120px' }}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>

                        {/* Drag & Drop Attachments */}
                        <div className="space-y-3">
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
                                Reference Attachments
                            </label>

                            {/* Drop Zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('attachment-upload').click()}
                                className="border-2 border-dashed p-6 text-center transition-colors cursor-pointer"
                                style={{
                                    borderColor:     dragOver ? C.btnPrimary : C.cardBorder,
                                    backgroundColor: dragOver ? `${C.btnPrimary}0d` : C.innerBg,
                                    borderRadius:    '10px',
                                }}
                            >
                                <input
                                    type="file" multiple
                                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                    onChange={handleFileUpload}
                                    className="hidden" id="attachment-upload"
                                />
                                <MdUpload style={{ width: 24, height: 24, color: C.btnPrimary, margin: '0 auto 8px' }} />
                                <p
                                    style={{
                                        fontFamily:  T.fontFamily,
                                        fontSize:    T.size.base,
                                        fontWeight:  T.weight.semibold,
                                        color:       C.text,
                                        margin:      0,
                                    }}
                                >
                                    Drag & drop or click to attach PDFs/Docs
                                </p>
                            </div>

                            {/* File List */}
                            {formData.attachments.length > 0 && (
                                <div className="space-y-2 mt-3">
                                    {formData.attachments.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-3"
                                            style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex items-center justify-center p-2"
                                                    style={{ backgroundColor: C.cardBg, borderRadius: '10px' }}
                                                >
                                                    <MdArticle style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                </div>
                                                <div>
                                                    <p
                                                        className="truncate w-48 sm:w-auto"
                                                        style={{
                                                            fontFamily:  T.fontFamily,
                                                            fontSize:    T.size.base,
                                                            fontWeight:  T.weight.semibold,
                                                            color:       C.heading,
                                                            margin:      0,
                                                        }}
                                                    >
                                                        {file.name}
                                                    </p>
                                                    <p
                                                        style={{
                                                            fontFamily:    T.fontFamily,
                                                            fontSize:      T.size.xs,
                                                            color:         C.text,
                                                            textTransform: 'uppercase',
                                                            margin:        0,
                                                        }}
                                                    >
                                                        {file.type?.split('/')[1] || 'File'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) }))}
                                                className="flex shrink-0 items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-75"
                                                style={{ width: 32, height: 32, backgroundColor: C.dangerBg, borderRadius: '10px' }}
                                            >
                                                <MdDelete style={{ width: 14, height: 14, color: C.danger }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grading Rubric Card */}
                    <div className="p-6 space-y-4" style={sectionCard}>
                        <CardSectionHeader
                            title="Grading Rubric"
                            right={
                                <span
                                    style={{
                                        fontFamily:  T.fontFamily,
                                        fontSize:    T.size.lg,
                                        fontWeight:  T.weight.bold,
                                        color:       C.btnPrimary,
                                    }}
                                >
                                    {totalRubricPts} Points
                                </span>
                            }
                        />

                        <div className="space-y-4">
                            {formData.rubric.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex gap-3 p-4"
                                    style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                >
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-3">
                                            {/* Criterion name */}
                                            <input
                                                type="text" required
                                                value={item.criterion}
                                                onChange={e => updateRubric(idx, 'criterion', e.target.value)}
                                                placeholder="Criterion Name"
                                                style={{ ...baseInputStyle, flex: 1, backgroundColor: C.cardBg }}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            />
                                            {/* Points */}
                                            <div className="relative w-24">
                                                <input
                                                    type="number" required min="1"
                                                    value={item.points}
                                                    onChange={e => updateRubric(idx, 'points', Number(e.target.value))}
                                                    style={{
                                                        ...baseInputStyle,
                                                        paddingRight: '32px',
                                                        backgroundColor: C.cardBg,
                                                        color:           C.btnPrimary,
                                                        fontWeight:      T.weight.bold,
                                                    }}
                                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                />
                                                <span
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    style={{
                                                        fontFamily:  T.fontFamily,
                                                        fontSize:    T.size.xs,
                                                        fontWeight:  T.weight.bold,
                                                        color:       C.text,
                                                    }}
                                                >
                                                    pts
                                                </span>
                                            </div>
                                        </div>
                                        {/* Description */}
                                        <textarea
                                            rows={2}
                                            value={item.description}
                                            onChange={e => updateRubric(idx, 'description', e.target.value)}
                                            placeholder="Description..."
                                            style={{ ...baseInputStyle, resize: 'none', backgroundColor: C.cardBg }}
                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        />
                                    </div>
                                    {/* Delete criterion */}
                                    <button
                                        type="button"
                                        onClick={() => removeRubric(idx)}
                                        disabled={formData.rubric.length === 1}
                                        className="flex shrink-0 items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-40"
                                        style={{ width: 36, height: 36, backgroundColor: C.dangerBg, borderRadius: '10px', marginTop: 2 }}
                                    >
                                        <MdDelete style={{ width: 16, height: 16, color: C.danger }} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Criterion */}
                        <button
                            type="button"
                            onClick={addRubric}
                            className="flex items-center justify-center gap-2 w-full py-3 mt-2 cursor-pointer transition-opacity hover:opacity-80 border-2 border-dashed"
                            style={{
                                backgroundColor: C.innerBg,
                                borderColor:     C.cardBorder,
                                borderRadius:    '10px',
                                color:           C.btnPrimary,
                                fontFamily:      T.fontFamily,
                                fontSize:        T.size.base,
                                fontWeight:      T.weight.bold,
                            }}
                        >
                            <MdAdd style={{ width: 16, height: 16 }} /> Add Criterion
                        </button>
                    </div>
                </div>

                {/* ── Right: Settings ─────────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-5">
                    <div className="p-6 space-y-5" style={sectionCard}>
                        <CardSectionHeader title="Assignment Settings" />

                        {/* Due Date */}
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
                                Due Date & Time *
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local" required
                                    value={formData.dueDate}
                                    onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                                    style={{ ...baseInputStyle, paddingLeft: '38px' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                                <MdCalendarMonth
                                    className="absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{ width: 16, height: 16, color: C.text }}
                                />
                            </div>
                        </div>

                        {/* Status */}
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
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                style={baseInputStyle}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        {/* Audience */}
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
                                Audience
                            </label>
                            <div
                                style={{
                                    backgroundColor: C.innerBg,
                                    padding:         '16px',
                                    borderRadius:    '10px',
                                    border:          `1px solid ${C.cardBorder}`,
                                }}
                            >
                                <AudienceSelector
                                    value={formData.audience}
                                    onChange={audience => setFormData(p => ({ ...p, audience }))}
                                    availableBatches={availableBatches}
                                    availableStudents={availableStudents}
                                    allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                                    instituteId={institute?._id || null}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}