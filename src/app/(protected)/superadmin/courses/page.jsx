'use client';

import { useState, useEffect } from 'react';
import {
    MdHourglassEmpty, MdMenuBook, MdSearch, MdWarning, MdSchool,
    MdBusiness, MdCheckCircle, MdBlock, MdVisibility, MdVideocam,
    MdMoreHoriz, MdAccessTime, MdStar, MdPerson
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Base Input Style ─────────────────────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

export default function SuperAdminCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [kpis, setKpis] = useState({ totalCourses: 0, publishedCourses: 0, suspendedCourses: 0, totalEnrollments: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchCourses();
    }, [statusFilter]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/courses?status=${statusFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;

            const res = await api.get(query);
            if (res.data.success) {
                setCourses(res.data.data.courses);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load global courses');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCourses();
    };

    const handleStatusChange = async (id, currentStatus, title) => {
        const newStatus = currentStatus === 'suspended' ? 'published' : 'suspended';
        const actionText = newStatus === 'suspended' ? 'SUSPEND' : 'RESTORE';

        if (!confirm(`🚨 Are you sure you want to ${actionText} the course: "${title}"?`)) return;

        try {
            const res = await api.patch(`/superadmin/courses/${id}/status`, { status: newStatus });
            if (res.data.success) {
                setCourses(courses.map(c => c._id === id ? { ...c, status: newStatus } : c));
                toast.success(`Course successfully ${newStatus}`);
            }
        } catch (error) {
            toast.error('Failed to update course status');
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'published': return { color: C.success, bg: C.successBg, border: `1px solid ${C.successBorder}`, icon: MdCheckCircle, label: 'Published' };
            case 'suspended': return { color: C.danger, bg: C.dangerBg, border: `1px solid ${C.dangerBorder}`, icon: MdWarning, label: 'Suspended' };
            case 'pending': return { color: C.warning, bg: C.warningBg, border: `1px solid ${C.warningBorder}`, icon: MdAccessTime, label: 'Pending Review' };
            default: return { color: C.textMuted, bg: C.innerBg, border: `1px solid ${C.cardBorder}`, icon: MdMenuBook, label: status };
        }
    };

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdMenuBook style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Global Course Registry
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Monitor, audit, and moderate all content across the platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdMenuBook} 
                    value={kpis.totalCourses} 
                    label="Total Courses" 
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdCheckCircle} 
                    value={kpis.publishedCourses} 
                    label="Active / Live" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
                <StatCard 
                    icon={MdWarning} 
                    value={kpis.suspendedCourses} 
                    label="Suspended" 
                    iconBg={C.dangerBg} 
                    iconColor={C.danger} 
                />
                <StatCard 
                    icon={MdSchool} 
                    value={kpis.totalEnrollments.toLocaleString()} 
                    label="Global Enrollments" 
                    iconBg="#FFF7ED" 
                    iconColor="#F59E0B" 
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    {['all', 'published', 'pending', 'suspended'].map(status => (
                        <button 
                            key={status} 
                            onClick={() => setStatusFilter(status)} 
                            className="transition-all capitalize whitespace-nowrap border-none cursor-pointer"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                backgroundColor: statusFilter === status ? C.surfaceWhite : 'transparent',
                                color: statusFilter === status ? C.btnPrimary : C.textFaint,
                                boxShadow: statusFilter === status ? S.active : 'none'
                            }}
                        >
                            {status === 'all' ? 'All Courses' : status}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full xl:w-[320px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" 
                        placeholder="Search by course title..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </form>
            </div>

            {/* ── Courses List ── */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                            Loading courses...
                        </p>
                    </div>
                </div>
            ) : courses.length === 0 ? (
                <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdWarning style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No courses found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map(course => {
                        const statusData = getStatusConfig(course.status);
                        const StatusIcon = statusData.icon;

                        return (
                            <div key={course._id} className="flex flex-col transition-transform hover:-translate-y-1 overflow-hidden group" 
                                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = S.cardHover}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = S.card}
                            >

                                {/* Thumbnail Header */}
                                <div className="relative w-full overflow-hidden" style={{ height: '160px', backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ color: C.textFaint }}>
                                            <MdVideocam style={{ width: 48, height: 48, opacity: 0.5 }} />
                                        </div>
                                    )}

                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className="flex items-center gap-1" 
                                            style={{ 
                                                padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, 
                                                textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                backgroundColor: statusData.bg, color: statusData.color, border: statusData.border 
                                            }}>
                                            <StatusIcon style={{ width: 12, height: 12 }} /> {statusData.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 flex flex-col" style={{ padding: '20px' }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span style={{ 
                                            fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: C.btnPrimary, 
                                            textTransform: 'uppercase', letterSpacing: T.tracking.wider, backgroundColor: C.innerBg, 
                                            padding: '2px 8px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` 
                                        }}>
                                            {course.level}
                                        </span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading }}>
                                            {course.isFree ? 'Free' : `₹${course.price}`}
                                        </span>
                                    </div>

                                    <h3 className="line-clamp-2 leading-snug" style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '12px' }}>
                                        {course.title}
                                    </h3>

                                    {/* Context Details */}
                                    <div className="space-y-2 mt-auto">
                                        <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                            <MdBusiness style={{ width: 16, height: 16, color: C.textFaint, flexShrink: 0 }} />
                                            <span className="truncate">{course.instituteId ? course.instituteId.name : 'Global Platform'}</span>
                                        </div>
                                        <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>
                                            <div className="flex items-center justify-center shrink-0 overflow-hidden" 
                                                style={{ width: 16, height: 16, borderRadius: R.full, backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                {course.tutorId?.profileImage ? (
                                                    <img src={course.tutorId.profileImage} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span style={{ fontSize: '8px', fontWeight: T.weight.bold, color: C.btnPrimary }}>T</span>
                                                )}
                                            </div>
                                            <span className="truncate">{course.tutorId?.name || 'Unknown Tutor'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer & God Actions */}
                                <div className="flex items-center justify-between gap-3" style={{ padding: '16px 20px', borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                    <div className="flex items-center gap-3" style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.statLabel }}>
                                        <span className="flex items-center gap-1"><MdSchool style={{ width: 14, height: 14 }} /> {course.enrolledCount}</span>
                                        <span className="flex items-center gap-1" style={{ color: C.warning }}><MdStar style={{ width: 14, height: 14, color: C.warning }} /> {course.rating.toFixed(1)}</span>
                                    </div>

                                    {/* Master Ban Button */}
                                    <button
                                        onClick={() => handleStatusChange(course._id, course.status, course.title)}
                                        className="flex items-center justify-center transition-colors cursor-pointer border-none shadow-sm"
                                        style={{ 
                                            width: 36, height: 36, borderRadius: '10px',
                                            ...(course.status === 'suspended' ? { backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` } : { backgroundColor: C.surfaceWhite, color: C.danger, border: `1px solid ${C.dangerBorder}` })
                                        }}
                                        onMouseEnter={(e) => { 
                                            e.currentTarget.style.backgroundColor = course.status === 'suspended' ? C.success : C.dangerBg; 
                                            if (course.status === 'suspended') e.currentTarget.style.color = '#ffffff';
                                        }}
                                        onMouseLeave={(e) => { 
                                            e.currentTarget.style.backgroundColor = course.status === 'suspended' ? C.successBg : C.surfaceWhite; 
                                            if (course.status === 'suspended') e.currentTarget.style.color = C.success;
                                        }}
                                        title={course.status === 'suspended' ? 'Restore Course' : 'Suspend / Takedown Course'}
                                    >
                                        {course.status === 'suspended' ? <MdCheckCircle style={{ width: 18, height: 18 }} /> : <MdBlock style={{ width: 18, height: 18 }} />}
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}