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
    MdAutoAwesome,
} from 'react-icons/md';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_RUBRIC = [
    { criterion: 'Originality',  description: "Student's work is original",               points: 20 },
    { criterion: 'Completeness', description: 'All parts of the assignment are addressed', points: 80 },
];

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

// ─── Card Section Header ──────────────────────────────────────────────────────
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
export default function EditAssignmentPage({ params }) {
    const router                              = useRouter();
    const { id: courseId, assignmentId }      = use(params);
    const { institute }                       = useInstitute();

    const [initialLoading, setInitialLoading]       = useState(true);
    const [submitting, setSubmitting]               = useState(false);
    const [availableBatches, setAvailableBatches]   = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);

    const [formData, setFormData] = useState({
        title: '', description: '', dueDate: '', totalMarks: 100,
        status: 'published', attachments: [],
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
        rubric: DEFAULT_RUBRIC,
    });

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            try {
                const [batchesRes, studentsRes] = await Promise.all([
                    api.get('/batches'),
                    api.get(`/enrollments/students/${courseId}`),
                ]);
                const batchList = (batchesRes.data?.batches || []).filter(batch => {
                    const batchCourseId = batch.courseId?._id || batch.courseId;
                    return batchCourseId === courseId;
                });
                setAvailableBatches(batchList);
                setAvailableStudents(
                    (studentsRes.data?.students || [])
                        .map(item => ({ _id: item.studentId?._id, name: item.studentId?.name, email: item.studentId?.email }))
                        .filter(item => item._id)
                );
            } catch {
                setAvailableBatches([]); setAvailableStudents([]);
            }
        };
        if (courseId) fetchAudienceTargets();
    }, [courseId]);

    useEffect(() => {
        const loadAssignment = async () => {
            try {
                const res = await assignmentService.getAssignmentDetails(assignmentId);
                if (!res.success || !res.assignment) {
                    toast.error('Assignment not found');
                    router.push(`/tutor/courses/${courseId}/assignments`);
                    return;
                }
                const assignment = res.assignment;
                const fallbackAudience = {
                    scope:      assignment.batchId ? 'batch' : assignment.instituteId ? 'institute' : 'global',
                    instituteId: assignment.instituteId || institute?._id || null,
                    batchIds:   assignment.batchId ? [String(assignment.batchId)] : [],
                    studentIds: [],
                };
                const rawAudience        = assignment.audience || fallbackAudience;
                const normalizedAudience = {
                    ...rawAudience,
                    instituteId: rawAudience.instituteId ? String(rawAudience.instituteId) : null,
                    batchIds:    (rawAudience.batchIds   || []).map(id => String(id)),
                    studentIds:  (rawAudience.studentIds || []).map(id => String(id)),
                };

                setFormData({
                    title:       assignment.title       || '',
                    description: assignment.description || '',
                    dueDate:     assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '',
                    totalMarks:  assignment.totalMarks  || 100,
                    status:      assignment.status      || 'published',
                    attachments: Array.isArray(assignment.attachments) ? assignment.attachments : [],
                    audience:    normalizedAudience,
                    rubric:      Array.isArray(assignment.rubric) && assignment.rubric.length > 0
                        ? assignment.rubric.map(item => ({
                            criterion:   item.criterion   || '',
                            description: item.description || '',
                            points:      Number(item.points || 0),
                          }))
                        : DEFAULT_RUBRIC,
                });
            } catch {
                toast.error('Failed to load assignment');
                router.push(`/tutor/courses/${courseId}/assignments`);
            } finally { setInitialLoading(false); }
        };
        if (assignmentId) loadAssignment();
    }, [assignmentId, courseId, institute?._id, router]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            audience: { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null },
        }));
    }, [institute?._id]);

    const handleUpdate = async (event) => {
        event.preventDefault();
        if (!formData.title.trim()) return toast.error('Title is required');
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                totalMarks: formData.rubric.reduce((total, criterion) => total + Number(criterion.points || 0), 0),
                audience:   { ...formData.audience, instituteId: formData.audience?.instituteId || institute?._id || null },
                scope:      formData.audience?.scope,
                batchId:    formData.audience?.scope === 'batch' ? formData.audience.batchIds?.[0] || null : null,
            };
            await assignmentService.updateAssignment(assignmentId, payload);
            toast.success('Assignment updated successfully');
            router.push(`/tutor/courses/${courseId}/assignments`);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update assignment');
        } finally { setSubmitting(false); }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);
        try {
            const res = await api.post('/upload/file', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, { name: res.data.name, url: res.data.fileUrl, type: res.data.type }],
                }));
                toast.success('File attached');
            }
        } catch { toast.error('Failed to attach file'); }
    };

    const addRubric    = () => setFormData(prev => ({ ...prev, rubric: [...prev.rubric, { criterion: '', description: '', points: 0 }] }));
    const removeRubric = (index) => setFormData(prev => ({ ...prev, rubric: prev.rubric.filter((_, idx) => idx !== index) }));
    const updateRubric = (index, field, value) => setFormData(prev => { const r = [...prev.rubric]; r[index][field] = value; return { ...prev, rubric: r }; });

    const totalRubricPoints = formData.rubric.reduce((acc, item) => acc + Number(item.points || 0), 0);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (initialLoading) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="relative w-12 h-12">
                <div
                    className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
            </div>
            <p style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium }}>
                Loading assignment...
            </p>
        </div>
    );

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
                        onClick={() => router.push(`/tutor/courses/${courseId}/assignments`)}
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
                            Edit Assignment
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
                            Update assignment details and grading rubric
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => router.push(`/tutor/courses/${courseId}/assignments`)}
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
                        onClick={handleUpdate}
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
                        Update Assignment
                    </button>
                </div>
            </div>

            {/* ── Form Grid ───────────────────────────────────────────────── */}
            <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left: Main Details ──────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Assignment Details Card */}
                    <div className="p-6 space-y-5" style={sectionCard}>
                        <CardSectionHeader title="Assignment Details" />

                        {/* Title */}
                        <div className="space-y-2">
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
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
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
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

                        {/* Attachments */}
                        <div className="space-y-3">
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                Attachments
                            </label>

                            {/* File List */}
                            {formData.attachments.length > 0 && (
                                <div className="space-y-2">
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
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                                        {file.name}
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, textTransform: 'uppercase', margin: 0 }}>
                                                        {file.type?.split('/')[1] || 'File'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) }))}
                                                className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-75"
                                                style={{ width: 32, height: 32, backgroundColor: C.dangerBg, borderRadius: '10px' }}
                                            >
                                                <MdDelete style={{ width: 14, height: 14, color: C.danger }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Button */}
                            <input type="file" onChange={handleFileUpload} className="hidden" id="edit-attachment-upload" />
                            <label
                                htmlFor="edit-attachment-upload"
                                className="flex items-center justify-center gap-2 w-full py-3 cursor-pointer transition-opacity hover:opacity-80 border-2 border-dashed"
                                style={{
                                    backgroundColor: C.innerBg,
                                    borderColor:     C.cardBorder,
                                    borderRadius:    '10px',
                                    color:           C.btnPrimary,
                                    fontFamily:      T.fontFamily,
                                    fontSize:        T.size.base,
                                    fontWeight:      T.weight.semibold,
                                }}
                            >
                                <MdUpload style={{ width: 16, height: 16 }} /> Attach Files
                            </label>
                        </div>
                    </div>

                    {/* Grading Rubric Card */}
                    <div className="p-6 space-y-4" style={sectionCard}>
                        <CardSectionHeader
                            title="Grading Rubric"
                            right={
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                    {totalRubricPoints} Points
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
                                                        paddingRight:    '32px',
                                                        backgroundColor: C.cardBg,
                                                        color:           C.btnPrimary,
                                                        fontWeight:      T.weight.bold,
                                                    }}
                                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                />
                                                <span
                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}
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
                                    {/* Delete */}
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
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
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
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
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
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
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