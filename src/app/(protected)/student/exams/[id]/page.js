'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2, Timer, CheckCircle, AlertCircle, ArrowRight, ChevronLeft, ChevronRight,
    HelpCircle, Flag, XCircle, Menu, LayoutGrid, LogOut, Award, Clock, Sparkles, Eye
} from 'lucide-react';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import Link from 'next/link';

export default function ExamPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({});
    const [questionStatus, setQuestionStatus] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const [isStarted, setIsStarted] = useState(false);
    const [agreedToInstructions, setAgreedToInstructions] = useState(false);
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/exams/${examId}`);
                if (res.data.success) {
                    setExam(res.data.exam);
                    setTimeLeft(res.data.exam.duration * 60);
                    const initialStatus = {};
                    res.data.exam.questions.forEach(q => { initialStatus[q._id] = 'not-visited'; });
                    setQuestionStatus(initialStatus);
                }
            } catch (error) {
                toast.error('Failed to load exam.');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [examId, router]);

    useEffect(() => {
        if (!exam || timeLeft <= 0 || !isStarted) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); handleSubmit(true); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [exam, timeLeft, isStarted]);

    useEffect(() => {
        if (exam && isStarted && exam.questions[currentQuestionIndex]) {
            const currentQId = exam.questions[currentQuestionIndex]._id;
            setQuestionStatus(prev => {
                if (prev[currentQId] === 'not-visited') return { ...prev, [currentQId]: 'visited' };
                return prev;
            });
        }
    }, [currentQuestionIndex, exam, isStarted]);

    const handleSelectOption = (questionId, optionIndex, optionText) => {
        setAnswers(prev => ({ ...prev, [questionId]: { index: optionIndex, text: optionText } }));
        setQuestionStatus(prev => ({ ...prev, [questionId]: prev[questionId] === 'marked' ? 'answered-marked' : 'answered' }));
    };

    const handleNumericAnswer = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: { value } }));
        setQuestionStatus(prev => ({ ...prev, [questionId]: prev[questionId] === 'marked' ? 'answered-marked' : (value ? 'answered' : 'visited') }));
    };

    const handleSubjectiveAnswer = (questionId, text) => {
        setAnswers(prev => ({ ...prev, [questionId]: { textAnswer: text } }));
        setQuestionStatus(prev => ({ ...prev, [questionId]: prev[questionId] === 'marked' ? 'answered-marked' : (text.trim() ? 'answered' : 'visited') }));
    };

    const handleMatchAnswer = (questionId, leftItem, rightItem) => {
        setAnswers(prev => ({ ...prev, [questionId]: { match: { ...(prev[questionId]?.match || {}), [leftItem]: rightItem } } }));
        setQuestionStatus(prev => ({ ...prev, [questionId]: prev[questionId] === 'marked' ? 'answered-marked' : 'answered' }));
    };

    const handleClearResponse = (questionId) => {
        const newAnswers = { ...answers };
        delete newAnswers[questionId];
        setAnswers(newAnswers);
        setQuestionStatus(prev => ({ ...prev, [questionId]: 'visited' }));
    };

    const handleMarkForReview = (questionId) => {
        setQuestionStatus(prev => {
            const current = prev[questionId];
            if (current === 'marked') return { ...prev, [questionId]: 'visited' };
            if (current === 'answered-marked') return { ...prev, [questionId]: 'answered' };
            if (current === 'answered') return { ...prev, [questionId]: 'answered-marked' };
            return { ...prev, [questionId]: 'marked' };
        });
    };

    const handleSkip = () => { if (currentQuestionIndex < exam.questions.length - 1) setCurrentQuestionIndex(prev => prev + 1); };
    const handleSaveAndNext = () => { if (currentQuestionIndex < exam.questions.length - 1) setCurrentQuestionIndex(prev => prev + 1); };

    const handleSubmit = async (auto = false) => {
        if (!auto) {
            const isConfirmed = await confirmDialog("Submit Test", "Are you sure you want to submit? You won't be able to change your answers.");
            if (!isConfirmed) return;
        }
        setSubmitting(true);
        try {
            const payload = {
                examId,
                answers: Object.entries(answers).map(([qId, ans]) => ({
                    questionId: qId,
                    selectedOption: ans.index !== undefined ? ans.index : -1,
                    selectedOptionText: ans.text || null,
                    numericAnswer: ans.value || null,
                    matchAnswers: ans.match || null,
                    textAnswer: ans.textAnswer || null,
                })),
                timeSpent: (exam.duration * 60) - timeLeft,
                startedAt: startedAt || new Date().toISOString(),
            };
            const res = await api.post(`/exams/${examId}/submit`, payload);
            if (res.data.success) router.push(`/student/exams/${examId}/result?attemptId=${res.data.attemptId}`);
        } catch (error) {
            toast.error('Submission failed. Please try again.');
        } finally { setSubmitting(false); }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartExam = () => { setIsStarted(true); setStartedAt(new Date().toISOString()); };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                    </div>
                </div>
                <p className="text-sm text-slate-400 font-medium">Loading exam…</p>
            </div>
        </div>
    );

    if (!exam) return <div className="p-8 text-center text-slate-500">Exam not found</div>;

    // ══════════════════════════════════════════════════════════════════════════
    // SCREEN 1 — INSTRUCTIONS
    // ══════════════════════════════════════════════════════════════════════════
    if (!isStarted) {
        return (
            <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Link href="/student/dashboard" className="hover:text-[var(--theme-primary)] transition-colors">Dashboard</Link>
                    <span>›</span>
                    <Link href="/student/exams" className="hover:text-[var(--theme-primary)] transition-colors">Tests</Link>
                    <span>›</span>
                    <span className="font-semibold text-slate-700">Exam Instructions</span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Instructions card */}
                    <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                            <div className="w-8 h-8 bg-[var(--theme-primary)]/20 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-[var(--theme-primary)]" />
                            </div>
                            <h1 className="text-base font-bold text-slate-800">Exam Instructions</h1>
                        </div>

                        <div className="p-6 space-y-5">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-[0.06em]">Please Read the Instructions Carefully</h2>

                            <ul className="space-y-2.5">
                                {[
                                    `This test contains <strong>${exam.questions.length}</strong> questions`,
                                    `Total duration is <strong>${exam.duration} minutes</strong>`,
                                    'You cannot pause the <strong>test once started</strong>',
                                    'Each question has only <strong>one correct answer</strong>',
                                    'Do not refresh or close the browser',
                                    'Test will <strong>auto submit</strong> after <strong>time expires</strong>',
                                    'Your progress is <strong>saved automatically</strong>',
                                    'Ensure stable internet connection',
                                ].map((text, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]/20 mt-2 shrink-0" />
                                        <span className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />
                                    </li>
                                ))}
                                {exam.negativeMarking && (
                                    <li className="flex items-start gap-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                                        <span className="text-sm text-red-600 font-semibold">Negative marking enabled — incorrect answers will deduct marks.</span>
                                    </li>
                                )}
                            </ul>

                            {(exam.description || exam.instructions) && (
                                <div className="bg-[var(--theme-primary)]/20/60 rounded-xl p-4 border border-[var(--theme-primary)]/30">
                                    <p className="text-[11px] font-bold text-[var(--theme-primary)] uppercase tracking-wider mb-2">Additional Instructions</p>
                                    <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(exam.description || exam.instructions) }} />
                                </div>
                            )}

                            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-[var(--theme-primary)]/20/50 transition-colors border border-slate-100">
                                <input type="checkbox" checked={agreedToInstructions}
                                    onChange={e => setAgreedToInstructions(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-[var(--theme-primary)] focus:ring-[var(--theme-primary)] cursor-pointer" />
                                <span className="text-sm text-slate-700 font-medium">I've read all instructions carefully and have understood them</span>
                            </label>

                            <div className="flex items-center justify-end gap-3 pt-1">
                                <button onClick={() => router.back()}
                                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                    Back to Tests
                                </button>
                                <button onClick={handleStartExam} disabled={!agreedToInstructions}
                                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[var(--theme-sidebar)] hover:bg-[var(--theme-primary)] text-white rounded-xl transition-colors disabled:opacity-40">
                                    Start Test <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-fit">
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
                            <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-lg flex items-center justify-center">
                                <Award className="w-4 h-4 text-[var(--theme-primary)]" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">Test Summary</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex items-center gap-2.5 p-3 bg-[var(--theme-primary)]/20 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-[var(--theme-primary)] shrink-0" />
                                <span className="text-sm font-semibold text-[var(--theme-primary)] truncate">{exam.title}</span>
                            </div>
                            {[
                                { icon: Clock, label: 'Duration', value: `${exam.duration} mins` },
                                { icon: HelpCircle, label: 'Questions', value: exam.questions.length },
                                { icon: CheckCircle, label: 'Marks', value: exam.totalMarks || exam.questions.length },
                                { icon: Sparkles, label: 'Attempts Allowed', value: `${exam.maxAttempts || 1} Allowed` },
                                { icon: XCircle, label: 'Negative Marking', value: exam.negativeMarking ? 'Yes' : 'No' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <item.icon className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm text-slate-500">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SCREEN 2 — EXAM PLAYER
    // ══════════════════════════════════════════════════════════════════════════
    const currentQuestion = exam.questions[currentQuestionIndex];
    const answeredCount = Object.values(questionStatus).filter(s => s === 'answered' || s === 'answered-marked').length;
    const notAnsweredCount = Object.values(questionStatus).filter(s => s === 'visited').length;
    const markedCount = Object.values(questionStatus).filter(s => s === 'marked').length;
    const answeredMarkedCount = Object.values(questionStatus).filter(s => s === 'answered-marked').length;
    const notVisitedCount = Object.values(questionStatus).filter(s => s === 'not-visited').length;
    const totalMarksObtainable = exam.totalMarks || exam.questions.length;
    const marksProgress = Math.round((answeredCount / exam.questions.length) * 100);
    const isLowTime = timeLeft < 300;

    // navigator box color helper — matching reference image exactly
    const getNavBoxStyle = (status, isCurrent) => {
        if (isCurrent) return { bg: 'var(--theme-sidebar)', text: 'white', border: 'var(--theme-sidebar)', ring: true };
        switch (status) {
            case 'answered': return { bg: '#22c55e', text: 'white', border: '#16a34a' };
            case 'answered-marked': return { bg: '#f59e0b', text: 'white', border: '#d97706' };
            case 'marked': return { bg: '#a855f7', text: 'white', border: '#9333ea' };
            case 'visited': return { bg: '#ef4444', text: 'white', border: '#dc2626' };
            default: return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
        }
    };

    return (
        <div className="space-y-3" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Top bar ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                    <div className="w-6 h-6 bg-[var(--theme-primary)]/20 rounded-lg flex items-center justify-center shrink-0">
                        <HelpCircle className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Test: <span className="text-slate-900">{exam.title}</span></span>
                </div>
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--theme-sidebar)] to-[var(--theme-primary)] hover:from-[var(--theme-primary)] hover:to-[var(--theme-primary)] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-[var(--theme-primary)]/30 disabled:opacity-60">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Test
                </button>
            </div>

            {/* ── Stats bar ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Timer */}
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold
                    ${isLowTime ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <Timer className={`w-4 h-4 ${isLowTime ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                    <span className="text-xs text-slate-400 mr-1">Time Left:</span>
                    <span className={`text-sm font-black tabular-nums ${isLowTime ? 'text-red-700' : 'text-slate-900'}`}>{formatTime(timeLeft)}</span>
                </div>
                {/* Questions */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400 mr-1">Questions:</span>
                    <span className="text-sm font-black text-slate-900">{currentQuestionIndex + 1} / {exam.questions.length}</span>
                </div>
                {/* Marks */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400 mr-1">Marks:</span>
                    <span className="text-sm font-black text-slate-900">
                        {answeredCount * Math.round(totalMarksObtainable / exam.questions.length)} / {totalMarksObtainable}
                    </span>
                </div>
                {/* Progress */}
                <div className="flex-1 min-w-[180px] flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
                    <span className="text-xs text-slate-400 shrink-0">Progress</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${marksProgress}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 shrink-0">{marksProgress}%</span>
                </div>
            </div>

            {/* ── Main grid ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Question area */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    {/* Question header */}
                    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">Q{currentQuestionIndex + 1} of {exam.questions.length}</span>
                        {currentQuestion.section && (
                            <>
                                <span className="text-slate-300">|</span>
                                <span className="text-xs font-bold text-[var(--theme-primary)] uppercase tracking-[0.1em]">{currentQuestion.section}</span>
                            </>
                        )}
                    </div>

                    {/* Question body */}
                    <div className="p-6 flex-1">
                        <motion.div key={currentQuestion._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                            {/* Passage */}
                            {currentQuestion.questionType === 'passage_based' && currentQuestion.passage && (
                                <div className="mb-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Eye className="w-3.5 h-3.5" /> Read Passage
                                    </h4>
                                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion.passage) }} />
                                </div>
                            )}

                            {/* Question text */}
                            <div className="prose prose-base max-w-none text-slate-800 font-semibold mb-1"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(`Q${currentQuestionIndex + 1}. ${currentQuestion.question}`) }} />

                            {/* MCQ */}
                            {currentQuestion.options && currentQuestion.options.length > 0 && (!currentQuestion.questionType || currentQuestion.questionType === 'mcq' || currentQuestion.questionType === 'passage_based') && (
                                <>
                                    <p className="text-sm text-slate-400 mb-4">Choose one from below options</p>
                                    <div className="space-y-3">
                                        {currentQuestion.options.map((option, idx) => {
                                            const isSelected = answers[currentQuestion._id]?.index === idx;
                                            return (
                                                <div key={idx} onClick={() => handleSelectOption(currentQuestion._id, idx, option.text)}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150
                                                        ${isSelected
                                                            ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/20/60'
                                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'}`}>
                                                    {/* Letter badge */}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-all
                                                        ${isSelected ? 'bg-[var(--theme-sidebar)] border-[var(--theme-sidebar)] text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-[var(--theme-primary)]' : 'text-slate-600'}`}>
                                                        {option.text}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* Subjective */}
                            {(!currentQuestion.options || currentQuestion.options.length === 0 || currentQuestion.questionType === 'subjective') && (
                                <div className="mt-5 animate-in fade-in duration-300">
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">Type your detailed answer:</label>
                                    <textarea
                                        value={answers[currentQuestion._id]?.textAnswer || ''}
                                        onChange={e => handleSubjectiveAnswer(currentQuestion._id, e.target.value)}
                                        placeholder="Type your detailed answer here..."
                                        className="w-full p-5 rounded-2xl border-2 border-slate-200 focus:border-[var(--theme-primary)] focus:ring-4 focus:ring-[var(--theme-primary)]/10 min-h-[240px] resize-y text-slate-800 bg-slate-50 transition-all text-base shadow-inner font-medium placeholder:text-slate-400"
                                    />
                                </div>
                            )}

                            {/* Numeric */}
                            {currentQuestion.questionType === 'numeric' && (
                                <div className="mt-5">
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">Type your numeric answer:</label>
                                    <input type="number" step="any"
                                        value={answers[currentQuestion._id]?.value || ''}
                                        onChange={e => handleNumericAnswer(currentQuestion._id, e.target.value)}
                                        className="w-full max-w-sm px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[var(--theme-primary)] focus:ring-0 text-lg font-bold text-slate-800 transition-colors"
                                        placeholder="e.g. 42.5" />
                                </div>
                            )}

                            {/* Match the following */}
                            {currentQuestion.questionType === 'match_the_following' && currentQuestion.pairs && (
                                <div className="mt-5 space-y-3">
                                    <p className="text-sm font-medium text-slate-500 mb-3">Match the items on the left with the correct options on the right.</p>
                                    {currentQuestion.pairs.map((pair, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="flex-1 font-semibold text-slate-800">{idx + 1}. {pair.left}</div>
                                            <div className="hidden sm:block text-slate-300 font-bold">→</div>
                                            <div className="flex-1">
                                                <select value={answers[currentQuestion._id]?.match?.[pair.left] || ''}
                                                    onChange={e => handleMatchAnswer(currentQuestion._id, pair.left, e.target.value)}
                                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]">
                                                    <option value="" disabled>Select match…</option>
                                                    {currentQuestion.pairs.map((p, i) => (
                                                        <option key={i} value={p.right}>{String.fromCharCode(65 + i)}. {p.right}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Bottom actions */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleClearResponse(currentQuestion._id)}
                                disabled={!answers[currentQuestion._id]}
                                className="px-3 py-2 text-xs font-bold text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-40">
                                Clear Answer
                            </button>
                            <button onClick={() => handleMarkForReview(currentQuestion._id)}
                                className={`px-3 py-2 text-xs font-bold border rounded-xl transition-colors
                                    ${questionStatus[currentQuestion._id] === 'marked' || questionStatus[currentQuestion._id] === 'answered-marked'
                                        ? 'text-amber-700 border-amber-300 bg-amber-50'
                                        : 'text-amber-600 border-amber-200 hover:bg-amber-50'}`}>
                                Mark for Review
                            </button>
                            <button onClick={handleSkip}
                                className="px-3 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                Skip Question
                            </button>
                        </div>
                        <button onClick={handleSaveAndNext}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-sidebar)] hover:bg-[var(--theme-primary)] text-white text-sm font-bold rounded-xl transition-colors">
                            Save & Next <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── RIGHT: Question Navigator (matches reference image) ── */}
                <div className="space-y-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                <span className="text-sm font-bold text-slate-800">
                                    {answeredCount}/{exam.questions.length} Answered
                                </span>
                            </div>
                            <LayoutGrid className="w-4 h-4 text-slate-400" />
                        </div>

                        {/* Question number grid */}
                        <div className="p-4">
                            <div className="grid grid-cols-6 gap-2 mb-5">
                                {exam.questions.map((q, idx) => {
                                    const status = questionStatus[q._id] || 'not-visited';
                                    const isCurrent = currentQuestionIndex === idx;
                                    const style = getNavBoxStyle(status, isCurrent);
                                    return (
                                        <button key={idx} onClick={() => setCurrentQuestionIndex(idx)}
                                            className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold border-2 transition-all hover:scale-105 hover:shadow-sm"
                                            style={{
                                                backgroundColor: style.bg,
                                                color: style.text,
                                                borderColor: style.border,
                                                outline: style.ring ? '2px solid var(--theme-sidebar)' : 'none',
                                                outlineOffset: '2px',
                                            }}>
                                            {idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend — exactly matching reference image */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* Answered */}
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-sm font-black shrink-0">
                                        {answeredCount}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 leading-tight">Answered</span>
                                </div>

                                {/* Not Answered */}
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center text-white text-sm font-black shrink-0">
                                        {notAnsweredCount}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 leading-tight">Not Answered</span>
                                </div>

                                {/* Marked for Review */}
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="w-9 h-9 rounded-lg bg-[var(--theme-accent)] flex items-center justify-center text-white text-sm font-black shrink-0">
                                        {markedCount}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 leading-tight">Marked for Review</span>
                                </div>

                                {/* Answered & Marked */}
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white text-sm font-black shrink-0">
                                        {answeredMarkedCount}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 leading-tight">Answered & Marked for Review</span>
                                </div>

                                {/* Not Visited — full width */}
                                <div className="col-span-2 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-black shrink-0">
                                        {notVisitedCount}
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600">Not Visited</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Finish Test button */}
                    <button onClick={() => handleSubmit(false)} disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl transition-all shadow-sm shadow-red-900/20 disabled:opacity-60">
                        <LogOut className="w-4 h-4" />
                        Finish Test
                    </button>
                </div>
            </div>
        </div>
    );
}