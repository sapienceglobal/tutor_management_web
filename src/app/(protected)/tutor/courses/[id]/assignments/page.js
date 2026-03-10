// ─── CourseAssignmentsPage.jsx ────────────────────────────────────────────────
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Plus, Loader2, Calendar, FileText,
    Trash2, Edit3, Users, ClipboardList, Award
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function CourseAssignmentsPage({ params }) {
    const router = useRouter();
    const { id: courseId } = use(params);
    const [course, setCourse] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { confirmDialog } = useConfirm();

    useEffect(() => { loadData(); }, [courseId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [courseRes, assignmentsRes] = await Promise.all([
                api.get(`/courses/${courseId}`),
                assignmentService.getCourseAssignments(courseId)
            ]);
            if (courseRes.data.success) setCourse(courseRes.data.course);
            if (assignmentsRes.success) setAssignments(assignmentsRes.assignments);
        } catch {
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (assignmentId) => {
        const ok = await confirmDialog("Delete Assignment", "All submitted work and grades will be lost.", { variant: 'destructive' });
        if (!ok) return;
        try {
            await assignmentService.deleteAssignment(assignmentId);
            setAssignments(prev => prev.filter(a => a._id !== assignmentId));
            toast.success("Assignment deleted");
        } catch { toast.error("Failed to delete assignment"); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading assignments...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Header */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/tutor/courses/${courseId}`)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                <ClipboardList className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h1 className="text-lg font-bold text-slate-800">Assignments</h1>
                        </div>
                        {course && <p className="text-xs text-slate-400 pl-0.5">{course.title}</p>}
                    </div>
                </div>
                <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white font-semibold rounded-xl transition-opacity"
                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                    <Plus className="w-4 h-4" /> New Assignment
                </button>
            </div>

            {/* Assignments List */}
            {assignments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <ClipboardList className="h-7 w-7" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 mb-1">No Assignments Yet</h3>
                    <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                        Create engaging assignments to track student progress and enforce learning.
                    </p>
                    <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                        className="px-5 py-2 text-sm font-semibold rounded-xl transition-opacity"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', color: 'var(--theme-primary)' }}>
                        Create First Assignment
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {assignments.map(assignment => (
                        <div key={assignment._id}
                            className="bg-white rounded-xl border border-slate-100 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow group">
                            <div className="p-3 rounded-xl flex-shrink-0 transition-colors"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                <FileText className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 truncate mb-1.5">{assignment.title}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5" /> {assignment.totalMarks} Points
                                    </span>
                                    {assignment.dueDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${assignment.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <span className="capitalize">{assignment.status}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/submissions`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Users className="w-3.5 h-3.5" /> Submissions
                                </button>
                                <button
                                    onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/edit`)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--theme-primary)]/10 transition-colors">
                                    <Edit3 className="w-4 h-4 text-slate-400" />
                                </button>
                                <button onClick={() => handleDelete(assignment._id)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}