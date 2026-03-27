'use client';

import { useState, useEffect, useRef } from 'react';
import {
    UserMinus, AlertTriangle, Shield, TrendingDown,
    Users, BarChart2, ChevronRight, MoreHorizontal,
    RefreshCw, Bell, BookOpen, Target, Loader2,
    CheckCircle2, Clock, XCircle, Lightbulb,
    TrendingUp, Eye, PieChart, Activity
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S } from '@/constants/tutorTokens';

// ─── Purple palette ───────────────────────────────────────────────────────────
const P = {
    primary: '#7C3AED',
    soft: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg: '#F5F3FF',
};

// ─── Risk colors ──────────────────────────────────────────────────────────────
const RISK = {
    High: { color: '#F43F5E', bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.20)', gradient: 'linear-gradient(135deg,#F43F5E,#FB7185)' },
    Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.20)', gradient: 'linear-gradient(135deg,#F59E0B,#FCD34D)' },
    Low: { color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.20)', gradient: 'linear-gradient(135deg,#10B981,#34D399)' },
};

// ─── Cause colors ─────────────────────────────────────────────────────────────
const CAUSE_COLORS = ['#F43F5E', '#F59E0B', '#10B981', '#8B5CF6', '#3B82F6'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ h = 4, w = 'full', r = 'xl' }) {
    return <div className={`h-${h} w-${w} rounded-${r} animate-pulse`} style={{ backgroundColor: P.soft }} />;
}

// ─── Donut chart (SVG) ────────────────────────────────────────────────────────
function DonutChart({ segments, size = 120, strokeWidth = 18, centerLabel, centerSub }) {
    const r = (size - strokeWidth * 2) / 2;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const arcs = segments.map(seg => {
        const dash = (seg.pct / 100) * circ;
        const gap = circ - dash;
        const rotate = (offset / 100) * 360 - 90;
        offset += seg.pct;
        return { ...seg, dash, gap, rotate };
    });

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(0deg)' }}>
                {arcs.map((arc, i) => (
                    <circle key={i}
                        cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke={arc.color} strokeWidth={strokeWidth}
                        strokeLinecap="butt"
                        strokeDasharray={`${arc.dash} ${arc.gap}`}
                        style={{ transformOrigin: '50% 50%', transform: `rotate(${arc.rotate}deg)` }} />
                ))}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                {centerLabel && <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', lineHeight: 1 }}>{centerLabel}</p>}
                {centerSub && <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', textAlign: 'center', marginTop: 2 }}>{centerSub}</p>}
            </div>
        </div>
    );
}

// ─── Mini line chart (SVG) ────────────────────────────────────────────────────
function TrendChart({ data, width = 340, height = 90 }) {
    if (!data || data.length === 0) return null;
    const keys = ['total', 'high', 'medium'];
    const colors = ['#8B5CF6', '#F43F5E', '#F59E0B'];
    const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0))) || 1;
    const pad = 10;
    const w = width - pad * 2;
    const h = height - pad * 2;

    const toX = i => pad + (i / (data.length - 1)) * w;
    const toY = v => pad + h - (v / maxVal) * h;

    return (
        <svg width={width} height={height}>
            {keys.map((key, ki) => {
                const pts = data.map((d, i) => `${toX(i)},${toY(d[key] || 0)}`).join(' ');
                return (
                    <g key={key}>
                        <polyline points={pts} fill="none" stroke={colors[ki]} strokeWidth={2} strokeLinejoin="round" opacity={0.85} />
                        {data.map((d, i) => (
                            <circle key={i} cx={toX(i)} cy={toY(d[key] || 0)} r={3} fill={colors[ki]} />
                        ))}
                    </g>
                );
            })}
            {data.map((d, i) => (
                <text key={i} x={toX(i)} y={height - 1} textAnchor="middle"
                    style={{ fontFamily: T.fontFamily, fontSize: '9px', fill: '#94A3B8' }}>
                    {d.week}
                </text>
            ))}
        </svg>
    );
}

// ─── Student row ──────────────────────────────────────────────────────────────
function StudentRow({ student, onSelect, isActive }) {
    const risk = RISK[student.riskLevel] || RISK.Low;
    return (
        <div onClick={() => onSelect(student)}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
            style={{ backgroundColor: isActive ? P.soft : '#fff', border: isActive ? `1.5px solid ${P.primary}` : `1px solid ${P.border}` }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.04)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = isActive ? P.soft : '#fff'; }}>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                style={{ background: risk.gradient }}>
                {student.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                    {student.name}
                </p>
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                    {student.causes?.[0] || 'No issues'} · {student.avgProgress}% progress
                </p>
            </div>
            <span className="px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: risk.bg, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: risk.color }}>
                {student.riskLevel}
            </span>
        </div>
    );
}

