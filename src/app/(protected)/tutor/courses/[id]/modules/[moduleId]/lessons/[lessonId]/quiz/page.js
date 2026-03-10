'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function ManageQuizPage() {
    const params = useParams();
    const router = useRouter();
    const { id: courseId, moduleId, lessonId } = params;

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [quizData, setQuizData] = useState({
        passingScore: 70,
        timeLimit: '',
        questions: []
    });

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const res = await api.get(`/lessons/${lessonId}`);
                if (res.data.success) {
                    setLesson(res.data.lesson);
                    if (res.data.lesson.content?.quiz) setQuizData(res.data.lesson.content.quiz);
                }
            } catch (error) {
                console.error('Failed to fetch lesson:', error);
                toast.error('Failed to load quiz details');
            } finally {
                setLoading(false);
            }
        };
        if (lessonId) fetchLesson();
    }, [lessonId]);

    const addQuestion = () => {
        setQuizData(prev => ({
            ...prev,
            questions: [...prev.questions, {
                id: Date.now().toString(),
                question: '', points: 1, explanation: '',
                options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }]
            }]
        }));
    };

    const updateQuestion = (index, field, value) => {
        const newQ = [...quizData.questions];
        newQ[index][field] = value;
        setQuizData(prev => ({ ...prev, questions: newQ }));
    };

    const removeQuestion = (index) => {
        setQuizData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
    };

    const addOption = (qIndex) => {
        const newQ = [...quizData.questions];
        newQ[qIndex].options.push({ text: '', isCorrect: false });
        setQuizData(prev => ({ ...prev, questions: newQ }));
    };

    const updateOption = (qIndex, oIndex, field, value) => {
        const newQ = [...quizData.questions];
        if (field === 'isCorrect' && value === true) {
            newQ[qIndex].options.forEach((opt, idx) => { if (idx !== oIndex) opt.isCorrect = false; });
        }
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
            if (!q.question.trim()) { toast.error(`Question ${i + 1} cannot be empty`); return; }
            if (q.options.some(o => !o.text.trim())) { toast.error(`All options in Question ${i + 1} must have text`); return; }
            if (!q.options.some(o => o.isCorrect)) { toast.error(`Question ${i + 1} must have at least one correct option`); return; }
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
        } catch (error) {
            console.error('Save quiz error:', error);
            toast.error('Failed to save quiz');
        } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading quiz...</p>
            </div>
        );
    }

    if (!lesson) return <div className="p-8 text-slate-500 text-sm">Lesson not found.</div>;

    const totalPoints = quizData.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

    return (
        <div className="max-w-3xl mx-auto space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/tutor/courses/${courseId}`)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h1 className="text-lg font-bold text-slate-800">Quiz Builder</h1>
                        </div>
                        <p className="text-xs text-slate-400 pl-0.5">Lesson: {lesson.title}</p>
                    </div>
                </div>
                <button onClick={saveQuiz} disabled={saving}
                    className="px-4 py-2 text-white rounded-xl font-semibold flex items-center gap-2 text-sm transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Quiz'}
                </button>
            </div>

            {/* Settings card */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 5%, white)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)' }}>
                            <AlertCircle className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Quiz Settings</h2>
                            <p className="text-xs text-slate-400">Configure passing criteria and time limit.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Points</p>
                            <span className="text-xl font-black" style={{ color: 'var(--theme-primary)' }}>{totalPoints}</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Passing %</p>
                            <input type="number" value={quizData.passingScore}
                                onChange={(e) => setQuizData(p => ({ ...p, passingScore: e.target.value }))}
                                className="w-16 text-center px-2 py-1 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none"
                                style={{ '--tw-ring-color': 'var(--theme-primary)' }} />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time (mins)</p>
                            <input type="number" placeholder="∞" value={quizData.timeLimit}
                                onChange={(e) => setQuizData(p => ({ ...p, timeLimit: e.target.value }))}
                                className="w-16 text-center px-2 py-1 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none" />
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="p-5 space-y-5">
                    {quizData.questions.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                <FileText className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-1">No questions yet</h3>
                            <p className="text-xs text-slate-400 mb-4">Start building your quiz by adding the first question.</p>
                            <button onClick={addQuestion}
                                className="px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 mx-auto transition-opacity"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', color: 'var(--theme-primary)' }}>
                                <Plus className="w-4 h-4" /> Add First Question
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {quizData.questions.map((q, qIndex) => (
                                <div key={q.id || qIndex}
                                    className="bg-white border border-slate-100 rounded-xl overflow-hidden relative group shadow-sm">
                                    {/* left accent bar */}
                                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
                                    <div className="p-5 pl-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-black flex-shrink-0"
                                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                                    {qIndex + 1}
                                                </span>
                                                <input type="text" value={q.question}
                                                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                    placeholder="Enter your question here..."
                                                    className="flex-1 text-sm font-semibold text-slate-800 focus:outline-none border-b border-transparent pb-0.5 bg-transparent min-w-0"
                                                    style={{ borderBottomColor: 'transparent' }}
                                                    onFocus={e => e.target.style.borderBottomColor = 'var(--theme-primary)'}
                                                    onBlur={e => e.target.style.borderBottomColor = 'transparent'} />
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                                                    <label className="text-[10px] font-bold text-slate-500">PTS</label>
                                                    <input type="number" value={q.points}
                                                        onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)}
                                                        className="w-10 text-center text-sm font-bold bg-transparent focus:outline-none" />
                                                </div>
                                                <button onClick={() => removeQuestion(qIndex)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Options */}
                                        <div className="pl-10 space-y-2">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex}
                                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all
                                                        ${opt.isCorrect
                                                            ? 'border-emerald-200 bg-emerald-50/50'
                                                            : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                                    <button onClick={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                                                        className={`flex-shrink-0 transition-colors ${opt.isCorrect ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}`}>
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <input type="text" value={opt.text}
                                                        onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        className="flex-1 text-sm bg-transparent border-none focus:outline-none text-slate-700" />
                                                    <button onClick={() => removeOption(qIndex, oIndex)}
                                                        className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all">
                                                        <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => addOption(qIndex)}
                                                className="text-xs font-semibold flex items-center gap-1 mt-1 transition-opacity"
                                                style={{ color: 'var(--theme-primary)' }}>
                                                <Plus className="w-3 h-3" /> Add Option
                                            </button>
                                        </div>

                                        {/* Explanation */}
                                        <div className="pl-10 mt-3 pt-3 border-t border-slate-100">
                                            <input type="text" value={q.explanation || ''}
                                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                placeholder="Explanation (shown after answering, optional)"
                                                className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:bg-white transition-all" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add question button */}
                    {quizData.questions.length > 0 && (
                        <button onClick={addQuestion}
                            className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-dashed flex items-center justify-center gap-2 transition-all"
                            style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, white)', color: 'var(--theme-primary)' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-primary) 5%, white)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <Plus className="w-4 h-4" /> Add Another Question
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}