'use client';

import { useState, useEffect } from 'react';
import {
    CalendarCheck, ChevronDown, ChevronRight, Clock,
    GraduationCap, Loader2, BookOpen, Target,
    CheckCircle2, AlertCircle, User, Sparkles,
    TrendingUp, TrendingDown, Star
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

export default function StudentStudyPlansPage() {
    const [plans, setPlans]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [total, setTotal]               = useState(0);
    const [expandedPlan, setExpandedPlan] = useState(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const res = await api.get('/ai/student/study-plans?limit=20');
                if (res.data?.success) {
                    setPlans(res.data.plans || []);
                    setTotal(res.data.total || 0);
                }
            } catch { } finally { setLoading(false); }
        };
        init();
    }, []);

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
                    <CalendarCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#fff', marginBottom: 2 }}>
                        My Study Plans 📋
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.78)' }}>
                        Personalized AI study plans created by your tutors · {total} plans
                    </p>
                </div>
            </div>

            {/* Plans */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: P.primary }} />
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}` }}>
                    <CalendarCheck className="w-12 h-12 mx-auto mb-3" style={{ color: `${P.primary}35` }} />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: P.textPrimary, marginBottom: 4 }}>No Study Plans Yet</p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: P.textMuted }}>When your tutor creates a personalized study plan for you, it will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {plans.map(plan => (
                        <div key={plan._id} className="rounded-2xl overflow-hidden transition-all"
                            style={{ backgroundColor: P.cardBg, border: expandedPlan === plan._id ? `2px solid ${P.primary}30` : `1px solid ${P.border}`, boxShadow: S.card }}>

                            {/* Plan header */}
                            <div className="p-5 cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === plan._id ? null : plan._id)}>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: P.gradient }}>
                                        <CalendarCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: 4 }}>
                                            {plan.title}
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {plan.course && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                                    <GraduationCap className="w-3 h-3" style={{ color: P.primary }} />
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>{plan.course}</span>
                                                </span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-full`}
                                                style={{
                                                    backgroundColor: plan.status === 'active' ? 'rgba(16,185,129,0.10)' : plan.status === 'completed' ? 'rgba(59,130,246,0.10)' : 'rgba(245,158,11,0.10)',
                                                    fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold,
                                                    color: plan.status === 'active' ? '#10B981' : plan.status === 'completed' ? '#3B82F6' : '#F59E0B',
                                                }}>
                                                {plan.status || 'active'}
                                            </span>
                                            <span className="flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>
                                                <User className="w-3 h-3" /> By {plan.tutorName}
                                            </span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>{plan.timeAgo}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {plan.durationWeeks && (
                                            <div className="text-center">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: P.primary }}>{plan.durationWeeks}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: P.textMuted }}>weeks</p>
                                            </div>
                                        )}
                                        {plan.weeklyHours && (
                                            <div className="text-center">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#10B981' }}>{plan.weeklyHours}h</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: P.textMuted }}>per week</p>
                                            </div>
                                        )}
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${expandedPlan === plan._id ? 'rotate-180' : ''}`}
                                            style={{ color: P.textMuted }} />
                                    </div>
                                </div>
                            </div>

                            {/* Expanded content */}
                            {expandedPlan === plan._id && (
                                <div className="px-5 pb-5 pt-0">
                                    <div className="h-px mb-4" style={{ backgroundColor: P.border }} />

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Strengths */}
                                        {plan.strengths?.length > 0 && (
                                            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingUp className="w-4 h-4" style={{ color: '#10B981' }} />
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Your Strengths</p>
                                                </div>
                                                {plan.strengths.map((s, i) => (
                                                    <div key={i} className="flex items-start gap-2 mb-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569' }}>{s}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Weaknesses */}
                                        {plan.weaknesses?.length > 0 && (
                                            <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingDown className="w-4 h-4" style={{ color: '#F43F5E' }} />
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Areas to Improve</p>
                                                </div>
                                                {plan.weaknesses.map((w, i) => (
                                                    <div key={i} className="flex items-start gap-2 mb-1.5">
                                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#F43F5E' }} />
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569' }}>{w}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Focus Areas */}
                                    {plan.focusAreas?.length > 0 && (
                                        <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="w-4 h-4" style={{ color: P.primary }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Focus Areas</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {plan.focusAreas.map((area, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-full"
                                                        style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: P.primary }}>
                                                        {area}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Weekly Plan */}
                                    {plan.weeklyPlan?.length > 0 && (
                                        <div className="mt-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CalendarCheck className="w-4 h-4" style={{ color: P.primary }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Weekly Schedule</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {plan.weeklyPlan.map((week, wi) => (
                                                    <div key={wi} className="rounded-xl p-4" style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: P.gradient }}>
                                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: '#fff' }}>{wi + 1}</span>
                                                            </div>
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: P.textPrimary }}>
                                                                Week {wi + 1}
                                                            </p>
                                                        </div>
                                                        {typeof week === 'string' ? (
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.6 }}>{week}</p>
                                                        ) : week.topics ? (
                                                            <div className="space-y-1">
                                                                {(Array.isArray(week.topics) ? week.topics : [week.topics]).map((topic, ti) => (
                                                                    <div key={ti} className="flex items-start gap-2">
                                                                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: P.primary }} />
                                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569' }}>{typeof topic === 'string' ? topic : topic.name || JSON.stringify(topic)}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.6 }}>{JSON.stringify(week)}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
