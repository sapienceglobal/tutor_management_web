'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle, Users, ChevronDown, MoreHorizontal,
    Sparkles, RefreshCw, Loader2, TrendingDown,
    BookOpen, Clock, Target, BarChart2, Bell,
    ChevronRight, Star, Shield, Brain, Zap,
    FileText, Share2, Calendar, ArrowUpRight,
    CheckSquare, Send, ClipboardList
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';
import { useRouter } from 'next/navigation';


// ─── Purple palette (matches screenshot) ─────────────────────────────────────
const P = {
    primary:   '#7C3AED',
    light:     '#8B5CF6',
    soft:      'rgba(124,58,237,0.08)',
    border:    'rgba(124,58,237,0.14)',
    gradient:  'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg:    '#F5F3FF',
    red:       '#EF4444',
    redSoft:   'rgba(239,68,68,0.10)',
    orange:    '#F97316',
    orangeSoft:'rgba(249,115,22,0.10)',
    green:     '#10B981',
    greenSoft: 'rgba(16,185,129,0.10)',
    yellow:    '#F59E0B',
};

const RISK_CFG = {
    high:   { label: 'HIGH RISK',   color: P.red,    bg: P.redSoft,    border: 'rgba(239,68,68,0.25)'    },
    medium: { label: 'MEDIUM RISK', color: P.orange, bg: P.orangeSoft, border: 'rgba(249,115,22,0.25)'   },
    low:    { label: 'LOW RISK',    color: P.green,  bg: P.greenSoft,  border: 'rgba(16,185,129,0.25)'   },
};

const ALERT_ICON_CFG = {
    high:   { color: P.red,    bg: P.redSoft    },
    medium: { color: P.orange, bg: P.orangeSoft },
    low:    { color: P.green,  bg: P.greenSoft  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 10, w = '100%', r = 10 }) {
    return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, backgroundColor: P.soft }} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 40 }) {
    const initials = (name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} />;
    return (
        <div style={{ width: size, height: size, borderRadius: 999, background: P.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.fontFamily, fontSize: size * 0.33, fontWeight: T.weight.black, color: '#fff' }}>{initials}</span>
        </div>
    );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
    const cfg = RISK_CFG[level] || RISK_CFG.low;
    return (
        <span className="px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: cfg.color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {cfg.label}
        </span>
    );
}

