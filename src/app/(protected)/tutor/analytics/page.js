'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, LineChart, Line,
    PieChart, Pie, Cell
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, Users, Star, Clock, TrendingUp, Loader2, Download } from 'lucide-react';
import { C, T, FX } from '@/constants/tutorTokens';

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-lg text-xs">
                <p className="text-slate-400 font-medium mb-0.5">{label}</p>
                <p className="font-bold text-slate-800" style={{ color: C.btnPrimary }}>
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
        <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
            </div>
            <p className="text-2xl font-black text-slate-800">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
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

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            const [earningsRes, statsRes, coursesRes] = await Promise.all([
                api.get('/tutor/dashboard/earnings'),
                api.get('/tutor/dashboard/stats'),
                api.get('/courses/my-courses'),
            ]);

            if (earningsRes.data.success) {
                setMonthlyEarnings(earningsRes.data.earnings.monthly);
                const byCourse = earningsRes.data.earnings.byCourse
                    .map(c => ({ name: c.title, students: c.enrollments }))
                    .sort((a, b) => b.students - a.students)
                    .slice(0, 5);
                setCourseEnrollments(byCourse);
            }

            if (statsRes.data.success) {
                setStats({
                    avgRating: statsRes.data.stats.rating.average,
                    totalReviews: statsRes.data.stats.rating.totalReviews,
                    totalStudents: statsRes.data.stats.students.total,
                    totalCourses: statsRes.data.stats.courses.total,
                });
            }

            if (coursesRes.data.success) {
                const levels = { beginner: 0, intermediate: 0, advanced: 0 };
                coursesRes.data.courses.forEach(course => {
                    const level = course.level?.toLowerCase() || 'beginner';
                    if (levels[level] !== undefined) levels[level] += course.enrolledCount;
                });
                setStudentDistribution([
                    { name: 'Beginner', value: levels.beginner },
                    { name: 'Intermediate', value: levels.intermediate },
                    { name: 'Advanced', value: levels.advanced },
                ].filter(d => d.value > 0));
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p className="text-sm text-slate-400">Loading analytics...</p>
            </div>
        );
    }

    // Pie chart colors derived from CSS vars — computed once on client
    const PIE_COLORS = [
        C.btnPrimary,
        C.chartLine,
        C.darkCard,
    ];

    return (
        <div className="space-y-6" style={{ fontFamily: T.fontFamily }}>

            {/* Page Header */}
            <div>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                                backgroundColor: FX.primary12,
                                border: `1px solid ${FX.primary20}`
                            }}>
                            <TrendingUp className="w-4 h-4" style={{ color: C.btnPrimary }} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-60"
                        style={{ backgroundColor: C.btnPrimary }}
                    >
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Export Report
                    </button>
                </div>
                <p className="text-xs text-slate-400 pl-0.5">Deep dive into your course performance and student engagement.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={ArrowUpRight} label="Avg. Completion Rate" value="N/A"
                    sub="Data not available yet"
                    iconBg="bg-emerald-50" iconColor="text-emerald-500"
                />
                <StatCard
                    icon={Star} label="Avg. Rating" value={stats.avgRating || '—'}
                    sub={`Based on ${stats.totalReviews} reviews`}
                    iconBg="bg-yellow-50" iconColor="text-yellow-500"
                />
                <StatCard
                    icon={Clock} label="Total Courses" value={stats.totalCourses}
                    sub="Active courses"
                    iconBg="bg-blue-50" iconColor="text-blue-500"
                />
                <StatCard
                    icon={Users} label="Active Learners" value={stats.totalStudents}
                    sub="Total enrollments"
                    iconBg="bg-slate-50" iconColor="text-slate-500"
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-slate-100 p-1 rounded-xl h-auto">
                    {['overview', 'courses', 'students'].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="capitalize text-sm font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                            style={{ '--tab-active-color': C.btnPrimary }}>
                            {tab === 'overview' ? 'Overview' : tab === 'courses' ? 'Course Performance' : 'Student Insights'}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* ── Overview ─────────────────────────────────────────── */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-7">

                        {/* Revenue Chart */}
                        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-100 p-5">
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-slate-800">Revenue Trends</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Monthly income overview</p>
                            </div>
                            <div className="h-[300px]">
                                {monthlyEarnings.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyEarnings} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}
                                                tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                                            <Bar dataKey="revenue" name="Earnings" radius={[6, 6, 0, 0]}
                                                fill={C.btnPrimary} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-2">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-400">No earnings data yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Courses */}
                        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 p-5">
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-slate-800">Most Popular Courses</h2>
                                <p className="text-xs text-slate-400 mt-0.5">By active enrollment count</p>
                            </div>
                            <div className="space-y-4">
                                {courseEnrollments.length > 0 ? courseEnrollments.map((course, index) => {
                                    const pct = Math.round((course.students / (courseEnrollments[0].students || 1)) * 100);
                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                                                style={{ backgroundColor: index === 0 ? C.btnPrimary : C.darkCard }}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 truncate mb-1.5">{course.name}</p>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700"
                                                        style={{ width: `${pct}%`, backgroundColor: C.btnPrimary }} />
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 flex-shrink-0">{course.students}</span>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-sm text-slate-400 text-center py-8">No courses yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ── Courses ──────────────────────────────────────────── */}
                <TabsContent value="courses">
                    <div className="bg-white rounded-xl border border-slate-100 p-5">
                        <div className="mb-4">
                            <h2 className="text-sm font-bold text-slate-800">Enrollment Distribution</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Revenue trends over time</p>
                        </div>
                        <div className="h-[380px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyEarnings} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={C.btnPrimary} stopOpacity={0.15} />
                                            <stop offset="100%" stopColor={C.btnPrimary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Line type="monotone" dataKey="revenue" name="Revenue"
                                        stroke={C.btnPrimary} strokeWidth={2.5}
                                        dot={{ r: 3, fill: C.btnPrimary, strokeWidth: 0 }}
                                        activeDot={{ r: 5, fill: C.btnPrimary }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </TabsContent>

                {/* ── Students ─────────────────────────────────────────── */}
                <TabsContent value="students">
                    <div className="grid gap-4 md:grid-cols-2">

                        {/* Pie Chart */}
                        <div className="bg-white rounded-xl border border-slate-100 p-5">
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-slate-800">Student Level Distribution</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Breakdown by course difficulty</p>
                            </div>
                            <div className="h-[260px]">
                                {studentDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={studentDistribution}
                                                cx="50%" cy="50%"
                                                innerRadius={55} outerRadius={95}
                                                paddingAngle={4} dataKey="value"
                                                strokeWidth={0}
                                            >
                                                {studentDistribution.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-2">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-400">No student data yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Level breakdown list */}
                        <div className="bg-white rounded-xl border border-slate-100 p-5">
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-slate-800">Level Breakdown</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Students per course level</p>
                            </div>
                            <div className="space-y-4">
                                {studentDistribution.length > 0 ? studentDistribution.map((item, index) => {
                                    const total = studentDistribution.reduce((a, b) => a + b.value, 0);
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    return (
                                        <div key={index}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                                    <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-slate-800">{item.value} <span className="text-xs font-normal text-slate-400">({pct}%)</span></span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-sm text-slate-400 italic">No data available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
