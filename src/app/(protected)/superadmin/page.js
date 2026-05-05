'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPlatformStats } from '@/services/superadminService';
import {
    MdBusiness,
    MdPeople,
    MdSchool,
    MdMonitor,
    MdChevronRight,
    MdAdd,
    MdMenuBook,
    MdSecurity,
    MdCreditCard,
    MdShowChart,
    MdWarning,
    MdCurrencyRupee,
    MdBolt,
    MdKeyboardArrowDown,
    MdCheckCircle,
    MdCalendarMonth,
    MdError,
    MdSmartToy,
    MdArrowForward,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Constants (unchanged) ────────────────────────────────────────────────────
const INITIAL_STATS = {
    totalInstitutes: 0,
    activeInstitutes: 0,
    totalUsers: 0,
    totalTutors: 0,
    totalStudents: 0,
    totalCourses: 0
};

const INITIAL_DASHBOARD = {
    kpiGrowth: { institutes: 0, students: 0, tutors: 0, courses: 0 },
    analytics: [],
    topCourses: [],
    topInstitutes: [],
    topInstructors: [],
    recentActivities: [],
    alerts: {
        pendingApprovals: 0,
        paymentFailures: 0,
        systemAlerts: 0,
        highRiskUsers: 0
    },
    certificates: { totalIssued: 0 },
    revenueOverview: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeSubscriptions: 0,
        payoutPendingAmount: 0,
        payoutPendingCount: 0,
        pendingPaymentsAmount: 0,
        pendingPaymentsCount: 0
    },
    diagnostics: {
        serverStatus: 'healthy',
        handlerLatencyMs: 0,
        auditRequests24h: 0,
        auditErrorRate24h: 0,
        auditErrors24h: 0
    }
};

const ANALYTICS_OPTIONS = [
    { value: '5w', label: 'Last 5 Weeks' },
    { value: '8w', label: 'Last 8 Weeks' },
    { value: '12w', label: 'Last 12 Weeks' }
];

const COURSE_OPTIONS = [
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
];

// ─── Helpers (unchanged) ──────────────────────────────────────────────────────
const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;
const formatGrowth = (value) => {
    const num = Number(value || 0);
    const abs = Math.abs(num).toFixed(1).replace('.0', '');
    return `${num >= 0 ? '+' : '-'}${abs}%`;
};

const getEmptyAnalyticsData = (range) => {
    const weeks = range === '12w' ? 12 : range === '8w' ? 8 : 5;
    return Array.from({ length: weeks }, (_, idx) => ({
        name: `Week ${idx + 1}`,
        students: 0,
        instructors: 0,
        revenue: 0
    }));
};

