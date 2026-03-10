'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Loader2, Calendar, FileText,
    Trash2, Save, Upload, X, ClipboardList, AlertCircle
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';

export default function NewAssignmentPage({ params }) {
    const router = useRouter();
    const { id: courseId } = use(params);
    const { institute } = useInstitute();

    const [submitting, setSubmitting] = useState(false);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);

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
        if (!formData.title.trim()) return toast.error("Title is required");
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
            toast.success("Assignment created successfully");
            router.push(`/tutor/courses/${courseId}/assignments`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create assignment");
        } finally { setSubmitting(false); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);
        try {
            const res = await api.post('/upload/file', uploadData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, { name: res.data.name, url: res.data.fileUrl, type: res.data.type }]
                }));
                toast.success("File attached");
            }
        } catch { toast.error('Failed to attach file'); }
    };

    const addRubric = () => setFormData(prev => ({ ...prev, rubric: [...prev.rubric, { criterion: '', description: '', points: 0 }] }));
    const removeRubric = (idx) => setFormData(prev => ({ ...prev, rubric: prev.rubric.filter((_, i) => i !== idx) }));
    const updateRubric = (idx, field, value) => setFormData(prev => {
        const r = [...prev.rubric];
        r[idx][field] = value;
        return { ...prev, rubric: r };
    });

    const totalRubricPts = formData.rubric.reduce((a, c) => a + Number(c.points || 0), 0);

    // Shared input/textarea focus styles
    const focusStyle = { '--ring-color': 'var(--theme-primary)' };

    return (
        <div className="space-y-5 pb-24" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Header */}
            <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-5 py-4">
                <button onClick={() => router.back()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                </button>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                            <ClipboardList className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-800">Create Assignment</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">Configure and publish a new assignment</p>
                </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">

                {/* ── Basic Info ─────────────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <span className="w-1 h-4 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
                        Basic Information
                    </h2>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Assignment Title <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.title}
                            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                            placeholder="e.g. Final Project Submission"
                            className="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Instructions / Description <span className="text-red-500">*</span></label>
                        <textarea required rows={4} value={formData.description}
                            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                            placeholder="Describe the assignment requirements and expected deliverables..."
                            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 resize-none transition-colors" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Due Date & Time <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type="datetime-local" required value={formData.dueDate}
                                    onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                                    className="w-full h-10 pl-10 pr-3.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors" />
                                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Status</label>
                            <select value={formData.status}
                                onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                                className="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] transition-colors">
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
                        <label className="text-sm font-semibold text-slate-700">Reference Materials</label>
                        {formData.attachments.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {formData.attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                                <FileText className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                                                <p className="text-xs text-slate-400 uppercase">{file.type?.split('/')[1] || 'File'}</p>
                                            </div>
                                        </div>
                                        <button type="button"
                                            onClick={() => setFormData(p => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) }))}
                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <input type="file" onChange={handleFileUpload} className="hidden" id="attachment-upload" />
                        <label htmlFor="attachment-upload"
                            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-sm font-semibold cursor-pointer transition-all"
                            style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, white)', color: 'var(--theme-primary)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-primary) 5%, white)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <Upload className="w-4 h-4" /> Attach File
                        </label>
                    </div>
                </div>

                {/* ── Rubric Builder ──────────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Grading Rubric</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Define the criteria and points for grading</p>
                        </div>
                        <span className="text-xl font-black" style={{ color: 'var(--theme-primary)' }}>{totalRubricPts} pts</span>
                    </div>

                    <div className="p-5 space-y-3">
                        {formData.rubric.map((item, idx) => (
                            <div key={idx} className="flex gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-3">
                                        <input type="text" required value={item.criterion}
                                            onChange={(e) => updateRubric(idx, 'criterion', e.target.value)}
                                            placeholder="Criterion Name (e.g. Grammar)"
                                            className="flex-1 h-9 px-3 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] bg-white transition-colors" />
                                        <div className="relative w-28">
                                            <input type="number" required min="1" value={item.points}
                                                onChange={(e) => updateRubric(idx, 'points', Number(e.target.value))}
                                                className="w-full h-9 pl-3 pr-8 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] bg-white transition-colors"
                                                style={{ color: 'var(--theme-primary)' }} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">pts</span>
                                        </div>
                                    </div>
                                    <textarea rows={2} value={item.description}
                                        onChange={(e) => updateRubric(idx, 'description', e.target.value)}
                                        placeholder="Description of this criterion..."
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[var(--theme-primary)] bg-white resize-none transition-colors" />
                                </div>
                                <button type="button" onClick={() => removeRubric(idx)}
                                    disabled={formData.rubric.length === 1}
                                    className="w-8 h-8 mt-0.5 flex-shrink-0 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-30">
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </button>
                            </div>
                        ))}

                        <button type="button" onClick={addRubric}
                            className="w-full py-3 border-2 border-dashed rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 25%, white)', color: 'var(--theme-primary)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-primary) 5%, white)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <Plus className="w-4 h-4" /> Add Criterion
                        </button>
                    </div>
                </div>

                {/* ── Fixed Bottom Bar ─────────────────────────────────────── */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 p-4 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Total points auto-calculated from rubric.
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => router.back()}
                                className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="px-5 py-2 text-sm text-white font-bold rounded-xl flex items-center gap-2 transition-opacity disabled:opacity-60"
                                style={{ backgroundColor: 'var(--theme-primary)' }}>
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