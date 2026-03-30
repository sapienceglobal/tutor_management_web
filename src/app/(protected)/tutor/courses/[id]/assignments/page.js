'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2, Calendar, FileText, Trash2, Edit3, Users, ClipboardList, Award } from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R } from '@/constants/tutorTokens';

export default function CourseAssignmentsPage({ params }) {
    const router = useRouter();
    const { id: courseId }  = use(params);
    const [course, setCourse]           = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading]         = useState(true);
    const { confirmDialog }             = useConfirm();

    useEffect(() => { loadData(); }, [courseId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [courseRes, assignmentsRes] = await Promise.all([
                api.get(`/courses/${courseId}`),
                assignmentService.getCourseAssignments(courseId)
            ]);
            if (courseRes.data.success)  setCourse(courseRes.data.course);
            if (assignmentsRes.success) setAssignments(assignmentsRes.assignments);
        } catch { toast.error('Failed to load assignments'); }
        finally { setLoading(false); }
    };

    const handleDelete = async (assignmentId) => {
        const ok = await confirmDialog('Delete Assignment', 'All submitted work and grades will be lost.', { variant: 'destructive' });
        if (!ok) return;
        try {
            await assignmentService.deleteAssignment(assignmentId);
            setAssignments(prev => prev.filter(a => a._id !== assignmentId));
            toast.success('Assignment deleted');
        } catch { toast.error('Failed to delete assignment'); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading assignments...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push(`/tutor/courses/${courseId}`)} className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                        <ArrowLeft size={18} color={C.heading} />
                    </button>
                    <div>
                        <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            <ClipboardList size={20} color={C.btnPrimary} /> Assignments
                        </h1>
                        {course && (
                            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                                {course.title}
                            </p>
                        )}
                    </div>
                </div>
                <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                    className="flex items-center justify-center h-10 px-5 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                    <Plus size={16} /> New Assignment
                </button>
            </div>

            {/* Empty state */}
            {assignments.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <div className="w-14 h-14 flex items-center justify-center mb-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <ClipboardList size={28} color={C.btnPrimary} />
                    </div>
                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No Assignments Yet</h3>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: '0 auto 20px', maxWidth: 320 }}>
                        Create engaging assignments to track student progress and enforce learning.
                    </p>
                    <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                        className="px-6 h-11 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                        style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        Create First Assignment
                    </button>
                </div>
            ) : (
                <div className="p-5 overflow-x-auto" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            {['Assignment Title', 'Details', 'Status', 'Actions'].map(h => (
                                <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                            ))}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            {assignments.map(assignment => (
                                <div key={assignment._id} className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr] gap-4 px-4 py-3 items-center"
                                    style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                    
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.md, border: `1px solid ${C.cardBorder}` }}>
                                            <FileText size={18} color={C.btnPrimary} />
                                        </div>
                                        <h3 className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                            {assignment.title}
                                        </h3>
                                    </div>

                                    <div>
                                        <p className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '0 0 4px 0' }}>
                                            <Award size={12} /> {assignment.totalMarks} Points
                                        </p>
                                        {assignment.dueDate && (
                                            <p className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.danger, margin: 0 }}>
                                                <Calendar size={12} /> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <span className="uppercase" style={{ 
                                            fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: R.md,
                                            backgroundColor: assignment.status === 'published' ? C.successBg : C.warningBg, 
                                            color: assignment.status === 'published' ? C.success : C.warning, 
                                            border: `1px solid ${assignment.status === 'published' ? C.successBorder : C.warningBorder}`
                                        }}>
                                            {assignment.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/submissions`)}
                                            className="flex items-center gap-1.5 h-9 px-3 cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.btnPrimary, color: '#fff', borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.card }}>
                                            <Users size={14} /> Submissions
                                        </button>
                                        <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/edit`)}
                                            className="w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.md, border: `1px solid ${C.cardBorder}` }}>
                                            <Edit3 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(assignment._id)}
                                            className="w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: R.md, border: `1px solid ${C.dangerBorder}` }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}