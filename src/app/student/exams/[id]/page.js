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
import { Progress } from '@/components/ui/progress';
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

    // Fetch Exam
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/exams/${examId}`);
                if (res.data.success) {
                    setExam(res.data.exam);
                    setTimeLeft(res.data.exam.duration * 60);
                    const initialStatus = {};
                    res.data.exam.questions.forEach(q => {
                        initialStatus[q._id] = 'not-visited';
                    });
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

    // Timer
    useEffect(() => {
        if (!exam || timeLeft <= 0 || !isStarted) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [exam, timeLeft, isStarted]);

    // Mark current question as visited
    useEffect(() => {
        if (exam && isStarted && exam.questions[currentQuestionIndex]) {
            const currentQId = exam.questions[currentQuestionIndex]._id;
            setQuestionStatus(prev => {
                if (prev[currentQId] === 'not-visited') {
                    return { ...prev, [currentQId]: 'visited' };
                }
                return prev;
            });
        }
    }, [currentQuestionIndex, exam, isStarted]);

    const handleSelectOption = (questionId, optionIndex, optionText) => {
        setAnswers(prev => ({ ...prev, [questionId]: { index: optionIndex, text: optionText } }));
        setQuestionStatus(prev => ({
            ...prev,
            [questionId]: prev[questionId] === 'marked' ? 'answered-marked' : 'answered'
        }));
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

    const handleSkip = () => {
        if (currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleSaveAndNext = () => {
        if (currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

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
                    selectedOption: ans.index,
                    selectedOptionText: ans.text
                })),
                timeSpent: (exam.duration * 60) - timeLeft,
                startedAt: startedAt || new Date().toISOString()
            };
            const res = await api.post(`/exams/${examId}/submit`, payload);
            if (res.data.success) {
                router.push(`/student/exams/${examId}/result?attemptId=${res.data.attemptId}`);
            }
        } catch (error) {
            toast.error('Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStartExam = () => {
        setIsStarted(true);
        setStartedAt(new Date().toISOString());
    };

    // --- LOADING ---
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium text-sm animate-pulse">Loading exam...</p>
            </div>
        </div>
    );
    if (!exam) return <div className="p-8 text-center text-slate-500">Exam not found</div>;

    // ==========================================
    // SCREEN 1: EXAM INSTRUCTIONS (Image 1)
    // ==========================================
    if (!isStarted) {
        return (
            <div className="space-y-6 font-sans">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/student/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                    <span>›</span>
                    <Link href="/student/exams" className="hover:text-indigo-600">Tests</Link>
                    <span>›</span>
                    <span className="font-semibold text-slate-800">Exam Instructions</span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Instructions Card */}
                    <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-800">Exam Instructions</h1>
                        </div>

                        <div className="p-6 space-y-6">
                            <h2 className="text-base font-bold text-slate-800">Please Read the Instructions Carefully</h2>

                            <ul className="space-y-3">
                                {[
                                    `This test contains <strong>${exam.questions.length}</strong> multiple-choice questions`,
                                    `Total duration is <strong>${exam.duration} minutes</strong>`,
                                    'You cannot pause the <strong>test once started</strong>',
                                    'Each question has only <strong>one correct answer</strong>',
                                    'Do not refresh or close the browser',
                                    'Test will <strong>auto submit</strong> after <strong>time expires</strong>',
                                    'Your progress is <strong>saved automatically</strong>',
                                    'Ensure stable internet connection',
                                ].map((text, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></span>
                                        <span className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />
                                    </li>
                                ))}
                                {exam.negativeMarking && (
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0"></span>
                                        <span className="text-sm text-red-600 font-medium">Negative marking is enabled. Incorrect answers will deduct marks.</span>
                                    </li>
                                )}
                            </ul>

                            {/* Tutor instructions */}
                            {(exam.description || exam.instructions) && (
                                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Additional Instructions</p>
                                    <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: sanitizeHtml(exam.description || exam.instructions) }} />
                                </div>
                            )}

                            {/* Checkbox */}
                            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={agreedToInstructions}
                                    onChange={(e) => setAgreedToInstructions(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-sm text-slate-700 font-medium">I've read all the instructions carefully and have understood them</span>
                            </label>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => router.back()} className="px-6">
                                    Back to Tests
                                </Button>
                                <Button
                                    onClick={handleStartExam}
                                    disabled={!agreedToInstructions}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 disabled:opacity-50"
                                >
                                    Start Test <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Test Summary Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-fit">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                            <Award className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-base font-bold text-slate-800">Test Summary</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3 p-2 bg-indigo-50 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-semibold text-indigo-800">{exam.title}</span>
                            </div>
                            {[
                                { icon: Clock, label: 'Duration', value: `${exam.duration} mins`, color: 'text-slate-600' },
                                { icon: HelpCircle, label: 'Questions', value: exam.questions.length, color: 'text-indigo-600' },
                                { icon: CheckCircle, label: 'Marks', value: exam.totalMarks || exam.questions.length, color: 'text-emerald-600' },
                                { icon: Sparkles, label: 'Attempts Allowed', value: `${exam.maxAttempts || 1} Allowed`, color: 'text-indigo-600' },
                                { icon: XCircle, label: 'Negative Marking', value: exam.negativeMarking ? 'Yes' : 'No', color: exam.negativeMarking ? 'text-red-600' : 'text-red-600' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <item.icon className={`w-4 h-4 ${item.color}`} />
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

    // ==========================================
    // SCREEN 2: TAKE EXAM (Image 2)
    // ==========================================
    const currentQuestion = exam.questions[currentQuestionIndex];
    const answeredCount = Object.values(questionStatus).filter(s => s === 'answered' || s === 'answered-marked').length;
    const notAnsweredCount = Object.values(questionStatus).filter(s => s === 'visited').length;
    const markedCount = Object.values(questionStatus).filter(s => s === 'marked').length;
    const answeredMarkedCount = Object.values(questionStatus).filter(s => s === 'answered-marked').length;
    const notVisitedCount = Object.values(questionStatus).filter(s => s === 'not-visited').length;
    const totalMarksObtainable = exam.totalMarks || exam.questions.length;
    const marksProgress = Math.round((answeredCount / exam.questions.length) * 100);

    const getStatusColor = (status, isCurrent) => {
        if (isCurrent) return 'ring-2 ring-indigo-600 bg-indigo-100 text-indigo-800 font-bold';
        switch (status) {
            case 'answered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'answered-marked': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'marked': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'visited': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    return (
        <div className="space-y-4 font-sans">
            {/* Top Bar: Exam Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-slate-700">Test: {exam.title}</span>
                    </div>
                    <Button onClick={() => handleSubmit(false)} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Submit Test
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-4 flex-wrap">
                {[
                    { icon: Timer, label: 'Time Left', value: formatTime(timeLeft), danger: timeLeft < 300 },
                    { icon: HelpCircle, label: 'Questions', value: `${currentQuestionIndex + 1} / ${exam.questions.length}` },
                    { icon: Award, label: 'Marks', value: `${answeredCount * Math.round(totalMarksObtainable / exam.questions.length)} / ${totalMarksObtainable}` },
                ].map((stat, i) => (
                    <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${stat.danger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <stat.icon className={`w-4 h-4 ${stat.danger ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                        <span className="text-xs text-slate-400">{stat.label}:</span>
                        <span className={`text-sm font-bold ${stat.danger ? 'text-red-700' : ''}`}>{stat.value}</span>
                    </div>
                ))}
                <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-xs text-slate-400">Progress</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${marksProgress}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{marksProgress}%</span>
                </div>
            </div>

            {/* Main Grid: Question + Navigator */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Question Area */}
                <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Question Header */}
                    <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <span className="text-sm font-bold text-slate-800">Q{currentQuestionIndex + 1} of {exam.questions.length}</span>
                        {currentQuestion.section && (
                            <>
                                <span className="text-slate-300">|</span>
                                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{currentQuestion.section}</span>
                            </>
                        )}
                    </div>

                    {/* Question Body */}
                    <div className="p-6">
                        <motion.div key={currentQuestion._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="prose prose-lg max-w-none text-slate-800 font-semibold mb-2"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(`Q${currentQuestionIndex + 1}. ${currentQuestion.question}`) }}
                            />
                            <p className="text-sm text-slate-400 mb-5">Choose one from below options</p>

                            <div className="space-y-3">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = answers[currentQuestion._id]?.index === idx;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelectOption(currentQuestion._id, idx, option.text)}
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                                                ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-50/50'
                                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 flex-shrink-0
                                                ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                                            >
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={`text-sm font-medium ${isSelected ? 'text-indigo-800' : 'text-slate-600'}`}>{option.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleClearResponse(currentQuestion._id)}
                                disabled={!answers[currentQuestion._id]}
                                className="px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                                Clear Answer
                            </button>
                            <button
                                onClick={() => handleMarkForReview(currentQuestion._id)}
                                className={`px-3 py-2 text-xs font-semibold border rounded-lg transition-colors
                                    ${questionStatus[currentQuestion._id] === 'marked' || questionStatus[currentQuestion._id] === 'answered-marked'
                                        ? 'text-amber-700 border-amber-300 bg-amber-50'
                                        : 'text-amber-600 border-amber-200 hover:bg-amber-50'
                                    }`}
                            >
                                Mark for Review
                            </button>
                            <button onClick={handleSkip} className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                Skip Question
                            </button>
                        </div>
                        <Button onClick={handleSaveAndNext} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5">
                            Save & Next <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>

                {/* Right: Question Navigator */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-slate-800">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                {answeredCount}/{exam.questions.length} Answered
                            </span>
                            <LayoutGrid className="w-4 h-4 text-slate-400" />
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-6 gap-2 mb-4">
                            {exam.questions.map((q, idx) => {
                                const status = questionStatus[q._id] || 'not-visited';
                                const isCurrent = currentQuestionIndex === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold border transition-all hover:scale-105 ${getStatusColor(status, isCurrent)}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {[
                                { color: 'bg-emerald-500', label: 'Answered', count: answeredCount },
                                { color: 'bg-red-500', label: 'Not Answered', count: notAnsweredCount },
                                { color: 'bg-purple-500', label: 'Marked for Review', count: markedCount },
                                { color: 'bg-amber-500', label: 'Answered & Marked', count: answeredMarkedCount },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                    <span className={`w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold ${item.color}`}>
                                        {item.count}
                                    </span>
                                    <span className="text-slate-600">{item.label}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg col-span-2">
                                <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-200 text-slate-500 text-[10px] font-bold">
                                    {notVisitedCount}
                                </span>
                                <span className="text-slate-600">Not Visited</span>
                            </div>
                        </div>
                    </div>

                    {/* Finish Test Button */}
                    <Button
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-sm"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Finish Test
                    </Button>
                </div>
            </div>
        </div>
    );
}
