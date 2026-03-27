// ─── ManageQuizPage.jsx ───────────────────────────────────────────────────────
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/tutorTokens';

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
                if (res.data.success) {
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
            if (q.options.some(o => !o.text.trim())) { toast.error(`All options in Question ${i + 1} must have text`);     return; }
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

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                style={{ borderColor: FX.primary25Transparent, borderTopColor: C.btnPrimary }} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>Loading quiz…</p>
        </div>
    );

    if (!lesson) return (
        <div className="p-8" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
            Lesson not found.
        </div>
    );

    const totalPoints = quizData.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

    const settingInputSt = {
        width: 64, textAlign: 'center', padding: '4px 8px',
        fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold,
        border: `1px solid ${C.cardBorder}`, borderRadius: R.md,
        backgroundColor: C.surfaceWhite, color: C.heading, outline: 'none',
    };

    return (
        <div className="max-w-3xl mx-auto space-y-5" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/tutor/courses/${courseId}`)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                        style={{ backgroundColor: C.innerBg, color: C.textMuted }}>
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: FX.primary15, border: `1px solid ${FX.primary25}` }}>
                                <FileText className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                            </div>
                            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                Quiz Builder
                            </h1>
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Lesson: {lesson.title}
                        </p>
                    </div>
                </div>
                <button onClick={saveQuiz} disabled={saving}
                    className="px-4 py-2 text-white rounded-xl flex items-center gap-2 text-sm disabled:opacity-60 hover:opacity-90 transition-all"
                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.semibold, boxShadow: S.btn }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving…' : 'Save Quiz'}
                </button>
            </div>

            {/* ── Settings + Questions card ─────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                {/* Settings bar */}
                <div className="px-5 py-4 flex items-center justify-between"
                    style={{ backgroundColor: FX.primary07, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl" style={{ backgroundColor: FX.primary15 }}>
                            <AlertCircle className="w-4 h-4" style={{ color: C.btnPrimary }} />
                        </div>
                        <div>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                Quiz Settings
                            </h2>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                Configure passing criteria and time limit.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        {[
                            { label: 'Total Points', content: <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.btnPrimary }}>{totalPoints}</span> },
                            { label: 'Passing %',    content: <input type="number" value={quizData.passingScore} onChange={e => setQuizData(p => ({ ...p, passingScore: e.target.value }))} style={settingInputSt} /> },
                            { label: 'Time (mins)',  content: <input type="number" placeholder="∞" value={quizData.timeLimit} onChange={e => setQuizData(p => ({ ...p, timeLimit: e.target.value }))} style={settingInputSt} /> },
                        ].map(({ label, content }) => (
                            <div key={label} className="text-center">
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 4 }}>
                                    {label}
                                </p>
                                {content}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Questions area */}
                <div className="p-5 space-y-5">
                    {quizData.questions.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border-2 border-dashed"
                            style={{ borderColor: C.cardBorder }}>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                                style={{ backgroundColor: FX.primary12 }}>
                                <FileText className="w-6 h-6" style={{ color: C.btnPrimary }} />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading, marginBottom: 4 }}>
                                No questions yet
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginBottom: 16 }}>
                                Start building your quiz by adding the first question.
                            </p>
                            <button onClick={addQuestion}
                                className="px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 mx-auto transition-all hover:opacity-80"
                                style={{ backgroundColor: FX.primary12, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                <Plus className="w-4 h-4" /> Add First Question
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {quizData.questions.map((q, qIndex) => (
                                <div key={q.id || qIndex} className="rounded-2xl overflow-hidden relative group"
                                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    {/* Left accent */}
                                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: C.btnPrimary }} />

                                    <div className="p-5 pl-5">
                                        {/* Question row */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-black"
                                                    style={{ backgroundColor: C.btnPrimary }}>
                                                    {qIndex + 1}
                                                </span>
                                                <input type="text" value={q.question}
                                                    onChange={e => updateQuestion(qIndex, 'question', e.target.value)}
                                                    placeholder="Enter your question here..."
                                                    className="flex-1 bg-transparent min-w-0 pb-0.5 border-b border-transparent transition-all"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading, outline: 'none' }}
                                                    onFocus={e => { e.target.style.borderBottomColor = C.btnPrimary; }}
                                                    onBlur={e => { e.target.style.borderBottomColor = 'transparent'; }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                    <label style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel }}>PTS</label>
                                                    <input type="number" value={q.points}
                                                        onChange={e => updateQuestion(qIndex, 'points', e.target.value)}
                                                        className="w-10 text-center bg-transparent"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, outline: 'none' }}
                                                    />
                                                </div>
                                                <button onClick={() => removeQuestion(qIndex)}
                                                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                                                    style={{ backgroundColor: C.dangerBg, color: C.danger }}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Options */}
                                        <div className="pl-10 space-y-2">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all"
                                                    style={opt.isCorrect
                                                        ? { borderColor: C.successBorder, backgroundColor: C.successBg }
                                                        : { borderColor: C.cardBorder, backgroundColor: C.surfaceWhite }}>
                                                    <button onClick={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                                                        className="flex-shrink-0 transition-colors"
                                                        style={{ color: opt.isCorrect ? C.success : C.textMuted }}>
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                    <input type="text" value={opt.text}
                                                        onChange={e => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        className="flex-1 bg-transparent border-none"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, outline: 'none' }}
                                                    />
                                                    <button onClick={() => removeOption(qIndex, oIndex)}
                                                        className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:opacity-80"
                                                        style={{ backgroundColor: C.dangerBg, color: C.danger }}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => addOption(qIndex)}
                                                className="text-xs font-semibold flex items-center gap-1 mt-1 transition-opacity hover:opacity-70"
                                                style={{ color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                                <Plus className="w-3 h-3" /> Add Option
                                            </button>
                                        </div>

                                        {/* Explanation */}
                                        <div className="pl-10 mt-3 pt-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                            <input type="text" value={q.explanation || ''}
                                                onChange={e => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                placeholder="Explanation (shown after answering, optional)"
                                                style={{ ...cx.input(), width: '100%', padding: '8px 12px', fontSize: T.size.xs }}
                                                onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                                                onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add question button */}
                    {quizData.questions.length > 0 && (
                        <button onClick={addQuestion}
                            className="w-full py-3 rounded-2xl text-sm font-semibold border-2 border-dashed flex items-center justify-center gap-2 transition-all hover:opacity-80"
                            style={{ borderColor: FX.primary40, color: C.btnPrimary, fontFamily: T.fontFamily }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = FX.primary07; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <Plus className="w-4 h-4" /> Add Another Question
                        </button>
                    )}
                </div>
              
            </div>
        </div>
    );
}
