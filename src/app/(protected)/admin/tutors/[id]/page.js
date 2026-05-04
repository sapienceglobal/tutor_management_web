'use client';

import { useState, useEffect, use } from 'react';
import { 
    MdMail, 
    MdPhone, 
    MdCalendarMonth, 
    MdMenuBook, 
    MdAttachMoney, 
    MdPeople, 
    MdSecurity,
    MdVisibility,
    MdLibraryBooks
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

export default function AdminTutorDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tutor, setTutor] = useState(null);
    const [stats, setStats] = useState(null);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchTutorDetails();
    }, [id]);

    const fetchTutorDetails = async () => {
        try {
            const res = await api.get(`/admin/tutors/${id}`);
            if (res.data.success) {
                setTutor(res.data.tutor);
                setStats(res.data.stats);
                setCourses(res.data.courses);
            }
        } catch (error) {
            console.error('Failed to fetch tutor details:', error);
            toast.error('Failed to load tutor details');
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

    if (!tutor) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
                <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdSecurity style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>Tutor Not Found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>The tutor you are looking for does not exist.</p>
                    <button onClick={() => router.push('/admin/tutors')} className="mt-6 transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ padding: '10px 24px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                        Back to Instructors
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
                                {tutor.profileImage ? (
                                    <img src={tutor.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.bold, color: C.textMuted }}>
                                        {tutor.name?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="mb-1">
                                <h1 className="flex items-center flex-wrap gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                    {tutor.name}
                                    <span style={{ backgroundColor: C.btnViewAllBg, color: C.btnPrimary, padding: '2px 8px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MdSecurity style={{ width: 12, height: 12 }} /> Tutor
                                    </span>
                                </h1>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>{tutor.email}</p>
                            </div>
                        </div>
                        <div className="flex shrink-0">
                            <button
                                onClick={() => router.push('/admin/tutors')}
                                className="transition-colors cursor-pointer"
                                style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '10px 20px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                            >
                                Back to List
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                    <MdMail style={{ width: 16, height: 16, color: C.iconColor }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{tutor.email}</span>
                            </div>
                            {tutor.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                        <MdPhone style={{ width: 16, height: 16, color: C.iconColor }} />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{tutor.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                    <MdCalendarMonth style={{ width: 16, height: 16, color: C.iconColor }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>Joined {new Date(tutor.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 8px 0' }}>Bio</h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, lineHeight: 1.6, margin: 0 }}>
                                {tutor.bio || "No biography provided."}
                            </p>
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
                    label="Total Students"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard 
                    icon={MdAttachMoney}
                    value={`$${stats?.totalEarnings || 0}`}
                    label="Total Earnings"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
            </div>

            {/* Courses List */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <SectionHeader icon={MdLibraryBooks} title={`Courses by ${tutor.name}`} />
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Title</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Category</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Price</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length > 0 ? (
                                courses.map((course) => (
                                    <tr key={course._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                {course.title}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                                {course.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>
                                                ${course.price}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                padding: '4px 10px',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.bold,
                                                borderRadius: '10px',
                                                textTransform: 'uppercase',
                                                letterSpacing: T.tracking.wider,
                                                backgroundColor: course.status === 'published' ? C.successBg : course.status === 'draft' ? C.btnViewAllBg : C.warningBg,
                                                color: course.status === 'published' ? C.success : course.status === 'draft' ? C.textMuted : C.warning,
                                                border: `1px solid ${course.status === 'published' ? C.successBorder : course.status === 'draft' ? C.cardBorder : C.warningBorder}`
                                            }}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => router.push(`/admin/courses/${course._id}`)}
                                                className="transition-colors cursor-pointer border-none"
                                                style={{ backgroundColor: 'transparent', color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#5839D6'}
                                                onMouseLeave={e => e.currentTarget.style.color = C.btnPrimary}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    <MdVisibility style={{ width: 16, height: 16 }} /> View
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
                                                <MdMenuBook style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Courses</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No courses created yet.
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