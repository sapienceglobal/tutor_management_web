'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    BarChart3, CheckCircle, Clock, TrendingUp, Sparkles, Brain,
    Calendar, Target, BookOpen, Award, Zap, AlertCircle, ChevronRight, XCircle,
    Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const themeBg = '#dfdaf3';
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';
const PIE_COLORS = [C.success, C.btnPrimary, C.warning, C.danger];

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl px-4 py-3 shadow-xl"
            style={{ backgroundColor: '#1E1B4B', border: '1px solid rgba(255,255,255,0.1)', fontFamily: T.fontFamily }}>
            <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.6)', marginBottom: 2, textTransform: 'uppercase' }}>{label}</p>
            <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: '#fff' }}>{payload[0].value}% <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.5)' }}>AVG</span></p>
        </div>
    );
};

const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl px-4 py-3 shadow-xl"
            style={{ backgroundColor: '#1E1B4B', border: '1px solid rgba(255,255,255,0.1)', fontFamily: T.fontFamily }}>
            <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{payload[0].name} Score</p>
            <p style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: payload[0].payload.fill, marginTop: 2 }}>{payload[0].value} Tests</p>
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
    return (
        <div className="rounded-2xl p-5 flex flex-col justify-between transition-transform hover:-translate-y-1 shadow-sm"
            style={{ backgroundColor: outerCard, border: `1px solid ${C.cardBorder}` }}>
            <div className="flex items-center justify-between mb-4">
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.textMuted }}>
                    {label}
                </p>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
            </div>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, lineHeight: 1, color: C.heading }}>
                    {value}
                </p>
            </div>
        </div>
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
                if (historyRes.data?.success) setAttempts(historyRes.data.attempts || []);
                if (examsRes.data?.success) setAllExams(examsRes.data.exams || []);
                if (coursesRes.data?.success) setCourses((coursesRes.data.enrollments || []).map(e => e.courseId));
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
            if (response.data?.success) {
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
            const key = new Date(a.date || a.submittedAt || a.createdAt).toLocaleDateString('en-US', { month: 'short' });
            if (!monthMap[key]) monthMap[key] = { name: key, total: 0, count: 0 };
            monthMap[key].total += a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
            monthMap[key].count++;
        });
        return Object.values(monthMap).map(m => ({ name: m.name, avg: Math.round(m.total / m.count), count: m.count }));
    }, [attempts]);

    const scoreDistribution = useMemo(() => {
        const ranges = [
            { name: '90–100%', count: 0 }, { name: '80–89%', count: 0 },
            { name: '70–79%', count: 0 },  { name: 'Below 70%', count: 0 },
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{ backgroundColor: themeBg }}>
            <div className="relative w-12 h-12">
                <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#4F46E5] animate-pulse" />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                Loading AI Analytics…
            </p>
        </div>
    );

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl" style={{ backgroundColor: outerCard, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: innerBox, borderRadius: R.xl }}>
                        <Brain size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>AI Learning Hub</h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                            Track your performance & get AI-powered recommendations.
                        </p>
                    </div>
                </div>

                <div className="flex p-1 rounded-xl shrink-0" style={{ backgroundColor: innerBox, border: `1px solid ${C.cardBorder}` }}>
                    {[
                        { id: 'analytics',  label: 'Analytics', icon: BarChart3 },
                        { id: 'study-plan', label: 'AI Study Plan', icon: Sparkles },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer border-none"
                            style={activeTab === tab.id
                                ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontSize: T.size.sm, fontWeight: T.weight.bold, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                                : { backgroundColor: 'transparent', color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ ANALYTICS TAB ═══════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Average Score"   value={`${insights.avgScore}%`} icon={TrendingUp} iconBg={innerBox} iconColor={C.btnPrimary} />
                        <StatCard label="Completed Tests" value={insights.completed}      icon={CheckCircle} iconBg={C.successBg} iconColor={C.success} />
                        <StatCard label="Tests Pending"   value={insights.pending}        icon={Clock} iconBg={C.warningBg} iconColor={C.warning} />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* Performance Trend */}
                        <div className="rounded-3xl p-6 shadow-sm border flex flex-col" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: innerBox }}>
                                        <BarChart3 size={16} color={C.btnPrimary} />
                                    </div>
                                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                        Performance Trend
                                    </h2>
                                </div>
                                <span className="px-3 py-1 rounded-lg" style={{ backgroundColor: innerBox, color: C.textMuted, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Monthly Avg
                                </span>
                            </div>

                            {performanceTrend.length > 0 ? (
                                <div className="flex-1 min-h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.textMuted, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: C.textMuted, fontWeight: 700 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                            <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                            <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                                {performanceTrend.map((_, i) => (
                                                    <Cell key={i} fill={i === performanceTrend.length - 1 ? C.btnPrimary : '#C5BFEA'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50 py-10">
                                    <BarChart3 size={32} color={C.textMuted} />
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No data to show</p>
                                </div>
                            )}
                        </div>

                        {/* Score Distribution */}
                        <div className="rounded-3xl p-6 shadow-sm border flex flex-col" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.successBg }}>
                                    <Target size={16} color={C.success} />
                                </div>
                                <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                    Score Distribution
                                </h2>
                            </div>

                            {scoreDistribution.length > 0 ? (
                                <div className="flex flex-col sm:flex-row items-center gap-8 flex-1">
                                    <div className="w-48 h-48 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={scoreDistribution} dataKey="count" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} stroke="none">
                                                    {scoreDistribution.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomPieTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4 flex-1 w-full">
                                        {scoreDistribution.map((range, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1.5">
                                                        <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{range.name}</span>
                                                        <span style={{ fontSize: '11px', fontWeight: T.weight.black, color: PIE_COLORS[i % PIE_COLORS.length] }}>{range.count} Tests</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: innerBox }}>
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(range.count / attempts.length) * 100}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50 py-10">
                                    <Target size={32} color={C.textMuted} />
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>Complete tests to see distribution</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent attempts */}
                    {recentScores.length > 0 && (
                        <div className="rounded-3xl shadow-sm border overflow-hidden" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: innerBox }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm">
                                        <Clock size={16} color={C.btnPrimary} />
                                    </div>
                                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                        Recent Attempts
                                    </h2>
                                </div>
                                <Link href="/student/history" className="text-decoration-none">
                                    <button className="flex items-center gap-1 h-8 px-3 rounded-lg border-none cursor-pointer transition-colors hover:bg-slate-200"
                                        style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, fontSize: '11px', fontWeight: T.weight.bold }}>
                                        View all <ChevronRight size={14} />
                                    </button>
                                </Link>
                            </div>
                            
                            <div className="flex flex-col p-3 gap-2">
                                {recentScores.map((attempt, i) => {
                                    const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                                    const passed = attempt.isPassed;
                                    return (
                                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl transition-colors hover:bg-white/40"
                                            style={{ backgroundColor: innerBox, border: `1px solid ${C.cardBorder}`, borderLeft: `4px solid ${passed ? C.success : C.danger}` }}>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: passed ? C.successBg : C.dangerBg }}>
                                                    {passed ? <CheckCircle size={18} color={C.success} /> : <XCircle size={18} color={C.danger} />}
                                                </div>
                                                <div>
                                                    <p className="truncate max-w-[250px] md:max-w-md" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                                        {attempt.examTitle || attempt.exam?.title || 'Exam'}
                                                    </p>
                                                    <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                                        {new Date(attempt.date || attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                                                <div className="text-right">
                                                    <p style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: passed ? C.success : C.danger, margin: '0 0 2px 0', lineHeight: 1 }}>
                                                        {pct}%
                                                    </p>
                                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                                        {attempt.score} / {attempt.totalMarks}
                                                    </p>
                                                </div>
                                                <Link href={`/student/exams/attempt/${attempt._id}`} className="text-decoration-none">
                                                    <button className="h-9 px-4 rounded-xl border-none cursor-pointer transition-opacity hover:opacity-80 shadow-sm"
                                                        style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, fontSize: '11px', fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}>
                                                        Report
                                                    </button>
                                                </Link>
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
                <div className="space-y-6">
                    {studyPlan ? (
                        <>
                            {/* Premium AI Plan Hero */}
                            <div className="rounded-3xl overflow-hidden relative shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 pointer-events-none" />
                                
                                <div className="relative p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                            <Brain className="w-6 h-6 text-amber-300" />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: '#ffffff', margin: '0 0 2px 0' }}>
                                                Your Personalized AI Study Plan
                                            </h2>
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                                                Crafted exclusively based on your past performance data.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Duration',    value: studyPlan.duration || '4 weeks',   icon: Calendar },
                                            { label: 'Daily Goal',  value: studyPlan.dailyGoal || '2 hours',  icon: Target },
                                            { label: 'Focus Areas', value: `${studyPlan.focusAreas?.length || 3} Topics`, icon: BookOpen },
                                            { label: 'Expected',    value: studyPlan.expectedImprovement || '+15%', icon: TrendingUp },
                                        ].map((s, i) => (
                                            <div key={i} className="rounded-2xl p-4 text-center border border-white/5 bg-white/5 backdrop-blur-sm">
                                                <s.icon className="w-5 h-5 mx-auto mb-2 text-amber-300 opacity-80" />
                                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>
                                                    {s.label}
                                                </p>
                                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: '#ffffff', margin: 0 }}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Plan Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* Focus Areas */}
                                <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.warningBg }}>
                                            <Target className="w-4 h-4" style={{ color: C.warning }} />
                                        </div>
                                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>Priority Focus Areas</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {(studyPlan.focusAreas || [
                                            { area: 'Mathematics',       priority: 'High',   reason: 'Improve problem-solving speed' },
                                            { area: 'Science Concepts',  priority: 'Medium', reason: 'Strengthen fundamentals' },
                                            { area: 'Logic & Reasoning', priority: 'High',   reason: 'Boost analytical skills' },
                                        ]).map((focus, i) => {
                                            const pCfg = {
                                                High:   { bg: C.dangerBg,  color: C.danger,  border: C.dangerBorder },
                                                Medium: { bg: C.warningBg, color: C.warning, border: C.warningBorder },
                                                Low:    { bg: C.successBg, color: C.success, border: C.successBorder },
                                            }[focus.priority] || { bg: innerBox, color: C.textMuted, border: C.cardBorder };
                                            
                                            return (
                                                <div key={i} className="rounded-2xl p-4 transition-transform hover:-translate-y-0.5 border"
                                                    style={{ borderColor: C.cardBorder, backgroundColor: innerBox, boxShadow: S.card }}>
                                                    <div className="flex items-center justify-between mb-2 gap-4">
                                                        <h4 className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{focus.area}</h4>
                                                        <span className="px-2.5 py-1 rounded-md shrink-0"
                                                            style={{ backgroundColor: pCfg.bg, color: pCfg.color, border: `1px solid ${pCfg.border}`, fontSize: '9px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            {focus.priority}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, lineHeight: 1.4 }}>
                                                        {focus.reason}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.successBg }}>
                                            <Award className="w-4 h-4" style={{ color: C.success }} />
                                        </div>
                                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>Actionable Steps</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {(studyPlan.recommendations || [
                                            'Complete 2 practice tests daily',
                                            'Review weak areas for 30 minutes',
                                            'Focus on time management during tests',
                                            'Take short breaks between study sessions',
                                        ]).map((action, i) => (
                                            <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border"
                                                style={{ backgroundColor: innerBox, borderColor: C.cardBorder }}>
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: C.successBg }}>
                                                    <CheckCircle className="w-3.5 h-3.5" style={{ color: C.success }} />
                                                </div>
                                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1.5 }}>{action}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </>
                    ) : (
                        /* Empty State */
                        <div className="rounded-[32px] overflow-hidden relative shadow-lg" style={{ backgroundColor: '#1E1B4B' }}>
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                            <div className="relative text-center py-24 px-6 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                    <Brain className="w-10 h-10 text-amber-300" />
                                </div>
                                <h3 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#fff', marginBottom: 12 }}>
                                    Generate Your AI Study Plan
                                </h3>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.6)', marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}>
                                    Our AI analyzes your test history to create a personalized, high-impact learning path specifically for your weak areas.
                                </p>
                                <button onClick={generateStudyPlan} disabled={generatingPlan}
                                    className="flex items-center gap-2 px-8 h-12 text-white rounded-xl transition-all disabled:opacity-60 shadow-xl cursor-pointer border-none"
                                    style={{ background: C.gradientBtn, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                    {generatingPlan ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Generating Your Plan...</>
                                    ) : (
                                        <><Sparkles className="w-5 h-5" /> Generate Magic Plan</>
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