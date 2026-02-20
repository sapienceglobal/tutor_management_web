'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Plus, Trash, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreateQuestionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [topics, setTopics] = useState([]);
    const [skills, setSkills] = useState([]);

    const [formData, setFormData] = useState({
        question: '',
        type: 'mcq',
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ],
        explanation: '',
        points: 1,
        difficulty: 'medium',
        topicId: '',
        skillId: ''
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

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...formData.options];
        newOptions[index][field] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        setFormData({
            ...formData,
            options: [...formData.options, { text: '', isCorrect: false }]
        });
    };

    const removeOption = (index) => {
        if (formData.options.length <= 2) return;
        const newOptions = formData.options.filter((_, i) => i !== index);
        setFormData({ ...formData, options: newOptions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.question) return toast.error('Question text is required');
        if (formData.options.some(o => !o.text)) return toast.error('All options must have text');
        if (!formData.options.some(o => o.isCorrect)) return toast.error('Select at least one correct answer');

        setLoading(true);
        try {
            const res = await api.post('/question-bank/questions', formData);
            if (res.data.success) {
                toast.success('Question created successfully!');
                router.push('/tutor/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create question');
        } finally {
            setLoading(false);
        }
    };

    const [isAIOpen, setIsAIOpen] = useState(false);
    const [aiParams, setAiParams] = useState({
        topic: '',
        count: 1, // Default to 1 for this single question page
        difficulty: 'medium'
    });
    const [aiLoading, setAiLoading] = useState(false);

    // AI Handler
    const handleAIGenerate = async () => {
        if (!aiParams.topic) {
            toast.error("Please enter a topic");
            return;
        }
        setAiLoading(true);
        try {
            // Force count to 1 for single question creation
            const res = await api.post('/ai/generate-questions', { ...aiParams, count: 1 });
            if (res.data.success && res.data.questions.length > 0) {
                const q = res.data.questions[0];

                // Map AI response to form structure
                setFormData({
                    ...formData,
                    question: q.question,
                    options: q.options.map((opt, i) => ({
                        text: opt,
                        isCorrect: opt === q.correctAnswer // AI returns string answer
                    })),
                    explanation: q.explanation || '',
                    difficulty: q.difficulty.toLowerCase()
                });

                setIsAIOpen(false);
                toast.success("Question generated!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate question. Try a different topic.");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/tutor/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-800">Create New Question</h1>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsAIOpen(true)}
                        className="gap-2 text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                        <Loader2 className={`w-4 h-4 ${aiLoading ? 'animate-spin' : 'hidden'}`} />
                        <span className={aiLoading ? 'hidden' : 'flex items-center gap-2'}>
                            <BrainCircuit className="w-4 h-4" />
                            Generate with AI
                        </span>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Question Text */}
                            <div className="space-y-2">
                                <Label>Question Text <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                <Label>Options</Label>
                                {formData.options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={option.isCorrect}
                                            onChange={() => {
                                                const newOpts = formData.options.map((o, i) => ({
                                                    ...o, isCorrect: i === index
                                                }));
                                                setFormData({ ...formData, options: newOpts });
                                            }}
                                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <Input
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        {formData.options.length > 2 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                                                <Trash className="w-4 h-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
                                    <Plus className="w-4 h-4 mr-2" /> Add Option
                                </Button>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Topic</Label>
                                    <Select value={formData.topicId} onValueChange={(val) => setFormData({ ...formData, topicId: val })}>
                                        <SelectTrigger><SelectValue placeholder="Select Topic" /></SelectTrigger>
                                        <SelectContent>
                                            {topics.map(t => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Skill</Label>
                                    <Select value={formData.skillId} onValueChange={(val) => setFormData({ ...formData, skillId: val })}>
                                        <SelectTrigger><SelectValue placeholder="Select Skill" /></SelectTrigger>
                                        <SelectContent>
                                            {skills.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <Select value={formData.difficulty} onValueChange={(val) => setFormData({ ...formData, difficulty: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Points</Label>
                                    <Input
                                        type="number"
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                        min={1}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Explanation (Optional)</Label>
                                <Input
                                    value={formData.explanation}
                                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                    placeholder="Explain the correct answer..."
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full bg-[#3b0d46] hover:bg-[#2a0933]">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" />
                                Save Question
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* AI Modal */}
            {isAIOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Generate with AI</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsAIOpen(false)}>
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                            </Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Topic</Label>
                                <Input
                                    placeholder="e.g. Newton's Laws"
                                    value={aiParams.topic}
                                    onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Difficulty</Label>
                                <Select
                                    value={aiParams.difficulty}
                                    onValueChange={(val) => setAiParams({ ...aiParams, difficulty: val })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAIGenerate} disabled={aiLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4">
                                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Generate"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
