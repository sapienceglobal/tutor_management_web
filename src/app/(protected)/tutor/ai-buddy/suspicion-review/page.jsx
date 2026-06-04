'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldAlert, AlertTriangle, CheckCircle2, Eye,
    Clock, Search, ChevronDown, FileText, Loader2,
    Shield, Activity, User, Filter, AlertCircle, RefreshCw
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

const P = {
    primary: '#7C3AED',
    soft: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg, #3B0764 0%, #7C3AED 60%, #8B5CF6 100%)',
    pageBg: '#F5F3FF',
};

const RISK_CONFIG = {
    'Cheating Detected': {
        color: C.danger,
        bg: C.dangerBg,
        border: C.dangerBorder,
        label: 'Cheating Detected',
        icon: ShieldAlert
    },
    'Suspicious Detected': {
        color: C.warning,
        bg: C.warningBg,
        border: C.warningBorder,
        label: 'Suspicious',
        icon: AlertTriangle
    },
    'Low Confidence Detected': {
        color: '#D97706',
        bg: 'rgba(217,119,6,0.08)',
        border: 'rgba(217,119,6,0.20)',
        label: 'Low Confidence',
        icon: AlertCircle
    },
    'Safe': {
        color: C.success,
        bg: C.successBg,
        border: C.successBorder,
        label: 'Safe',
        icon: CheckCircle2
    }
};

