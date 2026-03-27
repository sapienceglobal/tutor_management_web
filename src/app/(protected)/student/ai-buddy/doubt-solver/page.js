'use client';

import { useState, useRef, useEffect } from 'react';
import {
    HelpCircle, Send, Loader2, Sparkles, BookOpen,
    ChevronDown, RotateCcw, X, Clock,
    Tag, BarChart2, Lightbulb, CheckCircle2, Star,
    MessageSquare, AlertCircle, Zap, RefreshCw,
    Layers, GraduationCap
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, cx } from '@/constants/studentTokens';

// ─── Purple palette for student AI pages ─────────────────────────────────────
const P = {
    primary: '#7C3AED',
    light: '#8B5CF6',
    soft: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg: '#F5F3FF',
    cardBg: '#FFFFFF',
    textPrimary: '#1E1B4B',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
};

const DIFFICULTY_LEVELS = [
    { label: 'Easy',   color: '#10B981', bg: 'rgba(16,185,129,0.10)' },
    { label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
    { label: 'Hard',   color: '#F43F5E', bg: 'rgba(244,63,94,0.10)' },
];

// ─── Answer renderer ─────────────────────────────────────────────────────────
function AnswerBlock({ answer }) {
    const lines = answer.split('\n');
    return (
        <div className="space-y-1.5">
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1" />;
                if (line.startsWith('## ')) {
                    return (
                        <p key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: P.textPrimary, marginTop: 10, marginBottom: 2 }}>
                            {line.replace('## ', '')}
                        </p>
                    );
                }
                if (line.startsWith('- ') || line.startsWith('• ')) {
                    return (
                        <div key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: P.primary }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.65 }}>
                                {line.replace(/^[-•]\s/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
                            </p>
                        </div>
                    );
                }
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.65 }}>
                        {parts.map((part, j) =>
                            part.startsWith('**') && part.endsWith('**')
                                ? <strong key={j} style={{ color: P.textPrimary, fontWeight: T.weight.bold }}>{part.slice(2, -2)}</strong>
                                : part
                        )}
                    </p>
                );
            })}
        </div>
    );
}

