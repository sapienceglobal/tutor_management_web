'use client';

import { useState, useEffect, use } from 'react';
import { 
    MdMenuBook, 
    MdPeople, 
    MdAttachMoney, 
    MdVisibility,
    MdHourglassEmpty,
    MdSchool,
    MdWarning
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

export default function AdminCourseDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [stats, setStats] = useState(null);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchCourseDetails();
    }, [id]);

    const fetchCourseDetails = async () => {
        try {
            const res = await api.get(`/admin/courses/${id}`);
            if (res.data.success) {
                setCourse(res.data.course);
                setStats(res.data.stats);
                setStudents(res.data.students);
            }
        } catch (error) {
            console.error('Failed to fetch course details:', error);
            toast.error('Failed to load course details');
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

    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
                <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdWarning style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>Course Not Found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>The course you are looking for does not exist.</p>
                    <button onClick={() => router.push('/admin/courses')} className="mt-6 transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ padding: '10px 24px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen w-full" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* Header / Course Card */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="relative h-48" style={{ backgroundColor: C.heading }}>
                    {course.thumbnail && (
                        <>
                            <img src={course.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30, 27, 75, 0.9), transparent)' }}></div>
                        </>
                    )}
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span style={{ 
                                        padding: '2px 8px', 
                                        borderRadius: '10px', 
                                        fontFamily: T.fontFamily, 
                                        fontSize: T.size.xs, 
                                        fontWeight: T.weight.bold, 
                                        textTransform: 'uppercase', 
                                        letterSpacing: T.tracking.wider,
                                        backgroundColor: course.status === 'published' ? C.successBg : C.btnViewAllBg,
                                        color: course.status === 'published' ? C.success : C.btnPrimary,
                                        border: `1px solid ${course.status === 'published' ? C.successBorder : 'transparent'}`
                                    }}>
                                        {course.status}
                                    </span>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#ffffff', opacity: 0.8, textTransform: 'capitalize' }}>
                                        • {course.level}
                                    </span>
                                </div>
                                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: '#ffffff', margin: '0 0 8px 0' }}>{course.title}</h1>
                                <p className="line-clamp-1 max-w-2xl" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: '#ffffff', opacity: 0.8, margin: 0 }}>{course.description}</p>
                            </div>
                            <button
                                onClick={() => router.push('/admin/courses')}
                                className="transition-colors cursor-pointer shrink-0"
                                style={{ backgroundColor: C.surfaceWhite, color: C.heading, border: 'none', borderRadius: '10px', padding: '10px 20px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; e.currentTarget.style.color = C.btnPrimary; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.heading; }}
                            >
                                Back to List
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div onClick={() => router.push(`/admin/tutors/${course.tutorId?._id}`)} className="cursor-pointer group flex flex-col p-4 transition-colors" 
                             style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                             onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                             onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 8px 0' }}>Instructor</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center shrink-0 overflow-hidden" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                    {course.tutorId?.profileImage ? (
                                        <img src={course.tutorId.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                            {course.tutorId?.name?.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <span className="truncate transition-colors" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                    {course.tutorId?.name || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 8px 0' }}>Price</h3>
                            <div style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                {course.price > 0 ? `$${course.price}` : 'Free'}
                            </div>
                        </div>

                        <div className="flex flex-col p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 8px 0' }}>Category</h3>
                            <div className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                {course.category || 'General'}
                            </div>
                        </div>

                        <div className="flex flex-col p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: '0 0 8px 0' }}>Created Date</h3>
                            <div style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                {new Date(course.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <StatCard 
                    icon={MdMenuBook}
                    value={stats?.totalCourses || 0}
                    label="Total Courses"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdPeople}
                    value={stats?.totalStudents || 0}
                    label="Enrolled Students"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard 
                    icon={MdAttachMoney}
                    value={`$${stats?.totalEarnings || 0}`}
                    label="Total Revenue"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
            </div>

            {/* Students List */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <SectionHeader icon={MdSchool} title="Enrolled Students" />
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Student Name</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Email</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Enrolled Date</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Progress</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                {student.name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                                {student.email}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                                {new Date(student.enrolledAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="flex items-center gap-3">
                                                <div style={{ width: '80px', backgroundColor: C.innerBg, borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                                    <div
                                                        style={{ backgroundColor: C.success, height: '100%', borderRadius: '10px', width: `${student.progress || 0}%`, transition: 'width 0.5s ease' }}
                                                    ></div>
                                                </div>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{student.progress || 0}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => router.push(`/admin/students/${student._id}`)}
                                                className="transition-colors cursor-pointer border-none"
                                                style={{ backgroundColor: 'transparent', color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#5839D6'}
                                                onMouseLeave={e => e.currentTarget.style.color = C.btnPrimary}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <MdVisibility style={{ width: 16, height: 16 }} /> View Profile
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
                                                <MdPeople style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Students</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No students enrolled yet.
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