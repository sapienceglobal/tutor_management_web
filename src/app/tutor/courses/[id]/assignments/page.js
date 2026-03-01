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
    Edit3,
    Trash2,
    Users,
    ClipboardList,
    Clock,
    Award
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

    useEffect(() => {
        loadData();
    }, [courseId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [courseRes, assignmentsRes] = await Promise.all([
                api.get(`/courses/${courseId}`),
                assignmentService.getCourseAssignments(courseId)
            ]);

            if (courseRes.data.success) {
                setCourse(courseRes.data.course);
            }
            if (assignmentsRes.success) {
                setAssignments(assignmentsRes.assignments);
            }
        } catch (error) {
            console.error('Error loading assignments data:', error);
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (assignmentId) => {
        const confirmed = await confirmDialog("Delete Assignment", "Are you sure you want to delete this assignment? All submitted work and grades will be lost.", { variant: 'destructive' });
        if (!confirmed) return;

        try {
            await assignmentService.deleteAssignment(assignmentId);
            setAssignments(prev => prev.filter(a => a._id !== assignmentId));
            toast.success("Assignment deleted");
        } catch (error) {
            toast.error("Failed to delete assignment");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/tutor/courses/${courseId}`)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <ClipboardList className="w-6 h-6 text-indigo-600" />
                                Assignments
                            </h1>
                            <p className="text-slate-500 mt-1">{course?.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        New Assignment
                    </button>
                </div>

                {/* Assignments List */}
                {assignments.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Assignments Yet</h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Create engaging assignments to track student progress and enforce learning through practice.
                        </p>
                        <button
                            onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                            className="px-6 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold transition-all"
                        >
                            Create First Assignment
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map(assignment => (
                            <div key={assignment._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group flex items-start gap-6">
                                <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-100 transition-colors shrink-0">
                                    <FileText className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 truncate mb-1">
                                        {assignment.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Award className="w-4 h-4" />
                                            {assignment.totalMarks} Points
                                        </div>
                                        {assignment.dueDate && (
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${assignment.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <span className="capitalize">{assignment.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/submissions`)}
                                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Users className="w-4 h-4" />
                                        Submissions
                                    </button>
                                    <button
                                        onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/edit`)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(assignment._id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
