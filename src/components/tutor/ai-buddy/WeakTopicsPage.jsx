'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Lightbulb, Users, BarChart2, TrendingDown, AlertTriangle,
    ChevronDown, RefreshCw, Sparkles, Download, Share2,
    Calendar, MoreHorizontal, ArrowUp, ArrowDown
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar, Cell
} from 'recharts';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';
import { useRouter } from 'next/navigation';


// ─── Purple palette (matches screenshot) ─────────────────────────────────────
const P = {
    primary:  '#7C3AED',
    light:    '#8B5CF6',
    soft:     'rgba(124,58,237,0.08)',
    border:   'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg:   '#F5F3FF',
    orange:   '#F97316',
    green:    '#10B981',
    red:      '#EF4444',
    yellow:   '#F59E0B',
    blue:     '#3B82F6',
};

const SEV_COLOR = { critical: P.red, warning: P.yellow, moderate: P.green };
const PRIORITY_COLOR = { High: P.red, Medium: P.yellow, Low: P.green };
const TOPIC_COLORS = ['#EF4444', '#F97316', '#8B5CF6', '#3B82F6', '#10B981'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 10, w = 'full', extra = '' }) {
    return (
        <div className={`animate-pulse rounded-xl ${extra}`}
            style={{ height: h, width: w === 'full' ? '100%' : w, backgroundColor: 'rgba(124,58,237,0.08)' }} />
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 36 }) {
    const initials = (name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return src ? (
        <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0"
            style={{ width: size, height: size }} />
    ) : (
        <div className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{ width: size, height: size, background: P.gradient }}>
            <span style={{ fontFamily: T.fontFamily, fontSize: size * 0.33, fontWeight: T.weight.black, color: '#fff' }}>{initials}</span>
        </div>
    );
}

