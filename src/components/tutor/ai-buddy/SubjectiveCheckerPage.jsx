'use client';

import { useState, useRef } from 'react';
import {
    CheckSquare, Sparkles, Loader2, Star, RotateCcw,
    Share2, Save, Tag, MoreHorizontal, Lightbulb,
    BarChart2, BookOpen, Brain, Award, Target,
    ChevronDown, Copy, Check, GraduationCap
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// ─── Purple palette ───────────────────────────────────────────────────────────
const P = {
    primary:  '#7C3AED',
    light:    '#8B5CF6',
    soft:     'rgba(124,58,237,0.08)',
    border:   'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg:   '#F5F3FF',
    orange:   '#F97316',
    green:    '#10B981',
    red:      '#EF4444',
    yellow:   '#F59E0B',
    teal:     '#0891B2',
};

// ─── Grade color map ──────────────────────────────────────────────────────────
const GRADE_COLOR = {
    'A+': P.green, 'A': P.green, 'A-': '#059669',
    'B+': '#6366F1', 'B': '#6366F1', 'B-': '#6366F1',
    'C+': P.yellow, 'C': P.yellow,
    'D': P.orange, 'F': P.red,
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 10, w = '100%', r = 10 }) {
    return <div className="animate-pulse" style={{ height: h, width: typeof w === 'number' ? w : w, borderRadius: r, backgroundColor: P.soft }} />;
}

// ─── Star row ─────────────────────────────────────────────────────────────────
function StarRow({ count = 0, max = 5, color = P.yellow }) {
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(max)].map((_, i) => (
                <Star key={i} className="w-3 h-3"
                    style={{ color: i < count ? color : '#E2E8F0', fill: i < count ? color : '#E2E8F0' }} />
            ))}
        </div>
    );
}

// ─── Circular score ───────────────────────────────────────────────────────────
function CircleScore({ score = 0, size = 80, label, sublabel, color, icon: Icon }) {
    const r    = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const dash = ((score / 100) * circ);

    return (
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card, flex: 1 }}>
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color + '20'} strokeWidth={6} />
                    <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
                        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease' }} />
                </svg>
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {Icon && <Icon className="w-5 h-5" style={{ color }} />}
                </div>
            </div>
            {/* Score */}
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color, lineHeight: 1 }}>
                {score}<span style={{ fontSize: T.size.sm }}>%</span>
            </p>
            <StarRow count={Math.round((score / 100) * 5)} color={color} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textAlign: 'center' }}>{label}</p>
            {sublabel && (
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', textAlign: 'center', lineHeight: 1.4 }}>{sublabel}</p>
            )}
        </div>
    );
}

