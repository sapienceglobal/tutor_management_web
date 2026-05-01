'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    MdArrowBack,
    MdAdd,
    MdDelete,
    MdSave,
    MdWarning,
    MdArticle,
    MdCheckCircle,
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

// ─── Base Input Style — directive 13 ─────────────────────────────────────────
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
        passingScore: 70, timeLimit: '', questions: [],
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
            options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
        }],
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
            if (!q.question.trim())                  { toast.error(`Question ${i + 1} cannot be empty`);                           return; }
            if (q.options.some(o => !o.text.trim())) { toast.error(`All options in Question ${i + 1} must have text`);             return; }
            if (!q.options.some(o => o.isCorrect))   { toast.error(`Question ${i + 1} must have at least one correct option`);     return; }
        }
        setSaving(true);
        try {
            const totalPoints = quizData.questions.reduce((sum, q) => sum + Number(q.points), 0);
            await api.patch(`/lessons/${lessonId}`, {
                type: 'quiz',
                content: { ...lesson.content, quiz: { ...quizData, totalPoints } },
            });
            toast.success('Quiz saved successfully');
            router.push(`/tutor/courses/${courseId}`);
        } catch (err) {
            console.error('Save quiz error:', err);
            toast.error('Failed to save quiz');
        } finally { setSaving(false); }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div
                className="rounded-full border-[3px] animate-spin"
                style={{ width: 48, height: 48, borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
            />
            <p style={{ color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium, fontFamily: T.fontFamily }}>
                Loading quiz...
            </p>
        </div>
    );

    if (!lesson) return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <p style={{ color: C.danger, fontSize: T.size.md, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                Lesson not found.
            </p>
        </div>
    );

    const totalPoints = quizData.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

    return (
        <div
            className="w-full min-h-screen p-6 pb-24"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            <div className="max-w-3xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div
                    className="flex items-center justify-between"
                    style={{
                        backgroundColor: C.cardBg,
                        border: `1px solid ${C.cardBorder}`,
                        boxShadow: S.card,
                        borderRadius: R['2xl'],
                        padding: 20,
                    }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/tutor/courses/${courseId}`)}
                            className="flex items-center justify-center cursor-pointer transition-all hover:opacity-80 shrink-0"
                            style={{
                                width: 40,
                                height: 40,
                                backgroundColor: C.innerBg,
                                borderRadius: '10px',
                                border: 'none',
                            }}
                        >
                            <MdArrowBack style={{ width: 18, height: 18, color: C.heading }} />
                        </button>
                        <div>
                            <h1
                                className="flex items-center gap-2"
                                style={{
                                    color: C.heading,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xl,
                                    fontWeight: T.weight.bold,
                                    margin: '0 0 2px 0',
                                }}
                            >
                                <MdArticle style={{ width: 20, height: 20, color: C.btnPrimary }} />
                                Quiz Builder
                            </h1>
                            <p style={{ color: C.text, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0 }}>
                                Lesson: {lesson.title}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Settings Card ── */}
                <div
                    className="overflow-hidden"
                    style={{
                        backgroundColor: C.cardBg,
                        border: `1px solid ${C.cardBorder}`,
                        boxShadow: S.card,
                        borderRadius: R['2xl'],
                    }}
                >
                    {/* Settings header */}
                    <div
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex items-center justify-center shrink-0"
                                style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.iconBg }}
                            >
                                <MdWarning style={{ width: 18, height: 18, color: C.iconColor }} />
                            </div>
                            <div>
                                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                    Quiz Settings
                                </h2>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text, margin: 0 }}>
                                    Configure criteria
                                </p>
                            </div>
                        </div>

                        {/* Settings controls */}
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>
                                    Total Pts
                                </p>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                    {totalPoints}
                                </span>
                            </div>
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>
                                    Passing %
                                </p>
                                <input
                                    type="number" min="0" max="100"
                                    value={quizData.passingScore}
                                    onChange={e => setQuizData(p => ({ ...p, passingScore: e.target.value }))}
                                    style={{ ...baseInputStyle, width: 70, padding: '6px 8px', textAlign: 'center' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>
                                    Time (mins)
                                </p>
                                <input
                                    type="number" placeholder="∞"
                                    value={quizData.timeLimit}
                                    onChange={e => setQuizData(p => ({ ...p, timeLimit: e.target.value }))}
                                    style={{ ...baseInputStyle, width: 70, padding: '6px 8px', textAlign: 'center' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Questions area */}
                    <div className="p-6 space-y-6">
                        {quizData.questions.length === 0 ? (
                            /* ── Empty state ── */
                            <div
                                className="text-center flex flex-col items-center border border-dashed"
                                style={{
                                    backgroundColor: C.innerBg,
                                    borderColor: C.cardBorder,
                                    borderRadius: R['2xl'],
                                    padding: '48px 24px',
                                }}
                            >
                                <div
                                    className="flex items-center justify-center mx-auto mb-4"
                                    style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg }}
                                >
                                    <MdArticle style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                    No questions yet
                                </h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: '0 0 16px 0' }}>
                                    Start building your quiz by adding the first question.
                                </p>
                                <button
                                    onClick={addQuestion}
                                    className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                                    style={{
                                        background: C.gradientBtn,
                                        color: '#ffffff',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        border: 'none',
                                        borderRadius: '10px',
                                        boxShadow: S.btn,
                                        height: 40,
                                        padding: '0 24px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <MdAdd style={{ width: 16, height: 16 }} /> Add First Question
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {quizData.questions.map((q, qIndex) => (
                                    <div
                                        key={q.id || qIndex}
                                        style={{
                                            backgroundColor: C.innerBg,
                                            border: `1px solid ${C.cardBorder}`,
                                            borderRadius: '10px',
                                            padding: 20,
                                        }}
                                    >
                                        {/* Question row */}
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3 w-full">
                                                {/* Question number badge */}
                                                <span
                                                    className="flex items-center justify-center text-white shrink-0"
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: R.full,
                                                        backgroundColor: C.btnPrimary,
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.base,
                                                        fontWeight: T.weight.bold,
                                                    }}
                                                >
                                                    {qIndex + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={q.question}
                                                    onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                                                    placeholder="Enter your question here..."
                                                    style={{ ...baseInputStyle, flex: 1 }}
                                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Points input */}
                                                <div
                                                    className="flex items-center gap-2"
                                                    style={{
                                                        backgroundColor: C.cardBg,
                                                        border: `1px solid ${C.cardBorder}`,
                                                        borderRadius: '10px',
                                                        padding: '6px 12px',
                                                    }}
                                                >
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel }}>
                                                        PTS
                                                    </span>
                                                    <input
                                                        type="number" min="1"
                                                        value={q.points}
                                                        onChange={e => updateQuestion(qIndex, 'points', e.target.value)}
                                                        style={{
                                                            width: 40,
                                                            border: 'none',
                                                            outline: 'none',
                                                            textAlign: 'center',
                                                            fontFamily: T.fontFamily,
                                                            fontSize: T.size.base,
                                                            fontWeight: T.weight.bold,
                                                            color: C.heading,
                                                            backgroundColor: 'transparent',
                                                        }}
                                                    />
                                                </div>
                                                {/* Delete question */}
                                                <button
                                                    onClick={() => removeQuestion(qIndex)}
                                                    className="flex items-center justify-center shrink-0 cursor-pointer transition-all hover:opacity-80"
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        backgroundColor: C.dangerBg,
                                                        border: `1px solid ${C.dangerBorder}`,
                                                        borderRadius: '10px',
                                                    }}
                                                >
                                                    <MdDelete style={{ width: 16, height: 16, color: C.danger }} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Options */}
                                        <div className="ml-11 space-y-3">
                                            {q.options.map((opt, oIndex) => (
                                                <div
                                                    key={oIndex}
                                                    className="flex items-center gap-3 transition-colors"
                                                    style={{
                                                        backgroundColor: opt.isCorrect ? C.successBg : C.cardBg,
                                                        border: `1px solid ${opt.isCorrect ? C.successBorder : C.cardBorder}`,
                                                        borderRadius: '10px',
                                                        padding: 12,
                                                    }}
                                                >
                                                    {/* Correct toggle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                                                        className="flex items-center justify-center transition-all hover:opacity-70"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                    >
                                                        <MdCheckCircle style={{
                                                            width: 20,
                                                            height: 20,
                                                            color: opt.isCorrect ? C.success : C.text,
                                                        }} />
                                                    </button>
                                                    {/* Option text */}
                                                    <input
                                                        type="text"
                                                        value={opt.text}
                                                        onChange={e => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: 'transparent',
                                                            border: 'none',
                                                            outline: 'none',
                                                            fontFamily: T.fontFamily,
                                                            fontSize: T.size.base,
                                                            fontWeight: T.weight.semibold,
                                                            color: C.heading,
                                                        }}
                                                    />
                                                    {/* Remove option */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                        className="flex items-center justify-center shrink-0 cursor-pointer transition-all hover:opacity-80"
                                                        style={{
                                                            width: 28,
                                                            height: 28,
                                                            backgroundColor: C.dangerBg,
                                                            border: `1px solid ${C.dangerBorder}`,
                                                            borderRadius: '10px',
                                                        }}
                                                    >
                                                        <MdDelete style={{ width: 14, height: 14, color: C.danger }} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add option */}
                                            <button
                                                onClick={() => addOption(qIndex)}
                                                className="flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-70 mt-2"
                                                style={{
                                                    color: C.btnPrimary,
                                                    fontFamily: T.fontFamily,
                                                    fontSize: T.size.base,
                                                    fontWeight: T.weight.bold,
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                }}
                                            >
                                                <MdAdd style={{ width: 14, height: 14 }} /> Add Option
                                            </button>

                                            {/* Explanation */}
                                            <div className="mt-4 pt-4" style={{ borderTop: `1px dashed ${C.cardBorder}` }}>
                                                <input
                                                    type="text"
                                                    value={q.explanation || ''}
                                                    onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                    placeholder="Explanation (shown after answering, optional)"
                                                    style={{ ...baseInputStyle, fontSize: T.size.xs }}
                                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add another question */}
                                <button
                                    onClick={addQuestion}
                                    className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-80 border-2 border-dashed"
                                    style={{
                                        backgroundColor: C.innerBg,
                                        borderColor: C.btnPrimary,
                                        color: C.btnPrimary,
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.base,
                                        fontWeight: T.weight.bold,
                                        borderRadius: '10px',
                                        height: 48,
                                    }}
                                >
                                    <MdAdd style={{ width: 16, height: 16 }} /> Add Another Question
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Fixed Bottom Save Bar ── */}
                <div
                    className="fixed bottom-0 left-0 right-0 z-20 p-4 flex justify-center"
                    style={{
                        backgroundColor: `${C.cardBg}f5`,
                        backdropFilter: 'blur(8px)',
                        borderTop: `1px solid ${C.cardBorder}`,
                        boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
                    }}
                >
                    <div className="w-full max-w-3xl flex items-center justify-end">
                        <button
                            onClick={saveQuiz}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 w-full sm:w-auto"
                            style={{
                                background: C.gradientBtn,
                                color: '#ffffff',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                border: 'none',
                                borderRadius: '10px',
                                boxShadow: S.btn,
                                height: 44,
                                padding: '0 32px',
                                cursor: 'pointer',
                            }}
                        >
                            {saving
                                ? <div className="rounded-full border-2 animate-spin" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                : <MdSave style={{ width: 16, height: 16 }} />}
                            Save Quiz
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}