const timeAgo = (date) => {
    if (!date) return 'Just now';
    const diffMs = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

const activityBadge = (type) => {
    if (type === 'payment') return { label: 'Payment', color: C.success };
    if (type === 'audit') return { label: 'Audit', color: C.warning };
    return { label: 'User', color: C.btnPrimary };
};

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center shrink-0"
                style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                <Icon style={{ width: 16, height: 16, color: C.iconColor }} />
            </div>
            <h2 style={{
                fontFamily: T.fontFamily,
                fontSize: T.size.xl,
                fontWeight: T.weight.semibold,
                color: C.heading,
                margin: 0
            }}>
                {title}
            </h2>
        </div>
    );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                backgroundColor: '#3D3B8E',
                fontFamily: T.fontFamily,
                borderRadius: '10px',
                padding: '8px 12px',
                boxShadow: S.card,
            }}>
                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: '#ffffff', margin: 0 }}>
                        {p.name}: {p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState(INITIAL_STATS);
    const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD);
    const [analyticsRange, setAnalyticsRange] = useState('5w');
    const [coursesRange, setCoursesRange] = useState('year');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        let mounted = true;

        const loadStats = async () => {
            if (!hasLoadedRef.current) setLoading(true);
            else setRefreshing(true);

            try {
                const data = await fetchPlatformStats({ analyticsRange, coursesRange });
                if (!mounted) return;

                if (data?.success) {
                    setStats({ ...INITIAL_STATS, ...(data.stats || {}) });
                    setDashboard({
                        ...INITIAL_DASHBOARD,
                        ...(data.dashboard || {}),
                        alerts: { ...INITIAL_DASHBOARD.alerts, ...(data.dashboard?.alerts || {}) },
                        revenueOverview: { ...INITIAL_DASHBOARD.revenueOverview, ...(data.dashboard?.revenueOverview || {}) },
                        diagnostics: { ...INITIAL_DASHBOARD.diagnostics, ...(data.dashboard?.diagnostics || {}) },
                        certificates: { ...INITIAL_DASHBOARD.certificates, ...(data.dashboard?.certificates || {}) },
                        kpiGrowth: { ...INITIAL_DASHBOARD.kpiGrowth, ...(data.dashboard?.kpiGrowth || {}) }
                    });
                }
            } catch (error) {
                if (mounted) toast.error(error.message || 'Failed to load platform stats');
            } finally {
                if (!mounted) return;
                hasLoadedRef.current = true;
                setLoading(false);
                setRefreshing(false);
            }
        };

        loadStats();
        return () => { mounted = false; };
    }, [analyticsRange, coursesRange]);

    const analyticsData = useMemo(
        () => (dashboard.analytics?.length ? dashboard.analytics : getEmptyAnalyticsData(analyticsRange)),
        [dashboard.analytics, analyticsRange]
    );

    const kpiCards = [
        {
            title: 'Total Institutes',
            value: formatNumber(stats.totalInstitutes),
            growth: formatGrowth(dashboard.kpiGrowth.institutes),
            iconBg: '#EEF2FF',
            iconColor: '#4F46E5',
            icon: MdBusiness
        },
        {
            title: 'Total Students',
            value: formatNumber(stats.totalStudents),
            growth: formatGrowth(dashboard.kpiGrowth.students),
            iconBg: '#ECFDF5',
            iconColor: '#10B981',
            icon: MdPeople
        },
        {
            title: 'Total Instructors',
            value: formatNumber(stats.totalTutors),
            growth: formatGrowth(dashboard.kpiGrowth.tutors),
            iconBg: '#FFF7ED',
            iconColor: '#F59E0B',
            icon: MdSchool
        },
        {
            title: 'Total Courses',
            value: formatNumber(stats.totalCourses),
            growth: formatGrowth(dashboard.kpiGrowth.courses),
            iconBg: '#EEF2FF',
            iconColor: '#4F46E5',
            icon: MdMonitor
        }
    ];

    const quickActions = [
        { label: 'Add Institute', icon: MdBusiness, href: '/superadmin/institutes' },
        { label: 'Approve Institute', icon: MdCheckCircle, href: '/superadmin/institutes' },
        { label: 'Add Admin', icon: MdPeople, href: '/superadmin/users' },
        { label: 'Create Course', icon: MdMenuBook, href: '/superadmin/subscriptions' }
    ];

    // ─── Loading State ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{
                        fontFamily: T.fontFamily, fontSize: T.size.base,
                        fontWeight: T.weight.medium, color: C.text
                    }}>
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    const serverStatus = dashboard.diagnostics.serverStatus || 'healthy';
    const serverStatusColor = serverStatus === 'critical'
        ? { color: C.danger, backgroundColor: C.dangerBg, borderColor: C.dangerBorder }
        : serverStatus === 'degraded'
            ? { color: C.warning, backgroundColor: C.warningBg, borderColor: C.warningBorder }
            : { color: C.success, backgroundColor: C.successBg, borderColor: C.successBorder };

    // ─── Select style ─────────────────────────────────────────────────────────
    const selectStyle = {
        backgroundColor: 'transparent',
        outline: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: T.fontFamily,
        fontSize: T.size.xs,
        fontWeight: T.weight.bold,
        color: C.btnPrimary,
    };

    return (
        <div
            className="min-h-screen space-y-6 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="shrink-0" style={{ width: 56, height: 56, borderRadius: '10px', overflow: 'hidden', border: `2px solid ${C.btnPrimary}`, boxShadow: `0 0 0 3px ${C.btnViewAllBg}` }}>
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin&backgroundColor=E9DFFC"
                            alt="Admin"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 2 }}>
                            Super Admin
                        </p>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, lineHeight: T.leading.tight, margin: 0 }}>
                            Welcome back 👋
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, marginTop: 2 }}>
                            Live platform overview from real backend data.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/superadmin/institutes')}
                    className="flex items-center gap-2 transition-opacity hover:opacity-90 self-start sm:self-auto"
                    style={{
                        background: C.gradientBtn,
                        color: '#ffffff',
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        borderRadius: '10px',
                        boxShadow: S.btn,
                        border: 'none',
                        cursor: 'pointer',
                        padding: '10px 20px',
                    }}
                >
                    <MdAdd style={{ width: 18, height: 18 }} /> Quick Actions <MdChevronRight style={{ width: 16, height: 16 }} />
                </button>
            </div>

            {/* ── Refreshing indicator ── */}
            {refreshing && (
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                    Refreshing dashboard data...
                </p>
            )}

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* Left (col-span-3) */}
                <div className="xl:col-span-3 flex flex-col gap-6">

                    {/* ── KPI Cards ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {kpiCards.map((card, i) => (
                            <StatCard
                                key={i}
                                icon={card.icon}
                                value={card.value}
                                label={card.title}
                                subtext={card.growth}
                                iconBg={card.iconBg}
                                iconColor={card.iconColor}
                            />
                        ))}
                    </div>

                    {/* ── Analytics + Top Courses ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Platform Analytics */}
                        <div
                            className="lg:col-span-2 flex flex-col p-5"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <SectionHeader icon={MdShowChart} title="Platform Analytics" />
                                <div
                                    className="flex items-center gap-2"
                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '6px 12px' }}
                                >
                                    <select value={analyticsRange} onChange={(e) => setAnalyticsRange(e.target.value)} style={selectStyle}>
                                        {ANALYTICS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <MdKeyboardArrowDown style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-5 mb-4">
                                <div className="flex items-center gap-1.5">
                                    <div style={{ width: 8, height: 8, borderRadius: R.full, backgroundColor: C.btnPrimary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Students</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div style={{ width: 8, height: 8, borderRadius: R.full, backgroundColor: C.success }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Instructors</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div style={{ width: 8, height: 8, borderRadius: R.full, backgroundColor: C.warning }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Revenue</span>
                                </div>
                            </div>
                            <div className="h-[220px] w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analyticsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={`${C.btnPrimary}15`} />
                                        <XAxis dataKey="name" stroke={C.textFaint} tickLine={false} axisLine={false} tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 600, fontFamily: T.fontFamily }} dy={10} />
                                        <YAxis stroke={C.textFaint} tickLine={false} axisLine={false} tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 600, fontFamily: T.fontFamily }} dx={-10} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey="revenue" stroke={C.warning} strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: C.warning, strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="instructors" stroke={C.success} strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: C.success, strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="students" stroke={C.btnPrimary} strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: C.btnPrimary, strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Courses */}
                        <div
                            className="flex flex-col p-5"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <SectionHeader icon={MdMenuBook} title="Top Courses" />
                                <div
                                    className="flex items-center gap-2"
                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '6px 12px' }}
                                >
                                    <select value={coursesRange} onChange={(e) => setCoursesRange(e.target.value)} style={selectStyle}>
                                        {COURSE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <MdKeyboardArrowDown style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                </div>
                            </div>
                            {dashboard.topCourses?.length > 0 ? (
                                <div className="flex flex-col gap-3 flex-1">
                                    {dashboard.topCourses.map((course) => (
                                        <div
                                            key={course.id}
                                            className="flex items-center gap-3 p-3 transition-colors"
                                            style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', cursor: 'pointer' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        >
                                            <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                                <MdMenuBook style={{ width: 16, height: 16, color: C.iconColor }} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }} className="truncate">
                                                    {course.name}
                                                </span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                                    {formatNumber(course.students)} students • {formatCurrency(course.revenue)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-14 text-center border border-dashed"
                                    style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4"
                                        style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdMenuBook style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.lg,
                                        fontWeight: T.weight.bold, color: C.heading
                                    }}>No Course Data</h3>
                                    <p style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.base,
                                        color: C.text, marginTop: 4
                                    }}>No course data for selected range.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Top Institutes / Instructors / Activities ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Top Institutes */}
                        <div
                            className="flex flex-col p-5"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                        >
                            <SectionHeader icon={MdBusiness} title="Top Institutes" />
                            {dashboard.topInstitutes?.length > 0 ? (
                                <div className="flex flex-col gap-3 flex-1">
                                    {dashboard.topInstitutes.map((inst) => (
                                        <div key={inst.id} className="flex items-center justify-between"
                                            style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                                    <MdBusiness style={{ width: 14, height: 14, color: C.iconColor }} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }} className="truncate">{inst.name}</span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>{formatNumber(inst.students)} students</span>
                                                </div>
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, backgroundColor: C.surfaceWhite, padding: '4px 8px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                                {formatCurrency(inst.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-14 text-center border border-dashed"
                                    style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4"
                                        style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdBusiness style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.lg,
                                        fontWeight: T.weight.bold, color: C.heading
                                    }}>No Institute Data</h3>
                                    <p style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.base,
                                        color: C.text, marginTop: 4
                                    }}>No institute data available.</p>
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-2">
                                    <MdCurrencyRupee style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>Finance</span>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{formatCurrency(dashboard.revenueOverview.totalRevenue)}</span>
                            </div>
                        </div>

                        {/* Top Instructors */}
                        <div
                            className="flex flex-col p-5"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                        >
                            <SectionHeader icon={MdSchool} title="Top Instructors" />
                            {dashboard.topInstructors?.length > 0 ? (
                                <div className="flex flex-col gap-3 flex-1">
                                    {dashboard.topInstructors.map((inst) => (
                                        <div key={inst.id} className="flex items-center justify-between"
                                            style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={inst.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(inst.name || 'Tutor')}`}
                                                    alt="Instructor"
                                                    style={{ width: 32, height: 32, borderRadius: '10px', objectFit: 'cover', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }} className="truncate">{inst.name}</span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted }}>
                                                        {formatNumber(inst.students)} students • {formatNumber(inst.courseCount)} courses
                                                    </span>
                                                </div>
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, backgroundColor: C.surfaceWhite, padding: '4px 8px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                                {formatCurrency(inst.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-14 text-center border border-dashed"
                                    style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4"
                                        style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdSchool style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.lg,
                                        fontWeight: T.weight.bold, color: C.heading
                                    }}>No Instructor Data</h3>
                                    <p style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.base,
                                        color: C.text, marginTop: 4
                                    }}>No instructor data available.</p>
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-2">
                                    <MdCheckCircle style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>Certificates</span>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{formatNumber(dashboard.certificates.totalIssued)}</span>
                            </div>
                        </div>

                        {/* Recent Activities */}
                        <div
                            className="flex flex-col p-5"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                        >
                            <SectionHeader icon={MdShowChart} title="Recent Activities" />
                            {dashboard.recentActivities?.length > 0 ? (
                                <div className="flex flex-col gap-3 flex-1">
                                    {dashboard.recentActivities.slice(0, 5).map((act) => {
                                        const badge = activityBadge(act.type);
                                        return (
                                            <div key={act.id} className="flex items-center justify-between"
                                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: 12 }}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                                        <MdShowChart style={{ width: 14, height: 14, color: C.iconColor }} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }} className="truncate">
                                                            {act.title || 'Activity'}
                                                        </span>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: badge.color }}>
                                                            {badge.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, whiteSpace: 'nowrap' }}>
                                                    {timeAgo(act.timestamp)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-14 text-center border border-dashed"
                                    style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                    <div className="flex items-center justify-center mx-auto mb-4"
                                        style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                        <MdShowChart style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.lg,
                                        fontWeight: T.weight.bold, color: C.heading
                                    }}>No Recent Activity</h3>
                                    <p style={{
                                        fontFamily: T.fontFamily, fontSize: T.size.base,
                                        color: C.text, marginTop: 4
                                    }}>No recent activity found.</p>
                                </div>
                            )}
                            <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>Logs</span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                    {formatNumber(dashboard.recentActivities?.length || 0)} items
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Sidebar (col-span-1) ── */}
                <div className="xl:col-span-1 flex flex-col gap-6">

                    {/* Quick Actions */}
                    <div
                        className="p-5"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                    >
                        <SectionHeader icon={MdBolt} title="Quick Actions" />
                        <div className="flex flex-col gap-2">
                            {quickActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => router.push(action.href)}
                                    className="flex items-center justify-between w-full transition-all"
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        backgroundColor: C.innerBg,
                                        border: `1px solid ${C.cardBorder}`,
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                            <action.icon style={{ width: 16, height: 16, color: C.iconColor }} />
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{action.label}</span>
                                    </div>
                                    <MdArrowForward style={{ width: 16, height: 16, color: C.textMuted }} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div
                        className="p-5"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                    >
                        <SectionHeader icon={MdSecurity} title="Alerts" />
                        <div className="flex flex-col gap-3">
                            {/* Pending Approvals */}
                            <div
                                className="flex justify-between items-center"
                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '10px 12px' }}
                            >
                                <div className="flex items-center gap-2">
                                    <div style={{ width: 24, height: 24, borderRadius: '6px', backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: C.danger }}>IA</span>
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Pending approvals</span>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.warning, backgroundColor: C.warningBg, padding: '3px 8px', borderRadius: '10px', border: `1px solid ${C.warningBorder}` }}>
                                    {formatNumber(dashboard.alerts.pendingApprovals)}
                                </span>
                            </div>
                            {/* Payment Failures */}
                            <div
                                className="flex justify-between items-center"
                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '10px 12px' }}
                            >
                                <div className="flex items-center gap-2">
                                    <div style={{ width: 24, height: 24, borderRadius: '6px', backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MdCurrencyRupee style={{ width: 12, height: 12, color: C.warning }} />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Payment failures</span>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.danger, backgroundColor: C.dangerBg, padding: '3px 8px', borderRadius: '10px', border: `1px solid ${C.dangerBorder}` }}>
                                    {formatNumber(dashboard.alerts.paymentFailures)}
                                </span>
                            </div>
                            {/* System Alerts */}
                            <div
                                className="flex justify-between items-center"
                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '10px 12px' }}
                            >
                                <div className="flex items-center gap-2">
                                    <div style={{ width: 24, height: 24, borderRadius: '6px', backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MdWarning style={{ width: 12, height: 12, color: C.warning }} />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>System alerts</span>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.warning, backgroundColor: C.warningBg, padding: '3px 8px', borderRadius: '10px', border: `1px solid ${C.warningBorder}` }}>
                                    {formatNumber(dashboard.alerts.systemAlerts)}
                                </span>
                            </div>
                            {/* High Risk Users */}
                            <div
                                className="flex justify-between items-center"
                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '10px 12px' }}
                            >
                                <div className="flex items-center gap-2">
                                    <div style={{ width: 24, height: 24, borderRadius: '6px', backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: C.success }}>HR</span>
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>High risk users</span>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.success, backgroundColor: C.successBg, padding: '3px 8px', borderRadius: '10px', border: `1px solid ${C.successBorder}` }}>
                                    {formatNumber(dashboard.alerts.highRiskUsers)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Overview */}
                    <div
                        className="p-5 flex-1"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                    >
                        <SectionHeader icon={MdCurrencyRupee} title="Revenue Overview" />
                        <div className="flex flex-col gap-4">
                            {[
                                {
                                    icon: MdCurrencyRupee,
                                    label: 'Total Revenue',
                                    sub: `${formatNumber(dashboard.revenueOverview.pendingPaymentsCount)} pending payments`,
                                    value: formatCurrency(dashboard.revenueOverview.totalRevenue),
                                    valueColor: C.success,
                                    valueBg: C.successBg,
                                    valueBorder: C.successBorder
                                },
                                {
                                    icon: MdCalendarMonth,
                                    label: 'Monthly Revenue',
                                    sub: 'Current month paid amount',
                                    value: formatCurrency(dashboard.revenueOverview.monthlyRevenue),
                                    valueColor: C.success,
                                    valueBg: C.successBg,
                                    valueBorder: C.successBorder
                                },
                                {
                                    icon: MdCheckCircle,
                                    label: 'Active Subscriptions',
                                    sub: 'Live institute subscriptions',
                                    value: formatNumber(dashboard.revenueOverview.activeSubscriptions),
                                    valueColor: C.success,
                                    valueBg: 'transparent',
                                    valueBorder: 'transparent'
                                },
                                {
                                    icon: MdCreditCard,
                                    label: 'Payout Requests',
                                    sub: `${formatNumber(dashboard.revenueOverview.payoutPendingCount)} pending requests`,
                                    value: formatCurrency(dashboard.revenueOverview.payoutPendingAmount),
                                    valueColor: C.heading,
                                    valueBg: C.innerBg,
                                    valueBorder: C.cardBorder
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-start">
                                    <div className="flex gap-3 items-start">
                                        <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                            <item.icon style={{ width: 14, height: 14, color: C.iconColor }} />
                                        </div>
                                        <div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{item.label}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 2 }}>{item.sub}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: item.valueColor, backgroundColor: item.valueBg, border: `1px solid ${item.valueBorder}`, padding: item.valueBg !== 'transparent' ? '4px 8px' : '0', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Financial Overview */}
                <div
                    className="p-5 flex items-center justify-between"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                            <MdCurrencyRupee style={{ width: 18, height: 18, color: C.iconColor }} />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Financial Overview</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 2 }}>Total Revenue</p>
                        </div>
                    </div>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                        {formatCurrency(dashboard.revenueOverview.totalRevenue)}
                    </span>
                </div>

                {/* Server Health */}
                <div
                    className="p-5 flex items-center justify-between"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                            <MdCheckCircle style={{ width: 18, height: 18, color: C.iconColor }} />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Server Health</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: serverStatusColor.color, margin: 0, marginTop: 2, textTransform: 'capitalize' }}>
                                ● {serverStatus}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                            {formatNumber(dashboard.diagnostics.handlerLatencyMs)}ms
                        </span>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '3px 8px', borderRadius: '10px', border: `1px solid ${serverStatusColor.borderColor}`, ...serverStatusColor }}>
                            {dashboard.diagnostics.auditErrorRate24h}% err
                        </span>
                    </div>
                </div>

                {/* API Diagnostics */}
                <div
                    className="p-5 flex items-center justify-between"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                            <MdBolt style={{ width: 18, height: 18, color: C.iconColor }} />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>API Diagnostics</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.btnPrimary, margin: 0, marginTop: 2 }}>
                                Audit volume (24h)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                            {formatNumber(dashboard.diagnostics.auditRequests24h)}
                        </span>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.success, backgroundColor: C.successBg, padding: '3px 8px', borderRadius: '10px', border: `1px solid ${C.successBorder}` }}>
                            {dashboard.diagnostics.auditErrors24h} errors
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}