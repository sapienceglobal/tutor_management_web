'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import StatCard from '@/components/StatCard';
import AnalyticsChart from '@/components/widgets/AnalyticsChart';
import {
    MdPeople,
    MdMenuBook,
    MdLayers,
    MdChevronRight,
    MdBolt,
    MdPersonAdd,
    MdFactCheck,
    MdCalendarMonth,
    MdArticle,
    MdMoreVert,
    MdWarning,
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, linkHref, linkLabel = 'View All' }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
                <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}
                >
                    <Icon style={{ width: 16, height: 16, color: C.iconColor }} />
                </div>
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                    {title}
                </h2>
            </div>
            {linkHref && (
                <Link
                    href={linkHref}
                    className="inline-flex items-center gap-1 transition-all hover:opacity-80"
                    style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, borderRadius: '10px', border: `1px solid ${C.cardBorder}`, padding: '6px 12px' }}
                >
                    {linkLabel} <MdChevronRight style={{ width: 16, height: 16 }} />
                </Link>
            )}
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats]   = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/stats');
            if (res.data.success) setStats(res.data.stats);
        } catch { toast.error('Failed to load dashboard stats'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading && !stats) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
                <div
                    className="rounded-full border-[3px] animate-spin"
                    style={{ width: 48, height: 48, borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                    Loading...
                </p>
            </div>
        </div>
    );

    const formatTrend = (val) => val === null ? 'New' : `${val >= 0 ? '+' : ''}${Math.abs(val).toFixed(0)}%`;

    const statsData = [
        { title: 'Total Students',     value: stats?.totalStudents?.toLocaleString()  || '0', trend: formatTrend(stats?.trends?.students), icon: MdPeople,    iconColor: C.btnPrimary, iconBg: C.btnViewAllBg },
        { title: 'Total Instructors',  value: stats?.totalTutors?.toLocaleString()    || '0', trend: formatTrend(stats?.trends?.tutors),   icon: MdPersonAdd, iconColor: C.heading,    iconBg: C.innerBg },
        { title: 'Total Courses',      value: stats?.totalCourses?.toLocaleString()   || '0', trend: formatTrend(stats?.trends?.courses),  icon: MdLayers,    iconColor: C.warning,    iconBg: C.warningBg },
        { title: 'Active Batches',     value: stats?.activeBatches?.toLocaleString()  || '0', trend: 'Running',                            icon: MdMenuBook,  iconColor: C.success,    iconBg: C.successBg },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <img
                        src={stats?.adminImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminProfile'}
                        alt="Admin"
                        className="w-14 h-14 object-cover shrink-0"
                        style={{ borderRadius: '10px', border: `2px solid ${C.btnPrimary}`, boxShadow: `0 0 0 3px ${C.btnViewAllBg}` }}
                    />
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0', lineHeight: T.leading.tight }}>
                            Welcome back, {stats?.adminName || 'Admin'} 👋
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, margin: 0 }}>
                            Here's an overview of your institute's performance and upcoming activities.
                        </p>
                    </div>
                </div>

                <button
                    className="flex items-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                    style={{ background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}
                >
                    <MdBolt style={{ width: 18, height: 18 }} /> Quick Actions <MdChevronRight style={{ width: 18, height: 18 }} />
                </button>
            </div>

            {/* ── Main Split Layout ── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* ── LEFT: Main content ── */}
                <div className="xl:col-span-3 flex flex-col gap-6">

                    {/* Row 1: Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statsData.map((stat, i) => (
                            <StatCard
                                key={i}
                                icon={stat.icon}
                                value={stat.value}
                                label={stat.title}
                                subtext={stat.trend}
                                iconBg={stat.iconBg}
                                iconColor={stat.iconColor}
                            />
                        ))}
                    </div>

                    {/* Row 2: Analytics Chart + Upcoming Classes */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AnalyticsChart data={stats?.monthlyData} title="Course Performance" />
                        </div>

                        <div
                            className="lg:col-span-1 flex flex-col"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 20 }}
                        >
                            <SectionHeader icon={MdCalendarMonth} title="Upcoming Classes" linkHref="/admin/classes" />
                            <div className="flex flex-col gap-4 flex-1">
                                {stats?.upcomingClasses?.map((cls, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 items-center transition-colors"
                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}
                                    >
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.cardBg, borderRadius: '10px' }}>
                                            <MdCalendarMonth style={{ width: 18, height: 18, color: C.btnPrimary }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                    {cls.title}
                                                </h4>
                                                {cls.status === 'Live' ? (
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, backgroundColor: C.btnViewAllBg, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                        Live
                                                    </span>
                                                ) : (
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.success, backgroundColor: C.successBg, padding: '2px 8px', borderRadius: '10px' }}>
                                                        Upcoming
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text, margin: '4px 0 0 0' }}>
                                                {cls.date} • {cls.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Recent Activity + Exams + Fee Collection */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Recent Activity */}
                        <div
                            className="flex flex-col"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 20 }}
                        >
                            <SectionHeader icon={MdFactCheck} title="Recent Activities" linkHref="/admin/activity" />
                            <div className="flex flex-col gap-4">
                                {stats?.recentActivity?.map((act, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 items-center transition-colors"
                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}
                                    >
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                                            alt="Avatar"
                                            className="w-10 h-10 object-cover shrink-0"
                                            style={{ borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                    {act.text.split(':')[1] || 'User Name'}
                                                </p>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text, whiteSpace: 'nowrap' }}>
                                                    {act.time}
                                                </span>
                                            </div>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text, margin: '2px 0 0 0' }}>
                                                {act.text.split(':')[0]}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Exams & Assessments */}
                        <div
                            className="flex flex-col"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 20 }}
                        >
                            <SectionHeader icon={MdArticle} title="Exams & Assessments" linkHref="/admin/exams" />
                            <div className="flex flex-col gap-4">
                                {stats?.upcomingExams?.length > 0 ? (
                                    stats.upcomingExams.map((exam, i) => {
                                        const badge = i === 0
                                            ? { bg: C.warningBg,    text: C.warning,    label: 'Upcoming' }
                                            : i === 1
                                                ? { bg: C.successBg,  text: C.success,    label: 'Live' }
                                                : { bg: C.btnViewAllBg, text: C.btnPrimary, label: 'Draft' };
                                        return (
                                            <div
                                                key={i}
                                                className="flex gap-3 items-center transition-colors"
                                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}
                                            >
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.cardBg, borderRadius: '10px' }}>
                                                    <MdArticle style={{ width: 18, height: 18, color: C.btnPrimary }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                        {exam.title}
                                                    </h4>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text, margin: '2px 0 0 0' }}>
                                                        {exam.date} • {exam.time}
                                                    </p>
                                                </div>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: badge.bg, color: badge.text, padding: '4px 8px', borderRadius: '10px', flexShrink: 0 }}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, fontStyle: 'italic', color: C.text, margin: 0 }}>
                                        No exams found.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Fee Collection */}
                        <div
                            className="flex flex-col"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 20 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Fee Collection</h3>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>This Month ▾</span>
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text, margin: 0 }}>Total Collected</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: '2px 0 0 0' }}>
                                            ₹{stats?.feeCollection?.collected?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text, margin: 0 }}>Pending Fees</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '2px 0 0 0' }}>
                                            ₹{stats?.feeCollection?.pending?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                </div>

                                {/* Donut chart */}
                                <div
                                    className="relative flex items-center justify-center"
                                    style={{
                                        width: 100, height: 100,
                                        borderRadius: R.full,
                                        background: `conic-gradient(${C.btnPrimary} ${stats?.feeCollection?.percentage || 0}%, ${C.innerBg} ${stats?.feeCollection?.percentage || 0}%)`,
                                    }}
                                >
                                    <div
                                        className="flex flex-col items-center justify-center"
                                        style={{ width: 76, height: 76, borderRadius: R.full, backgroundColor: C.cardBg }}
                                    >
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1 }}>
                                            {stats?.feeCollection?.percentage || 0}%
                                        </span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', marginTop: 4, letterSpacing: T.tracking.wider }}>
                                            Collected
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-auto pt-4">
                                <div className="flex items-center gap-1.5">
                                    <span style={{ width: 8, height: 8, borderRadius: R.full, backgroundColor: C.btnPrimary, display: 'inline-block' }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>Collected</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span style={{ width: 8, height: 8, borderRadius: R.full, backgroundColor: C.innerBg, display: 'inline-block' }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Batch Overview + Pending Approvals */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Batch Overview Table */}
                        <div
                            className="lg:col-span-2 flex flex-col"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 20 }}
                        >
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Batch Overview</h3>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            {['Batch', 'Students', 'Progress', 'Status'].map(h => (
                                                <th
                                                    key={h}
                                                    style={{ paddingBottom: 12, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, borderBottom: `1px solid ${C.cardBorder}` }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats?.batchOverview?.map((batch, i) => (
                                            <tr key={i} style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <td style={{ padding: '12px 0', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{batch.name}</td>
                                                <td style={{ padding: '12px 0', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{batch.students}</td>
                                                <td style={{ padding: '12px 0', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.success }}>{batch.progress}%</td>
                                                <td style={{ padding: '12px 0', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold }}>
                                                    <span style={{ color: batch.status === 'Active' ? C.success : C.btnPrimary }}>{batch.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pending Approvals */}
                        <div
                            className="lg:col-span-1 flex flex-col"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 20 }}
                        >
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>Pending Approvals</h3>
                            <div className="flex flex-col gap-4 flex-1">
                                {[
                                    { icon: MdPersonAdd, label: 'Instructors', count: stats?.pendingApprovals?.instructors, color: C.warning,    bg: C.warningBg },
                                    { icon: MdPeople,    label: 'Students',    count: stats?.pendingApprovals?.students,    color: C.btnPrimary, bg: C.btnViewAllBg },
                                    { icon: MdMenuBook,  label: 'Courses',     count: stats?.pendingApprovals?.courses,     color: C.success,    bg: C.successBg },
                                ].map(({ icon: Icon, label, count, color, bg }) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between"
                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon style={{ width: 18, height: 18, color }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{label}</span>
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color, backgroundColor: bg, padding: '4px 8px', borderRadius: '10px' }}>
                                            {count} Pending
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT SIDEBAR ── */}
                <div className="xl:col-span-1 flex flex-col gap-6">

                    {/* Quick Actions */}
                    <div
                        className="flex flex-col"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 20 }}
                    >
                        <SectionHeader icon={MdLayers} title="Quick Actions" />
                        <div className="flex flex-col gap-3">
                            {[
                                { label: 'Add Student',    icon: MdPersonAdd,    link: '/admin/students' },
                                { label: 'Create Batch',   icon: MdLayers,       link: '/admin/batches' },
                                { label: 'Schedule Class', icon: MdCalendarMonth, link: '/admin/classes' },
                                { label: 'Create Exam',    icon: MdArticle,      link: '/admin/exams' },
                            ].map((action, i) => (
                                <Link
                                    href={action.link}
                                    key={i}
                                    className="flex items-center justify-between w-full transition-all cursor-pointer group"
                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.cardBg, borderRadius: '10px' }}>
                                            <action.icon style={{ width: 18, height: 18, color: C.btnPrimary }} />
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                            {action.label}
                                        </span>
                                    </div>
                                    <MdChevronRight style={{ width: 18, height: 18, color: C.text }} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* AI Buddy dark card */}
                    <div
                        className="flex flex-col relative overflow-hidden"
                        style={{ backgroundColor: C.darkCard, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 24 }}
                    >
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, backgroundColor: C.cardBg, borderRadius: '10px' }}>
                                    <MdFactCheck style={{ width: 20, height: 20, color: C.darkCard }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.darkCardText, margin: 0 }}>
                                    AI Buddy
                                </h3>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.darkCard, backgroundColor: C.cardBg, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                    Beta
                                </span>
                            </div>
                            <MdMoreVert style={{ width: 20, height: 20, color: C.darkCardMuted, cursor: 'pointer' }} />
                        </div>

                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.darkCardMuted, margin: '0 0 24px 0', position: 'relative', zIndex: 10 }}>
                            Smart insights to help you grow
                        </p>

                        <div className="flex flex-col gap-4 mb-7 relative z-10">
                            {/* High risk alert */}
                            <div className="flex items-center gap-3.5" style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: '10px', padding: 12 }}>
                                <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, backgroundColor: C.danger, borderRadius: R.full }}>
                                    <MdWarning style={{ width: 14, height: 14, color: '#ffffff' }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.darkCardText }}>
                                    {stats?.pendingApprovals?.instructors || 0} students are at high risk
                                </span>
                            </div>

                            {/* Info items */}
                            {[
                                `${stats?.pendingApprovals?.students    || 0} instructor requests pending`,
                                `${stats?.activeBatches                 || 0} active batches running smoothly`,
                                `Fee collection pending: ₹${stats?.feeCollection?.pending?.toLocaleString() || '0'}`,
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-3.5 px-3">
                                    <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, backgroundColor: C.warning, borderRadius: R.full }}>
                                        <MdFactCheck style={{ width: 14, height: 14, color: '#ffffff' }} />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.darkCardText }}>
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            className="w-full transition-all hover:opacity-90 cursor-pointer relative z-10"
                            style={{ background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', padding: 14, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}
                        >
                            Open AI Dashboard
                        </button>
                    </div>

                    {/* Upcoming Events */}
                    <div
                        className="flex flex-col"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, padding: 20 }}
                    >
                        <SectionHeader icon={MdCalendarMonth} title="Upcoming Events" linkHref="/admin/events" />
                        <div className="flex flex-col gap-4">
                            {(() => {
                                const events = [
                                    ...(stats?.upcomingExams?.map(e   => ({ ...e, type: 'exam',  color: C.btnPrimary, Icon: MdMenuBook      })) || []),
                                    ...(stats?.upcomingClasses?.map(c => ({ ...c, type: 'class', color: C.warning,    Icon: MdCalendarMonth })) || []),
                                ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

                                if (events.length === 0) return (
                                    <div
                                        className="p-8 text-center border border-dashed"
                                        style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, borderRadius: '10px' }}
                                    >
                                        <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 48, height: 48, backgroundColor: C.cardBg, borderRadius: '10px' }}>
                                            <MdCalendarMonth style={{ width: 24, height: 24, color: C.text }} />
                                        </div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>No Events</h3>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, marginTop: 4 }}>You have no upcoming events.</p>
                                    </div>
                                );

                                return events.map((event, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 items-center transition-colors"
                                        style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}
                                    >
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.cardBg, borderRadius: '10px' }}>
                                            <event.Icon style={{ width: 18, height: 18, color: event.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                {event.title}
                                            </h4>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text, margin: '2px 0 0 0' }}>
                                                {event.date} • {event.time}
                                            </p>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}