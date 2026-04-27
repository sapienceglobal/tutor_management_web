'use client';

import { useState, useEffect } from 'react';
import {
    CalendarCheck, ChevronDown, ChevronRight, Clock,
    GraduationCap, Loader2, BookOpen, Target,
    CheckCircle2, AlertCircle, User, Sparkles,
    TrendingUp, TrendingDown, Brain, Award, CheckCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';

const P = {
    primary: '#7C3AED', light: '#8B5CF6',
    soft: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg: '#F5F3FF', cardBg: '#FFFFFF', C.innerBox: '#E3DFF8',
    textPrimary: '#1E1B4B', textSecondary: '#6B7280', textMuted: '#9CA3AF',
};

export default function StudentStudyPlansPage() {
    // Tutor Plans State
    const [tutorPlans, setTutorPlans]       = useState([]);
    const [totalTutorPlans, setTotal]       = useState(0);
    const [expandedPlan, setExpandedPlan]   = useState(null);
    
    // AI Plan State
    const [aiPlan, setAiPlan]               = useState(null);
    const [generatingPlan, setGeneratingPlan]= useState(false);
    const [performanceData, setPerformanceData] = useState([]);
    const [courses, setCourses]             = useState([]);
    const [loading, setLoading]             = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Fetch everything in parallel: Tutor Plans, Exam History, and Enrollments
                const [plansRes, historyRes, coursesRes] = await Promise.all([
                    api.get('/ai/student/study-plans?limit=20'),
                    api.get('/exams/student/history-all'),
                    api.get('/enrollments/my-enrollments')
                ]);

                if (plansRes.data?.success) {
                    setTutorPlans(plansRes.data.plans || []);
                    setTotal(plansRes.data.total || 0);
                }
                if (historyRes.data?.success) {
                    setPerformanceData(historyRes.data.attempts || []);
                }
                if (coursesRes.data?.success) {
                    setCourses((coursesRes.data.enrollments || []).map(e => e.courseId));
                }
            } catch (err) { 
                console.error("Failed to fetch initial data", err);
            } finally { 
                setLoading(false); 
            }
        };
        init();
    }, []);

    const handleGenerateAIPlan = async () => {
        setGeneratingPlan(true);
        try {
            const response = await api.post('/ai/generate-study-plan', {
                performanceData,
                courses,
                goals: ['improve_scores', 'master_weak_areas'],
            });
            if (response.data?.success) {
                setAiPlan(response.data.studyPlan);
                toast.success('Magic AI Plan Generated! 🎯');
            }
        } catch { 
            toast.error('Failed to generate AI study plan'); 
        } finally { 
            setGeneratingPlan(false); 
        }
    };

    return (
        <div className="p-6 space-y-8" style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg, minHeight: '100vh' }}>

            {/* ─── HEADER ────────────────────────────────────────────────────── */}
            <div className="rounded-2xl p-5 flex items-center gap-4 shadow-sm"
                style={{ background: P.gradient, position: 'relative', overflow: 'hidden' }}>
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
                        Study Plans & Routine 📋
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.78)' }}>
                        Manage your AI-generated routines and Tutor-assigned paths.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: P.primary }} />
                </div>
            ) : (
                <div className="space-y-10">

                    {/* ═══ SECTION 1: AI GENERATED PLAN ══════════════════════════ */}
                    <section>
                        <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Brain size={20} color={P.primary} /> Personal AI Assistant Plan
                        </h2>

                        {!aiPlan ? (
                            /* Empty State - Generate Button */
                            <div className="rounded-[32px] overflow-hidden relative shadow-md border" style={{ backgroundcolor: C.headingDark, borderColor: 'rgba(255,255,255,0.1)' }}>
                                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                <div className="relative text-center py-16 px-6 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                                        <Sparkles className="w-8 h-8 text-amber-300" />
                                    </div>
                                    <h3 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: '#fff', marginBottom: 12 }}>
                                        Generate Your Smart Routine
                                    </h3>
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.6)', marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>
                                        Our AI analyzes your test history and weak areas to create a high-impact daily study path.
                                    </p>
                                    <button onClick={handleGenerateAIPlan} disabled={generatingPlan}
                                        className="flex items-center gap-2 px-8 h-12 text-white rounded-xl transition-all disabled:opacity-60 shadow-xl cursor-pointer border-none"
                                        style={{ background: P.gradient, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                        {generatingPlan ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Performance...</>
                                        ) : (
                                            <><Sparkles className="w-5 h-5" /> Generate Magic Plan</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Generated AI Plan Dashboard */
                            <div className="space-y-6">
                                {/* Premium Hero */}
                                <div className="rounded-3xl overflow-hidden relative shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                    
                                    <div className="relative p-6 md:p-8">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                                <Brain className="w-6 h-6 text-amber-300" />
                                            </div>
                                            <div>
                                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: '#ffffff', margin: '0 0 2px 0' }}>Active AI Routine</h2>
                                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Optimized for your current performance trend: <span className="text-amber-300">{aiPlan.performanceAnalysis?.trends}</span></p>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Duration',    value: aiPlan.duration,  icon: Clock },
                                                { label: 'Daily Goal',  value: aiPlan.dailyGoal, icon: Target },
                                                { label: 'Focus Areas', value: `${aiPlan.focusAreas?.length || 0} Topics`, icon: BookOpen },
                                                { label: 'Expected',    value: aiPlan.expectedImprovement, icon: TrendingUp },
                                            ].map((s, i) => (
                                                <div key={i} className="rounded-2xl p-4 text-center border border-white/5 bg-white/5 backdrop-blur-sm">
                                                    <s.icon className="w-5 h-5 mx-auto mb-2 text-amber-300 opacity-80" />
                                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>{s.label}</p>
                                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: '#ffffff', margin: 0 }}>{s.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Priority Focus Areas */}
                                    <div className="rounded-3xl p-6 shadow-sm border bg-white" style={{ borderColor: P.border }}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-100">
                                                <Target className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: P.textPrimary }}>Priority Focus Areas</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {aiPlan.focusAreas?.map((focus, i) => (
                                                <div key={i} className="rounded-2xl p-4 border bg-gray-50 transition-transform hover:-translate-y-0.5" style={{ borderColor: P.border }}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary, margin: 0 }}>{focus.area}</h4>
                                                        <span className={`px-2.5 py-1 rounded-md shrink-0 text-[9px] font-black uppercase tracking-wider ${focus.priority === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                                            {focus.priority}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: P.textSecondary, margin: 0 }}>{focus.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actionable Steps & Weekly Schedule */}
                                    <div className="space-y-6">
                                        <div className="rounded-3xl p-6 shadow-sm border bg-white" style={{ borderColor: P.border }}>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-100">
                                                    <Award className="w-4 h-4 text-green-600" />
                                                </div>
                                                <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: P.textPrimary }}>Recommendations</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {aiPlan.recommendations?.slice(0,3).map((action, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl border bg-gray-50" style={{ borderColor: P.border }}>
                                                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                        <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.textPrimary }}>{action}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-3xl p-6 shadow-sm border bg-white" style={{ borderColor: P.border }}>
                                            <h3 style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: '16px' }}>Weekly Rhythm</h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {Object.entries(aiPlan.weeklySchedule || {}).map(([day, task], i) => (
                                                    <div key={i} className="flex gap-3 text-sm">
                                                        <span className="font-bold w-20 shrink-0" style={{ color: P.primary }}>{day}</span>
                                                        <span style={{ color: P.textSecondary }}>{task}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>


                    {/* ═══ SECTION 2: TUTOR ASSIGNED PLANS ═══════════════════════ */}
                    <section>
                        <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px', borderTop: `1px solid ${P.border}` }}>
                            <User size={20} color={P.textSecondary} /> Assigned by Tutors
                        </h2>

                        {tutorPlans.length === 0 ? (
                            <div className="text-center py-12 rounded-2xl bg-white border" style={{ borderColor: P.border }}>
                                <CalendarCheck className="w-10 h-10 mx-auto mb-3" style={{ color: `${P.primary}35` }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: P.textPrimary }}>No Assigned Plans</p>
                                <p style={{ fontSize: T.size.xs, color: P.textMuted }}>Plans directly assigned by your tutors will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {tutorPlans.map(plan => (
                                    <div key={plan._id} className="rounded-2xl overflow-hidden transition-all bg-white"
                                        style={{ border: expandedPlan === plan._id ? `2px solid ${P.primary}30` : `1px solid ${P.border}`, boxShadow: S.card }}>

                                        {/* Plan Header */}
                                        <div className="p-5 cursor-pointer" onClick={() => setExpandedPlan(expandedPlan === plan._id ? null : plan._id)}>
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: P.gradient }}>
                                                    <CalendarCheck className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: 4 }}>
                                                        {plan.title}
                                                    </p>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        {plan.course && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100">
                                                                <GraduationCap className="w-3 h-3 text-purple-600" />
                                                                <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>{plan.course}</span>
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${plan.status === 'active' ? 'bg-green-50 text-green-600' : plan.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                            {plan.status || 'active'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[10px]" style={{ color: P.textMuted }}>
                                                            <User className="w-3 h-3" /> By {plan.tutorName}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    {plan.durationWeeks && (
                                                        <div className="text-center hidden sm:block">
                                                            <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: P.primary }}>{plan.durationWeeks}</p>
                                                            <p style={{ fontSize: '9px', color: P.textMuted }}>weeks</p>
                                                        </div>
                                                    )}
                                                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${expandedPlan === plan._id ? 'rotate-180' : ''}`} style={{ color: P.textMuted }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        {expandedPlan === plan._id && (
                                            <div className="px-5 pb-5 pt-0">
                                                <div className="h-px mb-4" style={{ backgroundColor: P.border }} />

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {plan.strengths?.length > 0 && (
                                                        <div className="rounded-xl p-4 bg-green-50 border border-green-100">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Your Strengths</p>
                                                            </div>
                                                            {plan.strengths.map((s, i) => (
                                                                <div key={i} className="flex items-start gap-2 mb-1.5">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                                                                    <p style={{ fontSize: T.size.xs, color: P.textSecondary }}>{s}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {plan.weaknesses?.length > 0 && (
                                                        <div className="rounded-xl p-4 bg-red-50 border border-red-100">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <TrendingDown className="w-4 h-4 text-red-500" />
                                                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Areas to Improve</p>
                                                            </div>
                                                            {plan.weaknesses.map((w, i) => (
                                                                <div key={i} className="flex items-start gap-2 mb-1.5">
                                                                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                                                                    <p style={{ fontSize: T.size.xs, color: P.textSecondary }}>{w}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {plan.weeklyPlan?.length > 0 && (
                                                    <div className="mt-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <CalendarCheck className="w-4 h-4" style={{ color: P.primary }} />
                                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>Weekly Schedule</p>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {plan.weeklyPlan.map((week, wi) => (
                                                                <div key={wi} className="rounded-xl p-4 bg-gray-50 border" style={{ borderColor: P.border }}>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: P.gradient }}>
                                                                            <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: '#fff' }}>{wi + 1}</span>
                                                                        </div>
                                                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: P.textPrimary }}>Week {wi + 1}</p>
                                                                    </div>
                                                                    {typeof week === 'string' ? (
                                                                        <p style={{ fontSize: T.size.xs, color: P.textSecondary }}>{week}</p>
                                                                    ) : week.topics ? (
                                                                        <div className="space-y-1">
                                                                            {(Array.isArray(week.topics) ? week.topics : [week.topics]).map((topic, ti) => (
                                                                                <div key={ti} className="flex items-start gap-2">
                                                                                    <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: P.primary }} />
                                                                                    <p style={{ fontSize: T.size.xs, color: P.textSecondary }}>{typeof topic === 'string' ? topic : topic.name || JSON.stringify(topic)}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : null}
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
                    </section>
                </div>
            )}
        </div>
    );
}