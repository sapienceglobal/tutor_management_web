'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Plus, Trash } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditQuestionPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [topics, setTopics] = useState([]);
    const [skills, setSkills] = useState([]);

    const [formData, setFormData] = useState({
        question: '',
        type: 'mcq',
        options: [],
        idealAnswer: '',
        explanation: '',
        points: 1,
        difficulty: 'medium',
        topicId: '',
        skillId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [topicsRes, skillsRes, questionRes] = await Promise.all([
                api.get('/taxonomy/topics'),
                api.get('/taxonomy/skills'),
                api.get(`/question-bank/questions/${id}`)
            ]);
            if (topicsRes.data.success) setTopics(topicsRes.data.topics);
            if (skillsRes.data.success) setSkills(skillsRes.data.skills);
            if (questionRes.data.success) {
                const q = questionRes.data.question;
                setFormData({
                    question: q.question || '',
                    type: q.type || (q.options?.length > 0 ? 'mcq' : 'subjective'),
                    options: q.options || [],
                    idealAnswer: q.idealAnswer || '',
                    explanation: q.explanation || '',
                    points: q.points || 1,
                    difficulty: q.difficulty || 'medium',
                    topicId: q.topicId?._id || '',
                    skillId: q.skillId?._id || ''
                });
            }
        } catch (error) {
            console.error('Failed to load data', error);
            toast.error('Failed to load question');
            router.push('/tutor/questions');
        } finally {
            setFetching(false);
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

        if (formData.type === 'mcq') {
            if (formData.options.some(o => !o.text)) return toast.error('All options must have text');
            if (!formData.options.some(o => o.isCorrect)) return toast.error('Select at least one correct answer');
        } else if (formData.type === 'subjective') {
            if (!formData.idealAnswer) return toast.error('Ideal Answer is required');
        }

        setLoading(true);
        try {
            const res = await api.patch(`/question-bank/questions/${id}`, formData);
            if (res.data.success) {
                toast.success('Question updated successfully!');
                router.push('/tutor/questions');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update question');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/tutor/questions">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Edit Question</h1>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Question Type */}
                            <div className="space-y-2">
                                <Label>Question Type</Label>
                                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                                        <SelectItem value="subjective">Subjective / Open-Ended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Question Text */}
                            <div className="space-y-2">
                                <Label>Question Text <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            {/* Conditional Rendering */}
                            {formData.type === 'mcq' ? (
                                <div className="space-y-3">
                                    <Label>Options <span className="text-red-500">*</span></Label>
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
                            ) : (
                                <div className="space-y-2">
                                    <Label>Ideal Answer / Grading Rubric <span className="text-red-500">*</span></Label>
                                    <textarea
                                        className="w-full min-h-[120px] p-3 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
                                        value={formData.idealAnswer}
                                        onChange={(e) => setFormData({ ...formData, idealAnswer: e.target.value })}
                                        placeholder="Enter the expected answer or grading rubric..."
                                    />
                                </div>
                            )}

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
                                        onChange={(e) => setFormData({ ...formData, points: e.target.value === '' ? '' : Number(e.target.value) })}
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
                                Update Question
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
