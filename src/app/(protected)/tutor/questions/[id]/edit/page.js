'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, Edit } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { QuestionFormFields } from '@/components/shared/QuestionFormFields';
import { C, T, FX } from '@/constants/tutorTokens';

export default function EditQuestionPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [topics, setTopics] = useState([]);
    const [skills, setSkills] = useState([]);

    const [formData, setFormData] = useState({
        question: '', type: 'mcq', options: [], idealAnswer: '',
        explanation: '', points: 1, difficulty: 'medium', topicId: '', skillId: ''
    });

    useEffect(() => { fetchData(); }, []);

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
        } catch {
            toast.error('Failed to load question');
            router.push('/tutor/questions');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.question) return toast.error('Question text is required');
        if (['mcq', 'true_false'].includes(formData.type)) {
            if (formData.options.some(o => !o.text)) return toast.error('All options must have text');
            if (!formData.options.some(o => o.isCorrect)) return toast.error('Select at least one correct answer');
        } else if (!formData.idealAnswer) return toast.error('Ideal Answer is required');

        setLoading(true);
        try {
            const res = await api.patch(`/question-bank/questions/${id}`, formData);
            if (res.data.success) {
                toast.success('Question updated successfully!');
                router.push('/tutor/questions');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update question');
        } finally { setLoading(false); }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.btnPrimary }} />
                <p className="text-sm text-slate-400">Loading question...</p>
            </div>
        );
    }

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
                            <Edit className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-800">Edit Question</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">Update the question details below</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="max-w-2xl bg-white rounded-xl border border-slate-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <QuestionFormFields formData={formData} setFormData={setFormData} topics={topics} skills={skills} />
                    <Button
                        type="submit" disabled={loading}
                        className="w-full h-10 text-white font-semibold gap-2 mt-2"
                        style={{ backgroundColor: C.btnPrimary }}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" /> Update Question
                    </Button>
                </form>
            </div>
        </div>
    );
}
