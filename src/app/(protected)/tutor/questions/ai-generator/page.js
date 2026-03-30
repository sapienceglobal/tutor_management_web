'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, Save, BrainCircuit, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: '#E3DFF8',
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

export default function BulkAIGeneratorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [topics, setTopics] = useState([]);
    const [skills, setSkills] = useState([]);
    const [aiParams, setAiParams] = useState({ topic: '', count: 5, difficulty: 'medium', type: 'mcq' });
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [metaParams, setMetaParams] = useState({ topicId: '', skillId: '', points: 1 });

    useEffect(() => { fetchTaxonomy(); }, []);

    const fetchTaxonomy = async () => {
        try {
            const [topicsRes, skillsRes] = await Promise.all([api.get('/taxonomy/topics'), api.get('/taxonomy/skills')]);
            if (topicsRes?.data?.success) setTopics(topicsRes.data.topics);
            if (skillsRes?.data?.success) setSkills(skillsRes.data.skills);
        } catch (error) { console.error('Failed to load taxonomy', error); }
    };

    const handleGenerate = async () => {
        if (!aiParams.topic) return toast.error('Please provide a topic or text excerpt.');
        setLoading(true);
        setGeneratedQuestions([]);
        try {
            const res = await api.post('/ai/generate-questions', aiParams);
            if (res?.data?.success && res.data.questions.length > 0) {
                setGeneratedQuestions(res.data.questions.map(q => ({ ...q, type: aiParams.type })));
                toast.success(`Generated ${res.data.questions.length} questions!`);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to generate questions');
        } finally { setLoading(false); }
    };

    const handleSaveAll = async () => {
        if (generatedQuestions.length === 0) return toast.error('No questions to save');
        if (!metaParams.topicId) return toast.error('Please assign a Topic');
        if (!metaParams.skillId) return toast.error('Please assign a Skill');

        setSaving(true);
        let successCount = 0, failCount = 0;
        try {
            for (const q of generatedQuestions) {
                const payload = {
                    question: q.question, explanation: q.explanation,
                    difficulty: q.difficulty.toLowerCase(), type: q.type,
                    topicId: metaParams.topicId, skillId: metaParams.skillId, points: metaParams.points,
                    ...(q.type === 'mcq'
                        ? { options: q.options.map(opt => ({ text: opt, isCorrect: opt === q.correctAnswer })) }
                        : { idealAnswer: q.idealAnswer })
                };
                try { await api.post('/question-bank/questions', payload); successCount++; }
                catch { failCount++; }
            }
            if (failCount === 0) {
                toast.success(`Saved all ${successCount} questions to Bank!`);
                router.push('/tutor/questions');
            } else {
                toast.error(`Saved ${successCount}, failed ${failCount}.`);
            }
        } catch { toast.error('An error occurred while saving.'); }
        finally { setSaving(false); }
    };

    const updateQ = (index, field, value) => {
        const updated = [...generatedQuestions];
        updated[index][field] = value;
        setGeneratedQuestions(updated);
    };

    const difficultyStyle = (d) => ({
        easy: { bg: C.successBg, color: C.success, border: C.successBorder },
        medium: { bg: C.warningBg, color: C.warning, border: C.warningBorder },
        hard: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
    }[d] || { bg: C.surfaceWhite, color: C.textMuted, border: C.cardBorder });

    return (
        <div className="w-full min-h-screen p-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row sm:items-center justify-between gap-4 p-5 mb-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <Link href="/tutor/questions" className="text-decoration-none">
                        <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                            style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                            <ArrowLeft size={18} color={C.heading} />
                        </button>
                    </Link>
                    <div>
                        <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            <BrainCircuit size={20} color={C.btnPrimary} /> Bulk AI Question Generator
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                            Rapidly build your Question Bank using AI
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left Panel ─────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-6">

                    {/* AI Prompt Card */}
                    <div className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="px-5 py-4" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 className="flex items-center gap-2" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                <Sparkles size={16} color={C.btnPrimary} /> 1. AI Prompt
                            </h2>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Topic or Text Excerpt</label>
                                <textarea
                                    value={aiParams.topic}
                                    onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                                    placeholder="Paste a paragraph or type a topic like 'Newton's Laws'..."
                                    style={{ ...baseInputStyle, resize: 'vertical', minHeight: '120px' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Question Type</label>
                                <select value={aiParams.type} onChange={(e) => setAiParams({ ...aiParams, type: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    <option value="mcq">Multiple Choice (MCQ)</option>
                                    <option value="subjective">Subjective / Open-Ended</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Count (max 20)</label>
                                    <input type="number" min="1" max="20" value={aiParams.count}
                                        onChange={(e) => setAiParams({ ...aiParams, count: parseInt(e.target.value) || 1 })}
                                        style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Difficulty</label>
                                    <select value={aiParams.difficulty} onChange={(e) => setAiParams({ ...aiParams, difficulty: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleGenerate} disabled={loading}
                                className="w-full flex items-center justify-center gap-2 h-11 mt-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />} Generate Questions
                            </button>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="overflow-hidden transition-opacity" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, opacity: generatedQuestions.length === 0 ? 0.4 : 1, pointerEvents: generatedQuestions.length === 0 ? 'none' : 'auto' }}>
                        <div className="px-5 py-4" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>2. Assign Metadata to Bank</h2>
                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Tag these questions before saving.</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Topic *</label>
                                <select value={metaParams.topicId} onChange={(e) => setMetaParams({ ...metaParams, topicId: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    <option value="" disabled>Select Topic</option>
                                    {topics.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Skill *</label>
                                <select value={metaParams.skillId} onChange={(e) => setMetaParams({ ...metaParams, skillId: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    <option value="" disabled>Select Skill</option>
                                    {skills.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Points (per question)</label>
                                <input type="number" min="1" value={metaParams.points}
                                    onChange={(e) => setMetaParams({ ...metaParams, points: parseInt(e.target.value) || 1 })}
                                    style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <button onClick={handleSaveAll} disabled={saving || generatedQuestions.length === 0}
                                className="w-full flex items-center justify-center gap-2 h-11 mt-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                style={{ backgroundColor: C.success, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save {generatedQuestions.length} Questions
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ─────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                            <BrainCircuit size={48} color={C.btnPrimary} className="animate-pulse mb-4" />
                            <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>AI is thinking...</h3>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, maxWidth: 300 }}>Analyzing topic and generating high-quality questions.</p>
                        </div>
                    ) : generatedQuestions.length > 0 ? (
                        <>
                            <div className="flex items-center gap-3 p-4" style={{ backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: R.xl }}>
                                <CheckCircle2 size={20} color={C.success} className="shrink-0" />
                                <div>
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.success, display: 'block', margin: '0 0 2px 0' }}>{generatedQuestions.length} questions generated.</span>
                                    <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.success, opacity: 0.8 }}>Review and edit before saving.</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {generatedQuestions.map((q, idx) => {
                                    const diffSty = difficultyStyle(q.difficulty);
                                    return (
                                        <div key={idx} className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                            <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <span style={{ fontSize: T.size.xs, fontWeight: T.weight.black, color: C.heading, textTransform: 'uppercase' }}>Question {idx + 1}</span>
                                                <div className="flex gap-2">
                                                    <span style={{ fontSize: '10px', fontWeight: T.weight.black, backgroundColor: diffSty.bg, color: diffSty.color, border: `1px solid ${diffSty.border}`, padding: '2px 8px', borderRadius: R.md, textTransform: 'uppercase' }}>
                                                        {q.difficulty}
                                                    </span>
                                                    <span style={{ fontSize: '10px', fontWeight: T.weight.black, backgroundColor: C.surfaceWhite, color: C.heading, border: `1px solid ${C.cardBorder}`, padding: '2px 8px', borderRadius: R.md, textTransform: 'uppercase' }}>
                                                        {q.type === 'mcq' ? 'MCQ' : 'Subjective'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-5 space-y-5">
                                                <div className="space-y-2">
                                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Question Text</label>
                                                    <textarea value={q.question} onChange={(e) => updateQ(idx, 'question', e.target.value)}
                                                        style={{ ...baseInputStyle, resize: 'none', minHeight: '80px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                                </div>

                                                {q.type === 'mcq' ? (
                                                    <div className="space-y-2">
                                                        <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Options (select correct)</label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {q.options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center gap-3 p-3 transition-colors"
                                                                    style={{ 
                                                                        backgroundColor: opt === q.correctAnswer ? C.successBg : C.surfaceWhite, 
                                                                        borderRadius: R.xl, border: `1px solid ${opt === q.correctAnswer ? C.successBorder : C.cardBorder}` 
                                                                    }}>
                                                                    <input type="radio" name={`correctOpt-${idx}`} checked={opt === q.correctAnswer}
                                                                        onChange={() => updateQ(idx, 'correctAnswer', opt)}
                                                                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: C.btnPrimary }} />
                                                                    <input type="text" value={opt}
                                                                        onChange={(e) => {
                                                                            const newOpts = [...q.options];
                                                                            const oldVal = newOpts[oIdx];
                                                                            newOpts[oIdx] = e.target.value;
                                                                            updateQ(idx, 'options', newOpts);
                                                                            if (q.correctAnswer === oldVal) updateQ(idx, 'correctAnswer', e.target.value);
                                                                        }}
                                                                        style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, fontFamily: T.fontFamily }} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Ideal Answer / Rubric</label>
                                                        <textarea value={q.idealAnswer || ''} onChange={(e) => updateQ(idx, 'idealAnswer', e.target.value)}
                                                            style={{ ...baseInputStyle, resize: 'none', minHeight: '80px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Explanation for Students</label>
                                                    <input type="text" value={q.explanation} onChange={(e) => updateQ(idx, 'explanation', e.target.value)}
                                                        style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                            <div className="w-14 h-14 flex items-center justify-center mb-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <AlertCircle size={28} color={C.btnPrimary} />
                            </div>
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No Questions Yet</h3>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, maxWidth: 300 }}>
                                Configure your AI prompt on the left and hit generate.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}