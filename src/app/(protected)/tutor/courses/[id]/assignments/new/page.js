'use client';
// ─── NewAssignmentPage.jsx ────────────────────────────────────────────────────

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, Calendar, FileText,
    Trash2, Save, Upload, X, ClipboardList, AlertCircle, Plus
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/tutorTokens';

export default function NewAssignmentPage({ params }) {
    const router = useRouter();
    const { id: courseId } = use(params);
    const { institute }    = useInstitute();

    const [submitting, setSubmitting]             = useState(false);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);

    const [formData, setFormData] = useState({
        title: '', description: '', dueDate: '', totalMarks: 100,
        status: 'published', attachments: [],
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
        rubric: [
            { criterion: 'Originality',   description: "Student's work is original",               points: 20 },
            { criterion: 'Completeness',  description: 'All parts of the assignment are addressed', points: 80 },
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
            toast.error(err.response?.data?.message || 'Failed to create assignment');
        } finally { setSubmitting(false); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const uploadData = new FormData(); uploadData.append('file', file);
        try {
            const res = await api.post('/upload/file', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setFormData(prev => ({ ...prev, attachments: [...prev.attachments, { name: res.data.name, url: res.data.fileUrl, type: res.data.type }] }));
                toast.success('File attached');
            }
        } catch { toast.error('Failed to attach file'); }
    };

    const addRubric    = () => setFormData(prev => ({ ...prev, rubric: [...prev.rubric, { criterion: '', description: '', points: 0 }] }));
    const removeRubric = (idx) => setFormData(prev => ({ ...prev, rubric: prev.rubric.filter((_, i) => i !== idx) }));
    const updateRubric = (idx, field, value) => setFormData(prev => { const r = [...prev.rubric]; r[idx][field] = value; return { ...prev, rubric: r }; });

    const totalRubricPts = formData.rubric.reduce((a, c) => a + Number(c.points || 0), 0);

    const inp = { ...cx.input(), width: '100%', padding: '10px 14px' };
    const applyFocus  = (e) => Object.assign(e.target.style, cx.inputFocus);
    const removeFocus = (e) => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; };

    const SectionBar = ({ children }) => (
        <h2 className="flex items-center gap-2 pb-2"
            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, borderBottom: `1px solid ${C.cardBorder}` }}>
            <span className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: C.btnPrimary }} />
            {children}
        </h2>
    );

    return (
        <div className="space-y-5 pb-24" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ backgroundColor: C.innerBg, color: C.textMuted }}>
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: FX.primary15, border: `1px solid ${FX.primary25}` }}>
                            <ClipboardList className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                        </div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            Create Assignment
                        </h1>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        Configure and publish a new assignment
                    </p>
                </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">

                {/* ── Basic Info ─────────────────────────────────────────── */}
                <div className="rounded-2xl p-6 space-y-5"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <SectionBar>Basic Information</SectionBar>

                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, marginBottom: 6 }}>
                            Assignment Title <span style={{ color: C.danger }}>*</span>
                        </label>
                        <input type="text" required value={formData.title}
                            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. Final Project Submission"
                            style={inp} onFocus={applyFocus} onBlur={removeFocus} />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, marginBottom: 6 }}>
                            Instructions / Description <span style={{ color: C.danger }}>*</span>
                        </label>
                        <textarea required rows={4} value={formData.description}
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                            placeholder="Describe the assignment requirements and expected deliverables..."
                            style={{ ...inp, resize: 'none' }}
                            onFocus={applyFocus} onBlur={removeFocus} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div>
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, marginBottom: 6 }}>
                                Due Date & Time <span style={{ color: C.danger }}>*</span>
                            </label>
                            <div className="relative">
                                <input type="datetime-local" required value={formData.dueDate}
                                    onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                                    style={{ ...inp, paddingLeft: 40 }}
                                    onFocus={applyFocus} onBlur={removeFocus} />
                                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ color: C.textMuted }} />
                            </div>
                        </div>
                        {/* Status */}
                        <div>
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, marginBottom: 6 }}>
                                Status
                            </label>
                            <select value={formData.status}
                                onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                style={{ ...inp, cursor: 'pointer', appearance: 'none' }}>
                                <option value="published">Published (Visible immediately)</option>
                                <option value="draft">Draft (Hidden from students)</option>
                            </select>
                        </div>
                    </div>

                    <AudienceSelector value={formData.audience}
                        onChange={(audience) => setFormData(p => ({ ...p, audience }))}
                        availableBatches={availableBatches} availableStudents={availableStudents}
                        allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                        instituteId={institute?._id || null} />

                    {/* Attachments */}
                    <div className="space-y-2">
                        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, marginBottom: 6 }}>
                            Reference Materials
                        </label>
                        {formData.attachments.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl" style={{ backgroundColor: FX.primary12 }}>
                                        <FileText className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text }}>
                                            {file.name}
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, textTransform: 'uppercase' }}>
                                            {file.type?.split('/')[1] || 'File'}
                                        </p>
                                    </div>
                                </div>
                                <button type="button"
                                    onClick={() => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) }))}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                    style={{ backgroundColor: C.dangerBg }}>
                                    <Trash2 className="w-3.5 h-3.5" style={{ color: C.danger }} />
                                </button>
                            </div>
                        ))}
                        <input type="file" onChange={handleFileUpload} className="hidden" id="attachment-upload" />
                        <label htmlFor="attachment-upload"
                            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-sm font-semibold cursor-pointer transition-all"
                            style={{ borderColor: FX.primary25, color: C.btnPrimary, fontFamily: T.fontFamily }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = FX.primary06; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <Upload className="w-4 h-4" /> Attach File
                        </label>
                    </div>
                </div>

                {/* ── Rubric Builder ──────────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-4 flex items-center justify-between"
                        style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                        <div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                Grading Rubric
                            </h2>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                                Define the criteria and points for grading
                            </p>
                        </div>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.btnPrimary }}>
                            {totalRubricPts} pts
                        </span>
                    </div>

                    <div className="p-5 space-y-3">
                        {formData.rubric.map((item, idx) => (
                            <div key={idx} className="flex gap-3 p-4 rounded-2xl"
                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-3">
                                        <input type="text" required value={item.criterion}
                                            onChange={e => updateRubric(idx, 'criterion', e.target.value)}
                                            placeholder="Criterion Name (e.g. Grammar)"
                                            style={{ ...cx.input(), flex: 1, height: 36, padding: '0 12px', fontWeight: T.weight.semibold }}
                                            onFocus={applyFocus} onBlur={removeFocus} />
                                        <div className="relative w-28">
                                            <input type="number" required min="1" value={item.points}
                                                onChange={e => updateRubric(idx, 'points', Number(e.target.value))}
                                                style={{ ...cx.input(), width: '100%', height: 36, paddingLeft: 12, paddingRight: 32, fontWeight: T.weight.bold, color: C.btnPrimary }}
                                                onFocus={applyFocus} onBlur={removeFocus} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                                pts
                                            </span>
                                        </div>
                                    </div>
                                    <textarea rows={2} value={item.description}
                                        onChange={e => updateRubric(idx, 'description', e.target.value)}
                                        placeholder="Description of this criterion..."
                                        style={{ ...cx.input(), width: '100%', padding: '8px 12px', resize: 'none' }}
                                        onFocus={applyFocus} onBlur={removeFocus} />
                                </div>
                                <button type="button" onClick={() => removeRubric(idx)}
                                    disabled={formData.rubric.length === 1}
                                    className="w-8 h-8 mt-0.5 flex-shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-80"
                                    style={{ backgroundColor: C.dangerBg }}>
                                    <Trash2 className="w-3.5 h-3.5" style={{ color: C.danger }} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addRubric}
                            className="w-full py-3 border-2 border-dashed rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{ borderColor: FX.primary25, color: C.btnPrimary, fontFamily: T.fontFamily }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = FX.primary06; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <Plus className="w-4 h-4" /> Add Criterion
                        </button>
                    </div>
                </div>

                {/* ── Fixed Bottom Bar ─────────────────────────────────────── */}
                <div className="fixed bottom-0 left-0 right-0 z-20 p-4"
                    style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${C.cardBorder}`, boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}>
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            Total points auto-calculated from rubric.
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => router.back()}
                                className="px-5 py-2 text-sm font-semibold rounded-xl transition-all hover:opacity-80"
                                style={cx.btnSecondary()}>
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="px-5 py-2 text-sm text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-60 hover:opacity-90"
                                style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Create Assignment
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
