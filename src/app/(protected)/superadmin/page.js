'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPlatformStats } from '@/services/superadminService';
import {
    Building2, Users, GraduationCap, MonitorPlay, ChevronRight, Plus,
    BookOpen, ShieldAlert, CreditCard, Activity, AlertTriangle, IndianRupee,
    Zap, ChevronDown, CheckCircle2, Calendar, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

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
    if (type === 'payment') return { label: 'Payment', color: 'text-[#4ABCA8]' };
    if (type === 'audit') return { label: 'Audit', color: 'text-[#FC8730]' };
    return { label: 'User', color: 'text-[#6B4DF1]' };
};

export default function SuperadminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState(INITIAL_STATS);
    const [dashboard, setDashboard] = useState(INITIAL_DASHBOARD);
    const [analyticsRange, setAnalyticsRange] = useState('5w');
    const [coursesRange, setCoursesRange] = useState('year');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const hasLoadedRef = useRef(false);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

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
        return () => {
            mounted = false;
        };
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
            color: '#6B4DF1',
            bg: '#F4F0FD',
            icon: Building2
        },
        {
            title: 'Total Students',
            value: formatNumber(stats.totalStudents),
            growth: formatGrowth(dashboard.kpiGrowth.students),
            color: '#4ABCA8',
            bg: '#ECFDF5',
            icon: Users
        },
        {
            title: 'Total Instructors',
            value: formatNumber(stats.totalTutors),
            growth: formatGrowth(dashboard.kpiGrowth.tutors),
            color: '#FC8730',
            bg: '#FFF7ED',
            icon: GraduationCap
        },
        {
            title: 'Total Courses',
            value: formatNumber(stats.totalCourses),
            growth: formatGrowth(dashboard.kpiGrowth.courses),
            color: '#6B4DF1',
            bg: '#F4F0FD',
            icon: MonitorPlay
        }
    ];

    const quickActions = [
        { label: 'Add Institute', icon: Building2, color: '#6B4DF1', bg: '#F4F0FD', href: '/superadmin/institutes' },
        { label: 'Approve Institute', icon: CheckCircle2, color: '#6B4DF1', bg: '#F4F0FD', href: '/superadmin/institutes' },
        { label: 'Add Admin', icon: Users, color: '#6B4DF1', bg: '#F4F0FD', href: '/superadmin/users' },
        { label: 'Create Course', icon: BookOpen, color: '#FC8730', bg: '#FFF7ED', href: '/superadmin/subscriptions' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F4EEFD]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#6B4DF1]"></div>
            </div>
        );
    }

    const serverStatus = dashboard.diagnostics.serverStatus || 'healthy';
    const serverStatusColor = serverStatus === 'critical'
        ? 'text-[#E53E3E] bg-[#FEE2E2]'
        : serverStatus === 'degraded'
            ? 'text-[#D97706] bg-[#FEF3C7]'
            : 'text-[#4ABCA8] bg-[#ECFDF5]';

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin&backgroundColor=E9DFFC" alt="Admin" className="w-14 h-14 rounded-full border-2 border-white shadow-sm" />
                    <div>
                        <h1 className="text-[22px] font-black text-[#27225B] m-0">Welcome back, Super Admin</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Live platform overview from real backend data.</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/superadmin/institutes')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer"
                >
                    <Plus size={16} strokeWidth={3} /> Quick Actions <ChevronRight size={16} />
                </button>
            </div>

            {refreshing && <div className="text-[12px] font-bold text-[#6B4DF1]">Refreshing dashboard data...</div>}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {kpiCards.map((card, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 hover:-translate-y-1 transition-transform relative" style={{ boxShadow: softShadow }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg, color: card.color }}>
                                        <card.icon size={16} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[14px] font-bold text-[#4A5568]">{card.title}</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[28px] font-black text-[#27225B] leading-none">{card.value}</span>
                                        <span className="text-[11px] font-bold text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded-md">{card.growth}</span>
                                    </div>
                                    <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2 18L12 10L20 14L38 2" stroke={card.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-5 lg:col-span-2 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[16px] font-black text-[#27225B] m-0">Platform Analytics</h2>
                                <div className="flex items-center gap-2 text-[12px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-3 py-1.5 rounded-lg">
                                    <select
                                        value={analyticsRange}
                                        onChange={(e) => setAnalyticsRange(e.target.value)}
                                        className="bg-transparent outline-none border-none cursor-pointer text-[12px] font-bold text-[#6B4DF1]"
                                    >
                                        {ANALYTICS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                            <div className="flex items-center gap-5 mb-4">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#6B4DF1]"></div><span className="text-[11px] font-bold text-[#7D8DA6]">Students</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4ABCA8]"></div><span className="text-[11px] font-bold text-[#7D8DA6]">Instructors</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FC8730]"></div><span className="text-[11px] font-bold text-[#7D8DA6]">Revenue</span></div>
                            </div>
                            <div className="h-[220px] w-full mt-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analyticsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F0FD" />
                                        <XAxis dataKey="name" stroke="#A0ABC0" tickLine={false} axisLine={false} tick={{ fill: '#7D8DA6', fontSize: 11, fontWeight: 600 }} dy={10} />
                                        <YAxis stroke="#A0ABC0" tickLine={false} axisLine={false} tick={{ fill: '#7D8DA6', fontSize: 11, fontWeight: 600 }} dx={-10} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: softShadow, fontWeight: 'bold', color: '#27225B' }} />
                                        <Line type="monotone" dataKey="revenue" stroke="#FC8730" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#FC8730', strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="instructors" stroke="#4ABCA8" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#4ABCA8', strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="students" stroke="#6B4DF1" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#6B4DF1', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-[16px] font-black text-[#27225B] m-0">Top Courses</h2>
                                <div className="flex items-center gap-2 text-[12px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-3 py-1.5 rounded-lg">
                                    <select
                                        value={coursesRange}
                                        onChange={(e) => setCoursesRange(e.target.value)}
                                        className="bg-transparent outline-none border-none cursor-pointer text-[12px] font-bold text-[#6B4DF1]"
                                    >
                                        {COURSE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                            {dashboard.topCourses?.length > 0 ? (
                                <div className="flex flex-col gap-4 flex-1">
                                    {dashboard.topCourses.map((course) => (
                                        <div key={course.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8F7FF] transition-colors cursor-pointer">
                                            <div className="w-10 h-10 rounded-full bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><BookOpen size={18} /></div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13px] font-bold text-[#27225B] leading-tight mb-0.5 truncate">{course.name}</span>
                                                <span className="text-[11px] font-medium text-[#7D8DA6]">{formatNumber(course.students)} students • {formatCurrency(course.revenue)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[13px] font-medium text-[#7D8DA6] py-6">No course data for selected range.</div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-5">Top Institutes</h2>
                            {dashboard.topInstitutes?.length > 0 ? (
                                <div className="flex flex-col gap-4 flex-1">
                                    {dashboard.topInstitutes.map((inst) => (
                                        <div key={inst.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><Building2 size={14} /></div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] font-bold text-[#27225B] truncate">{inst.name}</span>
                                                    <span className="text-[11px] font-medium text-[#7D8DA6]">{formatNumber(inst.students)} students</span>
                                                </div>
                                            </div>
                                            <span className="text-[12px] font-black text-[#4A5568]">{formatCurrency(inst.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[13px] font-medium text-[#7D8DA6] py-6">No institute data available.</div>
                            )}
                            <div className="mt-5 pt-3 border-t border-[#F4F0FD] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B4DF1]"><div className="w-2 h-2 rounded-full bg-[#6B4DF1]"></div> Finance</div>
                                <span className="text-[14px] font-black text-[#27225B]">{formatCurrency(dashboard.revenueOverview.totalRevenue)}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-5">Top Instructors</h2>
                            {dashboard.topInstructors?.length > 0 ? (
                                <div className="flex flex-col gap-4 flex-1">
                                    {dashboard.topInstructors.map((inst) => (
                                        <div key={inst.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img src={inst.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(inst.name || 'Tutor')}`} alt="Instructor" className="w-8 h-8 rounded-full bg-[#F4F0FD]" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] font-bold text-[#27225B] truncate">{inst.name}</span>
                                                    <span className="text-[11px] font-medium text-[#7D8DA6]">{formatNumber(inst.students)} students • {formatNumber(inst.courseCount)} courses</span>
                                                </div>
                                            </div>
                                            <span className="text-[12px] font-black text-[#4A5568]">{formatCurrency(inst.revenue)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[13px] font-medium text-[#7D8DA6] py-6">No instructor data available.</div>
                            )}
                            <div className="mt-5 pt-3 border-t border-[#F4F0FD] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B4DF1]"><div className="w-2 h-2 rounded-full bg-[#6B4DF1]"></div> Certificates</div>
                                <span className="text-[14px] font-black text-[#27225B]">{formatNumber(dashboard.certificates.totalIssued)}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex flex-col" style={{ boxShadow: softShadow }}>
                            <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-5">Recent Activities</h2>
                            {dashboard.recentActivities?.length > 0 ? (
                                <div className="flex flex-col gap-4 flex-1">
                                    {dashboard.recentActivities.slice(0, 5).map((act) => {
                                        const badge = activityBadge(act.type);
                                        return (
                                            <div key={act.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><Activity size={14} /></div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[13px] font-bold text-[#27225B] truncate">{act.title || 'Activity'}</span>
                                                        <span className={`text-[11px] font-bold ${badge.color}`}>{badge.label}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-black text-[#4A5568]">{timeAgo(act.timestamp)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-[13px] font-medium text-[#7D8DA6] py-6">No recent activity found.</div>
                            )}
                            <div className="mt-5 pt-3 border-t border-[#F4F0FD] flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#6B4DF1]"><div className="w-3 h-2 rounded bg-[#6B4DF1]"></div> Logs</div>
                                <span className="text-[13px] font-bold text-[#6B4DF1]">{formatNumber(dashboard.recentActivities?.length || 0)} items</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                        <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-4 flex items-center gap-2">
                            <Building2 size={18} className="text-[#6B4DF1]" /> Quick Actions
                        </h2>
                        <div className="flex flex-col gap-2">
                            {quickActions.map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => router.push(action.href)}
                                    className="flex items-center justify-between w-full p-3 rounded-xl border border-transparent bg-white hover:bg-[#F8F7FF] hover:border-[#E9DFFC] transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: action.bg, color: action.color }}>
                                            <action.icon size={16} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[13px] font-bold text-[#27225B]">{action.label}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-[#A0ABC0] group-hover:text-[#6B4DF1]" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                        <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-4 flex items-center gap-2">
                            <ShieldAlert size={18} className="text-[#6B4DF1]" /> Alerts
                        </h2>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#27225B]"><div className="w-5 h-5 rounded bg-[#FEE2E2] text-[#E53E3E] flex justify-center items-center text-[10px] font-black">IA</div> Pending approvals</div>
                                <span className="bg-[#FFF7ED] text-[#FC8730] px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1"><AlertTriangle size={10} /> {formatNumber(dashboard.alerts.pendingApprovals)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#27225B]"><div className="w-5 h-5 rounded bg-[#FFF7ED] text-[#FC8730] flex justify-center items-center text-[11px] font-black">Rs</div> Payment failures</div>
                                <span className="bg-[#FEE2E2] text-[#E53E3E] px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1"><ShieldAlert size={10} /> {formatNumber(dashboard.alerts.paymentFailures)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#27225B]"><div className="w-5 h-5 rounded bg-[#FEF3C7] text-[#D97706] flex justify-center items-center text-[12px] font-black">!</div> System alerts</div>
                                <span className="bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1"><AlertCircle size={10} /> {formatNumber(dashboard.alerts.systemAlerts)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]">
                                <div className="flex items-center gap-2 text-[13px] font-bold text-[#27225B]"><div className="w-5 h-5 rounded bg-[#EBF8FF] text-[#3182CE] flex justify-center items-center text-[12px] font-black">HR</div> High risk users</div>
                                <span className="bg-[#EBF8FF] text-[#3182CE] px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1">{formatNumber(dashboard.alerts.highRiskUsers)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex-1" style={{ boxShadow: softShadow }}>
                        <h2 className="text-[16px] font-black text-[#27225B] m-0 mb-4">Revenue Overview</h2>
                        <div className="flex flex-col gap-5">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 bg-[#F4F0FD] text-[#6B4DF1] rounded flex items-center justify-center shrink-0"><IndianRupee size={14} /></div>
                                    <div className="flex flex-col"><span className="text-[13px] font-bold text-[#27225B]">Total Revenue</span><span className="text-[10px] text-[#A0ABC0] font-medium leading-tight">{formatNumber(dashboard.revenueOverview.pendingPaymentsCount)} pending payments</span></div>
                                </div>
                                <span className="text-[12px] font-black text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded">{formatCurrency(dashboard.revenueOverview.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 bg-[#F4F0FD] text-[#6B4DF1] rounded flex items-center justify-center shrink-0"><Calendar size={14} /></div>
                                    <div className="flex flex-col"><span className="text-[13px] font-bold text-[#27225B]">Monthly Revenue</span><span className="text-[10px] text-[#A0ABC0] font-medium leading-tight">Current month paid amount</span></div>
                                </div>
                                <span className="text-[12px] font-black text-[#4ABCA8] bg-[#ECFDF5] px-2 py-0.5 rounded">{formatCurrency(dashboard.revenueOverview.monthlyRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 bg-[#F4F0FD] text-[#6B4DF1] rounded flex items-center justify-center shrink-0"><CheckCircle2 size={14} /></div>
                                    <div className="flex flex-col"><span className="text-[13px] font-bold text-[#27225B]">Active Subscriptions</span><span className="text-[10px] text-[#A0ABC0] font-medium leading-tight">Live institute subscriptions</span></div>
                                </div>
                                <span className="text-[12px] font-black text-[#4ABCA8]">{formatNumber(dashboard.revenueOverview.activeSubscriptions)}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="flex gap-2">
                                    <div className="w-6 h-6 bg-[#F4F0FD] text-[#6B4DF1] rounded flex items-center justify-center shrink-0"><CreditCard size={14} /></div>
                                    <div className="flex flex-col"><span className="text-[13px] font-bold text-[#27225B]">Payout Requests</span><span className="text-[10px] text-[#A0ABC0] font-medium leading-tight">{formatNumber(dashboard.revenueOverview.payoutPendingCount)} pending requests</span></div>
                                </div>
                                <span className="text-[12px] font-black text-[#4A5568] bg-[#F1F5F9] px-2 py-0.5 rounded">{formatCurrency(dashboard.revenueOverview.payoutPendingAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex items-center justify-between" style={{ boxShadow: softShadow }}>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-black text-[#27225B] mb-1">Financial Overview</span>
                        <span className="text-[13px] font-bold text-[#7D8DA6]">Total Revenue</span>
                    </div>
                    <span className="text-[20px] font-black text-[#4F7BF0]">{formatCurrency(dashboard.revenueOverview.totalRevenue)}</span>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex items-center justify-between" style={{ boxShadow: softShadow }}>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-black text-[#27225B] mb-1">Server Health</span>
                        <span className="text-[13px] font-bold text-[#4ABCA8] flex items-center gap-1.5 capitalize"><CheckCircle2 size={14} /> {serverStatus}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[14px] font-black text-[#4F7BF0] flex items-center gap-1.5"><Activity size={14} /> {formatNumber(dashboard.diagnostics.handlerLatencyMs)}ms</span>
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${serverStatusColor}`}>{dashboard.diagnostics.auditErrorRate24h}% err</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC]/50 flex items-center justify-between" style={{ boxShadow: softShadow }}>
                    <div className="flex flex-col">
                        <span className="text-[15px] font-black text-[#27225B] mb-1">API Diagnostics</span>
                        <span className="text-[13px] font-bold text-[#6B4DF1] flex items-center gap-1.5"><Zap size={14} className="bg-[#F4F0FD] px-0.5 rounded" /> Audit volume (24h)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[14px] font-black text-[#4A5568]">{formatNumber(dashboard.diagnostics.auditRequests24h)}</span>
                        <span className="text-[11px] font-bold text-[#4ABCA8] bg-[#ECFDF5] px-2 py-1 rounded-md">{dashboard.diagnostics.auditErrors24h} errors</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