// ─── Past Doubt Card ──────────────────────────────────────────────────────────
function PastDoubtCard({ doubt, onClick, isActive }) {
    return (
        <div
            onClick={onClick}
            className="p-3 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
            style={{
                backgroundColor: isActive ? P.soft : '#fff',
                border: isActive ? `1px solid ${P.primary}40` : `1px solid ${P.border}`,
                boxShadow: isActive ? `0 0 0 2px ${P.primary}18` : `0 2px 8px ${P.primary}0A`,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.boxShadow = `0 4px 16px ${P.primary}18`; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.boxShadow = `0 2px 8px ${P.primary}0A`; }}
        >
            <p className="line-clamp-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: P.textPrimary, lineHeight: 1.4 }}>
                {doubt.question}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {doubt.subject && (
                    <span className="px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>
                        {doubt.subject}
                    </span>
                )}
                {doubt.difficulty && (
                    <span className="px-1.5 py-0.5 rounded-full"
                        style={{
                            backgroundColor: doubt.difficulty === 'Easy' ? 'rgba(16,185,129,0.10)' : doubt.difficulty === 'Medium' ? 'rgba(245,158,11,0.10)' : 'rgba(244,63,94,0.10)',
                            fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold,
                            color: doubt.difficulty === 'Easy' ? '#10B981' : doubt.difficulty === 'Medium' ? '#F59E0B' : '#F43F5E',
                        }}>
                        {doubt.difficulty}
                    </span>
                )}
                {doubt.course && (
                    <span className="px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(99,102,241,0.08)', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#6366F1' }}>
                        {doubt.course}
                    </span>
                )}
                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted, marginLeft: 'auto' }}>{doubt.timeAgo}</span>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ h = 12, w = 'full', rounded = 'xl' }) {
    return (
        <div className={`h-${h} w-${w} rounded-${rounded} animate-pulse`}
            style={{ backgroundColor: P.soft }} />
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentDoubtSolverPage() {
    // ── Input state ─────────────────────────────────────────────────
    const [question, setQuestion]             = useState('');
    const [subject, setSubject]               = useState('');
    const [difficulty, setDifficulty]         = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');

    // ── Data from API ───────────────────────────────────────────────
    const [courses, setCourses]               = useState([]);
    const [pastDoubts, setPastDoubts]         = useState([]);
    const [totalDoubts, setTotalDoubts]       = useState(0);
    const [loadingInit, setLoadingInit]       = useState(true);

    // ── Answer state ────────────────────────────────────────────────
    const [solving, setSolving]               = useState(false);
    const [currentDoubt, setCurrentDoubt]     = useState(null);
    const [activeDoubtId, setActiveDoubtId]   = useState(null);
    const [rating, setRating]                 = useState(0);
    const [ratingDone, setRatingDone]         = useState(false);
    const [ratingLoading, setRatingLoading]   = useState(false);

    const answerRef = useRef(null);

    // ── Derive subject list from enrolled courses ───────────────────
    const courseSubjects = [...new Set(
        courses.flatMap(c => c.whatYouWillLearn || []).filter(Boolean)
    )].sort();

    // ── Load initial data ───────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            setLoadingInit(true);
            try {
                const [enrollRes, historyRes] = await Promise.all([
                    api.get('/enrollments/my-enrollments'),
                    api.get('/ai/doubts?limit=8'),
                ]);

                if (enrollRes.data?.enrollments) {
                    const enrolled = enrollRes.data.enrollments
                        .filter(e => e.courseId)
                        .map(e => ({
                            _id: e.courseId._id || e.courseId,
                            title: e.courseId.title || 'Untitled Course',
                            whatYouWillLearn: e.courseId.whatYouWillLearn || [],
                        }));
                    setCourses(enrolled);
                }

                if (historyRes.data?.success) {
                    setPastDoubts(historyRes.data.doubts || []);
                    setTotalDoubts(historyRes.data.total || 0);
                }
            } catch (err) {
                console.error('Failed to load doubt solver:', err);
            } finally {
                setLoadingInit(false);
            }
        };
        init();
    }, []);

    // Scroll to answer
    useEffect(() => {
        if (currentDoubt) answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [currentDoubt]);

    // ── Solve doubt ─────────────────────────────────────────────────
    const solveDoubt = async (forcedQ = null) => {
        const q = (forcedQ || question).trim();
        if (!q || solving) return;

        setSolving(true);
        setCurrentDoubt(null);
        setRating(0);
        setRatingDone(false);
        setActiveDoubtId(null);

        try {
            const res = await api.post('/ai/solve-doubt', {
                question:   q,
                subject:    subject || undefined,
                difficulty: difficulty || undefined,
                courseId:   selectedCourse || undefined,
            });

            if (res.data?.success) {
                setCurrentDoubt({
                    doubtLogId: res.data.doubtLogId,
                    question:   res.data.question,
                    answer:     res.data.answer,
                    subject:    res.data.subject,
                    difficulty: res.data.difficulty,
                });
                setActiveDoubtId(res.data.doubtLogId?.toString());

                // Refresh past doubts
                const histRes = await api.get('/ai/doubts?limit=8');
                if (histRes.data?.success) {
                    setPastDoubts(histRes.data.doubts || []);
                    setTotalDoubts(histRes.data.total || 0);
                }

                if (!forcedQ) setQuestion('');
            } else {
                toast.error('Could not solve doubt. Please try again.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'AI failed to respond. Try again.');
        } finally {
            setSolving(false);
        }
    };

    // ── Load past doubt ─────────────────────────────────────────────
    const loadPastDoubt = async (doubtId) => {
        if (activeDoubtId === doubtId?.toString()) return;
        try {
            const res = await api.get(`/ai/doubts/${doubtId}`);
            if (res.data?.success) {
                const d = res.data.doubt;
                setCurrentDoubt({
                    doubtLogId: d._id,
                    question:   d.question,
                    answer:     d.answer,
                    subject:    d.subject,
                    difficulty: d.difficulty,
                });
                setActiveDoubtId(d._id?.toString());
                setRating(d.rating || 0);
                setRatingDone(!!d.rating);
            }
        } catch {
            toast.error('Failed to load doubt');
        }
    };

    // ── Rate answer ─────────────────────────────────────────────────
    const handleRate = async (star) => {
        if (ratingDone || ratingLoading || !currentDoubt?.doubtLogId) return;
        setRatingLoading(true);
        try {
            await api.patch(`/ai/doubts/${currentDoubt.doubtLogId}/rate`, { rating: star });
            setRating(star);
            setRatingDone(true);
            toast.success('Thanks for your feedback!');
        } catch {
            toast.error('Could not save rating');
        } finally {
            setRatingLoading(false);
        }
    };

    // ── Reset ───────────────────────────────────────────────────────
    const reset = () => {
        setCurrentDoubt(null);
        setQuestion('');
        setRating(0);
        setRatingDone(false);
        setActiveDoubtId(null);
    };

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-[calc(100vh-90px)]" style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── LEFT PANEL ──────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[280px] flex-shrink-0 overflow-y-auto custom-scrollbar pr-1">

                {/* Header */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ background: P.gradient, boxShadow: '0 6px 24px rgba(124,58,237,0.30)', position: 'relative', overflow: 'hidden' }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute rounded-full"
                            style={{ width: i % 2 === 0 ? 3 : 2, height: i % 2 === 0 ? 3 : 2, backgroundColor: 'rgba(255,255,255,0.5)', left: `${12 + i * 16}%`, top: `${20 + (i % 3) * 28}%` }} />
                    ))}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                            <HelpCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#fff' }}>AI Doubt Solver</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'rgba(255,255,255,0.75)' }}>Instant AI-powered answers</p>
                        </div>
                    </div>
                </div>

                {/* Question input */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        Ask Your Doubt
                    </p>
                    <textarea
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) solveDoubt(); }}
                        placeholder="Type your doubt here… (Ctrl+Enter to solve)"
                        rows={4}
                        className="w-full resize-none outline-none"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: P.textPrimary, backgroundColor: 'transparent', lineHeight: 1.6 }}
                    />

                    <div className="flex items-center justify-end mt-3">
                        <button onClick={() => solveDoubt()} disabled={!question.trim() || solving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
                            style={{ background: P.gradient, boxShadow: `0 4px 14px rgba(124,58,237,0.35)` }}>
                            {solving
                                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                : <Zap className="w-3.5 h-3.5 text-white" />}
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff' }}>
                                {solving ? 'Solving…' : 'Solve'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Context filters */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        Context
                    </p>

                    {/* Subject */}
                    <div className="mb-3">
                        <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted, fontWeight: T.weight.semibold }}>Subject / Topic</label>
                        <div className="relative mt-1">
                            {loadingInit ? <Skeleton h={8} /> : (
                                <>
                                    <select value={subject} onChange={e => setSubject(e.target.value)}
                                        className="w-full appearance-none px-3 py-2 rounded-xl pr-7 outline-none"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textPrimary, border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                        <option value="">All Subjects</option>
                                        {courseSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: P.textMuted }} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Course */}
                    <div className="mb-3">
                        <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted, fontWeight: T.weight.semibold }}>Course Context</label>
                        <div className="relative mt-1">
                            {loadingInit ? <Skeleton h={8} /> : (
                                <>
                                    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                                        className="w-full appearance-none px-3 py-2 rounded-xl pr-7 outline-none"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textPrimary, border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                        <option value="">No Course</option>
                                        {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: P.textMuted }} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div>
                        <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted, fontWeight: T.weight.semibold }}>Difficulty</label>
                        <div className="flex gap-2 mt-1.5">
                            {DIFFICULTY_LEVELS.map(d => (
                                <button key={d.label} onClick={() => setDifficulty(prev => prev === d.label ? '' : d.label)}
                                    className="flex-1 py-1.5 rounded-xl text-center transition-all"
                                    style={{
                                        fontFamily:      T.fontFamily,
                                        fontSize:        T.size.xs,
                                        fontWeight:      T.weight.bold,
                                        color:           difficulty === d.label ? '#fff' : d.color,
                                        backgroundColor: difficulty === d.label ? d.color : d.bg,
                                        border:          `1px solid ${d.color}30`,
                                    }}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart2 className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: P.textPrimary }}>Your Stats</p>
                    </div>
                    {loadingInit ? (
                        <div className="space-y-2.5"><Skeleton h={5} /><Skeleton h={5} /><Skeleton h={5} /></div>
                    ) : (
                        [
                            { label: 'Total Doubts Asked', value: totalDoubts, color: P.primary },
                            { label: 'Enrolled Courses',  value: courses.length, color: '#10B981' },
                        ].map(st => (
                            <div key={st.label} className="flex items-center justify-between mb-2.5 last:mb-0">
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textSecondary }}>{st.label}</span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: st.color }}>{st.value}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── CENTER PANEL ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
                style={{ backgroundColor: P.pageBg, border: `1px solid ${P.border}`, boxShadow: `0 4px 24px ${P.primary}0D` }}>

                {/* Topbar */}
                <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
                    style={{ backgroundColor: P.cardBg, borderBottom: `1px solid ${P.border}` }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: P.gradient, boxShadow: `0 2px 8px rgba(124,58,237,0.35)` }}>
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: P.textPrimary }}>AI Explanation</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textMuted }}>
                                {solving ? 'Analyzing your doubt…' : currentDoubt ? 'Solution ready ✨' : 'Ask a doubt to get started'}
                            </p>
                        </div>
                    </div>
                    {currentDoubt && (
                        <button onClick={reset}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                            style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                            <RotateCcw className="w-3.5 h-3.5" style={{ color: P.primary }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: P.primary }}>New Doubt</span>
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">

                    {/* ── Empty state ── */}
                    {!currentDoubt && !solving && (
                        <div className="h-full flex flex-col justify-center">
                            {/* Welcome banner */}
                            <div className="rounded-2xl p-5 mb-4 flex items-center gap-4"
                                style={{ background: P.gradient, boxShadow: `0 8px 32px rgba(124,58,237,0.25)`, position: 'relative', overflow: 'hidden' }}>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="absolute rounded-full"
                                        style={{ width: 2, height: 2, backgroundColor: 'rgba(255,255,255,0.55)', left: `${8 + i * 12}%`, top: `${18 + (i % 3) * 32}%` }} />
                                ))}
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                                    <HelpCircle className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#fff', marginBottom: 4 }}>
                                        AI Doubt Solver 🧠
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.78)' }}>
                                        Type any academic doubt and get a detailed AI explanation instantly.
                                    </p>
                                </div>
                            </div>

                            {/* Quick course-based starts */}
                            {loadingInit ? (
                                <div className="space-y-2"><Skeleton h={10} /><Skeleton h={10} /></div>
                            ) : courses.length > 0 ? (
                                <>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: T.weight.bold, marginBottom: 10 }}>
                                        Quick Start — Your Courses
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                        {courses.slice(0, 4).map(course => (
                                            <button key={course._id}
                                                onClick={() => { setSelectedCourse(course._id); setQuestion(`Explain the key concepts of ${course.title}`); }}
                                                className="text-left px-4 py-3 rounded-xl transition-all hover:opacity-80 hover:-translate-y-0.5"
                                                style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: `0 2px 8px ${P.primary}0A`, fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569' }}>
                                                <div className="flex items-start gap-2">
                                                    <GraduationCap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: P.primary }} />
                                                    <div>
                                                        <p className="line-clamp-1" style={{ fontWeight: T.weight.semibold, color: P.textPrimary }}>{course.title}</p>
                                                        <p style={{ fontSize: '10px', color: P.textMuted, marginTop: 2 }}>Ask about this course</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : null}

                            {/* Tips */}
                            <div className="rounded-2xl p-4"
                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary, marginBottom: 8 }}>💡 Tips for better answers</p>
                                {[
                                    'Be specific — mention the topic, chapter, or concept',
                                    'Set difficulty level for a targeted explanation',
                                    'Select your course for curriculum-aware answers',
                                    'Press Ctrl+Enter to quickly submit your doubt',
                                ].map(tip => (
                                    <div key={tip} className="flex items-center gap-2 mb-1.5 last:mb-0">
                                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#10B981' }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textSecondary }}>{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Solving loader ── */}
                    {solving && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ background: P.gradient, boxShadow: `0 8px 24px rgba(124,58,237,0.35)` }}>
                                <Sparkles className="w-8 h-8 text-white animate-pulse" />
                            </div>
                            <div className="text-center">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: P.textPrimary, marginBottom: 4 }}>
                                    AI is solving your doubt…
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textMuted }}>Powered by Groq · usually 2–5s</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
                                style={{ backgroundColor: '#fff', border: `1px solid ${P.border}` }}>
                                {[0, 1, 2].map(i => (
                                    <span key={i} className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: P.primary, animation: `ds-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                                ))}
                                <style>{`@keyframes ds-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
                            </div>
                        </div>
                    )}

                    {/* ── Answer ── */}
                    {currentDoubt && !solving && (
                        <div ref={answerRef} className="space-y-4">
                            {/* Question recap */}
                            <div className="flex items-start gap-3 p-4 rounded-2xl"
                                style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: `0 2px 8px ${P.primary}0A` }}>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: P.soft }}>
                                    <MessageSquare className="w-4 h-4" style={{ color: P.primary }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Doubt</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: P.textPrimary, marginTop: 2, lineHeight: 1.5 }}>
                                        {currentDoubt.question}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        {currentDoubt.subject && (
                                            <span className="px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: P.soft, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>
                                                {currentDoubt.subject}
                                            </span>
                                        )}
                                        {currentDoubt.difficulty && (
                                            <span className="px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: currentDoubt.difficulty === 'Easy' ? 'rgba(16,185,129,0.10)' : currentDoubt.difficulty === 'Medium' ? 'rgba(245,158,11,0.10)' : 'rgba(244,63,94,0.10)',
                                                    fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold,
                                                    color: currentDoubt.difficulty === 'Easy' ? '#10B981' : currentDoubt.difficulty === 'Medium' ? '#F59E0B' : '#F43F5E',
                                                }}>
                                                {currentDoubt.difficulty}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* AI Answer */}
                            <div className="p-5 rounded-2xl"
                                style={{ backgroundColor: '#fff', border: `1px solid ${P.primary}20`, boxShadow: `0 4px 20px ${P.primary}14` }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{ background: P.gradient }}>
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.textPrimary }}>AI Explanation</p>
                                    <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
                                        <CheckCircle2 className="w-3 h-3" style={{ color: '#10B981' }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#10B981' }}>Solved</span>
                                    </span>
                                </div>
                                <AnswerBlock answer={currentDoubt.answer} />
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-3 p-4 rounded-2xl"
                                style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: `0 2px 8px ${P.primary}0A` }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: P.textMuted }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textSecondary }}>
                                    Was this helpful?
                                </p>
                                <div className="flex items-center gap-1 ml-auto">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star}
                                            onClick={() => handleRate(star)}
                                            disabled={ratingDone || ratingLoading}
                                            className="transition-transform hover:scale-110 disabled:cursor-default">
                                            <Star className="w-4 h-4 transition-all"
                                                style={{ color: star <= rating ? '#F59E0B' : '#CBD5E1', fill: star <= rating ? '#F59E0B' : 'none' }} />
                                        </button>
                                    ))}
                                </div>
                                {ratingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: P.textMuted }} />}
                                {ratingDone && !ratingLoading && (
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#10B981', fontWeight: T.weight.semibold }}>
                                        Thanks!
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[240px] flex-shrink-0 overflow-y-auto custom-scrollbar pl-1">

                {/* Recent Doubts */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" style={{ color: P.primary }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: P.textPrimary }}>Recent Doubts</p>
                        </div>
                        {totalDoubts > 0 && (
                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textMuted }}>
                                {totalDoubts} total
                            </span>
                        )}
                    </div>

                    {loadingInit ? (
                        <div className="space-y-2"><Skeleton h={16} /><Skeleton h={16} /><Skeleton h={16} /></div>
                    ) : pastDoubts.length === 0 ? (
                        <div className="text-center py-6">
                            <HelpCircle className="w-8 h-8 mx-auto mb-2" style={{ color: `${P.primary}40` }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textMuted }}>
                                No doubts yet.<br />Ask your first one!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pastDoubts.map(doubt => (
                                <PastDoubtCard
                                    key={doubt._id}
                                    doubt={doubt}
                                    isActive={activeDoubtId === doubt._id?.toString()}
                                    onClick={() => loadPastDoubt(doubt._id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Enrolled Courses */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: P.textPrimary }}>Your Courses</p>
                    </div>

                    {loadingInit ? (
                        <div className="flex flex-wrap gap-1.5">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} h={6} w="20" rounded="full" />)}
                        </div>
                    ) : courses.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textMuted, textAlign: 'center', padding: '12px 0' }}>
                            No courses enrolled.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {courses.map(c => (
                                <button key={c._id}
                                    onClick={() => { setSelectedCourse(c._id); setQuestion(`Explain the key concepts of ${c.title}`); }}
                                    className="px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: P.primary }}>
                                    {c.title.length > 20 ? c.title.slice(0, 18) + '…' : c.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* How it works */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: P.cardBg, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: P.textPrimary }}>How it Works</p>
                    </div>
                    {[
                        { step: '1', text: 'Type your doubt or click a course',        color: P.primary },
                        { step: '2', text: 'Set subject, course & difficulty',          color: '#8B5CF6' },
                        { step: '3', text: 'AI generates a step-by-step explanation',   color: '#10B981' },
                        { step: '4', text: 'Rate the answer — saved to your history',   color: '#F59E0B' },
                    ].map(item => (
                        <div key={item.step} className="flex items-start gap-2.5 mb-2.5 last:mb-0">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: item.color, marginTop: 1 }}>
                                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: '#fff' }}>{item.step}</span>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.textSecondary, lineHeight: 1.5 }}>{item.text}</p>
                        </div>
                    ))}
                </div>

                {/* AI status */}
                <div className="rounded-2xl p-4"
                    style={{ background: `linear-gradient(135deg,${P.soft},rgba(139,92,246,0.08))`, border: `1px solid ${P.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#5B21B6' }}>Powered by Groq AI</p>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.textSecondary, lineHeight: 1.5 }}>
                        Using <strong>llama-3.3-70b-versatile</strong> for fast, accurate academic explanations.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#10B981' }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#10B981', fontWeight: T.weight.semibold }}>
                            Online · Fast Response
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
