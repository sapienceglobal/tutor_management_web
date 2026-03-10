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

const COLORS = ['#10b981', 'var(--theme-primary)', '#f59e0b', '#ef4444'];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
            <p className="font-bold text-slate-700 mb-0.5">{label}</p>
            <p className="text-[var(--theme-primary)] font-semibold">{payload[0].value}% avg</p>
        </div>
    );
};

const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
            <p className="font-bold text-slate-700">{payload[0].name}</p>
            <p className="font-semibold" style={{ color: payload[0].payload.fill }}>{payload[0].value} Tests</p>
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, gradient }) {
    return (
        <div className={`rounded-2xl p-5 shadow-sm border flex items-center gap-4
            ${gradient ? 'border-[var(--theme-primary)]/20 text-white' : 'bg-white border-slate-100'}`}
            style={gradient ? { background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' } : {}}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${gradient ? 'bg-white/15' : bg}`}>
                <Icon className={`w-5 h-5 ${gradient ? 'text-[var(--theme-primary)]/70' : color}`} />
            </div>
            <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.07em] ${gradient ? 'text-[var(--theme-primary)]/70' : 'text-slate-400'}`}>
                    {label}
                </p>
                <p className={`text-2xl font-black leading-tight ${gradient ? 'text-white' : color}`}>{value}</p>
            </div>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
    return (
        <button onClick={onClick}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                ${active
                    ? 'bg-white text-[var(--theme-primary)] shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'}`}>
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
                if (coursesRes.data.success) {
                    setCourses((coursesRes.data.enrollments || []).map(e => e.courseId));
                }
            } catch (err) {
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
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
                toast.success('AI Study Plan Generated Successfully! 🎯');
            }
        } catch (err) {
            toast.error('Failed to generate AI study plan');
        } finally {
            setGeneratingPlan(false);
        }
    };

    // ── Computed values ───────────────────────────────────────────────────────
    const insights = useMemo(() => {
        if (!attempts.length) return { avgScore: 0, completed: 0, pending: 0 };
        const totalPct = attempts.reduce((sum, a) => {
            return sum + (a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0);
        }, 0);
        return {
            avgScore: Math.round(totalPct / attempts.length),
            completed: attempts.length,
            pending: allExams.filter(e => !e.isCompleted).length,
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
            { name: '90–100', count: 0 },
            { name: '80–89',  count: 0 },
            { name: '70–79',  count: 0 },
            { name: 'Below 70', count: 0 },
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

    const recentScores = useMemo(() => {
        return [...attempts]
            .sort((a, b) => new Date(b.date || b.submittedAt) - new Date(a.date || a.submittedAt))
            .slice(0, 5);
    }, [attempts]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-11 h-11">
                    <div className="w-11 h-11 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                    </div>
                </div>
                <p className="text-sm text-slate-400 font-medium">Loading analytics…</p>
            </div>
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-10" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-slate-800">AI Learning Hub</h1>
                    <p className="text-xs text-slate-400 mt-0.5">Track your performance & get AI-powered study recommendations</p>
                </div>
                <button onClick={generateStudyPlan} disabled={generatingPlan}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                    {generatingPlan ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating…
                        </>
                    ) : (
                        <>
                            <Brain className="w-4 h-4" />
                            Generate AI Study Plan
                        </>
                    )}
                </button>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                <TabBtn active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
                    📊 Analytics
                </TabBtn>
                <TabBtn active={activeTab === 'study-plan'} onClick={() => setActiveTab('study-plan')}>
                    🧠 AI Study Plan
                </TabBtn>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                ANALYTICS TAB
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
                <div className="space-y-5">

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <StatCard label="Average Score" value={`${insights.avgScore}%`}
                            icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
                        <StatCard label="Completed Tests" value={insights.completed}
                            icon={CheckCircle} color="text-[var(--theme-primary)]" bg="bg-[var(--theme-primary)]/20" />
                        <StatCard label="Tests Pending" value={insights.pending}
                            icon={Clock} color="text-amber-600" bg="bg-amber-50" />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Performance Trend */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                                        <BarChart3 className="w-4 h-4 text-[var(--theme-primary)]" />
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-800">Performance Trend</h2>
                                </div>
                                <span className="text-[11px] text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-lg">Monthly Avg</span>
                            </div>
                            {performanceTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={performanceTrend} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} width={30} />
                                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                                        <Bar dataKey="avg" radius={[8, 8, 0, 0]} maxBarSize={36}>
                                            {performanceTrend.map((_, i) => (
                                                <Cell key={i}
                                                    fill={i === performanceTrend.length - 1 ? 'var(--theme-primary)' : '#c7d2fe'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center gap-2">
                                    <BarChart3 className="w-8 h-8 text-slate-200" />
                                    <p className="text-sm text-slate-400 font-medium">No data yet</p>
                                </div>
                            )}
                        </div>

                        {/* Score Distribution */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-7 h-7 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <Target className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-800">Score Distribution</h2>
                            </div>
                            {scoreDistribution.length > 0 ? (
                                <div className="flex items-center gap-6">
                                    <div className="w-44 h-44 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={scoreDistribution} dataKey="count"
                                                    cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                                                    paddingAngle={4}>
                                                    {scoreDistribution.map((_, i) => (
                                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                                                    style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-500 font-medium">{range.name}</span>
                                                        <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{range.count}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full"
                                                            style={{
                                                                width: `${(range.count / attempts.length) * 100}%`,
                                                                backgroundColor: COLORS[i % COLORS.length],
                                                            }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center gap-2">
                                    <Target className="w-8 h-8 text-slate-200" />
                                    <p className="text-sm text-slate-400 font-medium">No data yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent attempts */}
                    {recentScores.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-[var(--theme-primary)]" />
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-800">Recent Attempts</h2>
                                </div>
                                <Link href="/student/exams"
                                    className="text-xs font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary)] flex items-center gap-1 transition-colors">
                                    View all <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {recentScores.map((attempt, i) => {
                                    const pct = attempt.totalMarks > 0
                                        ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                                    const passed = attempt.isPassed;
                                    return (
                                        <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                                                    ${passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                                    {passed
                                                        ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                        : <AlertCircle className="w-4 h-4 text-red-500" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">
                                                        {attempt.examTitle || attempt.exam?.title || 'Exam'}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        {new Date(attempt.date || attempt.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${passed ? 'text-emerald-600' : 'text-red-500'}`}>{pct}%</p>
                                                    <p className="text-[11px] text-slate-400">{attempt.score}/{attempt.totalMarks}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-[11px] font-bold rounded-full
                                                    ${passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
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

            {/* ══════════════════════════════════════════════════════════════
                STUDY PLAN TAB
            ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'study-plan' && (
                <div className="space-y-4">
                    {studyPlan ? (
                        <>
                            {/* Plan hero */}
                            <div className="rounded-2xl overflow-hidden shadow-sm border border-[var(--theme-primary)]/20 relative"
                                style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' }}>
                                {/* dot grid */}
                                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                                    style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[var(--theme-accent)]/20 blur-3xl pointer-events-none" />

                                <div className="relative p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                                            <Brain className="w-5 h-5 text-[var(--theme-primary)]/70" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-white">Your AI Study Plan</h2>
                                            <p className="text-xs text-[var(--theme-primary)]/70">Personalized based on your performance</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Duration',    value: studyPlan.duration || '4 weeks',  icon: Calendar },
                                            { label: 'Daily Goal',  value: studyPlan.dailyGoal || '2 hours', icon: Target },
                                            { label: 'Focus Areas', value: studyPlan.focusAreas?.length || 3, icon: BookOpen },
                                            { label: 'Expected',    value: studyPlan.expectedImprovement || '+15%', icon: TrendingUp },
                                        ].map((s, i) => (
                                            <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                                                <s.icon className="w-4 h-4 text-[var(--theme-primary)]/70 mx-auto mb-1.5" />
                                                <p className="text-[10px] text-[var(--theme-primary)]/70 font-semibold uppercase tracking-wider mb-0.5">{s.label}</p>
                                                <p className="text-sm font-black text-white">{s.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Weekly schedule */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-[var(--theme-primary)]" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800">Weekly Schedule</h3>
                                </div>
                                <div className="p-4 space-y-2">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                                        <div key={day}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/20 flex items-center justify-center text-[10px] font-black text-[var(--theme-primary)]">
                                                    {day.slice(0, 2).toUpperCase()}
                                                </span>
                                                <span className="text-sm font-semibold text-slate-700">{day}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-[var(--theme-primary)]">
                                                    {studyPlan.weeklySchedule?.[day] || 'Study & Practice'}
                                                </span>
                                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Focus areas */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <Target className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800">Focus Areas</h3>
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
                                                High:   { bg: 'bg-red-50',    color: 'text-red-700',    border: 'border-red-200' },
                                                Medium: { bg: 'bg-amber-50',  color: 'text-amber-700',  border: 'border-amber-200' },
                                                Low:    { bg: 'bg-emerald-50',color: 'text-emerald-700',border: 'border-emerald-200' },
                                            }[focus.priority] || { bg: 'bg-slate-50', color: 'text-slate-600', border: 'border-slate-200' };
                                            return (
                                                <div key={i} className="border border-slate-100 rounded-2xl p-4 hover:bg-slate-50/50 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-sm font-bold text-slate-800">{focus.area}</h4>
                                                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${pCfg.bg} ${pCfg.color} ${pCfg.border}`}>
                                                            {focus.priority} Priority
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">{focus.reason}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="rounded-2xl overflow-hidden border border-emerald-200"
                                style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}>
                                <div className="px-5 py-4 border-b border-emerald-200/60 flex items-center gap-2.5">
                                    <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <Award className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800">Recommended Actions</h3>
                                </div>
                                <div className="p-4 space-y-2.5">
                                    {(studyPlan.recommendations || [
                                        'Complete 2 practice tests daily',
                                        'Review weak areas for 30 minutes',
                                        'Focus on time management during tests',
                                        'Take breaks between study sessions',
                                    ]).map((action, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-emerald-100/60">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span className="text-xs font-medium text-slate-700">{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ── Empty state ─────────────────────────────────── */
                        <div className="rounded-2xl overflow-hidden relative"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' }}>
                            {/* dot grid */}
                            <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[var(--theme-accent)]/20 blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-[var(--theme-primary)]/20/20 blur-3xl pointer-events-none" />

                            <div className="relative text-center py-16 px-6">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Brain className="w-8 h-8 text-[var(--theme-primary)]/70" />
                                </div>
                                <h3 className="text-xl font-black text-white mb-2">No Study Plan Yet</h3>
                                <p className="text-sm text-[var(--theme-primary)]/70 mb-6 max-w-sm mx-auto leading-relaxed">
                                    Generate your personalized AI study plan to get targeted recommendations and improve your learning efficiency.
                                </p>
                                <button onClick={generateStudyPlan} disabled={generatingPlan}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                                    {generatingPlan ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Generating…
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Generate AI Study Plan
                                        </>
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