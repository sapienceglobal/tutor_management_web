'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldAlert, AlertTriangle, CheckCircle2, Eye,
    Clock, Users, BarChart2, Filter, Search,
    MoreHorizontal, RefreshCw, ChevronDown,
    FileText, Loader2, AlertOctagon, Shield,
    Activity, SortAsc, Bell
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { T, S } from '@/constants/tutorTokens';

const P = {
    primary:  '#7C3AED',
    soft:     'rgba(124,58,237,0.08)',
    border:   'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg:   '#F5F3FF',
};

// ─── Risk config ──────────────────────────────────────────────────────────────
const RISK = {
    'Cheating Detected':        { color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)',   label: 'Cheating Detected',         gradient: 'linear-gradient(135deg,#EF4444,#F87171)' },
    'Suspicious Detected':      { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)',  label: 'Suspicious Detected',       gradient: 'linear-gradient(135deg,#F59E0B,#FCD34D)' },
    'Low Confidence Detected':  { color: '#10B981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)',  label: 'Low Confidence Detected',   gradient: 'linear-gradient(135deg,#10B981,#34D399)' },
    'Safe':                     { color: '#6366F1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.15)',  label: 'Safe',                      gradient: 'linear-gradient(135deg,#6366F1,#818CF8)' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ h = 4, w = 'full', r = 'xl' }) {
    return <div className={'h-' + h + ' w-' + w + ' rounded-' + r + ' animate-pulse'} style={{ backgroundColor: P.soft }} />;
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ flaggedPct = 0, size = 110 }) {
    const stroke = 14;
    const r      = (size - stroke * 2) / 2;
    const circ   = 2 * Math.PI * r;
    const dash   = (flaggedPct / 100) * circ;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EDE9FE" strokeWidth={stroke} />
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#7C3AED"
                    strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={dash + ' ' + (circ - dash)} />
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#10B981"
                    strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={((100 - flaggedPct) / 100 * circ) + ' ' + (circ - (100 - flaggedPct) / 100 * circ)}
                    strokeDashoffset={-dash} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#1E293B', lineHeight: 1 }}>
                    {flaggedPct}%
                </p>
            </div>
        </div>
    );
}

// ─── Recent session card ──────────────────────────────────────────────────────
function RecentSessionCard({ session }) {
    const risk = RISK[session.riskLevel] || RISK['Safe'];
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: '#fff', border: '1px solid ' + P.border }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: risk.gradient }}>
                {session.studentName?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                    {session.studentName}
                </p>
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                    {session.examName}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                    {session.timeAgo}
                </p>
            </div>
            <div className="flex-shrink-0">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black"
                    style={{ backgroundColor: risk.color, display: 'flex' }}>
                    {session.violationsCount || '!'}
                </span>
            </div>
        </div>
    );
}

