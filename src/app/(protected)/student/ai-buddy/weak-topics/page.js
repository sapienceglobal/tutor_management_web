'use client';

import { useState, useEffect } from 'react';
import {
    Target, AlertTriangle, Loader2, BookOpen,
    GraduationCap, TrendingDown, TrendingUp,
    CheckCircle2, Sparkles, Zap, BarChart2,
    ChevronRight, AlertCircle, Lightbulb
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, cx } from '@/constants/studentTokens';

const P = {
    primary: '#7C3AED', light: '#8B5CF6',
    soft: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg: '#F5F3FF', cardBg: '#FFFFFF',
    textPrimary: '#1E1B4B', textSecondary: '#6B7280', textMuted: '#9CA3AF',
};

const SEVERITY_CONFIG = {
    critical: { color: '#F43F5E', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.15)', label: 'Critical', icon: AlertTriangle },
    warning:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', label: 'At Risk', icon: AlertCircle },
    moderate: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', label: 'Moderate', icon: Target },
};

export default function StudentWeakTopicsPage() {
    const [weakTopics, setWeakTopics]             = useState([]);
    const [overallStats, setOverallStats]         = useState(null);
    const [aiRecommendations, setAiRecommendations] = useState(null);
    const [loading, setLoading]                   = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const res = await api.get('/ai/student/weak-topics');
                if (res.data?.success) {
                    setWeakTopics(res.data.weakTopics || []);
                    setOverallStats(res.data.overallStats || null);
                    setAiRecommendations(res.data.aiRecommendations || null);
                }
            } catch { } finally { setLoading(false); }
        };
        init();
    }, []);

    const criticalCount = weakTopics.filter(t => t.severity === 'critical').length;
    const warningCount  = weakTopics.filter(t => t.severity === 'warning').length;
    const moderateCount = weakTopics.filter(t => t.severity === 'moderate').length;

    return (
        <div style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg, minHeight: '100%' }}>

            {/* Header */}
            <div className="rounded-2xl p-5 mb-5 flex items-center gap-4"
                style={{ background: P.gradient, boxShadow: '0 8px 32px rgba(124,58,237,0.25)', position: 'relative', overflow: 'hidden' }}>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute rounded-full"
                        style={{ width: 2, height: 2, backgroundColor: 'rgba(255,255,255,0.55)', left: `${8 + i * 12}%`, top: `${18 + (i % 3) * 32}%` }} />
                ))}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                    <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#fff', marginBottom: 2 }}>
                        My Weak Areas 🎯
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.78)' }}>
                        AI analysis of your quiz performance to identify areas for improvement
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: P.primary }} />
                </div>
            ) : weakTopics.length === 0 ? (
                <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}` }}>
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: 6 }}>
                        {overallStats?.totalAttempts > 0 ? "Great Job! No Weak Areas Found 🎉" : "No Quiz Data Yet"}
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: P.textMuted, maxWidth: 400, margin: '0 auto' }}>
                        {overallStats?.totalAttempts > 0
                            ? "Your scores are above 75% in all topics. Keep up the excellent work!"
                            : "Take some quizzes in your courses and your weak areas will be analyzed here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-5">

                    {/* Stats bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Avg Score',     value: `${overallStats?.avgScore || 0}%`, color: P.primary, icon: BarChart2 },
                            { label: 'Weak Topics',   value: weakTopics.length.toString(),      color: '#F59E0B', icon: AlertTriangle },
                            { label: 'Critical',      value: criticalCount.toString(),           color: '#F43F5E', icon: AlertTriangle },
                            { label: 'Total Attempts', value: (overallStats?.totalAttempts || 0).toString(), color: '#10B981', icon: TrendingUp },
                        ].map(stat => (
                            <div key={stat.label} className="rounded-xl p-4 flex items-center gap-3"
                                style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: `${stat.color}10` }}>
                                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                                </div>
                                <div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: P.textPrimary }}>{stat.value}</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* AI Recommendations */}
                    {aiRecommendations && (
                        <div className="rounded-2xl p-5" style={{ backgroundColor: P.cardBg, border: `2px solid ${P.primary}20`, boxShadow: `0 4px 20px ${P.primary}14` }}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: P.gradient }}>
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: P.textPrimary }}>AI Recommendations</p>
                                {aiRecommendations.estimatedImprovementDays && (
                                    <span className="ml-auto px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.10)', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#10B981' }}>
                                        ~{aiRecommendations.estimatedImprovementDays} days to improve
                                    </span>
                                )}
                            </div>

                            {aiRecommendations.summary && (
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.65, marginBottom: 12 }}>
                                    {aiRecommendations.summary}
                                </p>
                            )}

                            {aiRecommendations.recommendations?.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {aiRecommendations.recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: P.primary }} />
                                            <div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: P.primary }}>{rec.topic}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', marginTop: 2 }}>{rec.action}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {aiRecommendations.studyTips?.length > 0 && (
                                <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Lightbulb className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#10B981' }}>Study Tips</p>
                                    </div>
                                    {aiRecommendations.studyTips.map((tip, i) => (
                                        <div key={i} className="flex items-start gap-2 mb-1 last:mb-0">
                                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569' }}>{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Weak Topics List */}
                    <div className="space-y-3">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Topics Below 75% — {weakTopics.length} found
                        </p>

                        {weakTopics.map(topic => {
                            const severe = SEVERITY_CONFIG[topic.severity] || SEVERITY_CONFIG.moderate;
                            const SeverityIcon = severe.icon;

                            return (
                                <div key={topic.lessonId} className="rounded-2xl p-5"
                                    style={{ backgroundColor: P.cardBg, border: `1px solid ${severe.border}`, boxShadow: S.card }}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: severe.bg }}>
                                            <SeverityIcon className="w-6 h-6" style={{ color: severe.color }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: P.textPrimary }}>
                                                    {topic.lessonTitle}
                                                </p>
                                                <span className="px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: severe.bg, border: `1px solid ${severe.border}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: severe.color }}>
                                                    {severe.label}
                                                </span>
                                            </div>
                                            <p className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textMuted }}>
                                                <GraduationCap className="w-3 h-3" /> {topic.courseTitle}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-5 flex-shrink-0">
                                            {/* Score bar */}
                                            <div className="w-28">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>Avg Score</span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: severe.color }}>{topic.avgScore}%</span>
                                                </div>
                                                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                                                    <div className="h-full rounded-full transition-all" style={{ width: `${topic.avgScore}%`, backgroundColor: severe.color }} />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>{topic.totalAttempts}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: P.textMuted }}>attempts</p>
                                            </div>
                                            <div className="text-center">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#10B981' }}>{topic.passedCount}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: P.textMuted }}>passed</p>
                                            </div>
                                            <div className="text-center">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#F43F5E' }}>{topic.failedCount}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: P.textMuted }}>failed</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Score range */}
                                    <div className="mt-3 flex items-center gap-3">
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>
                                            Score range: {topic.minScore}% — {topic.maxScore}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
