'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, Mail, Calendar, BookOpen, CreditCard, ChevronLeft, User } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { C, T, S, R, FX } from '@/constants/tutorTokens';

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading student details...</p>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <p style={{ color: C.danger, fontSize: T.size.md, fontWeight: T.weight.bold, margin: '0 0 12px 0' }}>Student not found.</p>
                <button onClick={() => router.back()} className="px-5 py-2 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Profile Card ──────────────────────────────────────────────── */}
            <div className="relative overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                {/* Banner Area */}
                <div className="h-32 w-full relative overflow-hidden" style={{ backgroundColor: '#E3DFF8' }}>
                    {/* Subtle decorative elements for the banner */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ backgroundColor: C.btnPrimary, opacity: 0.05 }} />
                    <div className="absolute -bottom-10 right-20 w-32 h-32 rounded-full" style={{ backgroundColor: C.btnPrimary, opacity: 0.05 }} />
                    
                    {/* Back button */}
                    <button onClick={() => router.back()}
                        className="absolute top-4 left-5 flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                        style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                        <ChevronLeft size={14} /> Back
                    </button>
                </div>

                <div className="px-6 pb-6 relative">
                    {/* Avatar - Absolute positioning ensures it never clips or messes up flex layouts */}
                    <div className="absolute -top-12 left-6 w-24 h-24 rounded-full border-4 shadow-sm overflow-hidden flex items-center justify-center text-white font-black text-3xl"
                        style={{ background: C.gradientBtn, borderColor: '#EAE8FA' }}>
                        {student.profileImage
                            ? <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                            : student.name?.charAt(0)?.toUpperCase()
                        }
                    </div>

                    {/* Spacer to push content below the absolute avatar */}
                    <div className="w-full h-14" />

                    {/* Name + Info */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <h1 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                {student.name}
                            </h1>
                            <span style={{ 
                                backgroundColor: '#E3DFF8', color: C.btnPrimary, border: `1px solid ${C.cardBorder}`,
                                padding: '2px 10px', borderRadius: R.full, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                <User size={12} /> Student
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                            <span className="flex items-center gap-1.5"><Mail size={14} /> {student.email}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Enrolled Courses Stat */}
                <div className="p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5" 
                    style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <BookOpen size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Courses Enrolled</p>
                        <p style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>{stats?.totalEnrolled || 0}</p>
                        <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, margin: '4px 0 0 0' }}>In your courses</p>
                    </div>
                </div>

                {/* Total Spent Stat */}
                <div className="p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5" 
                    style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.successBg, borderRadius: R.xl }}>
                        <CreditCard size={24} color={C.success} />
                    </div>
                    <div>
                        <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Total Spent</p>
                        <p style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>₹{stats?.totalSpent || 0}</p>
                        <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, margin: '4px 0 0 0' }}>On your courses</p>
                    </div>
                </div>
            </div>

            {/* ── Enrollments List ──────────────────────────────────────────── */}
            <div className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="px-6 py-4 flex items-center gap-2" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                    <BookOpen size={18} color={C.btnPrimary} />
                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Enrolled Courses</h3>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    {enrollments.length > 0 ? (
                        <div className="min-w-[800px]">
                            {/* Table Header */}
                            <div className="grid grid-cols-[2fr_1fr_100px_200px] gap-4 px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {['Course', 'Level', 'Price', 'Progress'].map(h => (
                                    <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>{h}</span>
                                ))}
                            </div>
                            
                            {/* Table Rows */}
                            <div className="flex flex-col gap-2 p-3">
                                {enrollments.map((enrollment, idx) => (
                                    <div key={enrollment._id} className="grid grid-cols-[2fr_1fr_100px_200px] gap-4 px-3 py-3 items-center transition-colors hover:bg-white/50"
                                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                        
                                        {/* Course Title & Thumb */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            {enrollment.courseId?.thumbnail ? (
                                                <img src={enrollment.courseId.thumbnail} alt={enrollment.courseId?.title} className="w-10 h-10 rounded-lg object-cover shrink-0" style={{ border: `1px solid ${C.cardBorder}` }} />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                                    <BookOpen size={16} color={C.btnPrimary} />
                                                </div>
                                            )}
                                            <span className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                {enrollment.courseId?.title || 'Unknown Course'}
                                            </span>
                                        </div>

                                        {/* Level */}
                                        <div>
                                            <span style={{ fontSize: '10px', fontWeight: T.weight.black, backgroundColor: C.surfaceWhite, color: C.textMuted, border: `1px solid ${C.cardBorder}`, padding: '4px 10px', borderRadius: R.md, textTransform: 'uppercase' }}>
                                                {enrollment.courseId?.level || 'N/A'}
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                                {enrollment.courseId?.price ? `₹${enrollment.courseId.price}` : 'Free'}
                                            </span>
                                        </div>

                                        {/* Progress */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                                <div className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${enrollment.progress?.percentage || 0}%`, background: C.gradientBtn }} />
                                            </div>
                                            <span className="shrink-0" style={{ fontSize: T.size.xs, fontWeight: T.weight.black, color: C.btnPrimary, width: '36px', textAlign: 'right' }}>
                                                {enrollment.progress?.percentage || 0}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 flex flex-col items-center">
                            <BookOpen size={40} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No active enrollments.</p>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>This student has not enrolled in any of your courses yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}