// ─── Heatmap bar ─────────────────────────────────────────────────────────────
function HeatmapBar({ data }) {
    const segments = [
        { label: 'Struggling', pct: data.struggling, color: '#EF4444' },
        { label: 'At Risk',    pct: data.atRisk,     color: '#F97316' },
        { label: 'Caution',    pct: data.caution,    color: '#F59E0B' },
        { label: 'On Track',   pct: data.onTrack,    color: '#10B981' },
    ];
    return (
        <div>
            {/* Bar */}
            <div className="flex rounded-full overflow-hidden" style={{ height: 18 }}>
                {segments.map(s => (
                    <div key={s.label} style={{ width: `${s.pct || 0}%`, backgroundColor: s.color, minWidth: s.pct > 0 ? 4 : 0 }} />
                ))}
            </div>
            {/* Labels */}
            <div className="flex justify-between mt-2">
                {segments.map(s => (
                    <div key={s.label} className="text-center">
                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: s.color }}>{s.pct ?? 0}%</p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8', marginTop: 1 }}>{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Progress Snapshot bar ────────────────────────────────────────────────────
function ProgressSnapshot({ data }) {
    const segments = [
        { label: 'Struggling', pct: data.struggling, color: '#EF4444' },
        { label: 'At Risk',    pct: data.atRisk,     color: '#F97316' },
        { label: 'Caution',    pct: data.caution,    color: '#F59E0B' },
        { label: 'On Track',   pct: data.onTrack,    color: '#10B981' },
    ];
    return (
        <div>
            <div className="flex rounded-lg overflow-hidden" style={{ height: 10 }}>
                {segments.map(s => (
                    <div key={s.label} style={{ width: `${s.pct || 0}%`, backgroundColor: s.color }} />
                ))}
            </div>
            <div className="flex justify-between mt-1.5">
                {segments.map(s => (
                    <p key={s.label} style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8' }}>{s.label}</p>
                ))}
            </div>
        </div>
    );
}

// ─── Avg Score bar in table ───────────────────────────────────────────────────
function ScoreBar({ score }) {
    const color = score < 60 ? P.red : score < 75 ? P.yellow : P.green;
    return (
        <div className="flex items-center gap-2" style={{ minWidth: 100 }}>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, backgroundColor: color + '20' }}>
                <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
            </div>
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color, minWidth: 32 }}>{score}%</span>
        </div>
    );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="px-3 py-2 rounded-xl" style={{ backgroundColor: '#1E1B4B', border: '1px solid rgba(139,92,246,0.3)' }}>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#8B5CF6' }}>
                    {p.value != null ? `${Math.round(p.value)}%` : 'No data'}
                </p>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WeakTopicsPage() {
    const [loading, setLoading]           = useState(true);
    const [data, setData]                 = useState(null);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [activeTab, setActiveTab]       = useState('Overall');
    const [generating, setGenerating]     = useState(false);

    const router = useRouter();

    const fetchData = useCallback(async (cId = '') => {
        setLoading(true);
        try {
            const params = cId ? `?courseId=${cId}` : '';
            const res = await api.get(`/ai/weak-topics${params}`);
            if (res.data?.success) {
                setData(res.data);
                // Set first tab
                const tabs = ['Overall', ...(res.data.weakTopics || []).slice(0, 3).map(t => t.lessonTitle)];
                setActiveTab(tabs[0]);
            }
        } catch {
            toast.error('Failed to load weak topics analysis');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCourseChange = (cId) => {
        setSelectedCourse(cId);
        fetchData(cId);
    };

    const handleGenerateStudyPlans = () => {
        toast.success('Navigating to Study Plan generator…');
        router.push('/tutor/ai-buddy/study-plan')

    };

    // Tabs: Overall + top 3 weak topics
    const tabs = ['Overall', ...(data?.weakTopics || []).slice(0, 3).map(t => t.lessonTitle)];

    // Trend chart: show decline if avg dropping
    const trendData = data?.trendData || [];
    const hasDecline = trendData.length >= 2 &&
        trendData[trendData.length - 1]?.avgScore < trendData[0]?.avgScore;
    const declinePct = trendData.length >= 2 && trendData[0]?.avgScore && trendData[trendData.length - 1]?.avgScore
        ? Math.abs(trendData[trendData.length - 1].avgScore - trendData[0].avgScore)
        : null;

    // Top 4 weak topics for legend
    const top4 = (data?.weakTopics || []).slice(0, 4);

    const stats = data?.overallStats;
    const heatmap = data?.heatmap || { struggling: 0, atRisk: 0, caution: 0, onTrack: 0 };

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar" style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg, padding: 16 }}>

            {/* ── TOP STATS BAR ─────────────────────────────────────────── */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
                {/* At-Risk Students */}
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl flex-1 min-w-[180px]"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(249,115,22,0.12)' }}>
                        <Users className="w-5 h-5" style={{ color: P.orange }} />
                    </div>
                    <div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', fontWeight: T.weight.semibold }}>At-Risk Students</p>
                        {loading ? <Skel h={22} w={60} extra="mt-1" /> : (
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#1E293B' }}>
                                    {stats?.atRiskCount ?? 0}
                                </span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>students</span>
                                {stats?.totalStudents > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: 'rgba(249,115,22,0.10)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.orange }}>
                                        {Math.round((stats.atRiskCount / stats.totalStudents) * 100)}% of class
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Average Score */}
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl flex-1 min-w-[180px]"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: P.soft }}>
                        <BarChart2 className="w-5 h-5" style={{ color: P.primary }} />
                    </div>
                    <div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', fontWeight: T.weight.semibold }}>Average Score</p>
                        {loading ? <Skel h={22} w={80} extra="mt-1" /> : (
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#1E293B' }}>
                                    {stats?.avgScore ?? 0}%
                                </span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Class Avg.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detected Weak Topics */}
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl flex-1 min-w-[180px]"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(239,68,68,0.10)' }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: P.red }} />
                    </div>
                    <div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', fontWeight: T.weight.semibold }}>Detected Weak Topics</p>
                        {loading ? <Skel h={22} w={60} extra="mt-1" /> : (
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#1E293B' }}>
                                    {stats?.weakTopicCount ?? 0}
                                </span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>concepts</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Course filter */}
                <div className="relative flex-shrink-0">
                    <select value={selectedCourse} onChange={e => handleCourseChange(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2.5 rounded-xl outline-none"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: '#fff', boxShadow: S.card }}>
                        <option value="">All Courses</option>
                        {(data?.courseList || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                </div>

                {/* Generate Study Plans CTA */}
                <button onClick={handleGenerateStudyPlans} disabled={generating}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl transition-all hover:opacity-90 flex-shrink-0"
                    style={{ background: P.gradient, boxShadow: `0 4px 14px rgba(124,58,237,0.35)` }}>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff' }}>
                        Generate Study Plans
                    </span>
                </button>
            </div>

            {/* ── MAIN GRID ─────────────────────────────────────────────── */}
            <div className="flex gap-4">

                {/* ── LEFT (chart + table) ──────────────────────────────── */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">

                    {/* Chart card */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>

                        {/* Card header */}
                        <div className="flex items-center gap-3 px-5 py-3.5"
                            style={{ background: `linear-gradient(135deg, rgba(91,33,182,0.06), rgba(139,92,246,0.04))`, borderBottom: `1px solid ${P.border}` }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: P.gradient }}>
                                <TrendingDown className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>
                                    WEAK TOPIC ANALYSIS <span style={{ color: P.light, fontWeight: T.weight.medium }}>FOR YOUR COURSES</span>
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full"
                                style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>
                                Past 2 months
                            </span>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 px-5 pt-3 pb-0">
                            {loading ? (
                                <div className="flex gap-2"><Skel h={7} w={60} /><Skel h={7} w={80} /><Skel h={7} w={70} /></div>
                            ) : (
                                tabs.map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className="px-3 py-1.5 rounded-lg transition-all"
                                        style={{
                                            fontFamily:      T.fontFamily,
                                            fontSize:        T.size.xs,
                                            fontWeight:      activeTab === tab ? T.weight.bold : T.weight.medium,
                                            color:           activeTab === tab ? '#fff' : '#64748B',
                                            backgroundColor: activeTab === tab ? P.primary : 'transparent',
                                        }}>
                                        {tab.length > 16 ? tab.slice(0, 16) + '…' : tab}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Chart */}
                        <div className="px-5 pt-3 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Weak Topic Analysis</p>
                                <div className="flex items-center gap-2">
                                    {hasDecline && declinePct != null && (
                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                                            style={{ backgroundColor: 'rgba(249,115,22,0.10)' }}>
                                            <ArrowDown className="w-3 h-3" style={{ color: P.orange }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: P.orange }}>
                                                {declinePct}% Decline
                                            </span>
                                        </span>
                                    )}
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>Past 2 Months ▾</span>
                                </div>
                            </div>

                            {loading ? (
                                <Skel h={140} />
                            ) : trendData.length === 0 ? (
                                <div className="flex items-center justify-center rounded-xl"
                                    style={{ height: 140, backgroundColor: P.soft }}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                        No quiz attempts yet — chart will appear once students take quizzes
                                    </p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={150}>
                                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="weakGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor={P.primary} stopOpacity={0.20} />
                                                <stop offset="95%" stopColor={P.primary} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.08)" />
                                        <XAxis dataKey="month" tick={{ fontFamily: T.fontFamily, fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fontFamily: T.fontFamily, fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area type="monotone" dataKey="avgScore" stroke={P.primary} strokeWidth={2.5}
                                            fill="url(#weakGrad)" dot={{ fill: P.primary, r: 4, strokeWidth: 0 }}
                                            activeDot={{ r: 6, fill: P.primary }} connectNulls />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}

                            {/* Top 4 legend */}
                            {!loading && top4.length > 0 && (
                                <div className="mt-3">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 8 }}>Top {top4.length} Weak Topics</p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {top4.map((t, i) => (
                                            <div key={t.lessonId} className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: TOPIC_COLORS[i] }} />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: TOPIC_COLORS[i] }}>
                                                    {t.lessonTitle.length > 14 ? t.lessonTitle.slice(0, 14) + '…' : t.lessonTitle}
                                                </span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{t.avgScore}%</span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#CBD5E1' }}>⬩{t.studentsImpacted}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Topics Table */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${P.border}`, backgroundColor: 'rgba(124,58,237,0.04)' }}>
                                    {['Top Weak Topics', 'Difficulty Rank', 'Students Impacted', 'Avg. Score', 'Priority'].map(h => (
                                        <th key={h} className="text-left px-4 py-3"
                                            style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(4)].map((_, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            {[...Array(5)].map((__, j) => (
                                                <td key={j} className="px-4 py-3"><Skel h={8} /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (data?.weakTopics || []).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                            No weak topics detected yet 🎉
                                        </td>
                                    </tr>
                                ) : (
                                    (data?.weakTopics || []).map((topic, i) => (
                                        <tr key={topic.lessonId}
                                            className="transition-colors"
                                            style={{ borderBottom: `1px solid ${P.border}` }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = P.soft}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            {/* Topic name */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] + '20' }}>
                                                        <div className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#1E293B' }}>
                                                            {topic.lessonTitle}
                                                        </p>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{topic.courseTitle}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Difficulty rank */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#334155' }}>
                                                        {topic.difficultyRank}
                                                    </span>
                                                    <Users className="w-3.5 h-3.5" style={{ color: '#CBD5E1' }} />
                                                </div>
                                            </td>
                                            {/* Students impacted */}
                                            <td className="px-4 py-3">
                                                <ScoreBar score={Math.min(100, Math.round((topic.studentsImpacted / Math.max(data?.overallStats?.totalStudents || 1, 1)) * 100))} />
                                            </td>
                                            {/* Avg score */}
                                            <td className="px-4 py-3">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: topic.avgScore < 60 ? P.red : topic.avgScore < 75 ? P.yellow : P.green }}>
                                                    {topic.avgScore}%
                                                </span>
                                            </td>
                                            {/* Priority */}
                                            <td className="px-4 py-3">
                                                <span className="px-2.5 py-1 rounded-full"
                                                    style={{
                                                        backgroundColor: PRIORITY_COLOR[topic.priority] + '15',
                                                        fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black,
                                                        color: PRIORITY_COLOR[topic.priority],
                                                        border: `1px solid ${PRIORITY_COLOR[topic.priority]}30`,
                                                    }}>
                                                    {topic.priority}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* AI Recommendations bottom bar */}
                    <div className="rounded-2xl p-4"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: P.gradient }}>
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Recommendations Generated by AI</p>
                        </div>

                        {loading ? (
                            <div className="space-y-2"><Skel h={6} /><Skel h={6} /></div>
                        ) : !data?.aiRecommendations?.recommendations?.length ? (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                AI recommendations will appear once quiz data is available.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {data.aiRecommendations.recommendations.slice(0, 3).map((rec, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                            style={{ backgroundColor: TOPIC_COLORS[i] }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.5 }}>
                                            <strong style={{ color: '#334155' }}>{rec.topic}: </strong>
                                            {rec.action}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: `1px solid ${P.border}` }}>
                            {[
                                { icon: Download, label: 'Export Report',        color: '#64748B' },
                                { icon: Share2,   label: 'Share with Student',   color: '#64748B' },
                                { icon: Sparkles, label: 'Generate Study Plans', color: P.primary, gradient: true },
                                { icon: Calendar, label: 'Schedule Remedial Class', color: '#64748B' },
                            ].map(btn => {
                                const Icon = btn.icon;
                                return (
                                    <button key={btn.label}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                                        style={{
                                            background:      btn.gradient ? P.gradient : 'transparent',
                                            border:          btn.gradient ? 'none' : `1px solid ${P.border}`,
                                            backgroundColor: btn.gradient ? undefined : P.soft,
                                        }}>
                                        <Icon className="w-3.5 h-3.5" style={{ color: btn.gradient ? '#fff' : btn.color }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: btn.gradient ? '#fff' : btn.color }}>
                                            {btn.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL ───────────────────────────────────────── */}
                <div className="flex flex-col gap-4 flex-shrink-0" style={{ width: 280 }}>

                    {/* At-Risk Students List */}
                    <div className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <div className="flex items-center justify-between px-4 py-3.5"
                            style={{ borderBottom: `1px solid ${P.border}`, background: 'rgba(124,58,237,0.04)' }}>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>At-Risk Students List</p>
                            <button className="p-1 rounded-lg hover:opacity-70">
                                <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                            </button>
                        </div>

                        <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skel h={36} w={36} extra="rounded-full" />
                                        <div className="flex-1 space-y-1.5"><Skel h={8} /><Skel h={6} w={120} /></div>
                                    </div>
                                ))
                            ) : (data?.atRiskStudents || []).length === 0 ? (
                                <div className="py-6 text-center">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>No at-risk students detected 🎉</p>
                                </div>
                            ) : (
                                (data.atRiskStudents).map(student => (
                                    <div key={student.studentId} className="flex items-center gap-2.5">
                                        <Avatar src={student.avatar} name={student.name} size={36} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                                                    {student.name}
                                                </p>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: student.avgScore < 50 ? P.red : P.yellow, flexShrink: 0, marginLeft: 4 }}>
                                                    {student.avgScore}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span className="px-1.5 py-0.5 rounded-full"
                                                    style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: P.primary }}>
                                                    ⬩ {student.weakTopic.length > 14 ? student.weakTopic.slice(0, 14) + '…' : student.weakTopic}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded-full"
                                                    style={{ backgroundColor: 'rgba(249,115,22,0.10)', fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: P.orange }}>
                                                    ⏱ {student.hoursSpent}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Summary note */}
                        {!loading && (data?.atRiskStudents || []).length > 0 && data?.weakTopics?.[0] && (
                            <div className="px-4 pb-3">
                                <p className="px-3 py-2 rounded-xl"
                                    style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', backgroundColor: P.soft, lineHeight: 1.5 }}>
                                    {Math.round((data.atRiskStudents.length / Math.max(data.overallStats?.totalStudents || 1, 1)) * 100)}% of scored topics fall under <strong style={{ color: P.primary }}>{data.weakTopics[0].lessonTitle}</strong>, highlighting a key weakness.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* At-Risk Topics Heatmap */}
                    <div className="rounded-2xl p-4"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>
                            At-Risk Topics Heatmap
                        </p>
                        {loading ? <Skel h={40} /> : <HeatmapBar data={heatmap} />}
                    </div>

                    {/* Student Progress Snapshot */}
                    <div className="rounded-2xl p-4"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>
                            Student Progress Snapshot
                        </p>
                        {loading ? <Skel h={24} /> : <ProgressSnapshot data={heatmap} />}
                    </div>

                    {/* Groq badge */}
                    <div className="rounded-2xl p-4"
                        style={{ background: `linear-gradient(135deg,${P.soft},rgba(99,102,241,0.06))`, border: `1px solid ${P.border}` }}>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4" style={{ color: P.primary }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: P.primary }}>Powered by Groq AI</p>
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5 }}>
                            Real-time student performance analysis using <strong>llama-3.3-70b-versatile</strong>.
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: P.green }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.green, fontWeight: T.weight.semibold }}>Live · Auto-updating</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}