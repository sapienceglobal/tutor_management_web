'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2, Timer, CheckCircle, AlertCircle, ArrowRight, ChevronLeft, ChevronRight,
    HelpCircle, Flag, XCircle, Menu, LayoutGrid, PauseCircle, LogOut, Award
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function ExamPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: optionIndex }
    const [questionStatus, setQuestionStatus] = useState({}); // { questionId: 'visited' | 'marked' | 'answered' }
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const [sidebarView, setSidebarView] = useState('grid'); // 'grid' | 'list'
    const { confirmDialog } = useConfirm();

    // Helper to strip HTML for preview
    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '').substring(0, 60) + (html.length > 60 ? '...' : '');
    };

    // Fetch Exam
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/exams/${examId}`);
                if (res.data.success) {
                    setExam(res.data.exam);
                    setTimeLeft(res.data.exam.duration * 60);
                    // Initialize status for all questions
                    const initialStatus = {};
                    res.data.exam.questions.forEach(q => {
                        initialStatus[q._id] = 'not-visited';
                    });
                    setQuestionStatus(initialStatus);
                    setStartedAt(new Date().toISOString());
                }
            } catch (error) {
                console.error('Error fetching exam:', error);
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
        if (!exam || timeLeft <= 0 || isPaused || !isStarted) return;
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
    }, [exam, timeLeft, isPaused]);

    // Mark current question as visited
    useEffect(() => {
        if (exam && exam.questions[currentQuestionIndex]) {
            const currentQId = exam.questions[currentQuestionIndex]._id;
            setQuestionStatus(prev => {
                // Only mark as visited if it's currently 'not-visited'
                if (prev[currentQId] === 'not-visited') {
                    return { ...prev, [currentQId]: 'visited' };
                }
                return prev;
            });
        }
    }, [currentQuestionIndex, exam]);

    const handleSelectOption = (questionId, optionIndex, optionText) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { index: optionIndex, text: optionText }
        }));
        setQuestionStatus(prev => ({
            ...prev,
            [questionId]: prev[questionId] === 'marked' ? 'marked' : 'answered'
        }));
    };

    const handleClearResponse = (questionId) => {
        const newAnswers = { ...answers };
        delete newAnswers[questionId];
        setAnswers(newAnswers);
        setQuestionStatus(prev => ({
            ...prev,
            [questionId]: 'visited'
        }));
    };

    const handleMarkForReview = (questionId) => {
        setQuestionStatus(prev => ({
            ...prev,
            [questionId]: prev[questionId] === 'marked' ? (answers[questionId] !== undefined ? 'answered' : 'visited') : 'marked'
        }));
    };

    const handleSubmit = async (auto = false) => {
        if (!auto) {
            const isConfirmed = await confirmDialog("Submit Test", "Are you sure you want to Submit Test?");
            if (!isConfirmed) return;
        }

        setSubmitting(true);
        try {
            const payload = {
                examId,
                answers: Object.entries(answers).map(([qId, ans]) => ({
                    questionId: qId,
                    selectedOption: ans.index,
                    selectedOptionText: ans.text // Send text for shuffling support
                })),
                timeSpent: (exam.duration * 60) - timeLeft,
                startedAt: startedAt || new Date().toISOString()
            };

            const res = await api.post(`/exams/${examId}/submit`, payload);
            if (res.data.success) {
                router.push(`/student/exams/${examId}/result?attemptId=${res.data.attemptId}`);
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
            toast.error('Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (status, isCurrent) => {
        if (isCurrent) return 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 bg-white text-slate-900 font-bold';
        switch (status) {
            case 'answered': return 'bg-emerald-500 text-white border-emerald-600';
            case 'marked': return 'bg-violet-500 text-white border-violet-600';
            case 'visited': return 'bg-rose-500 text-white border-rose-600'; // Using Red/Rose for visited but not answered (Skipped)
            default: return 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700';
        }
    };

    // Start Screen State
    const [isStarted, setIsStarted] = useState(false);

    // Initial check for start
    useEffect(() => {
        if (exam && !loading) {
            // Check if we should auto-start or show intro
            // For now, always show intro to allow reading instructions
        }
    }, [exam, loading]);

    const handleStartExam = () => {
        setIsStarted(true);
        setStartedAt(new Date().toISOString());
        // Request fullscreen if possible (optional, maybe later)
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Loading exam environment...</p>
            </div>
        </div>
    );
    if (!exam) return <div className="p-8 text-center text-slate-500">Exam not found</div>;

    // INTRO SCREEN / START SCREEN
    if (!isStarted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full shadow-xl border-0 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white">
                        <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><Timer className="w-4 h-4" /> {exam.duration} Minutes</span>
                            <span className="flex items-center gap-1"><HelpCircle className="w-4 h-4" /> {exam.questions.length} Questions</span>
                            <span className="flex items-center gap-1"><Award className="w-4 h-4" /> {exam.totalMarks || exam.questions.length} Marks</span>
                        </div>
                    </div>
                    <CardContent className="p-8 space-y-6">
                        {/* Tags / Badges */}
                        <div className="flex gap-2">
                            {exam.negativeMarking && (
                                <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">
                                    Negative Marking: -0.25
                                </Badge>
                            )}
                            {exam.isFree && (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                    Free Access
                                </Badge>
                            )}
                        </div>

                        {/* Instructions / Description */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-800 text-lg">Instructions</h3>
                            <div
                                className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100"
                                dangerouslySetInnerHTML={{ __html: exam.description || exam.instructions || 'No special instructions.' }}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Rules</h3>
                            <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                                <li>The timer starts immediately after you click "Start Exam".</li>
                                {exam.negativeMarking ? (
                                    <li className="text-rose-600 font-medium">Negative marking is enabled. Incorrect answers will deduct marks.</li>
                                ) : (
                                    <li>No negative marking. Feel free to guess.</li>
                                )}
                                {exam.shuffleQuestions && <li>Questions and options may be shuffled.</li>}
                                <li>Do not refresh the page or switch tabs explicitly.</li>
                            </ul>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleStartExam}
                                className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            >
                                Start Exam <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;
    const answeredCount = Object.keys(answers).length;



    return (
        <div className="fixed inset-0 z-[50] flex bg-slate-900 text-slate-100 overflow-hidden font-sans">

            {/* LEFT SIDEBAR - Question Palette (Dark Theme) */}
            <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: isSidebarOpen ? 0 : -320, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20 absolute md:relative h-full shadow-2xl"
            >
                {/* Exam Title Area */}
                <div className="p-6 border-b border-slate-800 space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight mb-1">{exam.title}</h2>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                            {exam.courseId?.title || 'General Practice'}
                        </p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setSidebarView('grid')}
                            className={`flex-1 flex items-center justify-center py-1.5 text-xs font-bold rounded-md transition-all ${sidebarView === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <LayoutGrid className="w-3 h-3 mr-1.5" /> Grid
                        </button>
                        <button
                            onClick={() => setSidebarView('list')}
                            className={`flex-1 flex items-center justify-center py-1.5 text-xs font-bold rounded-md transition-all ${sidebarView === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Menu className="w-3 h-3 mr-1.5" /> List
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="px-6 py-2 bg-slate-800/50 flex justify-between items-center text-xs border-b border-slate-800">
                    <span className="text-slate-400 font-medium">{answeredCount}/{exam.questions.length} Attempted</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Question List/Grid */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {sidebarView === 'grid' ? (
                        <div className="grid grid-cols-5 gap-3">
                            {exam.questions.map((q, idx) => {
                                const status = questionStatus[q._id] || 'not-visited';
                                const isCurrent = currentQuestionIndex === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCurrentQuestionIndex(idx);
                                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                                        }}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm ${getStatusColor(status, isCurrent)}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {exam.questions.map((q, idx) => {
                                const status = questionStatus[q._id] || 'not-visited';
                                const isCurrent = currentQuestionIndex === idx;

                                let borderClass = 'border-l-4 border-slate-700';
                                if (status === 'answered') borderClass = 'border-l-4 border-emerald-500';
                                if (status === 'marked') borderClass = 'border-l-4 border-violet-500';
                                if (status === 'visited') borderClass = 'border-l-4 border-rose-500';
                                if (isCurrent) borderClass = 'border-l-4 border-white';

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCurrentQuestionIndex(idx);
                                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                                        }}
                                        className={`w-full text-left bg-slate-800 rounded-r-lg p-3 hover:bg-slate-750 transition-colors group ${isCurrent ? 'bg-slate-700 ring-1 ring-white/20' : ''} ${borderClass}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>Question {idx + 1}</span>
                                            {status === 'answered' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                            {status === 'marked' && <Flag className="w-3 h-3 text-violet-500 fill-violet-500" />}
                                            {status === 'visited' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                                        </div>
                                        <p className="text-xs text-slate-300 line-clamp-2 font-medium leading-relaxed">
                                            {stripHtml(q.question)}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="p-6 bg-slate-900 border-t border-slate-800 text-xs font-medium space-y-3">
                    <div className="flex items-center gap-3 text-slate-300">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                        Answered
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"></div>
                        Skipped / Visited
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                        <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.4)]"></div>
                        Marked for Review
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600"></div>
                        Not Visited
                    </div>
                </div>
            </motion.aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-full bg-[#F8FAFC] text-slate-900 relative">

                {/* Header / Top Bar */}
                <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-500 hover:bg-slate-100">
                            <Menu className="w-6 h-6" />
                        </Button>
                        <div className="text-lg font-bold text-slate-700 hidden sm:block">
                            Q{currentQuestionIndex + 1} of {exam.questions.length} <span className="text-slate-400 mx-2">|</span> <span className="text-slate-500 text-sm font-medium uppercase tracking-wide">{currentQuestion.courseId?.title || 'Topic'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-100">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                            {currentQuestion.points} XP
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className={`font-mono font-bold text-base border-2 ${timeLeft < 300 ? 'text-rose-600 border-rose-200 bg-rose-50 animate-pulse' : 'text-slate-700 border-slate-200'}`}
                        >
                            <Timer className="w-4 h-4 mr-2" />
                            {formatTime(timeLeft)}
                        </Button>

                        <Button
                            variant="default"
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-200"
                            onClick={() => setIsPaused(!isPaused)}
                        >
                            <PauseCircle className="w-4 h-4 mr-2" />
                            Pause
                        </Button>
                    </div>
                </header>

                {/* Question Area - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* Question Card */}
                        <motion.div
                            key={currentQuestion._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <span className="text-sm font-bold text-slate-400 mt-1">Q{currentQuestionIndex + 1}</span>
                                <div className="prose prose-lg max-w-none text-slate-800 font-medium leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
                                />
                            </div>

                            {/* Options Grid */}
                            <div className="space-y-3 pl-8">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = answers[currentQuestion._id]?.index === idx;
                                    const isCorrect = isSelected; // Just for UI demo (in real exam we don't know correct answer immediately usually)
                                    // Actually, let's keep it simple: Standard Selection UI

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelectOption(currentQuestion._id, idx, option.text)}
                                            className={`
                                                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group flex items-center gap-4
                                                ${isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm shadow-emerald-100'
                                                    : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shrink-0
                                                ${isSelected
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'bg-slate-100 border-slate-200 text-slate-500 group-hover:border-slate-300'
                                                }
                                            `}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={`text-base font-medium ${isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>
                                                {option.text}
                                            </span>

                                            {isSelected && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                                                        <CheckCircle className="w-3 h-3" /> Selected
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Status Message (Optional - Feedback) */}
                        {answers[currentQuestion._id] !== undefined && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 text-emerald-800"
                            >
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium text-sm">Answer saved automatically</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Footer / Bottom Bar */}
                <footer className="h-20 bg-white border-t border-slate-200 px-6 md:px-12 flex items-center justify-between shrink-0 z-10">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleMarkForReview(currentQuestion._id)}
                            className={`h-10 px-4 border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-colors ${questionStatus[currentQuestion._id] === 'marked' ? 'bg-violet-50 border-violet-200 text-violet-700' : ''}`}
                        >
                            <Flag className={`w-4 h-4 mr-2 ${questionStatus[currentQuestion._id] === 'marked' ? 'fill-current' : ''}`} />
                            {questionStatus[currentQuestion._id] === 'marked' ? 'Marked' : 'Review'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => handleClearResponse(currentQuestion._id)}
                            disabled={answers[currentQuestion._id] === undefined}
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                        >
                            Clear
                        </Button>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>

                        {isLastQuestion ? (
                            <Button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-200 px-8"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                                Finish Test
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200 px-6"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </footer>

            </main>
        </div>
    );
}
