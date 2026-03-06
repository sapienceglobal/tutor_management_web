'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Loader2,
    Calendar,
    FileText,
    MoreVertical,
    Trash2,
    Save,
    Upload,
    X,
    GripVertical,
    ClipboardList,
    AlertCircle
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

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        totalMarks: 100,
        status: 'published',
        attachments: [],
        audience: {
            scope: 'institute',
            instituteId: null,
            batchIds: [],
            studentIds: [],
        },
        rubric: [
            { criterion: 'Originality', description: 'Student\'s work is original', points: 20 },
            { criterion: 'Completeness', description: 'All parts of the assignment are addressed', points: 80 }
        ]
    });

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            try {
                const [batchesRes, studentsRes] = await Promise.all([
                    api.get('/batches'),
                    api.get(`/enrollments/students/${courseId}`),
                ]);
                const batchList = (batchesRes.data?.batches || []).filter((batch) => {
                    const batchCourseId = batch.courseId?._id || batch.courseId;
                    return batchCourseId === courseId;
                });
                setAvailableBatches(batchList);
                const studentList = (studentsRes.data?.students || []).map((item) => ({
                    _id: item.studentId?._id,
                    name: item.studentId?.name,
                    email: item.studentId?.email,
                })).filter((item) => item._id);
                setAvailableStudents(studentList);
            } catch (error) {
                console.error('Failed to fetch audience targets', error);
            }
        };

        if (courseId) {
            fetchAudienceTargets();
        }
    }, [courseId]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            audience: {
                ...prev.audience,
                instituteId: prev.audience?.instituteId || institute?._id || null,
            },
        }));
    }, [institute?._id]);

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            return toast.error("Title is required");
        }

        setSubmitting(true);
        try {
            const data = {
                ...formData,
                courseId,
                totalMarks: formData.rubric.reduce((acc, curr) => acc + Number(curr.points), 0),
                audience: {
                    ...formData.audience,
                    instituteId: formData.audience?.instituteId || institute?._id || null,
                },
                scope: formData.audience?.scope,
                batchId: formData.audience?.scope === 'batch' ? (formData.audience.batchIds?.[0] || null) : null,
            };

            await assignmentService.createAssignment(data);
            toast.success("Assignment created successfully");
            router.push(`/tutor/courses/${courseId}/assignments`);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to create assignment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await api.post('/upload/file', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, {
                        name: res.data.name,
                        url: res.data.fileUrl,
                        type: res.data.type
                    }]
                }));
                toast.success("File attached");
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to attach file');
        }
    };

    const addRubricCriterion = () => {
        setFormData(prev => ({
            ...prev,
            rubric: [...prev.rubric, { criterion: '', description: '', points: 0 }]
        }));
    };

    const removeRubricCriterion = (index) => {
        setFormData(prev => ({
            ...prev,
            rubric: prev.rubric.filter((_, i) => i !== index)
        }));
    };

    const updateRubric = (index, field, value) => {
        setFormData(prev => {
            const newRubric = [...prev.rubric];
            newRubric[index][field] = value;
            return { ...prev, rubric: newRubric };
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-24">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <ClipboardList className="w-6 h-6 text-indigo-600" />
                                Create Assignment
                            </h1>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Assignment Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g. Final Project Submission"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Instructions / Description</label>
                            <textarea
                                required
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe the assignment requirements and expected deliverables..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date & Time</label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <Calendar className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="published">Published (Visible immediately)</option>
                                    <option value="draft">Draft (Hidden from students)</option>
                                </select>
                            </div>
                        </div>

                        <AudienceSelector
                            value={formData.audience}
                            onChange={(audience) => setFormData((prev) => ({ ...prev, audience }))}
                            availableBatches={availableBatches}
                            availableStudents={availableStudents}
                            allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                            instituteId={institute?._id || null}
                        />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Reference Materials</label>

                            {formData.attachments.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {formData.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 rounded-lg">
                                                    <FileText className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-700">{file.name}</p>
                                                    <p className="text-xs text-slate-500 uppercase">{file.type?.split('/')[1] || 'File'}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev, attachments: prev.attachments.filter((_, i) => i !== idx)
                                                }))}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="attachment-upload"
                                />
                                <label
                                    htmlFor="attachment-upload"
                                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-semibold hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                                >
                                    <Upload className="w-5 h-5" />
                                    Attach File
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Rubric Builder */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Grading Rubric</h2>
                                <p className="text-sm text-slate-500 mt-1">Define the criteria and points for grading</p>
                            </div>
                            <div className="text-2xl font-black text-indigo-600">
                                {formData.rubric.reduce((acc, curr) => acc + Number(curr.points || 0), 0)} pts total
                            </div>
                        </div>

                        <div className="p-6 space-y-4 bg-slate-50/50">
                            {formData.rubric.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    required
                                                    value={item.criterion}
                                                    onChange={(e) => updateRubric(idx, 'criterion', e.target.value)}
                                                    placeholder="Criterion Name (e.g. Grammar, Originality)"
                                                    className="w-full px-4 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="w-32 relative">
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={item.points}
                                                    onChange={(e) => updateRubric(idx, 'points', Number(e.target.value))}
                                                    className="w-full pl-4 pr-10 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400">pts</span>
                                            </div>
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={item.description}
                                            onChange={(e) => updateRubric(idx, 'description', e.target.value)}
                                            placeholder="Description of this criterion..."
                                            className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeRubricCriterion(idx)}
                                        disabled={formData.rubric.length === 1}
                                        className="p-2 h-fit text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addRubricCriterion}
                                className="w-full p-4 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 font-semibold hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Criterion
                            </button>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 drop-shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-20">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <AlertCircle className="w-4 h-4" />
                                Total assigned points must match the rubric sum.
                            </div>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Create Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
