'use client';

import { useState, useEffect } from 'react';
import {
    BrainCircuit, Sparkles, Bot, FileStack, HelpCircle,
    CheckSquare, ScanSearch, PenLine, Lightbulb, ArrowRight,
    TrendingUp, Zap, BarChart2, ChevronRight,
    MessageSquare, Wand2, Bell, MoreHorizontal,
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S } from '@/constants/tutorTokens';
import Link from 'next/link';
import FeatureGate from '@/components/FeatureGate';

// ─── Activity icon map (backend action → icon + color) ───────────────────────
const ACTION_ICON_MAP = {
    'question_generation': { Icon: CheckSquare, color: '#6366F1', bg: '#EEF2FF' },
    'generate_lesson_quiz': { Icon: CheckSquare, color: '#6366F1', bg: '#EEF2FF' },
    'tutor_chat': { Icon: HelpCircle, color: '#8B5CF6', bg: '#F5F3FF' },
    'tutor_chat_session': { Icon: MessageSquare, color: '#8B5CF6', bg: '#F5F3FF' },
    'summarize_lesson': { Icon: FileStack, color: '#10B981', bg: '#ECFDF5' },
    'revision_notes': { Icon: FileStack, color: '#10B981', bg: '#ECFDF5' },
    'analytics': { Icon: BarChart2, color: '#F59E0B', bg: '#FFFBEB' },
    'contextual_chat': { Icon: MessageSquare, color: '#EC4899', bg: '#FDF2F8' },
};
const DEFAULT_ICON = { Icon: Sparkles, color: '#6366F1', bg: '#EEF2FF' };

