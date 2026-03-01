'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
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
                    if (res.data.lesson.content?.quiz) {
                        setQuizData(res.data.lesson.content.quiz);
                    }
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
            questions: [
                ...prev.questions,
                {
                    id: Date.now().toString(), // temporary frontend ID
                    question: '',
                    points: 1,
                    explanation: '',
                    options: [
                        { text: '', isCorrect: true },
                        { text: '', isCorrect: false }
                    ]
                }
            ]
        }));
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...quizData.questions];
        newQuestions[index][field] = value;
        setQuizData(prev => ({ ...prev, questions: newQuestions }));
    };

    const removeQuestion = (index) => {
        const newQuestions = quizData.questions.filter((_, i) => i !== index);
        setQuizData(prev => ({ ...prev, questions: newQuestions }));
    };

    const addOption = (qIndex) => {
        const newQuestions = [...quizData.questions];
        newQuestions[qIndex].options.push({ text: '', isCorrect: false });
        setQuizData(prev => ({ ...prev, questions: newQuestions }));
    };

    const updateOption = (qIndex, oIndex, field, value) => {
        const newQuestions = [...quizData.questions];

        // If setting this option as correct, optionally unset others (if single choice)
        if (field === 'isCorrect' && value === true) {
            newQuestions[qIndex].options.forEach((opt, idx) => {
                if (idx !== oIndex) opt.isCorrect = false;
            });
        }

        newQuestions[qIndex].options[oIndex][field] = value;
        setQuizData(prev => ({ ...prev, questions: newQuestions }));
    };

    const removeOption = (qIndex, oIndex) => {
        const newQuestions = [...quizData.questions];
        if (newQuestions[qIndex].options.length <= 2) {
            toast.error('A question must have at least 2 options');
            return;
        }
        newQuestions[qIndex].options.splice(oIndex, 1);

        // Ensure at least one option is correct if the deleted one was the only correct one
        if (!newQuestions[qIndex].options.some(o => o.isCorrect)) {
            newQuestions[qIndex].options[0].isCorrect = true;
        }

        setQuizData(prev => ({ ...prev, questions: newQuestions }));
    };

    const saveQuiz = async () => {
        // Validation
        if (quizData.questions.length === 0) {
            toast.error('Add at least one question');
            return;
        }

        for (let i = 0; i < quizData.questions.length; i++) {
            const q = quizData.questions[i];
            if (!q.question.trim()) {
                toast.error(`Question ${i + 1} cannot be empty`);
                return;
            }
            if (q.options.some(o => !o.text.trim())) {
                toast.error(`All options in Question ${i + 1} must have text`);
                return;
            }
            if (!q.options.some(o => o.isCorrect)) {
                toast.error(`Question ${i + 1} must have at least one correct option`);
                return;
            }
        }

        setSaving(true);
        try {
            // Calculate total points
            const totalPoints = quizData.questions.reduce((sum, q) => sum + Number(q.points), 0);

            const updatedQuizData = {
                ...quizData,
                totalPoints
            };

            await api.patch(`/lessons/${lessonId}`, {
                type: 'quiz',
                content: {
                    ...lesson.content,
                    quiz: updatedQuizData
                }
            });

            toast.success('Quiz saved successfully');
            router.push(`/tutor/courses/${courseId}`);
        } catch (error) {
            console.error('Save quiz error:', error);
            toast.error('Failed to save quiz');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!lesson) return <div>Lesson not found</div>;

    const totalPoints = quizData.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/tutor/courses/${courseId}`)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quiz Builder</h1>
                        <p className="text-sm text-slate-500">Lesson: {lesson.title}</p>
                    </div>
                </div>
                <button
                    onClick={saveQuiz}
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Quiz'}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800">Quiz Settings</h2>
                            <p className="text-xs text-slate-500">Configure passing criteria and time limit.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">Total Points</p>
                            <span className="text-xl font-bold text-purple-600">{totalPoints}</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">Passing Score (%)</p>
                            <input
                                type="number"
                                value={quizData.passingScore}
                                onChange={(e) => setQuizData(p => ({ ...p, passingScore: e.target.value }))}
                                className="w-20 px-2 py-1 border border-slate-300 rounded focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">Time Limit (mins)</p>
                            <input
                                type="number"
                                placeholder="None"
                                value={quizData.timeLimit}
                                onChange={(e) => setQuizData(p => ({ ...p, timeLimit: e.target.value }))}
                                className="w-20 px-2 py-1 border border-slate-300 rounded focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {quizData.questions.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-slate-700">No questions yet</h3>
                            <p className="text-slate-500 mb-4">Start building your quiz by adding the first question.</p>
                            <button
                                onClick={addQuestion}
                                className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Question
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {quizData.questions.map((q, qIndex) => (
                                <div key={q.id || qIndex} className="bg-white border text-left border-slate-200 rounded-xl shadow-sm relative group overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                                                    {qIndex + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={q.question}
                                                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                                    placeholder="Enter your question here..."
                                                    className="w-full text-lg font-medium text-slate-800 focus:outline-none border-b border-transparent focus:border-purple-300 bg-transparent min-w-[300px]"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                                    <label className="text-xs font-semibold text-slate-600">Points:</label>
                                                    <input
                                                        type="number"
                                                        value={q.points}
                                                        onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)}
                                                        className="w-12 text-center text-sm font-bold bg-transparent focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeQuestion(qIndex)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pl-11 space-y-3">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                                    <button
                                                        onClick={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                                                        className={`p-1 rounded-full shrink-0 transition-colors ${opt.isCorrect ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}`}
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={opt.text}
                                                        onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                                                    />
                                                    <button
                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                        className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addOption(qIndex)}
                                                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-2"
                                            >
                                                <Plus className="w-3 h-3" /> Add Option
                                            </button>
                                        </div>

                                        <div className="pl-11 mt-4 pt-4 border-t border-slate-100">
                                            <input
                                                type="text"
                                                value={q.explanation || ''}
                                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                placeholder="Explanation (shown after answering, optional)"
                                                className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-300 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-6 flex justify-center">
                        <button
                            onClick={addQuestion}
                            className="px-6 py-3 bg-white border-2 border-dashed border-purple-300 text-purple-700 hover:border-purple-500 hover:bg-purple-50 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Add Another Question
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
