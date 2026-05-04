'use client';

import { useState, useEffect, use } from 'react';
import { 
    MdMail, 
    MdPhone, 
    MdCalendarMonth, 
    MdBook, 
    MdPerson, 
    MdCreditCard, 
    MdLibraryBooks,
    MdVisibility
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

// ─── Reusable Section Header Pattern ──────────────────────────────────────────
function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                <Icon style={{ width: 16, height: 16, color: C.iconColor }} />
            </div>
            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                {title}
            </h2>
        </div>
    );
}

export default function AdminStudentDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [stats, setStats] = useState(null);
    const [enrollments, setEnrollments] = useState([]);

    useEffect(() => {
        fetchStudentDetails();
    }, [id]);

    const fetchStudentDetails = async () => {
        try {
            const res = await api.get(`/admin/students/${id}`);
            if (res.data.success) {
                setStudent(res.data.student);
                setStats(res.data.stats);
                setEnrollments(res.data.enrollments);
            }
        } catch (error) {
            console.error('Failed to fetch student details:', error);
            toast.error('Failed to load student details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading details...
                    </p>
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
                <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdPerson style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>Student Not Found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>The student you are looking for does not exist.</p>
                    <button onClick={() => router.push('/admin/students')} className="mt-6 transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ padding: '10px 24px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                        Back to Students
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen w-full" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* Header / Profile Card */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div style={{ height: '128px', background: C.gradientBtn }}></div>
                <div className="px-6 pb-6 relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
                        <div className="flex items-end gap-4">
                            <div className="shrink-0 flex items-center justify-center overflow-hidden"
                                style={{ width: 96, height: 96, borderRadius: '10px', border: `4px solid ${C.cardBg}`, backgroundColor: C.surfaceWhite, boxShadow: S.card }}>
                                {student.profileImage ? (
                                    <img src={student.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.bold, color: C.textMuted }}>
                                        {student.name?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="mb-1">
                                <h1 className="flex items-center flex-wrap gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                    {student.name}
                                    <span style={{ backgroundColor: C.successBg, color: C.success, padding: '2px 8px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MdPerson style={{ width: 12, height: 12 }} /> Student
                                    </span>
                                </h1>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>{student.email}</p>
                            </div>
                        </div>
                        <div className="flex shrink-0">
                            <button
                                onClick={() => router.push('/admin/students')}
                                className="transition-colors cursor-pointer"
                                style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '10px 20px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                            >
                                Back to List
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                    <MdMail style={{ width: 16, height: 16, color: C.iconColor }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{student.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                    <MdCalendarMonth style={{ width: 16, height: 16, color: C.iconColor }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>Joined {new Date(student.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard 
                    icon={MdBook}
                    value={stats?.totalEnrolled || 0}
                    label="Courses Enrolled"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdCreditCard}
                    value={`$${stats?.totalSpent || 0}`}
                    label="Total Spent"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
            </div>

            {/* Enrollments List */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <SectionHeader icon={MdLibraryBooks} title="Enrolled Courses" />
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Course</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Level</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Price</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Progress</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollments.length > 0 ? (
                                enrollments.map((enrollment) => (
                                    <tr key={enrollment._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div className="flex items-center gap-3">
                                                {enrollment.courseId?.thumbnail && (
                                                    <img src={enrollment.courseId.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: '10px', objectFit: 'cover' }} />
                                                )}
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {enrollment.courseId?.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, textTransform: 'capitalize' }}>
                                                {enrollment.courseId?.level}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>
                                                ${enrollment.courseId?.price}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="flex items-center gap-3">
                                                <div style={{ width: '80px', backgroundColor: C.innerBg, borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                                    <div
                                                        style={{ backgroundColor: C.success, height: '100%', borderRadius: '10px', width: `${enrollment.progress?.percentage || 0}%`, transition: 'width 0.5s ease' }}
                                                    ></div>
                                                </div>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{enrollment.progress?.percentage || 0}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => router.push(`/admin/courses/${enrollment.courseId?._id}`)}
                                                className="transition-colors cursor-pointer border-none"
                                                style={{ backgroundColor: 'transparent', color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#5839D6'}
                                                onMouseLeave={e => e.currentTarget.style.color = C.btnPrimary}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <MdVisibility style={{ width: 16, height: 16 }} /> View Course
                                                </div>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16">
                                        <div className="p-14 text-center border border-dashed"
                                             style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4"
                                                 style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdLibraryBooks style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Enrollments</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No active enrollments found.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}