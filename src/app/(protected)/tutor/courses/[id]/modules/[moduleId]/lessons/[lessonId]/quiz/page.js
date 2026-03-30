'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, FileText, CheckCircle2, Loader2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
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

export default function ManageQuizPage() {
    const params = useParams();
    const router = useRouter();
    const { id: courseId, moduleId, lessonId } = params;

    const [lesson, setLesson]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);

    const [quizData, setQuizData] = useState({
        passingScore: 70, timeLimit: '', questions: []
    });

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const res = await api.get(`/lessons/${lessonId}`);
                if (res?.data?.success) {
                    setLesson(res.data.lesson);
                    if (res.data.lesson.content?.quiz) setQuizData(res.data.lesson.content.quiz);
                }
            } catch (err) {
                console.error('Failed to fetch lesson:', err);
                toast.error('Failed to load quiz details');
            } finally { setLoading(false); }
        };
        if (lessonId) fetchLesson();
    }, [lessonId]);

    const addQuestion = () => setQuizData(prev => ({
        ...prev,
        questions: [...prev.questions, {
            id: Date.now().toString(), question: '', points: 1, explanation: '',
            options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }]
        }]
    }));

    const updateQuestion = (index, field, value) => {
        const newQ = [...quizData.questions]; newQ[index][field] = value;
        setQuizData(prev => ({ ...prev, questions: newQ }));
    };

    const removeQuestion = (index) =>
        setQuizData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));

    const addOption = (qIndex) => {
        const newQ = [...quizData.questions];
        newQ[qIndex].options.push({ text: '', isCorrect: false });
        setQuizData(prev => ({ ...prev, questions: newQ }));
    };

    const updateOption = (qIndex, oIndex, field, value) => {
        const newQ = [...quizData.questions];
        if (field === 'isCorrect' && value) newQ[qIndex].options.forEach((opt, idx) => { if (idx !== oIndex) opt.isCorrect = false; });
        newQ[qIndex].options[oIndex][field] = value;
        setQuizData(prev => ({ ...prev, questions: newQ }));
    };

    const removeOption = (qIndex, oIndex) => {
        const newQ = [...quizData.questions];
        if (newQ[qIndex].options.length <= 2) { toast.error('A question must have at least 2 options'); return; }
        newQ[qIndex].options.splice(oIndex, 1);
        if (!newQ[qIndex].options.some(o => o.isCorrect)) newQ[qIndex].options[0].isCorrect = true;
        setQuizData(prev => ({ ...prev, questions: newQ }));
    };

    const saveQuiz = async () => {
        if (quizData.questions.length === 0) { toast.error('Add at least one question'); return; }
        for (let i = 0; i < quizData.questions.length; i++) {
            const q = quizData.questions[i];
            if (!q.question.trim())              { toast.error(`Question ${i + 1} cannot be empty`);                        return; }
            if (q.options.some(o => !o.text.trim())) { toast.error(`All options in Question ${i + 1} must have text`);      return; }
            if (!q.options.some(o => o.isCorrect))   { toast.error(`Question ${i + 1} must have at least one correct option`); return; }
        }
        setSaving(true);
        try {
            const totalPoints = quizData.questions.reduce((sum, q) => sum + Number(q.points), 0);
            await api.patch(`/lessons/${lessonId}`, {
                type: 'quiz',
                content: { ...lesson.content, quiz: { ...quizData, totalPoints } }
            });
            toast.success('Quiz saved successfully');
            router.push(`/tutor/courses/${courseId}`);
        } catch (err) {
            console.error('Save quiz error:', err);
            toast.error('Failed to save quiz');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading quiz...</p>
            </div>
        );
    }

    if (!lesson) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
            <p style={{ color: C.danger, fontSize: T.size.md, fontWeight: T.weight.bold }}>Lesson not found.</p>
        </div>
    );

    const totalPoints = quizData.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

    return (
        <div className="w-full min-h-screen p-6 pb-24" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push(`/tutor/courses/${courseId}`)} className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                            style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                            <ArrowLeft size={18} color={C.heading} />
                        </button>
                        <div>
                            <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 2px 0' }}>
                                <FileText size={20} color={C.btnPrimary} /> Quiz Builder
                            </h1>
                            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                                Lesson: {lesson.title}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center gap-3">
                            <AlertCircle size={18} color={C.btnPrimary} />
                            <div>
                                <h2 style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Quiz Settings</h2>
                                <p style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Configure criteria</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Total Pts</p>
                                <span style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.btnPrimary }}>{totalPoints}</span>
                            </div>
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Passing %</p>
                                <input type="number" min="0" max="100" value={quizData.passingScore} onChange={e => setQuizData(p => ({ ...p, passingScore: e.target.value }))}
                                    style={{ ...baseInputStyle, width: '70px', padding: '6px 8px', textAlign: 'center', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Time (mins)</p>
                                <input type="number" placeholder="∞" value={quizData.timeLimit} onChange={e => setQuizData(p => ({ ...p, timeLimit: e.target.value }))}
                                    style={{ ...baseInputStyle, width: '70px', padding: '6px 8px', textAlign: 'center', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {quizData.questions.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px dashed ${C.cardBorder}` }}>
                                <FileText size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No questions yet</h3>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: '0 0 16px 0' }}>Start building your quiz by adding the first question.</p>
                                <button onClick={addQuestion} className="flex items-center justify-center gap-2 h-10 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                                    style={{ backgroundColor: C.btnPrimary, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    <Plus size={16} /> Add First Question
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {quizData.questions.map((q, qIndex) => (
                                    <div key={q.id || qIndex} className="p-5" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3 w-full">
                                                <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: C.btnPrimary }}>{qIndex + 1}</span>
                                                <input type="text" value={q.question} onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                                                    placeholder="Enter your question here..." style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, flex: 1 }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.md, border: `1px solid ${C.cardBorder}` }}>
                                                    <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>PTS</span>
                                                    <input type="number" min="1" value={q.points} onChange={e => updateQuestion(qIndex, 'points', e.target.value)}
                                                        style={{ width: '40px', border: 'none', outline: 'none', textAlign: 'center', fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }} />
                                                </div>
                                                <button onClick={() => removeQuestion(qIndex)} className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-80"
                                                    style={{ backgroundColor: C.dangerBg, borderRadius: R.md }}>
                                                    <Trash2 size={16} color={C.danger} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="ml-11 space-y-3">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-3 p-3 transition-colors"
                                                    style={{ backgroundColor: opt.isCorrect ? C.successBg : C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${opt.isCorrect ? C.successBorder : C.cardBorder}` }}>
                                                    <button type="button" onClick={() => updateOption(qIndex, oIndex, 'isCorrect', true)} className="border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors hover:opacity-70">
                                                        <CheckCircle2 size={20} color={opt.isCorrect ? C.success : C.textMuted} />
                                                    </button>
                                                    <input type="text" value={opt.text} onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, fontFamily: T.fontFamily }} />
                                                    <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="w-7 h-7 flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-80 opacity-50 hover:opacity-100"
                                                        style={{ backgroundColor: C.dangerBg, borderRadius: R.md }}>
                                                        <Trash2 size={14} color={C.danger} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => addOption(qIndex)} className="flex items-center gap-1.5 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70 mt-2"
                                                style={{ color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                <Plus size={14} /> Add Option
                                            </button>

                                            <div className="mt-4 pt-4" style={{ borderTop: `1px dashed ${C.cardBorder}` }}>
                                                <input type="text" value={q.explanation || ''} onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                    placeholder="Explanation (shown after answering, optional)" style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, fontSize: T.size.xs }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={addQuestion} className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer transition-opacity hover:opacity-80 border-2 border-dashed"
                                    style={{ backgroundColor: '#E3DFF8', borderColor: C.btnPrimary, color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    <Plus size={16} /> Add Another Question
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Bottom Save Button */}
                <div className="fixed bottom-0 left-0 right-0 z-20 p-4 flex justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${C.cardBorder}`, boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}>
                    <div className="w-full max-w-3xl flex items-center justify-end">
                        <button onClick={saveQuiz} disabled={saving} className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md w-full sm:w-auto"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}