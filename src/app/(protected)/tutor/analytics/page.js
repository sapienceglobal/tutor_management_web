'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, LineChart, Line,
    PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, Users, Star, Clock, TrendingUp, Loader2, Download, BarChart3, TrendingDown } from 'lucide-react';
import { C, T, S, R, FX } from '@/constants/tutorTokens';

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{ backgroundColor: '#ffffff', border: `1px solid ${C.cardBorder}`, borderRadius: R.lg, padding: '8px 12px', boxShadow: S.cardHover }}>
                <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 4px 0' }}>{label}</p>
                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.btnPrimary, margin: 0 }}>
                    ₹{payload[0].value?.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor }) {
    return (
        <div className="p-5 flex flex-col justify-between transition-transform hover:-translate-y-0.5" 
            style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, minHeight: '120px' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', margin: 0 }}>
                    {label}
                </p>
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg, borderRadius: R.xl }}>
                    <Icon size={20} color={iconColor} />
                </div>
            </div>
            <div className="mt-auto">
                <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
                {sub && (
                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '6px 0 0 0' }}>
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TutorAnalyticsPage() {
    const [monthlyEarnings, setMonthlyEarnings] = useState([]);
    const [courseEnrollments, setCourseEnrollments] = useState([]);
    const [studentDistribution, setStudentDistribution] = useState([]);
    const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0, totalStudents: 0, totalCourses: 0 });
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            const [earningsRes, statsRes, coursesRes] = await Promise.all([
                api.get('/tutor/dashboard/earnings'),
                api.get('/tutor/dashboard/stats'),
                api.get('/courses/my-courses'),
            ]);

            if (earningsRes.data?.success) {
                setMonthlyEarnings(earningsRes.data.earnings.monthly || []);
                const byCourse = (earningsRes.data.earnings.byCourse || [])
                    .map(c => ({ name: c.title, students: c.enrollments }))
                    .sort((a, b) => b.students - a.students)
                    .slice(0, 5);
                setCourseEnrollments(byCourse);
            }

            if (statsRes.data?.success) {
                setStats({
                    avgRating: statsRes.data.stats.rating?.average || 0,
                    totalReviews: statsRes.data.stats.rating?.totalReviews || 0,
                    totalStudents: statsRes.data.stats.students?.total || 0,
                    totalCourses: statsRes.data.stats.courses?.total || 0,
                });
            }

            if (coursesRes.data?.success) {
                const levels = { beginner: 0, intermediate: 0, advanced: 0 };
                (coursesRes.data.courses || []).forEach(course => {
                    const level = course.level?.toLowerCase() || 'beginner';
                    if (levels[level] !== undefined) levels[level] += (course.enrolledCount || 0);
                });
                setStudentDistribution([
                    { name: 'Beginner', value: levels.beginner },
                    { name: 'Intermediate', value: levels.intermediate },
                    { name: 'Advanced', value: levels.advanced },
                ].filter(d => d.value > 0));
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/tutor/dashboard/export', { responseType: 'blob' });
            const disposition = res.headers?.['content-disposition'] || '';
            let fileName = `tutor-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
            const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
            if (fileNameMatch?.[1]) fileName = fileNameMatch[1];

            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Analytics report downloaded');
        } catch {
            toast.error('Failed to export analytics');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading analytics...</p>
            </div>
        );
    }

    // Pie chart colors
    const PIE_COLORS = [C.btnPrimary, '#10B981', '#F59E0B'];

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'courses', label: 'Course Performance' },
        { id: 'students', label: 'Student Insights' },
    ];

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <BarChart3 size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>Analytics</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Deep dive into your course performance and student engagement.</p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export Report
                </button>
            </div>

            {/* ── Key Metrics ─────────────────────────────────────────────── */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={ArrowUpRight} label="Avg. Completion Rate" value="N/A"
                    sub="Data not available yet"
                    iconBg="rgba(16,185,129,0.15)" iconColor="#10B981"
                />
                <StatCard
                    icon={Star} label="Avg. Rating" value={stats.avgRating || '—'}
                    sub={`Based on ${stats.totalReviews} reviews`}
                    iconBg="rgba(245,158,11,0.15)" iconColor="#F59E0B"
                />
                <StatCard
                    icon={Clock} label="Total Courses" value={stats.totalCourses}
                    sub="Active courses"
                    iconBg="#E3DFF8" iconColor={C.btnPrimary}
                />
                <StatCard
                    icon={Users} label="Active Learners" value={stats.totalStudents}
                    sub="Total enrollments"
                    iconBg="#ffffff" iconColor={C.heading}
                />
            </div>

            {/* ── Native Tabs ─────────────────────────────────────────────── */}
            <div className="flex gap-2 p-1 w-full sm:w-max" style={{ backgroundColor: '#EAE8FA', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-6 cursor-pointer border-none transition-all"
                        style={{
                            backgroundColor: activeTab === tab.id ? C.surfaceWhite : 'transparent',
                            color: activeTab === tab.id ? C.btnPrimary : C.textMuted,
                            borderRadius: R.lg, boxShadow: activeTab === tab.id ? S.card : 'none',
                            fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                TAB 1: OVERVIEW
            ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
                <div className="grid gap-6 lg:grid-cols-7">
                    
                    {/* Revenue Chart */}
                    <div className="lg:col-span-4 overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            <div>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Revenue Trends</h2>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Monthly income overview</p>
                            </div>
                        </div>
                        <div className="p-6 h-[340px] w-full">
                            {monthlyEarnings.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyEarnings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" stroke={C.textMuted} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                                        <YAxis stroke={C.textMuted} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(117,115,232,0.05)' }} />
                                        <Bar dataKey="revenue" name="Earnings" radius={[6, 6, 0, 0]} fill={C.btnPrimary} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <TrendingUp size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No earnings data yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Courses */}
                    <div className="lg:col-span-3 overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            <div>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Most Popular Courses</h2>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>By active enrollment count</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                            {courseEnrollments.length > 0 ? courseEnrollments.map((course, index) => {
                                const pct = Math.round((course.students / (courseEnrollments[0].students || 1)) * 100);
                                return (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                                            style={{ backgroundColor: index === 0 ? C.btnPrimary : '#E3DFF8', color: index === 0 ? '#fff' : C.btnPrimary, border: index !== 0 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{course.name}</p>
                                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E3DFF8' }}>
                                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: C.gradientBtn }} />
                                            </div>
                                        </div>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.btnPrimary, flexShrink: 0 }}>
                                            {course.students}
                                        </span>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-10 flex flex-col items-center">
                                    <Users size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No courses yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                TAB 2: COURSE PERFORMANCE
            ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'courses' && (
                <div className="grid gap-6 lg:grid-cols-1">
                    <div className="overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            <div>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Enrollment Distribution</h2>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Revenue trends over time</p>
                            </div>
                        </div>
                        <div className="p-6 h-[400px] w-full">
                            {monthlyEarnings.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyEarnings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={C.btnPrimary} stopOpacity={0.2} />
                                                <stop offset="100%" stopColor={C.btnPrimary} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" stroke={C.textMuted} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                                        <YAxis stroke={C.textMuted} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                        <Tooltip content={<CustomBarTooltip />} cursor={{ stroke: 'rgba(117,115,232,0.1)', strokeWidth: 2 }} />
                                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke={C.btnPrimary} strokeWidth={3} dot={{ r: 4, fill: C.btnPrimary, strokeWidth: 0 }} activeDot={{ r: 6, fill: C.btnPrimary, strokeWidth: 2, stroke: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center">
                                    <TrendingUp size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No performance data available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════
                TAB 3: STUDENT INSIGHTS
            ══════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'students' && (
                <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Pie Chart */}
                    <div className="overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            <div>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Student Level Distribution</h2>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Breakdown by course difficulty</p>
                            </div>
                        </div>
                        <div className="p-6 h-[300px] w-full">
                            {studentDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={studentDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                            {studentDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }} />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700, color: C.textMuted }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-2">
                                    <Users size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No student data yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Level Breakdown List */}
                    <div className="overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            <div>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Level Breakdown</h2>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Students per course level</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {studentDistribution.length > 0 ? studentDistribution.map((item, index) => {
                                const total = studentDistribution.reduce((a, b) => a + b.value, 0);
                                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                return (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{item.name}</span>
                                            </div>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                                {item.value} <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>({pct}%)</span>
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E3DFF8' }}>
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-10">
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No data available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}