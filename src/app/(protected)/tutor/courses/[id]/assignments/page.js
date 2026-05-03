'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdArrowBack, MdAdd, MdHourglassEmpty, MdCalendarToday, 
    MdDescription, MdDelete, MdEdit, MdPeople, MdAssignment, MdGrade 
} from 'react-icons/md';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R } from '@/constants/studentTokens';

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading assignments...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push(`/tutor/courses/${courseId}`)} className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-colors hover:opacity-80 shrink-0"
                        style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                        <MdArrowBack size={20} color={C.heading} />
                    </button>
                    <div>
                        <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 2px 0' }}>
                            <MdAssignment size={24} color={C.btnPrimary} /> Assignments
                        </h1>
                        {course && (
                            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                                {course.title}
                            </p>
                        )}
                    </div>
                </div>
                <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                    className="flex items-center justify-center h-11 px-6 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                    <MdAdd size={18} /> New Assignment
                </button>
            </div>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            {assignments.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center animate-in fade-in duration-500" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <div className="w-16 h-16 flex items-center justify-center mb-4" style={{ backgroundColor: C.innerBg, borderRadius: '12px' }}>
                        <MdAssignment size={32} color={C.textMuted} style={{ opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No Assignments Yet</h3>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: '0 auto 20px', maxWidth: 360, lineHeight: 1.5 }}>
                        Create engaging assignments to track student progress and enforce learning.
                    </p>
                    <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                        className="px-6 h-11 cursor-pointer border-none transition-colors hover:opacity-80 shadow-sm"
                        style={{ backgroundColor: C.innerBg, color: C.btnPrimary, borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                        Create First Assignment
                    </button>
                </div>
            ) : (
                <div className="p-6 overflow-x-auto animate-in fade-in duration-500 delay-100" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="min-w-[850px]">
                        {/* Table Head */}
                        <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr] gap-4 px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                            {['Assignment Title', 'Details', 'Status', 'Actions'].map(h => (
                                <span key={h} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                            ))}
                        </div>
                        
                        {/* Table Body */}
                        <div className="flex flex-col gap-2 p-4">
                            {assignments.map((assignment, index) => (
                                <div key={assignment._id} className="grid grid-cols-[2.5fr_1.5fr_1fr_1.5fr] gap-4 px-5 py-4 items-center transition-colors"
                                    style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                    
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: C.surfaceWhite, borderRadius: '8px', border: `1px solid ${C.cardBorder}` }}>
                                            <MdDescription size={18} color={C.btnPrimary} />
                                        </div>
                                        <h3 className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                            {assignment.title}
                                        </h3>
                                    </div>

                                    <div>
                                        <p className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '0 0 6px 0' }}>
                                            <MdGrade size={14} /> {assignment.totalMarks} Points
                                        </p>
                                        {assignment.dueDate && (
                                            <p className="flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.danger, margin: 0 }}>
                                                <MdCalendarToday size={14} /> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <span className="uppercase" style={{ 
                                            fontSize: '10px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: '6px', letterSpacing: T.tracking.wider,
                                            backgroundColor: assignment.status === 'published' ? C.successBg : C.warningBg, 
                                            color: assignment.status === 'published' ? C.success : C.warning, 
                                            border: `1px solid ${assignment.status === 'published' ? C.successBorder : C.warningBorder}`
                                        }}>
                                            {assignment.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/submissions`)}
                                            className="flex items-center gap-1.5 h-10 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                                            style={{ backgroundColor: C.btnPrimary, color: '#fff', borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            <MdPeople size={16} /> Submissions
                                        </button>
                                        <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/edit`)}
                                            className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-colors shadow-sm shrink-0"
                                            style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: '8px', border: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.btnPrimary; }}>
                                            <MdEdit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(assignment._id)}
                                            className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-colors shadow-sm shrink-0"
                                            style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: '8px', border: `1px solid ${C.dangerBorder}` }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.danger; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}>
                                            <MdDelete size={16} />
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