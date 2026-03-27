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
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/tutorTokens';

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

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                style={{ borderColor: FX.primary25Transparent, borderTopColor: C.btnPrimary }} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                Loading assignments…
            </p>
        </div>
    );

    return (
        <div className="space-y-5" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="rounded-2xl px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/tutor/courses/${courseId}`)}
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
                                Assignments
                            </h1>
                        </div>
                        {course && (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                {course.title}
                            </p>
                        )}
                    </div>
                </div>
                <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all hover:opacity-90"
                    style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontWeight: T.weight.semibold, boxShadow: S.btn }}>
                    <Plus className="w-4 h-4" /> New Assignment
                </button>
            </div>

            {/* ── Empty state ───────────────────────────────────────────── */}
            {assignments.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: C.cardBorder, backgroundColor: C.cardBg }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: FX.primary10, border: `1px solid ${FX.primary20}` }}>
                        <ClipboardList className="w-7 h-7" style={{ color: C.btnPrimary }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, marginBottom: 4 }}>
                        No Assignments Yet
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, maxWidth: 320, margin: '0 auto 20px' }}>
                        Create engaging assignments to track student progress and enforce learning.
                    </p>
                    <button onClick={() => router.push(`/tutor/courses/${courseId}/assignments/new`)}
                        className="px-5 py-2 text-sm font-semibold rounded-xl transition-all hover:opacity-80"
                        style={{ backgroundColor: FX.primary12, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                        Create First Assignment
                    </button>
                </div>

            ) : (

                // ── Assignments list ─────────────────────────────────────
                <div className="space-y-3">
                    {assignments.map(assignment => (
                        <div key={assignment._id}
                            className="rounded-2xl p-5 flex items-start gap-4 transition-all group hover:shadow-md"
                            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = FX.primary25; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}>

                            {/* Icon */}
                            <div className="p-3 rounded-xl flex-shrink-0"
                                style={{ backgroundColor: FX.primary12 }}>
                                <FileText className="w-6 h-6" style={{ color: C.btnPrimary }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="truncate mb-1.5"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                    {assignment.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                    <span className="flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5" /> {assignment.totalMarks} Points
                                    </span>
                                    {assignment.dueDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" /> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full"
                                            style={{ backgroundColor: assignment.status === 'published' ? C.success : C.warning }} />
                                        <span className="capitalize">{assignment.status}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/submissions`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                                    style={{ backgroundColor: C.innerBg, color: C.text, fontFamily: T.fontFamily }}>
                                    <Users className="w-3.5 h-3.5" /> Submissions
                                </button>
                                <button
                                    onClick={() => router.push(`/tutor/courses/${courseId}/assignments/${assignment._id}/edit`)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                    style={{ backgroundColor: FX.primary12, color: C.btnPrimary }}>
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(assignment._id)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                    style={{ backgroundColor: C.dangerBg, color: C.danger }}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
