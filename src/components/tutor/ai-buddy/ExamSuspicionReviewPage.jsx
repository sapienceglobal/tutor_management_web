'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronRight, AlertTriangle, ShieldAlert, CheckCircle2,
    Flag, Video, Play, AlertCircle, FileText, Activity,
    MessageSquare, AlertOctagon, HelpCircle, User, Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { T, S } from '@/constants/tutorTokens';

const P = {
    primary: '#7C3AED', light: '#8B5CF6',
    soft: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg: '#F5F3FF',
};

function getRiskColors(riskLevel) {
    switch (riskLevel) {
        case 'Cheating Detected':    return { bg: '#FEE2E2', text: '#EF4444', border: '#FECACA', icon: <AlertTriangle className="w-4 h-4" /> };
        case 'Suspicious Detected':  return { bg: '#FEF3C7', text: '#F59E0B', border: '#FDE68A', icon: <ShieldAlert   className="w-4 h-4" /> };
        case 'Low Confidence Detected': return { bg: '#DCFCE7', text: '#10B981', border: '#BBF7D0', icon: <CheckCircle2 className="w-4 h-4" /> };
        default:                     return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', icon: <CheckCircle2  className="w-4 h-4" /> };
    }
}

export default function ExamSuspicionReviewPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [activeTab, setActiveTab] = useState('log');

    useEffect(() => {
        const fetchReviewData = async () => {
            try {
                const res = await api.get('/ai/proctoring/review/' + params.attemptId);
                if (res.data?.success) setData(res.data.reviewData);
            } catch {
                toast.error('Failed to load review data');
                router.push('/tutor/ai-buddy/proctoring');
            } finally {
                setLoading(false);
            }
        };
        fetchReviewData();
    }, [params.attemptId, router]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center" style={{ backgroundColor: P.pageBg }}>
                <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: P.primary }} />
                <p style={{ fontFamily: T.fontFamily, color: '#64748B' }}>Loading suspicion analysis...</p>
            </div>
        );
    }

    if (!data) return null;

    const colors         = getRiskColors(data.riskLevel);
    const riskPercentage = Math.min((data.riskScore / 10) * 100, 100);
    const conicStyle     = { background: 'conic-gradient(' + colors.text + ' 0% ' + riskPercentage + '%, #F1F5F9 ' + riskPercentage + '% 100%)' };

    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-5 gap-5"
            style={{ backgroundColor: P.pageBg, fontFamily: T.fontFamily }}>

            {/* ── BREADCRUMBS ── */}
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: P.primary }}>
                <span className="cursor-pointer hover:underline"
                    onClick={() => router.push('/tutor/ai-buddy/proctoring')}>
                    Proctoring Alerts
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-slate-600">Exam Suspicion Review</span>
            </div>

            {/* ── HEADER CARD ── */}
            <div className="rounded-2xl p-5 bg-white flex flex-col gap-4"
                style={{ border: '1px solid ' + P.border, boxShadow: S.card }}>

                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        {data.avatar ? (
                            <img src={data.avatar} alt="student"
                                className="w-14 h-14 rounded-full object-cover border-2"
                                style={{ borderColor: P.border }} />
                        ) : (
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-100 border-2"
                                style={{ borderColor: P.border }}>
                                <User className="w-6 h-6" style={{ color: P.primary }} />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: '#1E293B' }}>
                                    {data.student}
                                </h1>
                                <div className="px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold"
                                    style={{ backgroundColor: colors.bg, color: colors.text, border: '1px solid ' + colors.border }}>
                                    {colors.icon} {data.riskLevel}
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mt-0.5">Grade 8</p>
                        </div>
                    </div>

                    <div className="text-right p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-bold text-slate-500">EXAM SCORE</p>
                        <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: P.primary }}>
                            {data.examScore} / {data.totalQuestions}
                        </p>
                    </div>
                </div>

                <div>
                    <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: '#1E293B' }}>
                        {data.riskLevel === 'Safe' ? 'Completed' : 'Suspicion Suspected'} in {data.examName}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                        9 minutes ago • {data.timeSpent || 36} Minutes
                    </p>
                </div>

                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{ backgroundColor: '#FFF5F5', border: '1px solid #FECACA' }}>
                    <div>
                        <ul className="list-disc pl-5 text-sm font-semibold text-slate-700">
                            <li>
                                {data.keyIssues.length > 0
                                    ? data.keyIssues.join(' & ')
                                    : 'Multiple Screen Switches Detected'}
                            </li>
                        </ul>
                        <p className="text-xs font-bold mt-2 text-red-500 tracking-wide">
                            VIOLATIONS: {data.violationsCount}
                        </p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 shadow-lg"
                        style={{ background: P.gradient }}>
                        <Flag className="w-4 h-4" /> Flag for Investigation
                    </button>
                </div>
            </div>

            {/* ── TWO COLUMN LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">

                {/* LEFT: Activity Log */}
                <div className="lg:col-span-7 flex flex-col gap-5 min-h-0">
                    <div className="flex-1 rounded-2xl bg-white border flex flex-col p-5 overflow-y-auto custom-scrollbar"
                        style={{ borderColor: P.border, boxShadow: S.card }}>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 mb-5 pb-1">
                            {['log', 'timeline'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className="pb-3 px-4 text-sm font-bold transition-colors"
                                    style={{
                                        borderBottom: activeTab === tab ? '2px solid #7C3AED' : '2px solid transparent',
                                        color: activeTab === tab ? '#7C3AED' : '#94A3B8',
                                    }}>
                                    {tab === 'log' ? 'Suspicious Activity Log' : "Suspect's Activity Timeline"}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'log' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                                    <span>Violations: {data.violationsCount}</span>
                                    <span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">Sort: Newest</span>
                                </div>

                                {data.timeline.length > 0 ? data.timeline.map((event, i) => (
                                    <div key={i} className="rounded-xl border border-red-100 overflow-hidden">
                                        <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wide">
                                                <AlertOctagon className="w-4 h-4" />
                                                <span>
                                                    {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {' • '}
                                                    {event.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500">
                                                {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="p-4 bg-white">
                                            <p className="text-sm font-semibold text-slate-700 flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                                {event.details}
                                            </p>
                                            {event.type !== 'tab_switch' && (
                                                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative">
                                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md font-bold z-10 flex items-center gap-2">
                                                        <Video className="w-3.5 h-3.5" /> AI-Suggested Flagged Segment
                                                    </div>
                                                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                            <Video className="w-12 h-12 text-slate-600" />
                                                        </div>
                                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-3 px-4">
                                                            <div className="h-1 bg-white/30 rounded-full mb-3 relative overflow-hidden">
                                                                <div className="absolute inset-y-0 left-0 bg-red-500 w-1/3" />
                                                            </div>
                                                            <div className="flex items-center gap-4 text-white">
                                                                <Play className="w-4 h-4 fill-white cursor-pointer" />
                                                                <span className="text-xs font-bold">11:21 / 36:00</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-500 py-10 text-center font-semibold">
                                        No violations recorded.
                                    </p>
                                )}
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-sm text-slate-500 font-semibold">Timeline view coming soon...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Live Feed & Risk Assessment */}
                <div className="lg:col-span-5 flex flex-col gap-5 min-h-0">

                    {/* Proctor Camera Feed */}
                    <div className="rounded-2xl border bg-white overflow-hidden relative"
                        style={{ borderColor: P.border, boxShadow: S.card }}>
                        <div className="absolute top-3 left-3 bg-rose-500/90 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-black z-10 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> AI Proctor Active
                        </div>
                        <div className="aspect-video bg-slate-900 flex items-center justify-center">
                            <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-2">
                                <Video className="w-12 h-12 text-slate-600" />
                                <p className="text-slate-500 text-xs font-semibold">Webcam Feed</p>
                            </div>
                        </div>
                        <div className="flex border-t border-slate-100 bg-slate-50 p-2">
                            <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg transition-colors">
                                <MessageSquare className="w-4 h-4" /> Chat Log
                            </button>
                        </div>
                    </div>

                    {/* Risk Assessment Card */}
                    <div className="rounded-2xl bg-white p-5 border flex-1"
                        style={{ borderColor: P.border, boxShadow: S.card }}>
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B', letterSpacing: '-0.02em' }}>
                                RISK ASSESSMENT
                            </h3>
                            <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100 cursor-pointer">
                                Sort By Level ▼
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-center">
                            {/* Circular Dial */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 flex items-center justify-center rounded-full"
                                    style={conicStyle}>
                                    <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-inner border border-slate-50">
                                        <p style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: colors.text, lineHeight: 1 }}>
                                            {data.riskLevel === 'Cheating Detected' ? 'High'
                                                : data.riskLevel === 'Suspicious Detected' ? 'Med' : 'Low'}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Risk</p>
                                    </div>
                                </div>
                                <div className="mt-4 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                                    style={{ color: colors.text, backgroundColor: colors.bg }}>
                                    Risk Score {data.riskScore ? data.riskScore.toFixed(1) : '8.5'}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <Activity className="w-4 h-4 mt-0.5 text-slate-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Topic / Exam</p>
                                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{data.examName}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 mt-0.5 text-slate-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Violations</p>
                                        <p className="text-xs font-bold text-slate-700">{data.violationsCount} Flagged Logs</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Issues */}
                        <div className="mt-6 p-4 rounded-xl border border-slate-100 bg-slate-50">
                            <h4 className="flex items-center gap-2 text-sm font-black text-slate-700 mb-3">
                                <AlertCircle className="w-4 h-4" /> Key Issues
                            </h4>
                            <ul className="space-y-2">
                                {data.keyIssues.length > 0 ? data.keyIssues.map((issue, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: P.primary }} />
                                        {issue}
                                    </li>
                                )) : (
                                    <li className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-slate-400" />
                                        No specific issues mapped.
                                    </li>
                                )}
                            </ul>
                            <button className="w-full mt-5 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 shadow-md"
                                style={{ background: P.gradient }}>
                                Generate Summary
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BOTTOM ACTION BAR ── */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white sticky bottom-0 border mt-auto"
                style={{ borderColor: P.border, boxShadow: S.card }}>
                <div className="flex gap-3">
                    <button className="px-5 py-2 rounded-xl text-sm font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100 transition-colors flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Escalate Flags
                    </button>
                    <button className="px-5 py-2 rounded-xl text-sm font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Dismiss Flags
                    </button>
                    <button className="px-5 py-2 rounded-xl text-sm font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 transition-colors flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" /> Request Assistance
                    </button>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-2 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Generate Report
                    </button>
                    <button className="px-6 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-2 shadow-md"
                        style={{ background: P.gradient }}>
                        <ShieldAlert className="w-4 h-4" /> Finalize Review
                    </button>
                </div>
            </div>
        </div>
    );
}