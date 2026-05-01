'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdArrowBack, 
    MdHourglassEmpty, 
    MdSave, 
    MdEdit, 
    MdStorage 
} from 'react-icons/md';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { QuestionFormFields } from '@/components/shared/QuestionFormFields';
import { C, T, S, R } from '@/constants/studentTokens';

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
            if (topicsRes?.data?.success) setTopics(topicsRes.data.topics);
            if (skillsRes?.data?.success) setSkills(skillsRes.data.skills);
            if (questionRes?.data?.success) {
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
            if (res?.data?.success) {
                toast.success('Question updated successfully!');
                router.push('/tutor/questions');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update question');
        } finally { setLoading(false); }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading question...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 flex flex-col items-center" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            <div className="w-full max-w-3xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-4">
                        <Link href="/tutor/questions" className="text-decoration-none">
                            <button className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.btnViewAllBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <MdArrowBack style={{ width: 18, height: 18, color: C.btnViewAllText }} />
                            </button>
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                <MdEdit style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <div>
                                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: '0 0 2px 0' }}>
                                    Edit Question
                                </h2>
                                <p style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0, fontFamily: T.fontFamily }}>
                                    Update the question details below
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Wrapper */}
                <div className="p-6 space-y-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Note: Assuming QuestionFormFields handles its own theme context or relies on global styles */}
                        <div className="p-5" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <QuestionFormFields formData={formData} setFormData={setFormData} topics={topics} skills={skills} />
                        </div>
                        
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: 'none', boxShadow: S.btn }}>
                            {loading && <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />} <MdSave style={{ width: 16, height: 16 }} /> Update Question
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}