export default function ExamSuspicionReviewIndexPage() {
    const router = useRouter();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState('All');
    const [examFilter, setExamFilter] = useState('');
    const [sortBy, setSortBy] = useState('latest');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (riskFilter !== 'All') params.set('riskFilter', riskFilter);
            if (examFilter) params.set('examFilter', examFilter);
            params.set('sortBy', sortBy);

            const res = await api.get('/ai/proctoring/alerts?' + params.toString());
            if (res.data?.success) {
                setData(res.data);
            } else {
                toast.error(res.data?.message || 'Failed to load submissions');
            }
        } catch (err) {
            toast.error('Failed to load exam submissions');
        } finally {
            setLoading(false);
        }
    }, [riskFilter, examFilter, sortBy]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Filter attempts locally by search query (student name or exam name)
    const filteredAlerts = (data?.alerts || []).filter(alert => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            alert.studentName.toLowerCase().includes(query) ||
            alert.examName.toLowerCase().includes(query)
        );
    });

    const s = data?.summary || { cheating: 0, suspicious: 0, lowConfidence: 0, safe: 0, total: 0, flagged: 0, flaggedPct: 0 };

    return (
        <div className="p-5 space-y-5" style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg, minHeight: '100%' }}>
            
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <Shield className="w-6 h-6" style={{ color: '#7573E8' }} />
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading }}>
                            Exam Review Hub
                        </h1>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg,#7573E8,#3D3B8E)', color: '#fff' }}>
                            AI Auditor
                        </span>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                        Review, audit, and analyze student exam submissions and AI proctor logs.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={loadData}
                        disabled={loading}
                        className="flex items-center justify-center w-9 h-9 border-none cursor-pointer transition-colors"
                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', color: C.text }}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => router.push('/tutor/ai-buddy/proctoring')}
                        className="flex items-center gap-2 px-4 py-2 text-white border-none cursor-pointer font-bold transition-all hover:opacity-90 shadow-sm"
                        style={{ background: C.gradientBtn, fontSize: T.size.xs, borderRadius: '10px' }}
                    >
                        <ShieldAlert className="w-4 h-4" /> Proctoring Alerts
                    </button>
                </div>
            </div>

            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Audited', value: s.total, sub: 'Exam attempts', color: C.btnPrimary, icon: Activity },
                    { label: 'Integrity Flags', value: s.flagged, sub: `${s.flaggedPct}% Flagged Rate`, color: C.danger, icon: ShieldAlert },
                    { label: 'Safe Sessions', value: s.safe, sub: 'No violations detected', color: C.success, icon: CheckCircle2 },
                    { label: 'Cheating Cases', value: s.cheating, sub: 'Requires immediate action', color: '#B91C1C', icon: AlertTriangle }
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="rounded-2xl p-4 flex items-center justify-between"
                            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="space-y-1">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.semibold }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                                    {loading ? '—' : stat.value}
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                    {loading ? 'Loading...' : stat.sub}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${stat.color}12`, color: stat.color }}>
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Search & Filter Controls ── */}
            <div className="rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                {/* Search input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <input 
                        type="text"
                        placeholder="Search student or exam name..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-9 pr-4 py-2 border-none outline-none"
                        style={{ 
                            fontFamily: T.fontFamily, 
                            fontSize: T.size.xs, 
                            backgroundColor: C.innerBg, 
                            borderRadius: '10px', 
                            color: C.heading 
                        }}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold }}>Filters:</span>
                    </div>

                    {/* Risk Filter */}
                    <div className="relative">
                        <select 
                            value={riskFilter} 
                            onChange={e => setRiskFilter(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 border-none outline-none cursor-pointer"
                            style={{ 
                                fontFamily: T.fontFamily, 
                                fontSize: T.size.xs, 
                                color: C.text, 
                                backgroundColor: C.innerBg,
                                borderRadius: '10px'
                            }}
                        >
                            <option value="All">Risk — All Levels</option>
                            <option value="Cheating Detected">Cheating Detected</option>
                            <option value="Suspicious Detected">Suspicious</option>
                            <option value="Low Confidence Detected">Low Confidence</option>
                            <option value="Safe">Safe</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }} />
                    </div>

                    {/* Exam Filter */}
                    <div className="relative">
                        <select 
                            value={examFilter} 
                            onChange={e => setExamFilter(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 border-none outline-none cursor-pointer max-w-[200px] truncate"
                            style={{ 
                                fontFamily: T.fontFamily, 
                                fontSize: T.size.xs, 
                                color: C.text, 
                                backgroundColor: C.innerBg,
                                borderRadius: '10px'
                            }}
                        >
                            <option value="">Exams — All</option>
                            {(data?.exams || []).map(e => (
                                <option key={e._id} value={e._id}>{e.title}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }} />
                    </div>

                    {/* Sort Filter */}
                    <div className="relative">
                        <select 
                            value={sortBy} 
                            onChange={e => setSortBy(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 border-none outline-none cursor-pointer"
                            style={{ 
                                fontFamily: T.fontFamily, 
                                fontSize: T.size.xs, 
                                color: C.text, 
                                backgroundColor: C.innerBg,
                                borderRadius: '10px'
                            }}
                        >
                            <option value="latest">Sort — Newest</option>
                            <option value="risk">Sort — Risk Level</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }} />
                    </div>
                </div>
            </div>

            {/* ── Submissions Table/List ── */}
            <div className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
                        <thead>
                            <tr style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                                <th className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student</th>
                                <th className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exam / Course</th>
                                <th className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Performance</th>
                                <th className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Integrity Audit</th>
                                <th className="px-4 py-3 text-right" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, idx) => (
                                    <tr key={idx} style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <td className="px-4 py-4.5" colSpan={5}>
                                            <div className="flex items-center gap-3 animate-pulse">
                                                <div className="w-10 h-10 rounded-full bg-slate-200" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 w-1/4 bg-slate-200 rounded" />
                                                    <div className="h-2 w-1/3 bg-slate-200 rounded" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredAlerts.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-12 text-center" colSpan={5}>
                                        <ShieldAlert className="w-12 h-12 mx-auto mb-3" style={{ color: C.textMuted, opacity: 0.3 }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, fontWeight: T.weight.semibold }}>
                                            No exam submissions found matching the criteria.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAlerts.map((alert) => {
                                    const risk = RISK_CONFIG[alert.riskLevel] || RISK_CONFIG['Safe'];
                                    const RiskIcon = risk.icon;
                                    return (
                                        <tr key={alert._id} className="transition-colors hover:bg-slate-50/50" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            
                                            {/* Student Details */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                                                        style={{ background: C.gradientBtn }}>
                                                        {alert.studentName?.[0]?.toUpperCase() || 'S'}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>
                                                            {alert.studentName}
                                                        </p>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                                            Submitted {alert.timeAgo}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Exam details */}
                                            <td className="px-4 py-3.5">
                                                <div>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.heading }}>
                                                        {alert.examName}
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                                        AI Proctored Exam
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Performance */}
                                            <td className="px-4 py-3.5">
                                                <div>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>
                                                        Score: {alert.score ?? '—'} / {alert.totalQuestions}
                                                    </p>
                                                    <p className="flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                                        <Clock className="w-3 h-3" /> Duration: {alert.timeSpent || 0} mins
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Integrity / Risk Audit */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full w-fit"
                                                        style={{ 
                                                            backgroundColor: risk.bg, 
                                                            border: `1.5px solid ${risk.border}`, 
                                                            fontFamily: T.fontFamily, 
                                                            fontSize: '10px', 
                                                            fontWeight: T.weight.bold, 
                                                            color: risk.color 
                                                        }}
                                                    >
                                                        <RiskIcon className="w-3.5 h-3.5" />
                                                        {risk.label}
                                                    </span>
                                                    {alert.violationsCount > 0 ? (
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.danger, fontWeight: T.weight.bold }}>
                                                            {alert.violationsCount} flagged event{alert.violationsCount > 1 ? 's' : ''}
                                                        </p>
                                                    ) : (
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                                            Perfect integrity score
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Action Button */}
                                            <td className="px-4 py-3.5 text-right">
                                                <button 
                                                    onClick={() => router.push(`/tutor/ai-buddy/suspicion-review/${alert._id}`)}
                                                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-white border-none cursor-pointer font-bold transition-all hover:opacity-85 shadow-sm"
                                                    style={{ 
                                                        background: C.gradientBtn,
                                                        fontFamily: T.fontFamily,
                                                        fontSize: '11px',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Review Logs
                                                </button>
                                            </td>

                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

        </div>
    );
}
