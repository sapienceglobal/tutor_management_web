'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    BarChart3, CheckCircle, Clock, TrendingUp, Sparkles, Brain,
    Calendar, Target, BookOpen, Award, Zap, AlertCircle, ChevronRight
} from 'lucide-react';
import api from '@/lib/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';
import { toast } from 'react-hot-toast';
import { C, T, S } from '@/constants/studentTokens';

const PIE_COLORS = [C.success, C.btnPrimary, C.warning, C.danger];

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl px-3 py-2 shadow-lg"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily }}>
            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, marginBottom: 2 }}>{label}</p>
            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.btnPrimary }}>{payload[0].value}% avg</p>
        </div>
    );
};

const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl px-3 py-2 shadow-lg"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily }}>
            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>{payload[0].name}</p>
            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: payload[0].payload.fill }}>{payload[0].value} Tests</p>
        </div>
    );
};

// ─── Icon Pill ────────────────────────────────────────────────────────────────
function IconPill({ icon: Icon, size = 18, bg }) {
    return (
        <div className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, backgroundColor: bg || C.iconBg }}>
            <Icon style={{ width: size, height: size, color: '#ffffff' }} />
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, isDark }) {
    return (
        <div className="rounded-2xl p-5 flex items-center gap-4"
            style={{
                backgroundColor: isDark ? C.darkCard : C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                boxShadow: S.card,
            }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : C.iconBg }}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.semibold, textTransform: 'uppercase', letterSpacing: T.tracking.wide, color: isDark ? 'rgba(255,255,255,0.55)' : C.statLabel }}>
                    {label}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, lineHeight: T.leading.tight, color: isDark ? '#ffffff' : C.statValue }}>
                    {value}
                </p>
            </div>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
    return (
        <button onClick={onClick}
            className="flex-1 px-4 py-2.5 rounded-xl transition-all"
            style={active
                ? { backgroundColor: C.cardBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, boxShadow: S.active, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }
                : { backgroundColor: 'transparent', color: C.text, opacity: 0.6, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
            {children}
        </button>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ResultsAnalyticsPage() {
    const [attempts, setAttempts]             = useState([]);
    const [allExams, setAllExams]             = useState([]);
    const [courses, setCourses]               = useState([]);
    const [loading, setLoading]               = useState(true);
    const [activeTab, setActiveTab]           = useState('analytics');
    const [studyPlan, setStudyPlan]           = useState(null);
    const [generatingPlan, setGeneratingPlan] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, examsRes, coursesRes] = await Promise.all([
                    api.get('/exams/student/history-all'),
                    api.get('/exams/student/all'),
                    api.get('/enrollments/my-enrollments'),
                ]);
                if (historyRes.data.success) setAttempts(historyRes.data.attempts || []);
                if (examsRes.data.success) setAllExams(examsRes.data.exams || []);
                if (coursesRes.data.success) setCourses((coursesRes.data.enrollments || []).map(e => e.courseId));
            } catch (err) { console.error('Error fetching analytics:', err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const generateStudyPlan = async () => {
        setGeneratingPlan(true);
        try {
            const response = await api.post('/ai/generate-study-plan', {
                performanceData: attempts,
                courses,
                goals: ['improve_scores', 'complete_courses', 'master_weak_areas'],
            });
            if (response.data.success) {
                setStudyPlan(response.data.studyPlan);
                setActiveTab('study-plan');
                toast.success('AI Study Plan Generated! 🎯');
            }
        } catch { toast.error('Failed to generate AI study plan'); }
        finally { setGeneratingPlan(false); }
    };

    const insights = useMemo(() => {
        if (!attempts.length) return { avgScore: 0, completed: 0, pending: 0 };
        const totalPct = attempts.reduce((sum, a) =>
            sum + (a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0), 0);
        return {
            avgScore:  Math.round(totalPct / attempts.length),
            completed: attempts.length,
            pending:   allExams.filter(e => !e.isCompleted).length,
        };
    }, [attempts, allExams]);

    const performanceTrend = useMemo(() => {
        const monthMap = {};
        attempts.forEach(a => {
            const key = new Date(a.date || a.submittedAt || a.createdAt)
                .toLocaleDateString('en-US', { month: 'short' });
            if (!monthMap[key]) monthMap[key] = { name: key, total: 0, count: 0 };
            monthMap[key].total += a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
            monthMap[key].count++;
        });
        return Object.values(monthMap).map(m => ({ name: m.name, avg: Math.round(m.total / m.count), count: m.count }));
    }, [attempts]);

    const scoreDistribution = useMemo(() => {
        const ranges = [
            { name: '90–100', count: 0 }, { name: '80–89', count: 0 },
            { name: '70–79', count: 0 },  { name: 'Below 70', count: 0 },
        ];
        attempts.forEach(a => {
            const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
            if (pct >= 90) ranges[0].count++;
            else if (pct >= 80) ranges[1].count++;
            else if (pct >= 70) ranges[2].count++;
            else ranges[3].count++;
        });
        return ranges.filter(r => r.count > 0);
    }, [attempts]);

    const recentScores = useMemo(() =>
        [...attempts].sort((a, b) => new Date(b.date || b.submittedAt) - new Date(a.date || a.submittedAt)).slice(0, 5),
    [attempts]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-11 h-11">
                    <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 animate-pulse" style={{ color: C.btnPrimary }} />
                    </div>
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.55 }}>
                    Loading analytics…
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-10" style={{ fontFamily: T.fontFamily }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading }}>
                        AI Learning Hub
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, opacity: 0.5, marginTop: 2 }}>
                        Track your performance &amp; get AI-powered recommendations
                    </p>
                </div>
                <button onClick={generateStudyPlan} disabled={generatingPlan}
                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl transition-all disabled:opacity-60"
                    style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                    {generatingPlan ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                    ) : (
                        <><Brain className="w-4 h-4" /> Generate AI Study Plan</>
                    )}
                </button>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: C.innerBg }}>
                <TabBtn active={activeTab === 'analytics'}   onClick={() => setActiveTab('analytics')}>📊 Analytics</TabBtn>
                <TabBtn active={activeTab === 'study-plan'}  onClick={() => setActiveTab('study-plan')}>🧠 AI Study Plan</TabBtn>
            </div>

            {/* ══ ANALYTICS TAB ═══════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
                <div className="space-y-5">

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatCard label="Average Score"   value={`${insights.avgScore}%`} icon={TrendingUp} />
                        <StatCard label="Completed Tests" value={insights.completed}       icon={CheckCircle} />
                        <StatCard label="Tests Pending"   value={insights.pending}         icon={Clock} isDark />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Performance Trend */}
                        <div className="rounded-2xl p-5"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <IconPill icon={BarChart3} size={15} />
                                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                        Performance Trend
                                    </h2>
                                </div>
                                <span className="px-2 py-1 rounded-lg"
                                    style={{ backgroundColor: C.innerBg, color: C.text, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.semibold }}>
                                    Monthly Avg
                                </span>
                            </div>
                            {performanceTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={performanceTrend} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" stroke={C.cardBorder} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.text, opacity: 0.5, fontWeight: 600, fontFamily: T.fontFamily }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: C.text, opacity: 0.5, fontFamily: T.fontFamily }} axisLine={false} tickLine={false} domain={[0, 100]} width={30} />
                                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: C.innerBg, radius: 8 }} />
                                        <Bar dataKey="avg" radius={[8, 8, 0, 0]} maxBarSize={36}>
                                            {performanceTrend.map((_, i) => (
                                                <Cell key={i} fill={i === performanceTrend.length - 1 ? C.btnPrimary : C.btnViewAllBg} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center gap-2">
                                    <IconPill icon={BarChart3} bg={C.innerBg} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.4 }}>No data yet</p>
                                </div>
                            )}
                        </div>

                        {/* Score Distribution */}
                        <div className="rounded-2xl p-5"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <IconPill icon={Target} size={15} bg={C.success} />
                                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                    Score Distribution
                                </h2>
                            </div>
                            {scoreDistribution.length > 0 ? (
                                <div className="flex items-center gap-6">
                                    <div className="w-44 h-44 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={scoreDistribution} dataKey="count"
                                                    cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4}>
                                                    {scoreDistribution.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomPieTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-2.5 flex-1">
                                        {scoreDistribution.map((range, i) => (
                                            <div key={i} className="flex items-center gap-2.5">
                                                <span className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, opacity: 0.65 }}>{range.name}</span>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: PIE_COLORS[i % PIE_COLORS.length] }}>{range.count}</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                                                        <div className="h-full rounded-full"
                                                            style={{ width: `${(range.count / attempts.length) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center gap-2">
                                    <IconPill icon={Target} bg={C.innerBg} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.4 }}>No data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent attempts */}
                    {recentScores.length > 0 && (
                        <div className="rounded-2xl overflow-hidden"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="px-5 py-4 flex items-center justify-between"
                                style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-2.5">
                                    <IconPill icon={Clock} size={15} />
                                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                        Recent Attempts
                                    </h2>
                                </div>
                                <Link href="/student/exams" className="flex items-center gap-1"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.btnPrimary }}>
                                    View all <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div>
                                {recentScores.map((attempt, i) => {
                                    const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                                    const passed = attempt.isPassed;
                                    return (
                                        <div key={i}
                                            className="flex items-center justify-between px-5 py-3.5 transition-colors"
                                            style={{ borderBottom: i < recentScores.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                                    style={{ backgroundColor: passed ? C.successBg : C.dangerBg }}>
                                                    {passed
                                                        ? <CheckCircle className="w-4 h-4" style={{ color: C.success }} />
                                                        : <AlertCircle className="w-4 h-4" style={{ color: C.danger }} />}
                                                </div>
                                                <div>
                                                    <p className="truncate max-w-[200px]"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                        {attempt.examTitle || attempt.exam?.title || 'Exam'}
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.text, opacity: 0.45, marginTop: 2 }}>
                                                        {new Date(attempt.date || attempt.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-right">
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: passed ? C.success : C.danger }}>
                                                        {pct}%
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.text, opacity: 0.45 }}>
                                                        {attempt.score}/{attempt.totalMarks}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 rounded-full"
                                                    style={passed
                                                        ? { backgroundColor: C.successBg, color: C.success, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold }
                                                        : { backgroundColor: C.dangerBg, color: C.danger, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold }}>
                                                    {passed ? 'Passed' : 'Failed'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══ STUDY PLAN TAB ══════════════════════════════════════════ */}
            {activeTab === 'study-plan' && (
                <div className="space-y-4">
                    {studyPlan ? (
                        <>
                            {/* Plan hero */}
                            <div className="rounded-2xl overflow-hidden relative"
                                style={{ backgroundColor: C.darkCard, border: `1px solid ${C.cardBorder}` }}>
                                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                                    style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                                <div className="relative p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                                            <Brain className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#ffffff' }}>
                                                Your AI Study Plan
                                            </h2>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                                                Personalized based on your performance
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Duration',    value: studyPlan.duration || '4 weeks',   icon: Calendar },
                                            { label: 'Daily Goal',  value: studyPlan.dailyGoal || '2 hours',  icon: Target },
                                            { label: 'Focus Areas', value: studyPlan.focusAreas?.length || 3, icon: BookOpen },
                                            { label: 'Expected',    value: studyPlan.expectedImprovement || '+15%', icon: TrendingUp },
                                        ].map((s, i) => (
                                            <div key={i} className="rounded-xl p-3 text-center"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
                                                <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: 'rgba(255,255,255,0.55)' }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 2 }}>
                                                    {s.label}
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#ffffff' }}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Weekly schedule */}
                            <div className="rounded-2xl overflow-hidden"
                                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
                                <div className="px-5 py-4 flex items-center gap-2.5"
                                    style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <IconPill icon={Calendar} size={15} />
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Weekly Schedule</h3>
                                </div>
                                <div className="p-4 space-y-2">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <div key={day}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                                            style={{ border: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black }}>
                                                    {day.slice(0, 2).toUpperCase()}
                                                </span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text }}>{day}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.btnPrimary }}>
                                                    {studyPlan.weeklySchedule?.[day] || 'Study & Practice'}
                                                </span>
                                                <Zap className="w-3.5 h-3.5" style={{ color: C.warning }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Focus areas */}
                            <div className="rounded-2xl overflow-hidden"
                                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
                                <div className="px-5 py-4 flex items-center gap-2.5"
                                    style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <IconPill icon={Target} size={15} bg={C.warning} />
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Focus Areas</h3>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {(studyPlan.focusAreas || [
                                            { area: 'Mathematics',       priority: 'High',   reason: 'Improve problem-solving speed' },
                                            { area: 'Science',           priority: 'Medium', reason: 'Strengthen fundamentals' },
                                            { area: 'Language',          priority: 'Low',    reason: 'Maintain current level' },
                                            { area: 'Logic & Reasoning', priority: 'High',   reason: 'Boost analytical skills' },
                                        ]).map((focus, i) => {
                                            const pCfg = {
                                                High:   { bg: C.dangerBg,   color: C.danger,   border: C.dangerBorder },
                                                Medium: { bg: C.warningBg,  color: C.warning,  border: C.warningBorder },
                                                Low:    { bg: C.successBg,  color: C.success,  border: C.successBorder },
                                            }[focus.priority] || { bg: C.innerBg, color: C.text, border: C.cardBorder };
                                            return (
                                                <div key={i} className="rounded-2xl p-4 transition-colors"
                                                    style={{ border: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{focus.area}</h4>
                                                        <span className="px-2.5 py-1 rounded-full"
                                                            style={{ backgroundColor: pCfg.bg, color: pCfg.color, border: `1px solid ${pCfg.border}`, fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold }}>
                                                            {focus.priority} Priority
                                                        </span>
                                                    </div>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, opacity: 0.55 }}>
                                                        {focus.reason}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="rounded-2xl overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: `1px solid ${C.successBorder}` }}>
                                <div className="px-5 py-4 flex items-center gap-2.5"
                                    style={{ borderBottom: `1px solid ${C.successBorder}` }}>
                                    <IconPill icon={Award} size={15} bg={C.success} />
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Recommended Actions</h3>
                                </div>
                                <div className="p-4 space-y-2.5">
                                    {(studyPlan.recommendations || [
                                        'Complete 2 practice tests daily',
                                        'Review weak areas for 30 minutes',
                                        'Focus on time management during tests',
                                        'Take breaks between study sessions',
                                    ]).map((action, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.80)', border: `1px solid ${C.successBorder}` }}>
                                            <CheckCircle className="w-4 h-4 shrink-0" style={{ color: C.success }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text }}>{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Empty state */
                        <div className="rounded-2xl overflow-hidden relative"
                            style={{ backgroundColor: C.darkCard }}>
                            <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                            <div className="relative text-center py-16 px-6">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: '#ffffff', marginBottom: 8 }}>
                                    No Study Plan Yet
                                </h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.50)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px', lineHeight: T.leading.relaxed }}>
                                    Generate your personalized AI study plan to get targeted recommendations.
                                </p>
                                <button onClick={generateStudyPlan} disabled={generatingPlan}
                                    className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl transition-colors disabled:opacity-60"
                                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                    {generatingPlan ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> Generate AI Study Plan</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}