// ─── Alert card ───────────────────────────────────────────────────────────────
function AlertCard({ alert }) {
    const risk = RISK[alert.riskLevel] || RISK.Low;
    const Icon = alert.riskLevel === 'High' ? AlertTriangle : Bell;
    return (
        <div className="p-3 rounded-xl" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
            <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: risk.bg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: risk.color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B', lineHeight: 1.4 }}>
                        <strong>{alert.name}</strong> {alert.detail}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: risk.bg, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: risk.color }}>
                            {alert.riskLevel} Risk
                        </span>
                        {alert.mainCause && (
                            <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8' }}>{alert.mainCause}</span>
                        )}
                        <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#CBD5E1', marginLeft: 'auto' }}>{alert.timeAgo}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DropoutRiskPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetail, setStudentDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [filterRisk, setFilterRisk] = useState('All');

    // ── Load data ──────────────────────────────────────────────────
    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ai/dropout-risk');
            if (res.data?.success) setData(res.data);
            else toast.error(res.data?.message || 'Failed to load data');
        } catch { toast.error('Failed to load dropout risk data'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    // ── Load student detail ────────────────────────────────────────
    const selectStudent = async (student) => {
        if (selectedStudent?._id === student._id) return;
        setSelectedStudent(student);
        setStudentDetail(null);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/ai/dropout-risk/student/${student._id}`);
            if (res.data?.success) setStudentDetail(res.data);
        } catch { /* silent — basic info still shows */ }
        finally { setLoadingDetail(false); }
    };

    // ── Filtered students ──────────────────────────────────────────
    const filtered = (data?.students || []).filter(s =>
        filterRisk === 'All' || s.riskLevel === filterRisk
    );

    const ov = data?.overview || {};

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4 overflow-hidden" style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── MAIN AREA (left + center) ─────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto custom-scrollbar">

                {/* Page header */}
                <div className="flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: P.gradient, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
                            <UserMinus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: '#3B0764' }}>
                                Dropout Risk Overview
                            </h1>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#7C3AED' }}>
                                AI-powered early warning system for at-risk students
                            </p>
                        </div>
                    </div>
                    <button onClick={loadData} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>

                {/* ── Overview cards ─────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3 flex-shrink-0">
                    {loading ? [...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                            <Sk h={8} /><div className="mt-2"><Sk h={4} w="1/2" /></div>
                        </div>
                    )) : [
                        { level: 'High', count: ov.high || 0, pct: ov.highPct || 0 },
                        { level: 'Medium', count: ov.medium || 0, pct: ov.mediumPct || 0 },
                        { level: 'Low', count: ov.low || 0, pct: ov.lowPct || 0 },
                    ].map(item => {
                        const risk = RISK[item.level];
                        return (
                            <div key={item.level}
                                onClick={() => setFilterRisk(filterRisk === item.level ? 'All' : item.level)}
                                className="rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                                style={{ background: `linear-gradient(135deg,${risk.bg},${risk.bg})`, border: `1.5px solid ${risk.border}`, boxShadow: filterRisk === item.level ? `0 4px 20px ${risk.color}30` : S.card }}>
                                <div className="flex items-baseline gap-3">
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '36px', fontWeight: T.weight.black, color: risk.color, lineHeight: 1 }}>{item.count}</span>
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: risk.color }}>{item.level} Risk</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: risk.color, opacity: 0.7 }}>{item.pct}% of students</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Charts row ─────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                    {/* At-Risk Trend */}
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>At-Risk Trend</p>
                        {loading ? <Sk h={20} /> : (
                            <>
                                <TrendChart data={data?.trend || []} width={280} height={90} />
                                <div className="flex items-center gap-4 mt-2">
                                    {[
                                        { label: 'Total', color: '#8B5CF6' },
                                        { label: 'High Risk', color: '#F43F5E' },
                                        { label: 'Medium Risk', color: '#F59E0B' },
                                    ].map(l => (
                                        <div key={l.label} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{l.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Dropout Causes Donut */}
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>Dropout Causes Breakdown</p>
                        {loading ? <Sk h={20} /> : (
                            <div className="flex items-center gap-4">
                                <DonutChart
                                    size={110}
                                    strokeWidth={16}
                                    centerLabel="Dropout"
                                    centerSub="Causes"
                                    segments={(data?.causesBreakdown || []).map((c, i) => ({
                                        pct: c.pct,
                                        color: CAUSE_COLORS[i % CAUSE_COLORS.length],
                                    }))}
                                />
                                <div className="space-y-1.5 flex-1">
                                    {(data?.causesBreakdown || []).map((c, i) => (
                                        <div key={c.cause} className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CAUSE_COLORS[i % CAUSE_COLORS.length] }} />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569' }}>{c.cause}</span>
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>{c.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Student Risk Breakdown + Causes ────────────────────── */}
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                    {/* Risk Breakdown */}
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>Student Risk Breakdown</p>
                        <div className="grid grid-cols-2 gap-3">
                            {/* AT-RISK BREAKDOWN */}
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>AT-RISK BREAKDOWN</p>
                                {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Sk key={i} h={8} />)}</div> : (
                                    <div className="space-y-2">
                                        {['High', 'Medium', 'Low'].map(level => {
                                            const risk = RISK[level];
                                            const pct = level === 'High' ? ov.highPct : level === 'Medium' ? ov.mediumPct : ov.lowPct;
                                            return (
                                                <div key={level} className="flex items-center gap-2">
                                                    <span className="px-2 py-1 rounded-lg flex-shrink-0"
                                                        style={{ backgroundColor: risk.bg, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: risk.color, minWidth: 80, textAlign: 'center' }}>
                                                        {level} Risk
                                                    </span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: risk.color }}>{pct || 0}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {/* Demographic donut */}
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>RISK DISTRIBUTION</p>
                                {loading ? <Sk h={20} r="full" w="20" /> : (
                                    <DonutChart
                                        size={90}
                                        strokeWidth={14}
                                        segments={[
                                            { pct: ov.highPct || 0, color: '#F43F5E' },
                                            { pct: ov.mediumPct || 0, color: '#F59E0B' },
                                            { pct: ov.lowPct || 0, color: '#10B981' },
                                        ]}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dropout Causes list */}
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>Dropout Causes Breakdown</p>
                        {loading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <Sk key={i} h={8} />)}</div> : (
                            <div className="space-y-2.5">
                                {(data?.causesBreakdown || []).map((c, i) => {
                                    const icons = [TrendingDown, Users, BookOpen, Activity, Target];
                                    const Icon = icons[i % icons.length];
                                    return (
                                        <div key={c.cause} className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${CAUSE_COLORS[i]}15` }}>
                                                <Icon className="w-3.5 h-3.5" style={{ color: CAUSE_COLORS[i] }} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155' }}>{c.cause}</span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: CAUSE_COLORS[i] }}>{c.pct}%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: `${CAUSE_COLORS[i]}15` }}>
                                                    <div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, backgroundColor: CAUSE_COLORS[i] }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Preventative Action Plans ───────────────────────────── */}
                <div className="rounded-2xl p-4 flex-shrink-0" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Preventative Action Plans</p>
                        <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>
                            AT AT-RISK STUDENTS <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    {loading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <Sk key={i} h={10} />)}</div> : (
                        <div className="grid grid-cols-2 gap-2">
                            {(data?.actionPlans || []).map((plan, i) => {
                                const colors = ['#F43F5E', '#F59E0B', '#8B5CF6', '#10B981'];
                                const icons = [Bell, BookOpen, Target, Users];
                                const Icon = icons[i % icons.length];
                                return (
                                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                                        style={{ backgroundColor: `${colors[i]}08`, border: `1px solid ${colors[i]}20` }}>
                                        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors[i] }} />
                                        <div className="flex-1 min-w-0">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155', lineHeight: 1.4 }}>
                                                {plan.action}
                                            </p>
                                            {plan.count > 0 && (
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginTop: 2 }}>{plan.count} students</p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#CBD5E1' }} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── At-Risk Students list ───────────────────────────────── */}
                <div className="rounded-2xl p-4 flex-shrink-0" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>
                            At-Risk Students
                            {filterRisk !== 'All' && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs"
                                    style={{ backgroundColor: RISK[filterRisk]?.bg, color: RISK[filterRisk]?.color, fontWeight: T.weight.bold }}>
                                    {filterRisk} Risk
                                </span>
                            )}
                        </p>
                        <div className="flex items-center gap-1.5">
                            {['All', 'High', 'Medium', 'Low'].map(f => (
                                <button key={f} onClick={() => setFilterRisk(f)}
                                    className="px-2.5 py-1 rounded-lg transition-all"
                                    style={{
                                        fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold,
                                        backgroundColor: filterRisk === f ? (f === 'All' ? P.primary : RISK[f]?.color) : P.soft,
                                        color: filterRisk === f ? '#fff' : '#94A3B8',
                                    }}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    {loading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <Sk key={i} h={16} />)}</div> : (
                        <div className="grid grid-cols-2 gap-2">
                            {filtered.slice(0, 8).map(student => (
                                <StudentRow key={student._id} student={student}
                                    isActive={selectedStudent?._id === student._id}
                                    onSelect={selectStudent} />
                            ))}
                            {filtered.length === 0 && (
                                <div className="col-span-2 text-center py-6">
                                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2" style={{ color: '#10B981' }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#94A3B8' }}>No {filterRisk !== 'All' ? filterRisk : ''} risk students!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[260px] flex-shrink-0 overflow-y-auto custom-scrollbar">

                {/* Latest At-Risk Alerts */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>
                            LATEST AT-RISK ALERTS
                        </p>
                        <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    </div>
                    {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Sk key={i} h={16} />)}</div>
                        : (data?.alerts || []).length === 0 ? (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1', textAlign: 'center', padding: '12px 0' }}>No alerts</p>
                        ) : (
                            <div className="space-y-2">
                                {(data?.alerts || []).map((alert, i) => (
                                    <AlertCard key={i} alert={alert} />
                                ))}
                            </div>
                        )}

                    {/* AI Prediction accuracy badge */}
                    {!loading && (
                        <div className="mt-3 p-2.5 rounded-xl flex items-center gap-2"
                            style={{ background: P.gradient }}>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.20)' }}>
                                <Target className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>Dropout Prediction</p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff' }}>Accuracy 92%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Selected student detail */}
                {selectedStudent && (
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            STUDENT DETAIL
                        </p>
                        {/* Student header */}
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black"
                                style={{ background: RISK[selectedStudent.riskLevel]?.gradient || P.gradient }}>
                                {selectedStudent.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>{selectedStudent.name}</p>
                                <span className="px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: RISK[selectedStudent.riskLevel]?.bg, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: RISK[selectedStudent.riskLevel]?.color }}>
                                    {selectedStudent.riskLevel} Risk · {selectedStudent.riskScore}pts
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                            {[
                                { label: 'Avg Progress', value: `${selectedStudent.avgProgress}%`, color: '#3B82F6' },
                                { label: 'Quiz Score', value: `${selectedStudent.avgQuizScore}%`, color: '#8B5CF6' },
                                { label: 'Failed Quizzes', value: selectedStudent.failedQuizzes, color: '#F43F5E' },
                                { label: 'Avg Grade', value: `${selectedStudent.avgGrade}%`, color: '#10B981' },
                            ].map(st => (
                                <div key={st.label} className="p-2 rounded-xl" style={{ backgroundColor: P.soft }}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: st.color }}>{st.value}</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{st.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* AI Recommendation */}
                        {loadingDetail ? (
                            <div className="space-y-1.5"><Sk h={3} /><Sk h={3} /><Sk h={3} w="3/4" /></div>
                        ) : studentDetail?.recommendation ? (
                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <Lightbulb className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#D97706' }}>AI Recommendation</p>
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#92400E', lineHeight: 1.55 }}>
                                    {studentDetail.recommendation}
                                </p>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* All At-Risk summary */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>
                            All At-Risk Students
                        </p>
                        <ChevronRight className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    </div>
                    {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <Sk key={i} h={12} />)}</div> : (
                        <div className="space-y-2">
                            {(data?.students || []).filter(s => s.riskLevel !== 'Low').slice(0, 4).map(student => {
                                const risk = RISK[student.riskLevel];
                                return (
                                    <div key={student._id}
                                        onClick={() => selectStudent(student)}
                                        className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl hover:opacity-80 transition-all"
                                        style={{ backgroundColor: P.soft }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                                            style={{ background: risk.gradient }}>
                                            {student.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>{student.name}</p>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                                                {student.causes?.[0] || 'At Risk'}
                                            </p>
                                        </div>
                                        <span className="px-1.5 py-0.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: risk.bg, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: risk.color }}>
                                            {student.riskLevel}
                                        </span>
                                    </div>
                                );
                            })}
                            {(data?.students || []).filter(s => s.riskLevel !== 'Low').length === 0 && (
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1', textAlign: 'center', padding: '8px 0' }}>
                                    No at-risk students 🎉
                                </p>
                            )}
                        </div>
                    )}
                    <button onClick={() => setFilterRisk('High')}
                        className="w-full mt-3 py-2 rounded-xl flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                        <Eye className="w-3.5 h-3.5" /> All At Risk Students
                    </button>
                </div>
            </div>
        </div>
    );
}