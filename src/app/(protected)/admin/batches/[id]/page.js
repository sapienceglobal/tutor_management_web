'use client';

import { useState, useEffect, use } from 'react';
import { 
    MdLayers, 
    MdPeople, 
    MdSecurity, 
    MdCalendarMonth, 
    MdSchool, 
    MdBook,
    MdVisibility,
    MdWarning,
    MdPeopleOutline
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

export default function AdminBatchDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState(null);

    useEffect(() => {
        fetchBatchDetails();
    }, [id]);

    const fetchBatchDetails = async () => {
        try {
            const res = await api.get(`/batches/${id}`);
            if (res.data.success) {
                setBatch(res.data.batch);
            }
        } catch (error) {
            console.error('Failed to fetch batch details:', error);
            toast.error('Failed to load batch details');
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

    if (!batch) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
                <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdWarning style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>Batch Not Found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>The batch you are looking for does not exist.</p>
                    <button onClick={() => router.push('/admin/batches')} className="mt-6 transition-opacity hover:opacity-90 cursor-pointer border-none"
                        style={{ padding: '10px 24px', background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                        Back to Batches
                    </button>
                </div>
            </div>
        );
    }

    const totalInstructors = batch.instructors?.length || 0;
    const totalStudents = batch.students?.length || 0;

    const statusBadge = (status) => {
        const s = status || 'active';
        const map = {
            active: { bg: C.successBg, color: C.success, border: C.successBorder, label: 'Active' },
            upcoming: { bg: C.warningBg, color: C.warning, border: C.warningBorder, label: 'Upcoming' },
            completed: { bg: C.btnViewAllBg, color: C.btnPrimary, border: C.cardBorder, label: 'Completed' },
        };
        return map[s] || { bg: C.innerBg, color: C.text, border: C.cardBorder, label: s };
    };

    const badge = statusBadge(batch.status);

    return (
        <div className="space-y-6 min-h-screen w-full" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* Header / Batch Info Card */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div style={{ height: '96px', background: C.gradientBtn }}></div>
                <div className="px-6 pb-6 relative">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-8 mb-6">
                        <div className="flex items-end gap-4">
                            <div className="shrink-0 flex items-center justify-center overflow-hidden"
                                style={{ width: 80, height: 80, borderRadius: '12px', border: `4px solid ${C.cardBg}`, backgroundColor: C.surfaceWhite, boxShadow: S.card }}>
                                <MdLayers style={{ width: 36, height: 36, color: C.btnPrimary }} />
                            </div>
                            <div className="mb-1">
                                <h1 className="flex items-center flex-wrap gap-2.5" style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                    {batch.name}
                                    <span style={{ 
                                        backgroundColor: badge.bg, 
                                        color: badge.color, 
                                        border: `1px solid ${badge.border}`,
                                        padding: '2px 8px', 
                                        borderRadius: '10px', 
                                        fontSize: T.size.xs, 
                                        fontWeight: T.weight.bold, 
                                        textTransform: 'uppercase' 
                                    }}>
                                        {badge.label}
                                    </span>
                                </h1>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                                    Course: <span style={{ color: C.heading }}>{batch.courseId?.title || '—'}</span> • Grade: <span style={{ color: C.heading }}>{batch.grade || '—'}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0">
                            <button
                                onClick={() => router.push('/admin/batches')}
                                className="transition-colors cursor-pointer border-none"
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
                                    <MdCalendarMonth style={{ width: 16, height: 16, color: C.iconColor }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                    Start Date: {batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                    <MdCalendarMonth style={{ width: 16, height: 16, color: C.iconColor }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                    End Date: {batch.endDate ? new Date(batch.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </span>
                            </div>
                        </div>
                        {batch.scheduleDescription && (
                            <div className="space-y-2">
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Schedule Info</h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, lineHeight: 1.5, margin: 0 }}>
                                    {batch.scheduleDescription}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StatCard 
                    icon={MdSecurity}
                    value={totalInstructors}
                    label="Instructors Assigned"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdSchool}
                    value={totalStudents}
                    label="Students Enrolled"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
            </div>

            {/* Instructors Section */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <SectionHeader icon={MdSecurity} title="Assigned Instructors" />
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Instructor Name</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Email Address</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {totalInstructors > 0 ? (
                                batch.instructors.map((instructor) => {
                                    const userDoc = instructor.userId || instructor;
                                    const instructorId = userDoc?._id;
                                    return (
                                        <tr key={instructor._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div className="flex items-center gap-3">
                                                    <img src={userDoc?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDoc?.name || 'Instructor')}&background=random`} alt="" className="object-cover shrink-0" style={{ width: 36, height: 36, borderRadius: '8px' }} />
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {userDoc?.name || 'Unknown User'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                                    {userDoc?.email || 'N/A'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                {instructorId && (
                                                    <button
                                                        onClick={() => router.push(`/admin/tutors/${instructorId}`)}
                                                        className="transition-colors cursor-pointer border-none"
                                                        style={{ backgroundColor: 'transparent', color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#5839D6'}
                                                        onMouseLeave={e => e.currentTarget.style.color = C.btnPrimary}
                                                    >
                                                        <div className="flex items-center justify-end gap-1">
                                                            <MdVisibility style={{ width: 16, height: 16 }} /> View Profile
                                                        </div>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-10">
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, fontWeight: T.weight.medium, textAlign: 'center', margin: 0 }}>No instructors assigned to this batch.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Students Section */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                <div className="p-6" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <SectionHeader icon={MdSchool} title="Enrolled Students" />
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Student Name</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Email Address</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {totalStudents > 0 ? (
                                batch.students.map((student) => (
                                    <tr key={student._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div className="flex items-center gap-3">
                                                <img src={student.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`} alt="" className="object-cover shrink-0" style={{ width: 36, height: 36, borderRadius: '8px' }} />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {student.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                                                {student.email}
                                            </span>
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
                                    <td colSpan="3" className="px-6 py-16">
                                        <div className="p-10 text-center border border-dashed"
                                             style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4"
                                                 style={{ width: 48, height: 48, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdPeopleOutline style={{ width: 24, height: 24, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>No Enrolled Students</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 4 }}>
                                                No students have been enrolled into this batch yet.
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
