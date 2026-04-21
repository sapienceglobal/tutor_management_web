'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Calendar, FileText, Trash2, Save, Upload, ClipboardList, Plus } from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/tutorTokens';

const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: '#E3DFF8',
    border: '1.5px solid transparent',
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

export default function NewAssignmentPage({ params }) {
    const router = useRouter();
    const { id: courseId } = use(params);
    const { institute } = useInstitute();

    const [submitting, setSubmitting] = useState(false);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [dragOver, setDragOver] = useState(false); // 🌟 Added for Drag & Drop

    const [formData, setFormData] = useState({
        title: '', description: '', dueDate: '', totalMarks: 100,
        status: 'published', attachments: [],
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
        rubric: [
            { criterion: 'Originality', description: "Student's work is original", points: 20 },
            { criterion: 'Completeness', description: 'All parts of the assignment are addressed', points: 80 },
        ]
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
                setAvailableStudents((studentsRes.data?.students || []).map(item => ({
                    _id: item.studentId?._id, name: item.studentId?.name, email: item.studentId?.email,
                })).filter(i => i._id));
            } catch { console.error('Failed to fetch audience targets'); }
        };
        if (courseId) fetchAudienceTargets();
    }, [courseId]);

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            audience: { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null }
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
                audience: { ...formData.audience, instituteId: formData.audience?.instituteId || institute?._id || null },
                scope: formData.audience?.scope,
                batchId: formData.audience?.scope === 'batch' ? (formData.audience.batchIds?.[0] || null) : null,
            };
            await assignmentService.createAssignment(data);
            toast.success('Assignment created successfully');
            router.push(`/tutor/courses/${courseId}/assignments`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create assignment');
        } finally { setSubmitting(false); }
    };

    // 🌟 Enhanced Multi-File Uploader
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || e.dataTransfer?.files || []);
        if (files.length === 0) return;

        setSubmitting(true);
        const newAttachments = [];

        for (const file of files) {
            if (file.size > 20 * 1024 * 1024) {
                toast.error(`${file.name} is too large (Max 20MB)`);
                continue;
            }
            const uploadData = new FormData();
            uploadData.append('file', file);
            try {
                const res = await api.post('/upload/file', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (res.data?.success || res.data?.fileUrl) {
                    newAttachments.push({ name: res.data.name || file.name, url: res.data.fileUrl || res.data.url, type: res.data.type || file.type });
                }
            } catch {
                toast.error(`Failed to attach ${file.name}`);
            }
        }

        if (newAttachments.length > 0) {
            setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...newAttachments] }));
            toast.success('Files attached successfully!');
        }
        setSubmitting(false);
        if (e.target) e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileUpload(e);
    };

    const addRubric = () => setFormData(prev => ({ ...prev, rubric: [...prev.rubric, { criterion: '', description: '', points: 0 }] }));
    const removeRubric = (idx) => setFormData(prev => ({ ...prev, rubric: prev.rubric.filter((_, i) => i !== idx) }));
    const updateRubric = (idx, field, value) => setFormData(prev => { const r = [...prev.rubric]; r[idx][field] = value; return { ...prev, rubric: r }; });

    const totalRubricPts = formData.rubric.reduce((a, c) => a + Number(c.points || 0), 0);

    return (
        <div className="w-full min-h-screen p-6 pb-24 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* Header */}
            <div className="flex flex-col md:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                        <ArrowLeft size={18} color={C.heading} />
                    </button>
                    <div>
                        <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            <ClipboardList size={20} color={C.btnPrimary} /> Create Assignment
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>Configure and publish a new assignment</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button type="button" onClick={() => router.back()} className="flex-1 md:flex-none h-10 px-6 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-80"
                        style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        Cancel
                    </button>
                    <button onClick={handleCreate} disabled={submitting} className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Create Assignment
                    </button>
                </div>
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 space-y-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '12px' }}>Assignment Details</h3>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assignment Title *</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Business Ethics Case Study" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                        </div>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description *</label>
                            <textarea required rows={5} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                placeholder="Write the assignment details here..." style={{ ...baseInputStyle, resize: 'vertical', minHeight: '120px' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                        </div>

                        {/* 🌟 Premium Drag & Drop Attachments */}
                        <div className="space-y-3">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Reference Attachments
                            </label>

                            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className="border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer"
                                style={{ borderColor: dragOver ? C.btnPrimary : C.cardBorder, backgroundColor: dragOver ? `${C.btnPrimary}10` : '#E3DFF8' }}
                                onClick={() => document.getElementById('attachment-upload').click()}>
                                <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" id="attachment-upload" />
                                <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: C.btnPrimary }} />
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Drag & drop or click to attach PDFs/Docs</p>
                            </div>

                            {formData.attachments.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    {formData.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.md }}>
                                                    <FileText size={16} color={C.btnPrimary} />
                                                </div>
                                                <div>
                                                    <p className="truncate w-48 sm:w-auto" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{file.name}</p>
                                                    <p style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', margin: 0 }}>{file.type?.split('/')[1] || 'File'}</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) }))}
                                                className="w-8 h-8 flex shrink-0 items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-70" style={{ backgroundColor: C.dangerBg, borderRadius: R.md }}>
                                                <Trash2 size={14} color={C.danger} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 space-y-4" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Grading Rubric</h3>
                            <span style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.btnPrimary }}>{totalRubricPts} Points</span>
                        </div>
                        <div className="space-y-4">
                            {formData.rubric.map((item, idx) => (
                                <div key={idx} className="flex gap-3 p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-3">
                                            <input type="text" required value={item.criterion} onChange={e => updateRubric(idx, 'criterion', e.target.value)}
                                                placeholder="Criterion Name" style={{ ...baseInputStyle, flex: 1, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                            <div className="relative w-24">
                                                <input type="number" required min="1" value={item.points} onChange={e => updateRubric(idx, 'points', Number(e.target.value))}
                                                    style={{ ...baseInputStyle, paddingRight: '32px', backgroundColor: C.surfaceWhite, color: C.btnPrimary, fontWeight: T.weight.black }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>pts</span>
                                            </div>
                                        </div>
                                        <textarea rows={2} value={item.description} onChange={e => updateRubric(idx, 'description', e.target.value)}
                                            placeholder="Description..." style={{ ...baseInputStyle, resize: 'none', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    </div>
                                    <button type="button" onClick={() => removeRubric(idx)} disabled={formData.rubric.length === 1}
                                        className="w-9 h-9 flex shrink-0 items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50" style={{ backgroundColor: C.dangerBg, borderRadius: R.md, marginTop: '2px' }}>
                                        <Trash2 size={16} color={C.danger} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addRubric} className="flex items-center justify-center gap-2 w-full py-3 mt-2 cursor-pointer transition-opacity hover:opacity-80"
                            style={{ backgroundColor: '#E3DFF8', border: `2px dashed ${C.cardBorder}`, borderRadius: R.xl, color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <Plus size={16} /> Add Criterion
                        </button>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 space-y-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '12px' }}>Assignment Settings</h3>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Date & Time *</label>
                            <div className="relative">
                                <input type="datetime-local" required value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                                    style={{ ...baseInputStyle, paddingLeft: '36px' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" color={C.textMuted} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                            <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audience</label>
                            <div style={{ backgroundColor: '#E3DFF8', padding: '16px', borderRadius: R.xl }}>
                                <AudienceSelector value={formData.audience} onChange={(audience) => setFormData(p => ({ ...p, audience }))}
                                    availableBatches={availableBatches} availableStudents={availableStudents}
                                    allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                                    instituteId={institute?._id || null} />
                            </div>
                        </div>

                    </div>
                </div>
            </form>
        </div>
    );
}