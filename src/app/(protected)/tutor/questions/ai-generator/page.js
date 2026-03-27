'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles, Save, BrainCircuit, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, FX } from '@/constants/tutorTokens';

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
            if (topicsRes.data.success) setTopics(topicsRes.data.topics);
            if (skillsRes.data.success) setSkills(skillsRes.data.skills);
        } catch (error) { console.error('Failed to load taxonomy', error); }
    };

    const handleGenerate = async () => {
        if (!aiParams.topic) return toast.error('Please provide a topic or text excerpt.');
        setLoading(true);
        setGeneratedQuestions([]);
        try {
            const res = await api.post('/ai/generate-questions', aiParams);
            if (res.data.success && res.data.questions.length > 0) {
                setGeneratedQuestions(res.data.questions.map(q => ({ ...q, type: aiParams.type })));
                toast.success(`Generated ${res.data.questions.length} questions!`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate questions');
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
        easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        hard: 'bg-red-50 text-red-600 border-red-200',
    }[d] || 'bg-slate-100 text-slate-600 border-slate-200');

    return (
        <div className="space-y-6" style={{ fontFamily: T.fontFamily }}>

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <Link href="/tutor/questions">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                </Link>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                            <BrainCircuit className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-800">Bulk AI Question Generator</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">Rapidly build your Question Bank using AI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left Panel ─────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-4">

                    {/* AI Prompt Card */}
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5"
                            style={{ backgroundColor: FX.primary06 }}>
                            <Sparkles className="w-4 h-4" style={{ color: C.btnPrimary }} />
                            <h2 className="text-sm font-bold text-slate-800">1. AI Prompt</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Topic or Text Excerpt</Label>
                                <Textarea
                                    value={aiParams.topic}
                                    onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                                    placeholder="Paste a paragraph or type a topic like 'Newton's Laws'..."
                                    className="h-28 resize-y border-slate-200 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Question Type</Label>
                                <Select value={aiParams.type} onValueChange={(val) => setAiParams({ ...aiParams, type: val })}>
                                    <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                                        <SelectItem value="subjective">Subjective / Open-Ended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Count (max 20)</Label>
                                    <Input type="number" value={aiParams.count}
                                        onChange={(e) => setAiParams({ ...aiParams, count: parseInt(e.target.value) || 1 })}
                                        min={1} max={20} className="h-10 border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Difficulty</Label>
                                    <Select value={aiParams.difficulty} onValueChange={(val) => setAiParams({ ...aiParams, difficulty: val })}>
                                        <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button onClick={handleGenerate} disabled={loading}
                                className="w-full text-white gap-2"
                                style={{ backgroundColor: C.btnPrimary }}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                                Generate Questions
                            </Button>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className={`bg-white rounded-xl border border-slate-100 overflow-hidden transition-opacity ${generatedQuestions.length === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40">
                            <h2 className="text-sm font-bold text-slate-800">2. Assign Metadata to Bank</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Tag these questions before saving.</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Topic <span className="text-red-500">*</span></Label>
                                <Select value={metaParams.topicId} onValueChange={(val) => setMetaParams({ ...metaParams, topicId: val })}>
                                    <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select Topic" /></SelectTrigger>
                                    <SelectContent>{topics.map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Skill <span className="text-red-500">*</span></Label>
                                <Select value={metaParams.skillId} onValueChange={(val) => setMetaParams({ ...metaParams, skillId: val })}>
                                    <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select Skill" /></SelectTrigger>
                                    <SelectContent>{skills.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Points (per question)</Label>
                                <Input type="number" value={metaParams.points}
                                    onChange={(e) => setMetaParams({ ...metaParams, points: parseInt(e.target.value) || 1 })}
                                    min={1} className="h-10 border-slate-200" />
                            </div>
                            <Button onClick={handleSaveAll} disabled={saving || generatedQuestions.length === 0}
                                className="w-full text-white gap-2 bg-emerald-500 hover:bg-emerald-600">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save {generatedQuestions.length} Questions to Bank
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ─────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200">
                            <BrainCircuit className="w-12 h-12 animate-pulse mb-4" style={{ color: FX.primary40 }} />
                            <h3 className="text-base font-bold text-slate-700 mb-1">AI is thinking...</h3>
                            <p className="text-sm text-slate-400 max-w-xs text-center">Analyzing topic and generating high-quality questions.</p>
                        </div>
                    ) : generatedQuestions.length > 0 ? (
                        <>
                            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="text-sm font-semibold text-emerald-800">{generatedQuestions.length} questions generated.</span>
                                <span className="text-xs text-emerald-600 ml-auto">Review and edit before saving.</span>
                            </div>

                            {generatedQuestions.map((q, idx) => (
                                <div key={idx} className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
                                    <div className="px-5 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Question {idx + 1}</span>
                                        <div className="flex gap-1.5">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase ${difficultyStyle(q.difficulty)}`}>
                                                {q.difficulty}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-slate-50 text-slate-600 border-slate-200 uppercase">
                                                {q.type === 'mcq' ? 'MCQ' : 'Subjective'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Text</Label>
                                            <Textarea value={q.question}
                                                onChange={(e) => updateQ(idx, 'question', e.target.value)}
                                                className="border-slate-200 text-sm resize-none min-h-[70px]" />
                                        </div>

                                        {q.type === 'mcq' ? (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Options (select correct)</Label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {q.options.map((opt, oIdx) => (
                                                        <div key={oIdx}
                                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors
                                                                ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                                            <input type="radio" name={`correctOpt-${idx}`}
                                                                checked={opt === q.correctAnswer}
                                                                onChange={() => updateQ(idx, 'correctAnswer', opt)}
                                                                className="w-4 h-4 flex-shrink-0"
                                                                style={{ accentColor: C.btnPrimary }} />
                                                            <input className="flex-1 text-sm bg-transparent outline-none text-slate-700"
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newOpts = [...q.options];
                                                                    const oldVal = newOpts[oIdx];
                                                                    newOpts[oIdx] = e.target.value;
                                                                    updateQ(idx, 'options', newOpts);
                                                                    if (q.correctAnswer === oldVal) updateQ(idx, 'correctAnswer', e.target.value);
                                                                }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ideal Answer / Rubric</Label>
                                                <Textarea className="min-h-[70px] border-slate-200 text-sm resize-none"
                                                    value={q.idealAnswer || ''}
                                                    onChange={(e) => updateQ(idx, 'idealAnswer', e.target.value)} />
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explanation for Students</Label>
                                            <Input value={q.explanation}
                                                onChange={(e) => updateQ(idx, 'explanation', e.target.value)}
                                                className="border-slate-200 h-9 text-sm" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200 p-8">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                style={{ backgroundColor: FX.primary10, border: `1px solid ${FX.primary20}` }}>
                                <AlertCircle className="w-7 h-7" style={{ color: C.btnPrimary }} />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">No Questions Yet</h3>
                            <p className="text-sm text-slate-400 max-w-xs text-center">
                                Configure your AI prompt on the left and hit generate.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}