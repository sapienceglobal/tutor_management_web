'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Plus, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { QuestionFormFields } from '@/components/shared/QuestionFormFields';
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
        <div className="w-full min-h-screen p-6 flex flex-col items-center" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            <div className="w-full max-w-3xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-4">
                        <Link href="/tutor/questions" className="text-decoration-none">
                            <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                                style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                                <ArrowLeft size={18} color={C.heading} />
                            </button>
                        </Link>
                        <div>
                            <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                                <Plus size={20} color={C.btnPrimary} /> Create New Question
                            </h1>
                            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                                Add a question to your bank manually or with AI
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsAIOpen(true)} className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm w-full sm:w-auto"
                        style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                        <Sparkles size={16} /> Generate with AI
                    </button>
                </div>

                {/* Form Wrapper */}
                <div className="p-6 space-y-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Note: Assuming QuestionFormFields is updated to match theme internally, or it just outputs raw fields. Passing styles if needed might require modifying that component, but we will leave it as is if it handles its own. If it relies on global CSS, it's fine. */}
                        <div className="p-5" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                             <QuestionFormFields formData={formData} setFormData={setFormData} topics={topics} skills={skills} />
                        </div>
                        
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            {loading && <Loader2 size={16} className="animate-spin" />} <Save size={16} /> Save Question
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Modal */}
            {isAIOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-md p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h3 className="flex items-center gap-2" style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                <Sparkles size={18} color={C.btnPrimary} /> Generate with AI
                            </h3>
                            <button onClick={() => setIsAIOpen(false)} className="bg-transparent border-none cursor-pointer hover:opacity-70 flex items-center justify-center" style={{ width: '32px', height: '32px', backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                <X size={16} color={C.heading} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Topic</label>
                                <input type="text" value={aiParams.topic} onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                                    placeholder="e.g. Newton's Laws" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Type</label>
                                    <select value={aiParams.type} onChange={(e) => setAiParams({ ...aiParams, type: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                        <option value="mcq">MCQ</option>
                                        <option value="subjective">Subjective</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Difficulty</label>
                                    <select value={aiParams.difficulty} onChange={(e) => setAiParams({ ...aiParams, difficulty: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleAIGenerate} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 h-11 mt-4 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate Question
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}