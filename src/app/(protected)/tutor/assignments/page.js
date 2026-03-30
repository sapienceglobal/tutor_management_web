'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ClipboardList, BookOpen, ArrowRight, Plus } from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

export default function TutorAssignmentsOverviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const coursesRes = await api.get('/courses/my-courses');
                const fetchedCourses = coursesRes.data?.courses || [];

                const withCounts = await Promise.all(
                    fetchedCourses.map(async (course) => {
                        try {
                            const assignmentsRes = await assignmentService.getCourseAssignments(course._id);
                            return { ...course, assignmentsCount: assignmentsRes.assignments?.length || 0 };
                        } catch {
                            return { ...course, assignmentsCount: 0 };
                        }
                    })
                );

                setCourses(withCounts);
            } catch {
                toast.error('Failed to load assignments overview');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const totalAssignments = useMemo(
        () => courses.reduce((acc, course) => acc + (course.assignmentsCount || 0), 0),
        [courses]
    );

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
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <ClipboardList size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Assignments
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                            {courses.length} courses · {totalAssignments} assignments
                        </p>
                    </div>
                </div>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <div className="w-14 h-14 flex items-center justify-center mb-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <BookOpen size={28} color={C.btnPrimary} />
                    </div>
                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No Courses Found</h3>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, maxWidth: 320 }}>
                        Create a course first, then you can create and manage assignments for students.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {courses.map((course) => (
                        <div key={course._id} className="p-5 flex flex-col h-full transition-transform hover:-translate-y-0.5" 
                            style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="min-w-0">
                                    <h3 className="line-clamp-2" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>
                                        {course.title}
                                    </h3>
                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                        {course.assignmentsCount || 0} assignment{course.assignmentsCount === 1 ? '' : 's'}
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 uppercase shrink-0" style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.md, fontSize: '10px', fontWeight: T.weight.black, border: `1px solid ${C.cardBorder}` }}>
                                    {course.status || 'draft'}
                                </span>
                            </div>

                            <div className="mt-auto flex items-center gap-2 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <button onClick={() => router.push(`/tutor/courses/${course._id}/assignments/new`)}
                                    className="flex-1 flex items-center justify-center gap-1.5 h-10 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    <Plus size={14} /> New
                                </button>
                                <button onClick={() => router.push(`/tutor/courses/${course._id}/assignments`)}
                                    className="flex-1 flex items-center justify-center gap-1.5 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                                    style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                                    Manage <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}