// ─── Heatmap bar ─────────────────────────────────────────────────────────────
function HeatmapBar({ data, showCounts = false }) {
    const segments = [
        { label: 'Struggling', pct: data.struggling ?? 0, count: data.strugglingCount ?? 0, color: P.red    },
        { label: 'At Risk',    pct: data.atRisk     ?? 0, count: data.atRiskCount     ?? 0, color: P.orange },
        { label: 'Caution',    pct: data.caution    ?? 0, count: data.cautionCount    ?? 0, color: P.yellow },
        { label: 'On Track',   pct: data.onTrack    ?? 0, count: data.onTrackCount    ?? 0, color: P.green  },
    ];
    return (
        <div>
            <div className="flex rounded-lg overflow-hidden" style={{ height: 22 }}>
                {segments.map(s => (
                    <div key={s.label} style={{ width: `${s.pct}%`, backgroundColor: s.color, minWidth: s.pct > 0 ? 4 : 0 }} />
                ))}
            </div>
            <div className="grid grid-cols-4 mt-2 gap-1">
                {segments.map(s => (
                    <div key={s.label} className="text-center">
                        <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, color: s.color }}>{s.pct}%</p>
                        {showCounts && <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8' }}>{s.count}</p>}
                        <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8', marginTop: 1 }}>{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Student Row ──────────────────────────────────────────────────────────────
function StudentRow({ student, rank, onInsight }) {
    return (
        <tr style={{ borderBottom: `1px solid ${P.border}` }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = P.soft}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>

            {/* Student */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <Avatar src={student.avatar} name={student.name} size={38} />
                    <div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B' }}>
                            {student.name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                            {student.riskLevel === 'high' ? (
                                <AlertTriangle className="w-3 h-3" style={{ color: P.red }} />
                            ) : (
                                <Clock className="w-3 h-3" style={{ color: P.orange }} />
                            )}
                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                                {student.course || 'Multiple Courses'}
                            </span>
                        </div>
                    </div>
                </div>
            </td>

            {/* Risk Score */}
            <td className="px-4 py-3">
                <RiskBadge level={student.riskLevel} />
            </td>

            {/* Dropout Risk */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: student.dropoutRisk >= 60 ? P.red : student.dropoutRisk >= 35 ? P.orange : '#64748B' }}>
                        {student.dropoutRisk}%
                    </span>
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>risk</span>
                </div>
                {/* Mini bar */}
                <div className="w-16 rounded-full overflow-hidden mt-1" style={{ height: 3, backgroundColor: P.soft }}>
                    <div style={{ width: `${student.dropoutRisk}%`, height: '100%', backgroundColor: student.dropoutRisk >= 60 ? P.red : student.dropoutRisk >= 35 ? P.orange : P.green, borderRadius: 999 }} />
                </div>
            </td>

            {/* Key Risk Factors */}
            <td className="px-4 py-3" style={{ maxWidth: 200 }}>
                <div className="space-y-0.5">
                    {student.keyFactors.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <span style={{ color: i === 0 ? P.red : '#94A3B8', fontSize: 10 }}>•</span>
                            <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>{f}</span>
                        </div>
                    ))}
                    {student.keyFactors.length === 0 && (
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#CBD5E1' }}>No major factors</span>
                    )}
                </div>
            </td>

            {/* Insights */}
            <td className="px-4 py-3">
                <button onClick={() => onInsight(student)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                    style={{ background: P.gradient, boxShadow: `0 2px 8px rgba(124,58,237,0.30)` }}>
                    <Sparkles className="w-3 h-3 text-white" />
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: '#fff' }}>Insights</span>
                </button>
            </td>
        </tr>
    );
}

// ─── Insight Modal ────────────────────────────────────────────────────────────
function InsightModal({ student, onClose }) {
    if (!student) return null;
     const router = useRouter();
    const cfg = RISK_CFG[student.riskLevel] || RISK_CFG.low;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md rounded-3xl overflow-hidden"
                style={{ backgroundColor: '#fff', boxShadow: '0 24px 64px rgba(124,58,237,0.25)' }}>
                {/* Header */}
                <div className="p-5" style={{ background: P.gradient }}>
                    <div className="flex items-center gap-3">
                        <Avatar src={student.avatar} name={student.name} size={48} />
                        <div className="flex-1">
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#fff' }}>{student.name}</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'rgba(255,255,255,0.75)' }}>{student.course || 'All Courses'}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.20)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: '#fff' }}>
                            {cfg.label}
                        </span>
                    </div>
                </div>
                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Risk Score',      value: `${student.riskScore}/100`,                                   color: cfg.color      },
                            { label: 'Dropout Risk',    value: `${student.dropoutRisk}%`,                                     color: P.orange       },
                            { label: 'Avg Quiz Score',  value: student.avgScore != null ? `${student.avgScore}%` : 'N/A',    color: P.primary      },
                            { label: 'Course Progress', value: `${student.avgProgress}%`,                                     color: P.green        },
                            { label: 'Pass Rate',       value: student.passRate != null  ? `${student.passRate}%`  : 'N/A',  color: '#6366F1'      },
                            { label: 'Submission Rate', value: `${student.submissionRate}%`,                                  color: P.yellow       },
                        ].map(item => (
                            <div key={item.label} className="p-3 rounded-xl"
                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{item.label}</p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: item.color, marginTop: 2 }}>{item.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Key factors */}
                    {student.keyFactors.length > 0 && (
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Key Risk Factors</p>
                            <div className="space-y-2">
                                {student.keyFactors.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                        style={{ backgroundColor: P.redSoft }}>
                                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: P.red }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569' }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Weak topics */}
                    {student.weakTopics.length > 0 && (
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Weak Topics</p>
                            <div className="flex flex-wrap gap-2">
                                {student.weakTopics.map(t => (
                                    <span key={t} className="px-2.5 py-1 rounded-full"
                                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: P.primary }}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button className="flex-1 py-2.5 rounded-xl transition-all hover:opacity-80"
                            style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff' }}
                            onClick={() => { router.push('/tutor/ai-buddy/study-plan')}}>
                            Generate Study Plan
                        </button>
                        <button className="flex-1 py-2.5 rounded-xl transition-all hover:opacity-80"
                            style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}
                            onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RiskPredictorPage() {
    const [loading, setLoading]             = useState(true);
    const [data, setData]                   = useState(null);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [sortBy, setSortBy]               = useState('riskScore');
    const [insightStudent, setInsightStudent] = useState(null);
    
      
    const fetchData = useCallback(async (cId = '') => {
        setLoading(true);
        try {
            const params = cId ? `?courseId=${cId}` : '';
            const res = await api.get(`/ai/risk-predictor${params}`);
            if (res.data?.success) setData(res.data);
        } catch {
            toast.error('Failed to load risk predictions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCourseChange = (cId) => {
        setSelectedCourse(cId);
        fetchData(cId);
    };

    // Sort students
    const sortedStudents = [...(data?.students || [])].sort((a, b) => {
        if (sortBy === 'riskScore')   return b.riskScore   - a.riskScore;
        if (sortBy === 'dropoutRisk') return b.dropoutRisk - a.dropoutRisk;
        if (sortBy === 'name')        return a.name.localeCompare(b.name);
        return 0;
    });

    const rs   = data?.riskSummary;
    const hm   = data?.heatmap || { struggling: 0, atRisk: 0, caution: 0, onTrack: 0 };
    const recs = data?.aiRecommendations || [];

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4 overflow-y-auto custom-scrollbar"
            style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── LEFT + CENTER ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Risk Overview header */}
                <div className="rounded-2xl p-5"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: P.gradient }}>
                                <Brain className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#1E293B' }}>
                                AI-Assessed Risk Overview
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Course filter */}
                            <div className="relative">
                                <select value={selectedCourse} onChange={e => handleCourseChange(e.target.value)}
                                    className="appearance-none pl-3 pr-7 py-1.5 rounded-xl outline-none"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                    <option value="">All Courses</option>
                                    {(data?.courseList || []).map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                            </div>
                            {/* Sort */}
                            <div className="relative">
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                    className="appearance-none pl-3 pr-7 py-1.5 rounded-xl outline-none"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                    <option value="riskScore">Sort: Risk Score</option>
                                    <option value="dropoutRisk">Sort: Dropout Risk</option>
                                    <option value="name">Sort: Name</option>
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                            </div>
                            <button onClick={() => fetchData(selectedCourse)} className="p-1.5 rounded-lg hover:opacity-70">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: P.primary }} />
                            </button>
                        </div>
                    </div>

                    {/* Risk summary cards */}
                    <div className="grid grid-cols-3 gap-4">
                        {loading ? (
                            [...Array(3)].map((_, i) => <Skel key={i} h={80} />)
                        ) : (
                            [
                                { label: 'High Risk:',   count: rs?.high   ?? 0, pct: rs?.highPct   ?? 0, color: P.red,    bg: P.redSoft,    gradient: 'linear-gradient(135deg,#DC2626,#EF4444)' },
                                { label: 'Medium Risk:', count: rs?.medium ?? 0, pct: rs?.mediumPct ?? 0, color: P.orange, bg: P.orangeSoft, gradient: 'linear-gradient(135deg,#EA580C,#F97316)' },
                                { label: 'Low Risk:',    count: rs?.low    ?? 0, pct: rs?.lowPct    ?? 0, color: P.green,  bg: P.greenSoft,  gradient: 'linear-gradient(135deg,#059669,#10B981)' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3 p-4 rounded-2xl"
                                    style={{ backgroundColor: item.bg, border: `1px solid ${item.color}25` }}>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '42px', fontWeight: T.weight.black, color: item.color, lineHeight: 1 }}>
                                        {item.count}
                                    </span>
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: item.color }}>{item.label}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: item.color + 'bb' }}>{item.pct}% of students</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* AT-RISK STUDENTS LIST table */}
                <div className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between px-5 py-3.5"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            AT-RISK STUDENTS LIST
                        </p>
                        <button className="p-1 rounded-lg hover:opacity-70">
                            <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${P.border}`, backgroundColor: 'rgba(124,58,237,0.03)' }}>
                                    {['AT-RISK STUDENT', 'RISK SCORE', 'DROPOUT RISK', 'KEY RISK FACTORS', 'ACTION'].map(h => (
                                        <th key={h} className="text-left px-4 py-2.5"
                                            style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} style={{ borderBottom: `1px solid ${P.border}` }}>
                                            {[...Array(5)].map((__, j) => (
                                                <td key={j} className="px-4 py-3"><Skel h={8} /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : sortedStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center">
                                            <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: `${P.primary}30` }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#94A3B8' }}>
                                                No at-risk students detected 🎉
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedStudents.map((student, i) => (
                                        <StudentRow key={student.studentId}
                                            student={student}
                                            rank={i + 1}
                                            onInsight={setInsightStudent} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className="rounded-2xl p-5"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: P.gradient }}>
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Recommendations Generated by AI
                        </p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[...Array(6)].map((_, i) => <Skel key={i} h={14} />)}
                        </div>
                    ) : recs.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                            AI recommendations will appear once student data is available.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {recs.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <CheckSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: P.primary }} />
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155' }}>{rec.action}</p>
                                        {rec.detail && (
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', lineHeight: 1.4, marginTop: 1 }}>{rec.detail}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: `1px solid ${P.border}` }}>
                        {[
                            { icon: Send,          label: 'Alert Parents of High-Risk Students' },
                            { icon: Calendar,      label: 'Schedule Remedial Classes'           },
                            { icon: FileText,      label: 'Dr. Parents ofropon Classes'         },
                            { icon: ClipboardList, label: 'Assign Study Plans to Improve'       },
                            { icon: Target,        label: 'High Risk Action Plans',   primary: true },
                            { icon: Zap,           label: 'Identified Action Plans'             },
                        ].map(btn => {
                            const Icon = btn.icon;
                            return (
                                <button key={btn.label}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                                    style={{
                                        background:      btn.primary ? P.gradient : 'transparent',
                                        backgroundColor: btn.primary ? undefined : P.soft,
                                        border:          btn.primary ? 'none' : `1px solid ${P.border}`,
                                    }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: btn.primary ? '#fff' : P.primary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: btn.primary ? '#fff' : '#475569' }}>
                                        {btn.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 flex-shrink-0" style={{ width: 288 }}>

                {/* Recent Alerts */}
                <div className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="px-4 py-3.5"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Recent Alerts
                        </p>
                    </div>

                    <div className="p-4 space-y-3">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <Skel h={32} w={32} r={999} />
                                    <div className="flex-1 space-y-1.5"><Skel h={9} /><Skel h={7} w="80%" /></div>
                                </div>
                            ))
                        ) : (data?.recentAlerts || []).length === 0 ? (
                            <div className="text-center py-6">
                                <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: `${P.primary}30` }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>No alerts yet</p>
                            </div>
                        ) : (
                            (data.recentAlerts).map((alert, i) => {
                                const acfg = ALERT_ICON_CFG[alert.riskLevel] || ALERT_ICON_CFG.medium;
                                return (
                                    <div key={i} className="flex items-start gap-2.5 pb-3 last:pb-0"
                                        style={{ borderBottom: i < data.recentAlerts.length - 1 ? `1px solid ${P.border}` : 'none' }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: acfg.bg }}>
                                            <AlertTriangle className="w-4 h-4" style={{ color: acfg.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#1E293B', lineHeight: 1.4 }}>
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                <RiskBadge level={alert.riskLevel} />
                                                {alert.subText && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                                                        style={{ backgroundColor: P.soft }}>
                                                        <Star className="w-2.5 h-2.5" style={{ color: P.primary }} />
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.semibold, color: P.primary }}>
                                                            {alert.subText.length > 20 ? alert.subText.slice(0, 20) + '…' : alert.subText}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Dropout Prediction */}
                <div className="rounded-2xl p-4"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Dropout Prediction
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginTop: 2 }}>
                                {data?.dropoutPrediction >= 50 ? 'Attendance Declines' : 'Engagement Based'}
                            </p>
                        </div>
                        {loading ? <Skel h={36} w={70} /> : (
                            <div className="flex items-center gap-1">
                                <TrendingDown className="w-5 h-5" style={{ color: data?.dropoutPrediction >= 50 ? P.red : P.orange }} />
                                <span style={{ fontFamily: T.fontFamily, fontSize: '28px', fontWeight: T.weight.black, color: data?.dropoutPrediction >= 50 ? P.red : P.orange }}>
                                    {data?.dropoutPrediction ?? 0}%
                                </span>
                            </div>
                        )}
                    </div>
                    {!loading && (
                        <div className="mt-3">
                            <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: P.soft }}>
                                <div style={{ width: `${data?.dropoutPrediction ?? 0}%`, height: '100%', borderRadius: 999, background: data?.dropoutPrediction >= 50 ? 'linear-gradient(90deg,#DC2626,#EF4444)' : 'linear-gradient(90deg,#EA580C,#F97316)' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Student Progress Snapshot */}
                <div className="rounded-2xl p-4"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Student Progress Snapshot
                    </p>
                    {loading ? <Skel h={40} /> : <HeatmapBar data={hm} showCounts />}
                </div>

                {/* Quick action icons */}
                <div className="rounded-2xl p-4"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Quick Actions</p>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { icon: FileText,  label: 'Report',  color: P.primary },
                            { icon: Share2,    label: 'Share',   color: '#6366F1' },
                            { icon: Send,      label: 'Alert',   color: P.red     },
                            { icon: Target,    label: 'Plan',    color: P.green   },
                            { icon: Calendar,  label: 'Schedule',color: P.orange  },
                            { icon: Bell,      label: 'Notify',  color: P.yellow  },
                            { icon: BarChart2, label: 'Analyze', color: '#8B5CF6' },
                            { icon: Zap,       label: 'Action',  color: P.primary },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-70 transition-opacity">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: item.color + '15' }}>
                                        <Icon className="w-4.5 h-4.5" style={{ color: item.color, width: 18, height: 18 }} />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8', textAlign: 'center' }}>{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Groq badge */}
                <div className="rounded-2xl p-4"
                    style={{ background: `linear-gradient(135deg,${P.soft},rgba(99,102,241,0.06))`, border: `1px solid ${P.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: P.primary }}>Powered by Groq AI</p>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5 }}>
                        Risk scores computed from quiz performance, enrollment progress & submission rates using <strong>llama-3.3-70b</strong>.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: P.green }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.green, fontWeight: T.weight.semibold }}>Live · Auto-updating</span>
                    </div>
                </div>
            </div>

            {/* Insight Modal */}
            {insightStudent && (
                <InsightModal student={insightStudent} onClose={() => setInsightStudent(null)} />
            )}
        </div>
    );
}