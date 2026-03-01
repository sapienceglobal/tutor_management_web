'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles, Save, BrainCircuit, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function BulkAIGeneratorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [topics, setTopics] = useState([]);
    const [skills, setSkills] = useState([]);

    const [aiParams, setAiParams] = useState({
        topic: '',
        count: 5,
        difficulty: 'medium',
        type: 'mcq'
    });

    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [metaParams, setMetaParams] = useState({
        topicId: '',
        skillId: '',
        points: 1
    });

    useEffect(() => {
        fetchTaxonomy();
    }, []);

    const fetchTaxonomy = async () => {
        try {
            const [topicsRes, skillsRes] = await Promise.all([
                api.get('/taxonomy/topics'),
                api.get('/taxonomy/skills')
            ]);
            if (topicsRes.data.success) setTopics(topicsRes.data.topics);
            if (skillsRes.data.success) setSkills(skillsRes.data.skills);
        } catch (error) {
            console.error('Failed to load taxonomy', error);
        }
    };

    const handleGenerate = async () => {
        if (!aiParams.topic) return toast.error('Please provide a topic or text excerpt.');

        setLoading(true);
        setGeneratedQuestions([]);

        try {
            const res = await api.post('/ai/generate-questions', aiParams);
            if (res.data.success && res.data.questions.length > 0) {
                setGeneratedQuestions(res.data.questions.map(q => ({
                    ...q,
                    // Ensure the type flag matches what we requested
                    type: aiParams.type
                })));
                toast.success(`Successfully generated ${res.data.questions.length} questions!`);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to generate questions');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        if (generatedQuestions.length === 0) return toast.error('No questions to save');
        if (!metaParams.topicId) return toast.error('Please assign a Topic for these questions');
        if (!metaParams.skillId) return toast.error('Please assign a Skill for these questions');

        setSaving(true);

        let successCount = 0;
        let failCount = 0;

        try {
            // We'll save them sequentially or with Promise.all
            // Sequential is safer to not hit rate limits if there are many DB inserts
            for (const q of generatedQuestions) {
                const payload = {
                    question: q.question,
                    explanation: q.explanation,
                    difficulty: q.difficulty.toLowerCase(),
                    type: q.type,
                    topicId: metaParams.topicId,
                    skillId: metaParams.skillId,
                    points: metaParams.points,
                };

                if (q.type === 'mcq') {
                    payload.options = q.options.map(opt => ({
                        text: opt,
                        isCorrect: opt === q.correctAnswer
                    }));
                } else {
                    payload.idealAnswer = q.idealAnswer;
                }

                try {
                    await api.post('/question-bank/questions', payload);
                    successCount++;
                } catch (e) {
                    console.error('Failed to save question:', q.question, e);
                    failCount++;
                }
            }

            if (failCount === 0) {
                toast.success(`Saved all ${successCount} questions to Bank!`);
                router.push('/tutor/questions');
            } else {
                toast.error(`Saved ${successCount}, failed ${failCount}. Check console.`);
            }

        } catch (error) {
            console.error(error);
            toast.error('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    // Keep generated question fields editable in case AI hallucinated slightly
    const updateGeneratedQuestion = (index, field, value) => {
        const updated = [...generatedQuestions];
        updated[index][field] = value;
        setGeneratedQuestions(updated);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/tutor/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-purple-600" />
                            Bulk AI Question Generator
                        </h1>
                        <p className="text-slate-500">Rapidly build your Question Bank using Sapience AI</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Generator Configuration */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-purple-100 shadow-md">
                            <CardHeader className="bg-purple-50/50 border-b border-purple-50 pb-4">
                                <CardTitle className="text-purple-800 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> AI Prompt
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Topic or Excerpt Text</Label>
                                    <Textarea
                                        value={aiParams.topic}
                                        onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                                        placeholder="Paste a paragraph, or type a topic like 'Newton's Laws of Motion'..."
                                        className="h-32 resize-y"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Question Type</Label>
                                    <Select value={aiParams.type} onValueChange={(val) => setAiParams({ ...aiParams, type: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                                            <SelectItem value="subjective">Subjective / Open-Ended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Count (Max 20)</Label>
                                        <Input
                                            type="number"
                                            value={aiParams.count}
                                            onChange={(e) => setAiParams({ ...aiParams, count: parseInt(e.target.value) || 1 })}
                                            min={1} max={20}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Difficulty</Label>
                                        <Select value={aiParams.difficulty} onValueChange={(val) => setAiParams({ ...aiParams, difficulty: val })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="easy">Easy</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="hard">Hard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <BrainCircuit className="w-5 h-5 mr-2" />}
                                    Generate Questions
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Metadata block (Disabled until generated) */}
                        <Card className={`border-slate-200 shadow-sm transition-opacity ${generatedQuestions.length === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-slate-800 text-base">2. Assign Metadata to Bank</CardTitle>
                                <CardDescription>Tag these questions before saving.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Topic</Label>
                                    <Select value={metaParams.topicId} onValueChange={(val) => setMetaParams({ ...metaParams, topicId: val })}>
                                        <SelectTrigger><SelectValue placeholder="Select Topic" /></SelectTrigger>
                                        <SelectContent>
                                            {topics.map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Skill</Label>
                                    <Select value={metaParams.skillId} onValueChange={(val) => setMetaParams({ ...metaParams, skillId: val })}>
                                        <SelectTrigger><SelectValue placeholder="Select Skill" /></SelectTrigger>
                                        <SelectContent>
                                            {skills.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Points (per question)</Label>
                                    <Input
                                        type="number"
                                        value={metaParams.points}
                                        onChange={(e) => setMetaParams({ ...metaParams, points: parseInt(e.target.value) || 1 })}
                                        min={1}
                                    />
                                </div>

                                <Button
                                    onClick={handleSaveAll}
                                    disabled={saving || generatedQuestions.length === 0}
                                    className="w-full bg-[#3b0d46] hover:bg-[#2a0933] mt-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    Save {generatedQuestions.length} Questions to Bank
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Results Preview */}
                    <div className="lg:col-span-2 space-y-4">
                        {loading ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300">
                                <BrainCircuit className="w-16 h-16 text-purple-300 animate-pulse mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">AI is thinking...</h3>
                                <p className="text-slate-500 max-w-sm text-center">Analyzing topic and generating high-quality questions according to your constraints.</p>
                            </div>
                        ) : generatedQuestions.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 px-4 py-3 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Success! {generatedQuestions.length} questions generated.
                                    </div>
                                    <span className="text-sm font-medium">Review and edit below before saving.</span>
                                </div>

                                {generatedQuestions.map((q, idx) => (
                                    <Card key={idx} className="border-slate-200">
                                        <CardHeader className="py-3 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
                                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                                Question {idx + 1}
                                            </CardTitle>
                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-white border text-slate-500">
                                                {q.difficulty} • {q.type === 'mcq' ? 'MCQ' : 'Subjective'}
                                            </span>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-500 uppercase">Question Text</Label>
                                                <Textarea
                                                    value={q.question}
                                                    onChange={(e) => updateGeneratedQuestion(idx, 'question', e.target.value)}
                                                />
                                            </div>

                                            {q.type === 'mcq' ? (
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-slate-500 uppercase">Options (Select Correct)</Label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {q.options.map((opt, oIdx) => (
                                                            <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`correctOpt-${idx}`}
                                                                    checked={opt === q.correctAnswer}
                                                                    onChange={() => updateGeneratedQuestion(idx, 'correctAnswer', opt)}
                                                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                                                                />
                                                                <input
                                                                    className="flex-1 text-sm bg-transparent outline-none"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...q.options];
                                                                        const oldVal = newOpts[oIdx];
                                                                        newOpts[oIdx] = e.target.value;
                                                                        updateGeneratedQuestion(idx, 'options', newOpts);
                                                                        if (q.correctAnswer === oldVal) updateGeneratedQuestion(idx, 'correctAnswer', e.target.value);
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-slate-500 uppercase">Ideal Answer / Rubric</Label>
                                                    <Textarea
                                                        className="min-h-[80px]"
                                                        value={q.idealAnswer || ''}
                                                        onChange={(e) => updateGeneratedQuestion(idx, 'idealAnswer', e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <Label className="text-xs text-slate-500 uppercase">Explanation for Students</Label>
                                                <Input
                                                    value={q.explanation}
                                                    onChange={(e) => updateGeneratedQuestion(idx, 'explanation', e.target.value)}
                                                    className="bg-slate-50 border-slate-200"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 p-8">
                                <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">No Questions Yet</h3>
                                <p className="text-slate-500 max-w-sm text-center">Configure your AI prompt on the left and hit generate to populate questions.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