// ─── Alert row ────────────────────────────────────────────────────────────────
function AlertRow({ alert, onReview }) {
    const risk = RISK[alert.riskLevel] || RISK['Safe'];
    return (
        <div className="flex items-center gap-4 px-4 py-3.5 border-b transition-all hover:bg-purple-50/40"
            style={{ borderColor: P.border }}>

            {/* Student */}
            <div className="flex items-center gap-3 w-[180px] flex-shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                    style={{ background: P.gradient }}>
                    {alert.studentName?.[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                        {alert.studentName}
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                        Score: {alert.score ?? '—'}
                    </p>
                </div>
            </div>

            {/* Alert type */}
            <div className="w-[180px] flex-shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: risk.bg, border: '1px solid ' + risk.border, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: risk.color }}>
                    <AlertTriangle className="w-3 h-3" />
                    {alert.riskLevel}
                </span>
                <div className="mt-1 space-y-0.5">
                    {(alert.keyIssues || []).slice(0, 2).map((issue, i) => (
                        <p key={i} style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B' }}>
                            • {issue}
                        </p>
                    ))}
                </div>
            </div>

            {/* Time */}
            <div className="flex-1">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155' }}>
                    {alert.timeAgo}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                    {alert.violationsCount} violation{alert.violationsCount !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Exam */}
            <div className="w-[140px] flex-shrink-0">
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>
                    {alert.examName}
                </p>
            </div>

            {/* Review button */}
            <button onClick={() => onReview(alert._id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl flex-shrink-0 transition-all hover:opacity-80"
                style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.30)' }}>
                <Eye className="w-3.5 h-3.5" /> Review
            </button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProctoringAlertsPage() {
    const router = useRouter();

    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [riskFilter, setRiskFilter] = useState('All');
    const [examFilter, setExamFilter] = useState('');
    const [sortBy, setSortBy]       = useState('latest');
    const [generatingSummary, setGeneratingSummary] = useState(false);

    // ── Load data ──────────────────────────────────────────────────
    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (riskFilter !== 'All') params.set('riskFilter', riskFilter);
            if (examFilter)           params.set('examFilter', examFilter);
            params.set('sortBy', sortBy);

            const res = await api.get('/ai/proctoring/alerts?' + params.toString());
            if (res.data?.success) setData(res.data);
            else toast.error(res.data?.message || 'Failed to load');
        } catch { toast.error('Failed to load proctoring alerts'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [riskFilter, examFilter, sortBy]);

    // ── Generate summary for all flagged ──────────────────────────
    const handleGenerateSummary = async () => {
        const flaggedAlert = data?.alerts?.find(a => a.riskLevel !== 'Safe');
        if (!flaggedAlert) return toast.error('No flagged alerts to summarize');
        setGeneratingSummary(true);
        try {
            const res = await api.post('/ai/proctoring/review/' + flaggedAlert._id + '/summary');
            if (res.data?.success) toast.success('AI summary generated!');
        } catch { toast.error('Failed to generate summary'); }
        finally { setGeneratingSummary(false); }
    };

    const s = data?.summary || {};

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4 overflow-hidden" style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── MAIN AREA ────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto custom-scrollbar">

                {/* Page header */}
                <div className="flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: P.gradient, boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: '#3B0764' }}>
                                Proctoring Alerts
                            </h1>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#7C3AED' }}>
                                AI-Enhanced live monitoring for online exams to detect suspicious activities
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setSortBy(sortBy === 'latest' ? 'risk' : 'latest')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-80"
                        style={{ backgroundColor: '#fff', border: '1px solid ' + P.border, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                        <SortAsc className="w-3.5 h-3.5" />
                        Sort By: {sortBy === 'latest' ? 'Latest Alert' : 'Risk Level'}
                    </button>
                </div>

                {/* ── Alert Summary + Proctoring Stats ───────────────────── */}
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">

                    {/* Alert Summary */}
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid ' + P.border, boxShadow: S.card }}>
                        <div className="flex items-center justify-between mb-3">
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Alert Summary</p>
                            {!loading && s.total > 0 && (
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#EF4444', fontWeight: T.weight.bold }}>
                                    ♥ {s.flaggedPct}% of flagged sessions
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-3 gap-2"><Sk h={16} /><Sk h={16} /><Sk h={16} /></div>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {[
                                        { key: 'Cheating Detected',       count: s.cheating,      sub: s.total ? Math.round(s.cheating / s.total * 100) + '% Cheating' : '0%' },
                                        { key: 'Suspicious Detected',     count: s.suspicious,    sub: s.total ? Math.round(s.suspicious / s.total * 100) + '% Suspicious' : '0%' },
                                        { key: 'Low Confidence Detected', count: s.lowConfidence, sub: s.total ? Math.round(s.lowConfidence / s.total * 100) + '% Low Conf.' : '0%' },
                                    ].map(item => {
                                        const risk = RISK[item.key];
                                        return (
                                            <div key={item.key}
                                                onClick={() => setRiskFilter(riskFilter === item.key ? 'All' : item.key)}
                                                className="p-3 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
                                                style={{ background: 'linear-gradient(135deg,' + risk.bg + ',' + risk.bg + ')', border: '1.5px solid ' + risk.border }}>
                                                <div className="flex items-baseline gap-2">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '28px', fontWeight: T.weight.black, color: risk.color, lineHeight: 1 }}>{item.count ?? 0}</span>
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: risk.color, marginTop: 2 }}>{item.key}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: risk.color, opacity: 0.7 }}>{item.sub}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Bottom info */}
                                <div className="flex items-center gap-4 pt-2" style={{ borderTop: '1px solid ' + P.border }}>
                                    <div className="flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>
                                            Active Exams: <strong style={{ color: '#1E293B' }}>{s.activeExams ?? 0} Ongoing</strong>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" style={{ color: P.primary }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>
                                            <strong style={{ color: '#1E293B' }}>{s.totalTimeProctored ?? 0}h</strong> Total Time Proctored
                                        </span>
                                    </div>
                                </div>

                                {/* Risk filter chips */}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {['Cheating Detected', 'Suspicious Detected', 'Low Confidence Detected'].map(r => {
                                        const risk = RISK[r];
                                        return (
                                            <button key={r} onClick={() => setRiskFilter(riskFilter === r ? 'All' : r)}
                                                className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-all"
                                                style={{
                                                    backgroundColor: riskFilter === r ? risk.color : risk.bg,
                                                    border: '1px solid ' + risk.border,
                                                    fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold,
                                                    color: riskFilter === r ? '#fff' : risk.color,
                                                }}>
                                                <CheckCircle2 className="w-3 h-3" /> {r}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Proctoring Stats */}
                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid ' + P.border, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>Proctoring Stats</p>
                        {loading ? <Sk h={24} /> : (
                            <div className="flex items-center gap-4">
                                <DonutChart flaggedPct={s.flaggedPct || 0} size={110} />
                                <div className="flex-1">
                                    <div className="mb-3">
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '28px', fontWeight: T.weight.black, color: '#1E293B', lineHeight: 1 }}>
                                            Flagged {s.flaggedPct ?? 0}%
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                            (OF {s.total ?? 0} SESSIONS)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>Safe</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: P.primary }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>Flagged</span>
                                    </div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>
                                        Active Exams: <strong style={{ color: '#1E293B' }}>{s.activeExams ?? 0} Ongoing</strong>
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>
                                        Flagged Sessions: <strong style={{ color: '#1E293B' }}>{s.flagged ?? 0} Of {s.total ?? 0} Sessions</strong>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Proctoring Alerts List ──────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: '1px solid ' + P.border, boxShadow: S.card }}>

                    {/* List header */}
                    <div className="flex items-center justify-between px-4 py-3.5"
                        style={{ borderBottom: '1px solid ' + P.border }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>
                            Proctoring Alerts List
                        </p>
                        <button onClick={() => setSortBy(sortBy === 'latest' ? 'risk' : 'latest')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                            style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>
                            <SortAsc className="w-3 h-3" /> Sort By: Latest Alert
                        </button>
                    </div>

                    {/* Column headers */}
                    <div className="flex items-center gap-4 px-4 py-2.5"
                        style={{ backgroundColor: P.soft, borderBottom: '1px solid ' + P.border }}>
                        {['Alerted Student', 'Alert Type', 'Flagged Time & Details', 'Exam', ''].map((col, i) => (
                            <p key={i} style={{
                                fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold,
                                color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em',
                                width: i === 0 ? 180 : i === 1 ? 180 : i === 3 ? 140 : i === 4 ? 80 : undefined,
                                flex: i === 2 ? 1 : undefined, flexShrink: 0,
                            }}>
                                {col}
                            </p>
                        ))}
                    </div>

                    {/* Alert rows */}
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: P.soft }} />
                                    <div className="flex-1 space-y-1.5"><Sk h={3} /><Sk h={3} w="3/4" /></div>
                                </div>
                            ))}
                        </div>
                    ) : (data?.alerts || []).length === 0 ? (
                        <div className="text-center py-12">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-3" style={{ color: P.soft }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#CBD5E1' }}>
                                {riskFilter !== 'All' ? 'No ' + riskFilter + ' alerts' : 'No proctoring alerts yet'}
                            </p>
                        </div>
                    ) : (
                        (data?.alerts || []).map(alert => (
                            <AlertRow key={alert._id} alert={alert}
                                onReview={id => router.push('/tutor/ai-buddy/suspicion-review/' + id)} />
                        ))
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[250px] flex-shrink-0 overflow-y-auto custom-scrollbar">

                {/* Recent Sessions */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid ' + P.border, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            RECENT SESSIONS
                        </p>
                        <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    </div>
                    {loading ? (
                        <div className="space-y-2">{[...Array(4)].map((_, i) => <Sk key={i} h={14} />)}</div>
                    ) : (data?.recentSessions || []).length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1', textAlign: 'center', padding: '12px 0' }}>
                            No recent sessions
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {(data?.recentSessions || []).map((session, i) => (
                                <RecentSessionCard key={i} session={session} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter Alerts */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid ' + P.border, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            FILTER ALERTS
                        </p>
                        <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                    </div>

                    {/* Alert Type filter */}
                    <div className="mb-3">
                        <div className="relative">
                            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
                                className="w-full appearance-none px-3 py-2.5 rounded-xl pr-8 outline-none"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: '1px solid ' + P.border, backgroundColor: P.soft }}>
                                <option value="All">Alert Type — All</option>
                                <option value="Cheating Detected">Cheating Detected</option>
                                <option value="Suspicious Detected">Suspicious Detected</option>
                                <option value="Low Confidence Detected">Low Confidence Detected</option>
                                <option value="Safe">Safe</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        </div>
                    </div>

                    {/* Exam Name filter */}
                    <div className="mb-4">
                        <div className="relative">
                            <select value={examFilter} onChange={e => setExamFilter(e.target.value)}
                                className="w-full appearance-none px-3 py-2.5 rounded-xl pr-8 outline-none"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: '1px solid ' + P.border, backgroundColor: P.soft }}>
                                <option value="">Exam Name — All</option>
                                {(data?.exams || []).map(e => (
                                    <option key={e._id} value={e._id}>{e.title}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        </div>
                    </div>

                    <button onClick={handleGenerateSummary} disabled={generatingSummary}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: P.gradient, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff', boxShadow: '0 4px 12px rgba(124,58,237,0.30)' }}>
                        {generatingSummary
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <FileText className="w-4 h-4" />}
                        {generatingSummary ? 'Generating…' : 'Generate Summary'}
                    </button>
                </div>

                {/* All Alerts quick view */}
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff', border: '1px solid ' + P.border, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>All Alerts</p>
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.primary, fontWeight: T.weight.bold, cursor: 'pointer' }}
                            onClick={() => setRiskFilter('All')}>All Alerts &gt;</span>
                    </div>

                    {loading ? (
                        <div className="flex gap-2 flex-wrap">{[...Array(6)].map((_, i) => <Sk key={i} h={8} w="8" r="full" />)}</div>
                    ) : (
                        <div className="space-y-2">
                            {[
                                { label: 'Cheating',      count: s.cheating,      color: '#EF4444' },
                                { label: 'Suspicious',    count: s.suspicious,    color: '#F59E0B' },
                                { label: 'Low Conf.',     count: s.lowConfidence, color: '#10B981' },
                                { label: 'Safe',          count: s.safe,          color: '#6366F1' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>{item.label}</span>
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: item.color }}>{item.count ?? 0}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={() => setRiskFilter('All')}
                        className="w-full mt-3 py-2 rounded-xl"
                        style={{ backgroundColor: P.soft, border: '1px solid ' + P.border, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                        All Alerts &gt;
                    </button>
                </div>

                {/* Refresh */}
                <button onClick={loadData} disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl transition-all hover:opacity-80"
                    style={{ backgroundColor: '#fff', border: '1px solid ' + P.border, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                    <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} />
                    {loading ? 'Loading…' : 'Refresh Alerts'}
                </button>
            </div>
        </div>
    );
}