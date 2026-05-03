'use client';

import { useState, useEffect, use } from 'react';
import {
    MdHourglassEmpty,
    MdEmail,
    MdCalendarMonth,
    MdMenuBook,
    MdCreditCard,
    MdChevronLeft,
    MdPerson,
    MdAutoAwesome,
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

export default function TutorStudentDetailPage({ params }) {
    const { id }  = use(params);
    const router  = useRouter();

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

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="relative w-12 h-12">
                <div
                    className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <MdAutoAwesome className="animate-pulse" style={{ width: 18, height: 18, color: C.btnPrimary }} />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium }}>
                Loading student details...
            </p>
        </div>
    );

    // ── Not Found ────────────────────────────────────────────────────────────
    if (!student) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div
                className="p-10 text-center"
                style={{
                    backgroundColor: C.cardBg,
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                    borderRadius:    R['2xl'],
                }}
            >
                <div
                    className="flex items-center justify-center mx-auto mb-4"
                    style={{ width: 56, height: 56, backgroundColor: C.dangerBg, borderRadius: R.lg }}
                >
                    <MdPerson style={{ width: 28, height: 28, color: C.danger, opacity: 0.6 }} />
                </div>
                <p style={{ fontFamily: T.fontFamily, color: C.danger, fontSize: T.size.lg, fontWeight: T.weight.bold, margin: '0 0 16px 0' }}>
                    Student not found.
                </p>
                <button
                    onClick={() => router.back()}
                    className="px-5 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-80"
                    style={{
                        background:   C.gradientBtn,
                        color:        '#ffffff',
                        borderRadius: '10px',
                        boxShadow:    S.btn,
                        fontFamily:   T.fontFamily,
                        fontSize:     T.size.base,
                        fontWeight:   T.weight.bold,
                    }}
                >
                    Go Back
                </button>
            </div>
        </div>
    );

    return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Profile Card ─────────────────────────────────────────────── */}
            <div
                className="relative overflow-hidden"
                style={{
                    backgroundColor: C.cardBg,
                    borderRadius:    R['2xl'],
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                }}
            >
                {/* Banner */}
                <div
                    className="h-28 w-full relative overflow-hidden"
                    style={{ background: C.gradientBtn }}
                >
                    {/* Decorative circles */}
                    <div
                        className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
                        style={{ backgroundColor: '#ffffff', opacity: 0.06 }}
                    />
                    <div
                        className="absolute -bottom-10 right-20 w-32 h-32 rounded-full"
                        style={{ backgroundColor: '#ffffff', opacity: 0.06 }}
                    />

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="absolute top-4 left-5 flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-none transition-opacity hover:opacity-80"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.18)',
                            color:           '#ffffff',
                            borderRadius:    '10px',
                            fontFamily:      T.fontFamily,
                            fontSize:        T.size.base,
                            fontWeight:      T.weight.bold,
                            border:          '1px solid rgba(255,255,255,0.25)',
                        }}
                    >
                        <MdChevronLeft style={{ width: 16, height: 16 }} /> Back
                    </button>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6 relative">
                    {/* Avatar pulled up over banner */}
                    <div
                        className="absolute -top-11 left-6 flex items-center justify-center overflow-hidden text-white"
                        style={{
                            width:        80,
                            height:       80,
                            borderRadius: R.xl,
                            background:   C.gradientBtn,
                            border:       `3px solid ${C.cardBg}`,
                            boxShadow:    S.card,
                            fontFamily:   T.fontFamily,
                            fontSize:     T.size['3xl'],
                            fontWeight:   T.weight.bold,
                        }}
                    >
                        {student.profileImage
                            ? <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                            : student.name?.charAt(0)?.toUpperCase()
                        }
                    </div>

                    {/* Spacer below avatar */}
                    <div className="w-full h-12" />

                    {/* Name + Info */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size['2xl'],
                                    fontWeight:  T.weight.bold,
                                    color:       C.heading,
                                    margin:      0,
                                    lineHeight:  T.leading.tight,
                                }}
                            >
                                {student.name}
                            </h1>
                            {/* Student Badge */}
                            <span
                                className="flex items-center gap-1"
                                style={{
                                    backgroundColor: C.innerBg,
                                    color:           C.btnPrimary,
                                    border:          `1px solid ${C.cardBorder}`,
                                    padding:         '2px 10px',
                                    borderRadius:    '10px',
                                    fontFamily:      T.fontFamily,
                                    fontSize:        T.size.xs,
                                    fontWeight:      T.weight.bold,
                                    textTransform:   'uppercase',
                                }}
                            >
                                <MdPerson style={{ width: 12, height: 12 }} /> Student
                            </span>
                        </div>

                        {/* Contact + Join Date */}
                        <div
                            className="flex flex-wrap items-center gap-4"
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.medium,
                                color:       C.text,
                            }}
                        >
                            <span className="flex items-center gap-1.5">
                                <MdEmail style={{ width: 15, height: 15 }} /> {student.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MdCalendarMonth style={{ width: 15, height: 15 }} />
                                Joined {new Date(student.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats Row ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                    icon={MdMenuBook}
                    value={stats?.totalEnrolled || 0}
                    label="Courses Enrolled"
                    subtext="In your courses"
                    iconBg={C.innerBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard
                    icon={MdCreditCard}
                    value={`₹${stats?.totalSpent || 0}`}
                    label="Total Spent"
                    subtext="On your courses"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
            </div>

            {/* ── Enrollments List ─────────────────────────────────────────── */}
            <div
                className="overflow-hidden"
                style={{
                    backgroundColor: C.cardBg,
                    borderRadius:    R['2xl'],
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                }}
            >
                {/* Card Header */}
                <div
                    className="px-5 py-4 flex items-center gap-2.5"
                    style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}
                >
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdMenuBook style={{ width: 18, height: 18, color: C.iconColor }} />
                    </div>
                    <h3
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size.xl,
                            fontWeight:  T.weight.semibold,
                            color:       C.heading,
                            margin:      0,
                        }}
                    >
                        Enrolled Courses
                    </h3>
                </div>

                {/* Table / Empty */}
                <div className="overflow-x-auto custom-scrollbar">
                    {enrollments.length > 0 ? (
                        <div className="min-w-[800px]">
                            {/* Table Header */}
                            <div
                                className="grid grid-cols-[2fr_1fr_100px_200px] gap-4 px-6 py-3"
                                style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                            >
                                {['Course', 'Level', 'Price', 'Progress'].map(h => (
                                    <span
                                        key={h}
                                        style={{
                                            fontFamily:    T.fontFamily,
                                            fontSize:      T.size.xs,
                                            fontWeight:    T.weight.bold,
                                            color:         C.text,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                        }}
                                    >
                                        {h}
                                    </span>
                                ))}
                            </div>

                            {/* Rows */}
                            <div className="flex flex-col gap-2 p-3">
                                {enrollments.map(enrollment => (
                                    <div
                                        key={enrollment._id}
                                        className="grid grid-cols-[2fr_1fr_100px_200px] gap-4 px-3 py-3 items-center transition-colors"
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = C.btnPrimary}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}
                                    >
                                        {/* Course */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            {enrollment.courseId?.thumbnail ? (
                                                <img
                                                    src={enrollment.courseId.thumbnail}
                                                    alt={enrollment.courseId?.title}
                                                    className="w-10 h-10 object-cover shrink-0"
                                                    style={{ borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                                />
                                            ) : (
                                                <div
                                                    className="flex items-center justify-center shrink-0"
                                                    style={{ width: 40, height: 40, backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}
                                                >
                                                    <MdMenuBook style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                </div>
                                            )}
                                            <span
                                                className="truncate"
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size.base,
                                                    fontWeight:  T.weight.semibold,
                                                    color:       C.heading,
                                                }}
                                            >
                                                {enrollment.courseId?.title || 'Unknown Course'}
                                            </span>
                                        </div>

                                        {/* Level Badge */}
                                        <div>
                                            <span
                                                style={{
                                                    fontFamily:      T.fontFamily,
                                                    fontSize:        T.size.xs,
                                                    fontWeight:      T.weight.bold,
                                                    backgroundColor: C.cardBg,
                                                    color:           C.text,
                                                    border:          `1px solid ${C.cardBorder}`,
                                                    padding:         '4px 10px',
                                                    borderRadius:    '10px',
                                                    textTransform:   'uppercase',
                                                }}
                                            >
                                                {enrollment.courseId?.level || 'N/A'}
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <span
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size.base,
                                                    fontWeight:  T.weight.bold,
                                                    color:       C.heading,
                                                }}
                                            >
                                                {enrollment.courseId?.price ? `₹${enrollment.courseId.price}` : 'Free'}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex-1 overflow-hidden"
                                                style={{
                                                    height:          8,
                                                    backgroundColor: C.cardBg,
                                                    borderRadius:    R.full,
                                                    border:          `1px solid ${C.cardBorder}`,
                                                }}
                                            >
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width:      `${enrollment.progress?.percentage || 0}%`,
                                                        background: C.gradientBtn,
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className="shrink-0"
                                                style={{
                                                    fontFamily:  T.fontFamily,
                                                    fontSize:    T.size.xs,
                                                    fontWeight:  T.weight.bold,
                                                    color:       C.btnPrimary,
                                                    width:       '36px',
                                                    textAlign:   'right',
                                                }}
                                            >
                                                {enrollment.progress?.percentage || 0}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="text-center py-16 flex flex-col items-center">
                            <div
                                className="flex items-center justify-center mb-4"
                                style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: R.lg }}
                            >
                                <MdMenuBook style={{ width: 28, height: 28, color: C.text, opacity: 0.3 }} />
                            </div>
                            <p
                                style={{
                                    fontFamily:   T.fontFamily,
                                    fontSize:     T.size.lg,
                                    fontWeight:   T.weight.bold,
                                    color:        C.heading,
                                    margin:       '0 0 4px 0',
                                }}
                            >
                                No active enrollments.
                            </p>
                            <p
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size.base,
                                    fontWeight:  T.weight.medium,
                                    color:       C.text,
                                    margin:      0,
                                }}
                            >
                                This student has not enrolled in any of your courses yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}