// ─── Quick tool cards ─────────────────────────────────────────────────────────
const QUICK_TOOLS = [
    { title: 'AI Assistant Chat', sub: 'Get Instant Help', icon: Bot, href: '/tutor/ai-buddy/assistant', gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)', btnLabel: 'Start Chat', btnColor: '#4F46E5', featureKey: 'aiAssistant' },
    { title: 'Lecture Summary', sub: 'Upload & Summarize', icon: FileStack, href: '/tutor/ai-buddy/lecture-summary', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', btnLabel: 'Upload', btnColor: '#7C3AED', featureKey: 'aiAssistant' },
    { title: 'Doubt Solver', sub: 'Ask Any Question', icon: HelpCircle, href: '/tutor/ai-buddy/doubt-solver', gradient: 'linear-gradient(135deg, #10B981, #059669)', btnLabel: 'Solve', btnColor: '#059669', featureKey: 'aiAssistant' },
    { title: 'Assignment Evaluator', sub: 'Auto-Grade Submissions', icon: CheckSquare, href: '/tutor/ai-buddy/assignment-eval', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', btnLabel: 'Evaluate', btnColor: '#D97706', featureKey: 'aiAssessment' },
];

const QUICK_AI_TOOLS = [
    { title: 'Assignment Evaluator', sub: 'Auto Evaluate Submissions', icon: CheckSquare, color: '#6366F1', href: '/tutor/ai-buddy/assignment-eval', featureKey: 'aiAssessment' },
    { title: 'Subjective Checker', sub: 'Check Answer Scripts', icon: PenLine, color: '#8B5CF6', href: '/tutor/ai-buddy/subjective-check', featureKey: 'aiAssessment' },
    { title: 'Plagiarism Check', sub: 'Scan Content', icon: ScanSearch, color: '#10B981', href: '/tutor/ai-buddy/plagiarism', featureKey: 'aiAssessment' },
    { title: 'Notes Simplifier', sub: 'Simplify Complex Notes', icon: Sparkles, color: '#F59E0B', href: '/tutor/ai-buddy/notes-simplifier', featureKey: 'aiAssistant' },
];

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ color = '#6366F1', up = true }) {
    const path = up
        ? 'M0,20 C10,18 20,12 30,10 C40,8 50,14 60,8 C70,3 80,6 90,2'
        : 'M0,5 C10,8 20,14 30,16 C40,18 50,12 60,16 C70,20 80,17 90,18';
    return (
        <svg width="90" height="24" viewBox="0 0 90 24" fill="none">
            <path d={path} stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
        </svg>
    );
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ pct = 0 }) {
    const r = 52, cx = 64, cy = 64;
    const circ = 2 * Math.PI * r;
    const dash = (Math.min(pct, 100) / 100) * circ;
    return (
        <svg width="128" height="128" viewBox="0 0 128 128">
            <defs>
                <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
            </defs>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDE9FE" strokeWidth="12" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#donutGrad)" strokeWidth="12"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`} />
            <text x={cx} y={cy - 6} textAnchor="middle"
                style={{ fontSize: 22, fontWeight: 900, fill: '#1E293B', fontFamily: 'inherit' }}>
                {pct}%
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle"
                style={{ fontSize: 10, fill: '#64748B', fontFamily: 'inherit' }}>
                AI Accuracy
            </text>
        </svg>
    );
}

// ─── Activity chart — receives chartData as prop ──────────────────────────────
function ActivityChart({ chartData }) {
    if (!chartData || chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-32"
                style={{ color: '#94A3B8', fontFamily: T.fontFamily, fontSize: T.size.xs }}>
                No activity data yet
            </div>
        );
    }

    const days = chartData.map(d => d.day);
    const aiChats = chartData.map(d => d.aiChats);
    const quizGen = chartData.map(d => d.quizGenerated);

    const W = 560, H = 160, PAD = 32;
    const maxVal = Math.max(...aiChats, ...quizGen, 1); // avoid division by zero
    const xStep = (W - PAD * 2) / Math.max(days.length - 1, 1);

    const toSvgPts = (vals) =>
        vals.map((v, i) => `${PAD + i * xStep},${H - PAD - (v / maxVal) * (H - PAD * 2)}`).join(' ');

    return (
        <div className="relative w-full overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
                <defs>
                    <linearGradient id="chatFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="quizFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.14" />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                    const y = H - PAD - t * (H - PAD * 2);
                    return <line key={t} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#F1F5F9" strokeWidth="1" />;
                })}
                <polygon fill="url(#chatFill)"
                    points={`${PAD},${H - PAD} ${toSvgPts(aiChats)} ${PAD + (days.length - 1) * xStep},${H - PAD}`} />
                <polygon fill="url(#quizFill)"
                    points={`${PAD},${H - PAD} ${toSvgPts(quizGen)} ${PAD + (days.length - 1) * xStep},${H - PAD}`} />
                <polyline points={toSvgPts(aiChats)} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={toSvgPts(quizGen)} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,3" />
                {aiChats.map((v, i) => (
                    <circle key={i} cx={PAD + i * xStep} cy={H - PAD - (v / maxVal) * (H - PAD * 2)}
                        r="4" fill="#6366F1" stroke="white" strokeWidth="2" />
                ))}
                {days.map((d, i) => (
                    <text key={d} x={PAD + i * xStep} y={H - 6} textAnchor="middle"
                        style={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'inherit' }}>{d}</text>
                ))}
            </svg>
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AiBuddyDashboardPage() {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/ai/tutor-dashboard-stats');
                if (res.data.success) {
                    setStats(res.data.stats);
                    setChartData(res.data.chartData || []);
                    setRecentActivities(res.data.recentActivities || []);
                }
            } catch {
                toast.error('Failed to load AI stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Accuracy % = (tasks completed / total sessions) * 100 — simple proxy
    const accuracyPct = stats
        ? Math.min(Math.round((stats.totalTasks / Math.max(stats.totalSessions, 1)) * 100), 99)
        : 0;

    return (
        <div className="p-5 space-y-5" style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg, minHeight: '100%' }}>

            {/* ── Page title ────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <BrainCircuit className="w-6 h-6" style={{ color: '#6366F1' }} />
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading }}>
                            AI Dashboard
                        </h1>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff' }}>
                            Premium
                        </span>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                        Your Personal AI Learning Assistant ✨
                    </p>
                </div>
            </div>

            {/* ── Quick tool cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {QUICK_TOOLS.map(tool => {
                    const Icon = tool.icon;
                    return (
                        <FeatureGate key={tool.title} featureName={tool.featureKey} mode="lock">
                    
                            <div
                                className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 h-full"
                                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = S.cardHover; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = S.card; }}
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: tool.gradient }}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 2 }}>
                                        {tool.title}
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>{tool.sub}</p>
                                </div>
                                <Link href={tool.href}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold w-fit mt-auto transition-all hover:opacity-90"
                                    style={{ backgroundColor: tool.btnColor }}>
                                    {tool.btnLabel} <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </FeatureGate>
                    );
                })}
            </div>

            {/* ── Insight stats ─────────────────────────────────────────── */}
            <div className="rounded-2xl p-5"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center justify-between mb-4">
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                        AI Insights Overview
                    </h2>
                    <button className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: C.innerBg }}>
                        <MoreHorizontal className="w-4 h-4" style={{ color: C.textMuted }} />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Students', value: stats?.totalStudents ?? '—', spark: '#6366F1', up: true },
                        { label: 'Courses', value: stats?.courseCount ?? '—', spark: '#10B981', up: true },
                        { label: 'Active AI Tools', value: `${stats?.activeToolsCount ?? 0}/20`, spark: '#6366F1', up: true, bar: (stats?.activeToolsCount ?? 0) / 20, barColor: '#6366F1' },
                        { label: 'Total AI Tasks', value: stats?.totalTasks ?? '—', spark: '#F59E0B', up: true },
                    ].map(stat => (
                        <div key={stat.label} className="p-3 rounded-2xl" style={{ backgroundColor: C.innerBg }}>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginBottom: 4 }}>{stat.label}</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: 1.1 }}>
                                {stat.value}
                            </p>
                            {stat.bar !== undefined && (
                                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E2E8F0' }}>
                                    <div className="h-full rounded-full" style={{ width: `${stat.bar * 100}%`, backgroundColor: stat.barColor }} />
                                </div>
                            )}
                            <div className="mt-2"><Sparkline color={stat.spark} up={stat.up} /></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Activity chart + AI Performance ───────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 rounded-2xl p-5"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>AI Activity</h2>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Last 7 Days</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6366F1' }} />
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>AI Chats</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: '#F59E0B' }} />
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Quiz Generated</span>
                            </div>
                        </div>
                    </div>
                    {/* ✅ chartData prop pass kar rahe hain */}
                    <ActivityChart chartData={chartData} />
                </div>

                <div className="rounded-2xl p-5"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>AI Performance</h2>
                        <button className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.innerBg }}>
                            <MoreHorizontal className="w-4 h-4" style={{ color: C.textMuted }} />
                        </button>
                    </div>
                    <div className="flex justify-center mb-4">
                        <DonutChart pct={accuracyPct} />
                    </div>
                    <div className="space-y-2.5">
                        {[
                            { label: 'Quizzes Created', value: stats?.quizzesCreated ?? 0, color: '#6366F1' },
                            { label: 'Doubts Solved', value: stats?.doubtsSolved ?? 0, color: '#F59E0B' },
                            { label: 'Notes Generated', value: stats?.summariesGenerated ?? 0, color: '#8B5CF6' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>{item.label}:</span>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.heading }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Quick AI Tools + Recent Activities ────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 rounded-2xl p-5"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4" style={{ color: '#6366F1' }} />
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Quick AI Tools</h2>
                        <ChevronRight className="w-4 h-4" style={{ color: C.textMuted }} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {QUICK_AI_TOOLS.map(tool => {
                            const Icon = tool.icon;
                            return (
                                <FeatureGate key={tool.title} featureName={tool.featureKey} mode="lock">
                                    <Link href={tool.href}
                                        className="flex items-center justify-between p-4 rounded-2xl border-2 transition-all hover:-translate-y-0.5"
                                        style={{ borderColor: `${tool.color}20`, backgroundColor: `${tool.color}06` }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${tool.color}50`; e.currentTarget.style.boxShadow = `0 4px 16px ${tool.color}18`; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = `${tool.color}20`; e.currentTarget.style.boxShadow = 'none'; }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${tool.color}15` }}>
                                                <Icon className="w-4 h-4" style={{ color: tool.color }} />
                                            </div>
                                            <div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>{tool.title}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>{tool.sub}</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: tool.color }}>
                                            <ArrowRight className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </Link>
                                </FeatureGate>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activities — real data from backend */}
                <div className="rounded-2xl p-5"
                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Recent AI Activities</h2>
                        <button className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.innerBg }}>
                            <MoreHorizontal className="w-4 h-4" style={{ color: C.textMuted }} />
                        </button>
                    </div>
                    {recentActivities.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, textAlign: 'center', padding: '24px 0' }}>
                            No recent activity
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentActivities.map((act, idx) => {
                                // ✅ Icon from map, not from backend
                                const { Icon, color, bg } = ACTION_ICON_MAP[act.action] || DEFAULT_ICON;
                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: bg }}>
                                            <Icon className="w-4 h-4" style={{ color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>
                                                {act.title}
                                            </p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>{act.sub}</p>
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {act.timeAgo}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Chat banner ───────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4C1D95 100%)', minHeight: 100 }}>
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute rounded-full opacity-40"
                        style={{ width: 2, height: 2, left: `${8 * i + 2}%`, top: `${20 + (i % 3) * 30}%`, backgroundColor: '#fff' }} />
                ))}
                <div className="relative flex items-center justify-between p-5 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                            <BrainCircuit className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#ffffff', marginBottom: 4 }}>
                                AI Assistant Chat
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.70)' }}>
                                Hello! 👋 How can I help you today?
                            </p>
                        </div>
                    </div>
                    <Link href="/tutor/ai-buddy/assistant"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold flex-shrink-0 transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
                        <MessageSquare className="w-4 h-4" /> Start Chat
                    </Link>
                </div>
            </div>
        </div>
    );
}