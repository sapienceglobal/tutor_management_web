'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, Mail, Calendar, BookOpen, CreditCard, ChevronLeft, User } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { C, T, FX } from '@/constants/tutorTokens';

export default function TutorStudentDetailPage({ params }) {
    const { id }      = use(params);
    const router      = useRouter();
    const [loading, setLoading]         = useState(true);
    const [student, setStudent]         = useState(null);
    const [stats, setStats]             = useState(null);
    const [enrollments, setEnrollments] = useState([]);

    useEffect(() => { fetchStudentDetails(); }, [id]);

    const fetchStudentDetails = async () => {
        try {
            const res = await api.get(`/tutors/students/${id}`);
            if (res.data.success) {
                setStudent(res.data.student);
                setStats({ totalEnrolled: res.data.tutorCoursesCount, totalSpent: res.data.totalSpent });
                setEnrollments(res.data.enrollments);
            }
        } catch {
            toast.error('Failed to load student details');
        } finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p className="text-sm text-slate-400">Loading student details...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-6 text-center text-slate-500 text-sm">Student not found.</div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: T.fontFamily }}>

            {/* ── Profile card ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                {/* Banner */}
                <div className="h-28 relative" style={{ backgroundColor: C.darkCard }}>
                    {/* Glow blob */}
                    <div className="absolute -top-6 -right-6 w-48 h-48 rounded-full blur-3xl opacity-30"
                        style={{ backgroundColor: FX.primary60Transparent }} />
                    {/* Back button */}
                    <button onClick={() => router.back()}
                        className="absolute top-4 left-5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                </div>

                <div className="px-6 pb-6">
                    {/* Avatar row */}
                    <div className="flex items-end justify-between -mt-10 mb-4">
                        <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden flex-shrink-0"
                            style={{ background: C.gradientBtn }}>
                            {student.profileImage
                                ? <img src={student.profileImage} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">
                                    {student.name?.charAt(0)?.toUpperCase()}
                                  </div>}
                        </div>
                    </div>

                    {/* Name + meta */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                                    style={{ backgroundColor: FX.primary08, color: C.btnPrimary, borderColor: FX.primary20 }}>
                                    <User className="w-2.5 h-2.5 inline mr-0.5" />Student
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{student.email}</span>
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12 }}>
                        <BookOpen className="w-5 h-5" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold">Courses Enrolled</p>
                        <p className="text-2xl font-black text-slate-800">{stats?.totalEnrolled || 0}</p>
                        <p className="text-[11px] text-slate-400">In your courses</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold">Total Spent</p>
                        <p className="text-2xl font-black text-slate-800">${stats?.totalSpent || 0}</p>
                        <p className="text-[11px] text-slate-400">On your courses</p>
                    </div>
                </div>
            </div>

            {/* ── Enrollments table ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12 }}>
                        <BookOpen className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Enrolled Courses</h3>
                </div>

                {/* Head */}
                <div className="grid grid-cols-[2fr_1fr_80px_140px] gap-4 px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                    {['Course', 'Level', 'Price', 'Progress'].map(h => (
                        <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</span>
                    ))}
                </div>

                {enrollments.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {enrollments.map(enrollment => (
                            <div key={enrollment._id}
                                className="grid grid-cols-[2fr_1fr_80px_140px] gap-4 px-5 py-4 items-center hover:bg-slate-50/40 transition-colors">
                                {/* Course */}
                                <div className="flex items-center gap-3 min-w-0">
                                    {enrollment.courseId?.thumbnail && (
                                        <img src={enrollment.courseId.thumbnail} alt=""
                                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                                    )}
                                    <span className="text-sm font-semibold text-slate-800 truncate">
                                        {enrollment.courseId?.title}
                                    </span>
                                </div>
                                {/* Level */}
                                <span className="text-xs text-slate-500 capitalize">{enrollment.courseId?.level || '—'}</span>
                                {/* Price */}
                                <span className="text-sm font-bold text-slate-700">${enrollment.courseId?.price || 0}</span>
                                {/* Progress */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-emerald-500 transition-all"
                                            style={{ width: `${enrollment.progress?.percentage || 0}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 w-8 text-right">
                                        {enrollment.progress?.percentage || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No active enrollments.</p>
                    </div>
                )}
            </div>
        </div>
    );
}