'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ClipboardList, BookOpen, ArrowRight, Plus } from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';
import { C, T, S, FX, pageStyle } from '@/constants/tutorTokens';

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                    Loading assignments...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={pageStyle}>
            <div
                className="rounded-2xl px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}
                    >
                        <ClipboardList className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            Assignments
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            {courses.length} courses · {totalAssignments} assignments
                        </p>
                    </div>
                </div>
            </div>

            {courses.length === 0 ? (
                <div
                    className="text-center py-16 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: C.cardBorder, backgroundColor: C.cardBg }}
                >
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: FX.primary10, border: `1px solid ${FX.primary20}` }}
                    >
                        <BookOpen className="w-7 h-7" style={{ color: C.btnPrimary }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                        No Courses Found
                    </h3>
                    <p
                        style={{
                            fontFamily: T.fontFamily,
                            fontSize: T.size.sm,
                            color: C.textMuted,
                            maxWidth: 320,
                            margin: '4px auto 0',
                        }}
                    >
                        Create a course first, then you can create and manage assignments for students.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course) => (
                        <div
                            key={course._id}
                            className="rounded-2xl p-5 space-y-4"
                            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3
                                        className="line-clamp-2"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}
                                    >
                                        {course.title}
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                                        {course.assignmentsCount || 0} assignment{course.assignmentsCount === 1 ? '' : 's'}
                                    </p>
                                </div>
                                <span
                                    className="px-2.5 py-1 rounded-full"
                                    style={{ backgroundColor: FX.primary10, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold }}
                                >
                                    {course.status || 'draft'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.push(`/tutor/courses/${course._id}/assignments/new`)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl transition-all hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    New
                                </button>
                                <button
                                    onClick={() => router.push(`/tutor/courses/${course._id}/assignments`)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border transition-all hover:opacity-90"
                                    style={{ borderColor: C.cardBorder, color: C.text, backgroundColor: C.innerBg, fontFamily: T.fontFamily, fontWeight: T.weight.semibold }}
                                >
                                    Manage
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