// ─── Stats card (right panel) ─────────────────────────────────────────────────
function StatCard({ title, items, loading }) {
    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
            <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {title}
                </p>
                <button className="p-1 rounded-lg hover:opacity-70">
                    <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                </button>
            </div>
            <div className="p-4 space-y-3">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skel h={32} w={32} r={999} />
                            <div className="flex-1 space-y-1"><Skel h={8} /><Skel h={10} w="60%" /></div>
                        </div>
                    ))
                ) : (
                    items.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: item.color + '15', border: `2px solid ${item.color}30` }}>
                                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                                </div>
                                <div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>{item.label}</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>{item.value}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubjectiveCheckPage() {
    // Input
    const [question, setQuestion]         = useState('');
    const [studentAnswer, setStudentAnswer] = useState('');
    const [idealAnswer, setIdealAnswer]   = useState('');
    const [maxMarks, setMaxMarks]         = useState(10);
    const [subject, setSubject]           = useState('');
    const [gradeLevel, setGradeLevel]     = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Result
    const [loading, setLoading]           = useState(false);
    const [result, setResult]             = useState(null);
    const [copied, setCopied]             = useState(false);

    const answerRef = useRef(null);

    // ── Evaluate ──────────────────────────────────────────────────────
    const handleEvaluate = async () => {
        if (!question.trim())       return toast.error('Please enter the question');
        if (!studentAnswer.trim())  return toast.error('Please enter the student answer');

        setLoading(true);
        setResult(null);

        try {
            const res = await api.post('/ai/subjective-check', {
                question,
                studentAnswer,
                idealAnswer:  idealAnswer  || undefined,
                maxMarks:     Number(maxMarks),
                subject:      subject      || undefined,
                gradeLevel:   gradeLevel   || undefined,
            });

            if (res.data?.success) {
                setResult(res.data.result);
                setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            } else {
                toast.error('Evaluation failed. Please retry.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'AI failed. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    // ── Regrade ───────────────────────────────────────────────────────
    const handleRegrade = () => {
        setResult(null);
        handleEvaluate();
    };

    // ── Copy feedback ─────────────────────────────────────────────────
    const handleCopy = () => {
        if (!result) return;
        const text = `Grade: ${result.grade} (${result.marksAwarded}/${maxMarks})\n\n${result.overallFeedback}\n\nKey Concepts: ${result.dimensions?.keyConcepts?.score}%\nClarity: ${result.dimensions?.clarity?.score}%\nExamples: ${result.dimensions?.examples?.score}%\nDepth: ${result.dimensions?.depthOfKnowledge?.score}%`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Feedback copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const gradeColor  = GRADE_COLOR[result?.grade] || P.primary;
    const dims        = result?.dimensions || {};

    const dimCards = [
        { label: 'Key Concepts',       score: dims.keyConcepts?.score      || 0, stars: dims.keyConcepts?.stars      || 0, feedback: dims.keyConcepts?.feedback,      icon: BookOpen, color: P.green   },
        { label: 'Clarity',            score: dims.clarity?.score          || 0, stars: dims.clarity?.stars          || 0, feedback: dims.clarity?.feedback,          icon: Target,   color: P.orange  },
        { label: 'Examples',           score: dims.examples?.score         || 0, stars: dims.examples?.stars         || 0, feedback: dims.examples?.feedback,         icon: Brain,    color: P.teal    },
        { label: 'Depth of Knowledge', score: dims.depthOfKnowledge?.score || 0, stars: dims.depthOfKnowledge?.stars || 0, feedback: dims.depthOfKnowledge?.feedback, icon: Award,    color: P.yellow  },
    ];

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4 overflow-y-auto custom-scrollbar"
            style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── LEFT + CENTER ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* ── Header card ── */}
                <div className="rounded-2xl overflow-hidden relative"
                    style={{ background: `linear-gradient(135deg,#EDE9FE 0%,#F5F3FF 60%,#EDE9FE 100%)`, border: `1px solid ${P.border}`, boxShadow: S.card, minHeight: 120 }}>
                    {/* Decorative dots */}
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="absolute rounded-full"
                            style={{ width: i % 3 === 0 ? 4 : 2, height: i % 3 === 0 ? 4 : 2, backgroundColor: `rgba(124,58,237,${0.12 + (i % 4) * 0.06})`, left: `${5 + i * 8}%`, top: `${15 + (i % 4) * 20}%` }} />
                    ))}

                    <div className="flex items-center gap-4 p-5">
                        <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: P.gradient }}>
                                    <CheckSquare className="w-4 h-4 text-white" />
                                </div>
                                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#1E293B' }}>
                                    Subjective Answer Checker
                                </h1>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#64748B', marginLeft: 42 }}>
                                AI-powered tool to evaluate & grade subjective answers
                            </p>
                        </div>
                        {/* Robot illustration placeholder */}
                        <div className="w-24 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: P.gradient, opacity: 0.18 }}>
                            <Brain className="w-10 h-10 text-white" style={{ opacity: 0 }} />
                        </div>
                        <div className="absolute right-6 top-4 w-20 h-20 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ background: P.gradient, boxShadow: `0 8px 24px rgba(124,58,237,0.30)` }}>
                                <Brain className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Answer textarea */}
                    <div className="px-5 pb-5">
                        <textarea
                            value={studentAnswer}
                            onChange={e => setStudentAnswer(e.target.value)}
                            placeholder="Paste or type the student's answer here…"
                            rows={3}
                            className="w-full resize-none outline-none px-4 py-3 rounded-xl"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#334155', backgroundColor: 'rgba(255,255,255,0.85)', border: `1px solid ${P.border}`, lineHeight: 1.6 }}
                        />
                    </div>
                </div>

                {/* ── Question + Config ── */}
                <div className="rounded-2xl p-5"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    {/* Question */}
                    <div className="mb-4">
                        <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Question *
                        </label>
                        <textarea
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            placeholder="Enter the question that was asked…"
                            rows={2}
                            className="w-full resize-none outline-none px-4 py-3 rounded-xl mt-2"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft, lineHeight: 1.6 }}
                        />
                    </div>

                    {/* Config row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                            <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Max Marks</label>
                            <input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} min={1} max={100}
                                className="w-full px-3 py-2 rounded-xl outline-none mt-1"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }} />
                        </div>
                        <div>
                            <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Subject</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics"
                                className="w-full px-3 py-2 rounded-xl outline-none mt-1"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }} />
                        </div>
                        <div>
                            <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Grade Level</label>
                            <input type="text" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} placeholder="e.g. 8th Grade"
                                className="w-full px-3 py-2 rounded-xl outline-none mt-1"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }} />
                        </div>
                    </div>

                    {/* Advanced — ideal answer */}
                    <button onClick={() => setShowAdvanced(p => !p)}
                        className="flex items-center gap-1.5 mb-3 hover:opacity-70 transition-opacity">
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} style={{ color: P.primary }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: P.primary }}>
                            {showAdvanced ? 'Hide' : 'Add'} Ideal Answer (optional)
                        </span>
                    </button>
                    {showAdvanced && (
                        <textarea
                            value={idealAnswer}
                            onChange={e => setIdealAnswer(e.target.value)}
                            placeholder="Provide an ideal/model answer for more accurate grading…"
                            rows={3}
                            className="w-full resize-none outline-none px-4 py-3 rounded-xl mb-4"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft, lineHeight: 1.6 }}
                        />
                    )}

                    {/* Grade button */}
                    <button onClick={handleEvaluate} disabled={loading || !question.trim() || !studentAnswer.trim()}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl transition-all disabled:opacity-50 hover:opacity-90"
                        style={{ background: P.gradient, boxShadow: `0 4px 16px rgba(124,58,237,0.35)` }}>
                        {loading
                            ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                            : <Sparkles className="w-5 h-5 text-white" />}
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#fff' }}>
                            {loading ? 'AI is evaluating…' : '✦ Grade Answer'}
                        </span>
                    </button>
                </div>

                {/* ── Loading ── */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-10 rounded-2xl"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                            style={{ background: P.gradient }}>
                            <Sparkles className="w-7 h-7 text-white animate-pulse" />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 4 }}>
                            AI is evaluating the answer…
                        </p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Powered by Groq · usually 3–6s</p>
                        <div className="flex gap-1.5 mt-3">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: P.primary, animation: `sc-b 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                            ))}
                            <style>{`@keyframes sc-b{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
                        </div>
                    </div>
                )}

                {/* ── Result ── */}
                {result && !loading && (
                    <div ref={answerRef} className="flex flex-col gap-4">

                        {/* Evaluated Answer card */}
                        <div className="rounded-2xl overflow-hidden"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div className="flex items-center justify-between px-5 py-3.5"
                                style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#1E293B' }}>
                                    Evaluated Answer
                                </p>
                                <button onClick={handleEvaluate}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:opacity-80"
                                    style={{ background: P.gradient, boxShadow: `0 2px 8px rgba(124,58,237,0.30)` }}>
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff' }}>✦ Grade Answer</span>
                                </button>
                            </div>

                            <div className="flex gap-4 p-5">
                                {/* Left — answer + tags */}
                                <div className="flex-1 min-w-0">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>
                                        {question}
                                    </p>
                                    <div className="p-4 rounded-xl mb-3"
                                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#475569', lineHeight: 1.7 }}>
                                            {studentAnswer}
                                        </p>
                                    </div>
                                    {/* Concept tags */}
                                    <div className="flex flex-wrap gap-2">
                                        {(result.conceptTags || []).map(tag => (
                                            <span key={tag}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                                <Tag className="w-3 h-3" style={{ color: P.primary }} />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: P.primary }}>{tag}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Right — grade + feedback */}
                                <div className="flex flex-col gap-3 flex-shrink-0" style={{ width: 220 }}>
                                    {/* Grade badge */}
                                    <div className="flex items-center justify-center w-20 h-20 rounded-full mx-auto"
                                        style={{ background: `linear-gradient(135deg,${gradeColor}22,${gradeColor}11)`, border: `3px solid ${gradeColor}` }}>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: gradeColor }}>
                                            {result.grade}
                                        </span>
                                    </div>

                                    {/* AI feedback */}
                                    <div className="p-3 rounded-xl"
                                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary, marginBottom: 4 }}>
                                            AI Evaluated Response
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.6 }}>
                                            {result.overallFeedback}
                                        </p>
                                    </div>

                                    {/* Marks */}
                                    <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                                        style={{ backgroundColor: gradeColor + '12', border: `1px solid ${gradeColor}25` }}>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>Marks</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: gradeColor }}>
                                            {result.marksAwarded}/{maxMarks}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Performance Analysis */}
                        <div className="rounded-2xl p-5"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                                Performance Analysis
                            </p>
                            <div className="flex gap-3">
                                {dimCards.map(d => (
                                    <CircleScore key={d.label}
                                        score={d.score} label={d.label}
                                        sublabel={d.feedback} color={d.color}
                                        icon={d.icon} />
                                ))}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 mt-5 pt-4"
                                style={{ borderTop: `1px solid ${P.border}` }}>
                                <button onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all hover:opacity-80 flex-1"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                    {copied ? <Check className="w-4 h-4" style={{ color: P.green }} /> : <Save className="w-4 h-4" style={{ color: P.primary }} />}
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>
                                        {copied ? 'Copied!' : 'Save Feedback'}
                                    </span>
                                </button>
                                <button onClick={handleRegrade} disabled={loading}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all hover:opacity-80 flex-1"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                    <RotateCcw className="w-4 h-4" style={{ color: P.primary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: P.primary }}>Regrade</span>
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(result.overallFeedback); toast.success('Feedback copied for student!'); }}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all hover:opacity-80 flex-1"
                                    style={{ background: P.gradient, boxShadow: `0 2px 8px rgba(124,58,237,0.25)` }}>
                                    <Share2 className="w-4 h-4 text-white" />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff' }}>Share with Student</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 flex-shrink-0" style={{ width: 256 }}>

                {/* STATS — Overview */}
                <StatCard title="STATS" loading={loading && !result}
                    items={result ? [
                        { icon: BarChart2,      label: 'Information',  value: `${result.informationRetained}%`,   color: P.primary },
                        { icon: Target,         label: 'Difficulty',   value: result.difficulty,                  color: P.orange  },
                        { icon: GraduationCap,  label: 'Grade Level',  value: result.gradeLevelAssessment,        color: P.teal    },
                    ] : [
                        { icon: BarChart2,      label: 'Information',  value: '—', color: P.primary },
                        { icon: Target,         label: 'Difficulty',   value: '—', color: P.orange  },
                        { icon: GraduationCap,  label: 'Grade Level',  value: '—', color: P.teal    },
                    ]}
                />

                {/* STATS — Detailed */}
                <StatCard title="STATS" loading={loading && !result}
                    items={result ? [
                        { icon: BookOpen,  label: 'Information Retained', value: `${result.informationRetained}%`, color: P.primary },
                        { icon: Target,    label: 'Difficulty',           value: result.difficulty,                color: P.orange  },
                        { icon: GraduationCap, label: 'Grade Level',      value: result.gradeLevelAssessment,      color: P.teal    },
                    ] : [
                        { icon: BookOpen,  label: 'Information Retained', value: '—', color: P.primary },
                        { icon: Target,    label: 'Difficulty',           value: '—', color: P.orange  },
                        { icon: GraduationCap, label: 'Grade Level',      value: '—', color: P.teal    },
                    ]}
                />

                {/* Tips */}
                <div className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" style={{ color: P.yellow }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Tips</p>
                        </div>
                        <button className="p-1 rounded-lg hover:opacity-70">
                            <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        </button>
                    </div>
                    <div className="p-4">
                        {result ? (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.7 }}>
                                ✨ {result.tips}
                            </p>
                        ) : (
                            <>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.7 }}>
                                    ✨ Ask for specific terms and relevant examples to ensure concise, focused answers.
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8', lineHeight: 1.7, marginTop: 6 }}>
                                    Add an ideal answer for more accurate AI grading.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats — action panel */}
                <div className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4" style={{ color: P.primary }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Stats</p>
                        </div>
                        <button className="p-1 rounded-lg hover:opacity-70">
                            <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        {[
                            { icon: Save,     label: 'Save Feedback',      color: P.primary },
                            { icon: RotateCcw,label: 'Regrade',            color: P.orange  },
                            { icon: Share2,   label: 'Share with Student', color: P.green   },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <button key={item.label}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#475569' }}>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Strengths & Improvements — only when result available */}
                {result && (
                    <div className="rounded-2xl p-4"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        {result.strengths?.length > 0 && (
                            <>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Strengths</p>
                                {result.strengths.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: P.green }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569', lineHeight: 1.5 }}>{s}</p>
                                    </div>
                                ))}
                            </>
                        )}
                        {result.improvements?.length > 0 && (
                            <>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 10 }}>Improve</p>
                                {result.improvements.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: P.orange }} />
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569', lineHeight: 1.5 }}>{s}</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Groq badge */}
                <div className="rounded-2xl p-4"
                    style={{ background: `linear-gradient(135deg,${P.soft},rgba(99,102,241,0.06))`, border: `1px solid ${P.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: P.primary }}>Powered by Groq AI</p>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5 }}>
                        Evaluates using <strong>llama-3.3-70b-versatile</strong> — grades, feedback, and dimension scores in seconds.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: P.green }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.green, fontWeight: T.weight.semibold }}>Online · Fast Response</span>
                    </div>
                </div>
            </div>
        </div>
    );
}