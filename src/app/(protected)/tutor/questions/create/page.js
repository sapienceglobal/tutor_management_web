'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save, Plus, BrainCircuit, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionFormFields } from '@/components/shared/QuestionFormFields';

export default function CreateQuestionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [topics, setTopics] = useState([]);
    const [skills, setSkills] = useState([]);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiParams, setAiParams] = useState({ topic: '', count: 1, difficulty: 'medium', type: 'mcq' });

    const [formData, setFormData] = useState({
        question: '', type: 'mcq',
        options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
        idealAnswer: '', explanation: '', points: 1, difficulty: 'medium', topicId: '', skillId: ''
    });

    useEffect(() => { fetchTaxonomy(); }, []);

    const fetchTaxonomy = async () => {
        try {
            const [topicsRes, skillsRes] = await Promise.all([api.get('/taxonomy/topics'), api.get('/taxonomy/skills')]);
            if (topicsRes.data.success) setTopics(topicsRes.data.topics);
            if (skillsRes.data.success) setSkills(skillsRes.data.skills);
        } catch (error) { console.error('Failed to load taxonomy', error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.question) return toast.error('Question text is required');
        if (formData.type === 'mcq') {
            if (formData.options.some(o => !o.text)) return toast.error('All options must have text');
            if (!formData.options.some(o => o.isCorrect)) return toast.error('Select at least one correct answer');
        } else if (!formData.idealAnswer) return toast.error('Ideal Answer is required');

        setLoading(true);
        try {
            const res = await api.post('/question-bank/questions', formData);
            if (res.data.success) {
                toast.success('Question created successfully!');
                router.push('/tutor/questions');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create question');
        } finally { setLoading(false); }
    };

    const handleAIGenerate = async () => {
        if (!aiParams.topic) { toast.error("Please enter a topic"); return; }
        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-questions', { ...aiParams, count: 1 });
            if (res.data.success && res.data.questions.length > 0) {
                const q = res.data.questions[0];
                setFormData({
                    ...formData,
                    question: q.question,
                    idealAnswer: q.idealAnswer || '',
                    type: aiParams.type,
                    options: aiParams.type === 'subjective' ? [] : q.options.map(opt => ({ text: opt, isCorrect: opt === q.correctAnswer })),
                    explanation: q.explanation || '',
                    difficulty: q.difficulty.toLowerCase()
                });
                setIsAIOpen(false);
                toast.success("Question generated!");
            }
        } catch { toast.error("Failed to generate question. Try a different topic."); }
        finally { setAiLoading(false); }
    };

    return (
        <div className="space-y-6" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/tutor/questions">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-slate-500" />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                <Plus className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h1 className="text-lg font-bold text-slate-800">Create New Question</h1>
                        </div>
                        <p className="text-xs text-slate-400 pl-0.5">Add a question to your bank manually or with AI</p>
                    </div>
                </div>
                <Button
                    variant="outline" size="sm"
                    onClick={() => setIsAIOpen(true)}
                    className="gap-2 text-sm border-slate-200"
                    style={{ color: 'var(--theme-primary)' }}>
                    <Sparkles className="w-4 h-4" /> Generate with AI
                </Button>
            </div>

            {/* Form Card */}
            <div className="max-w-2xl bg-white rounded-xl border border-slate-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <QuestionFormFields formData={formData} setFormData={setFormData} topics={topics} skills={skills} />
                    <Button
                        type="submit" disabled={loading}
                        className="w-full h-10 text-white font-semibold gap-2 mt-2"
                        style={{ backgroundColor: 'var(--theme-primary)' }}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" /> Save Question
                    </Button>
                </form>
            </div>

            {/* AI Modal */}
            {isAIOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                    <BrainCircuit className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                                <h2 className="text-base font-bold text-slate-800">Generate with AI</h2>
                            </div>
                            <button onClick={() => setIsAIOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Topic</Label>
                                <Input
                                    placeholder="e.g. Newton's Laws"
                                    value={aiParams.topic}
                                    onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700">Type</Label>
                                    <Select value={aiParams.type} onValueChange={(val) => setAiParams({ ...aiParams, type: val })}>
                                        <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mcq">MCQ</SelectItem>
                                            <SelectItem value="subjective">Subjective</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-slate-700">Difficulty</Label>
                                    <Select value={aiParams.difficulty} onValueChange={(val) => setAiParams({ ...aiParams, difficulty: val })}>
                                        <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button
                                onClick={handleAIGenerate} disabled={aiLoading}
                                className="w-full text-white gap-2 mt-2"
                                style={{ backgroundColor: 'var(--theme-primary)' }}>
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                                Generate Question
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}