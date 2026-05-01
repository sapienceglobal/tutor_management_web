'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdArrowBack, 
    MdHourglassEmpty, 
    MdSave, 
    MdAdd, 
    MdAutoAwesome, 
    MdClose 
} from 'react-icons/md';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { QuestionFormFields } from '@/components/shared/QuestionFormFields';
import { C, T, S, R } from '@/constants/tutorTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.border = `1px solid ${C.btnPrimary}`;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.border = `1px solid ${C.cardBorder}`;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

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
            if (topicsRes?.data?.success) setTopics(topicsRes.data.topics);
            if (skillsRes?.data?.success) setSkills(skillsRes.data.skills);
        } catch (error) { console.error('Failed to load taxonomy', error); }
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
            const res = await api.post('/question-bank/questions', formData);
            if (res?.data?.success) {
                toast.success('Question created successfully!');
                router.push('/tutor/questions');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create question');
        } finally { setLoading(false); }
    };

    const handleAIGenerate = async () => {
        if (!aiParams.topic) { toast.error("Please enter a topic"); return; }
        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-questions', { ...aiParams, count: 1 });
            if (res?.data?.success && res.data.questions.length > 0) {
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
                                <MdAdd style={{ width: 16, height: 16, color: C.iconColor }} />
                            </div>
                            <div>
                                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: '0 0 2px 0' }}>
                                    Create New Question
                                </h2>
                                <p style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0 }}>
                                    Add a question to your bank manually or with AI
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsAIOpen(true)} className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer transition-opacity hover:opacity-80 w-full sm:w-auto"
                        style={{ backgroundColor: C.innerBg, color: C.btnPrimary, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                        <MdAutoAwesome style={{ width: 16, height: 16 }} /> Generate with AI
                    </button>
                </div>

                {/* Form Wrapper */}
                <div className="p-6 space-y-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="p-5" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                             <QuestionFormFields formData={formData} setFormData={setFormData} topics={topics} skills={skills} />
                        </div>
                        
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: 'none', boxShadow: S.btn }}>
                            {loading && <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />} <MdSave style={{ width: 16, height: 16 }} /> Save Question
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Modal */}
            {isAIOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-md p-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                    <MdAutoAwesome style={{ width: 16, height: 16, color: C.iconColor }} />
                                </div>
                                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                    Generate with AI
                                </h2>
                            </div>
                            <button onClick={() => setIsAIOpen(false)} className="bg-transparent cursor-pointer hover:opacity-70 flex items-center justify-center transition-colors" style={{ width: 32, height: 32, backgroundColor: C.btnViewAllBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <MdClose style={{ width: 16, height: 16, color: C.btnViewAllText }} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>Topic</label>
                                <input type="text" value={aiParams.topic} onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                                    placeholder="e.g. Newton's Laws" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>Type</label>
                                    <select value={aiParams.type} onChange={(e) => setAiParams({ ...aiParams, type: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                        <option value="mcq">MCQ</option>
                                        <option value="subjective">Subjective</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>Difficulty</label>
                                    <select value={aiParams.difficulty} onChange={(e) => setAiParams({ ...aiParams, difficulty: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleAIGenerate} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 h-11 mt-4 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: 'none', boxShadow: S.btn }}>
                                {aiLoading ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" /> : <MdAutoAwesome style={{ width: 16, height: 16 }} />} Generate Question
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}