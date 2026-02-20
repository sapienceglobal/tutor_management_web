'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ArrowLeft,
    ArrowRight,
    Flag,
    FileQuestion,
    Star,
    TrendingUp,
    TrendingDown,
    Minus,
    Timer,
    Award,
    X,
    BookOpen,
    Zap,
    ChevronRight,
    Grid3x3,
    List
} from 'lucide-react';
import api from '@/lib/axios';

export default function ExamTakingScreen({ exam, courseId, onClose, onComplete }) {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [showQuestionNav, setShowQuestionNav] = useState(false);
    const [startedAt] = useState(new Date());

    const timerRef = useRef(null);

    useEffect(() => {
        initializeExam();
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const initializeExam = () => {
        let examQuestions = [...exam.questions];
        if (exam.shuffleQuestions) {
            examQuestions = shuffleArray(examQuestions);
        }

        if (exam.shuffleOptions) {
            examQuestions = examQuestions.map(q => ({
                ...q,
                options: shuffleArray([...q.options])
            }));
        }

        setQuestions(examQuestions);
        setRemainingSeconds(exam.duration * 60);
        startTimer();
    };

    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const selectAnswer = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleAutoSubmit = async () => {
        alert('Time is up! Auto-submitting your exam...');
        await submitExam();
    };

    const submitExam = async () => {
        setIsSubmitting(true);

        try {
            const timeSpent = Math.floor((new Date() - startedAt) / 1000);
            const answersData = questions.map(q => {
                const selectedIndex = answers[q._id];
                return {
                    questionId: q._id,
                    selectedOption: selectedIndex ?? -1,
                    selectedOptionText: selectedIndex !== undefined && selectedIndex !== -1
                        ? q.options[selectedIndex]?.text
                        : null
                };
            });

            const response = await api.post(`/exams/${exam._id}/submit`, {
                answers: answersData,
                timeSpent,
                startedAt: startedAt.toISOString()
            });

            if (response.data.success) {
                const showResults = response.data.showResultImmediately ?? true;

                if (showResults) {
                    onComplete(response.data.attempt);
                } else {
                    alert('Exam submitted successfully! Results will be published by your instructor.');
                    onClose();
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit exam');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitClick = () => {
        setShowConfirmDialog(true);
    };

    const confirmSubmit = async () => {
        setShowConfirmDialog(false);
        await submitExam();
    };

    const handleExitClick = () => {
        setShowExitDialog(true);
    };

    const confirmExit = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        onClose();
    };

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const isTimeCritical = remainingSeconds < 300;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'text-emerald-700 bg-emerald-100 border-emerald-300';
            case 'medium': return 'text-amber-700 bg-amber-100 border-amber-300';
            case 'hard': return 'text-red-700 bg-red-100 border-red-300';
            default: return 'text-slate-700 bg-slate-100 border-slate-300';
        }
    };

    const getDifficultyIcon = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return TrendingDown;
            case 'medium': return Minus;
            case 'hard': return TrendingUp;
            default: return FileQuestion;
        }
    };

    if (!currentQuestion) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading exam...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleExitClick}
                                className="p-2 hover:bg-red-50 rounded-xl transition-all duration-200 group border border-transparent hover:border-red-200"
                            >
                                <X className="w-5 h-5 text-slate-700 group-hover:text-red-600 transition-colors" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                    <FileQuestion className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
                                    <p className="text-sm text-slate-600 flex items-center gap-2">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        Question {currentQuestionIndex + 1} of {questions.length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Question Navigator Button */}
                            <button
                                onClick={() => setShowQuestionNav(!showQuestionNav)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium text-slate-700"
                            >
                                <Grid3x3 className="w-4 h-4" />
                                Questions
                            </button>

                            {/* Timer */}
                            <div className={`px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-lg transition-all duration-300 ${isTimeCritical
                                ? 'bg-gradient-to-r from-red-600 to-red-700 animate-pulse'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                                }`}>
                                <Timer className="w-5 h-5 text-white" />
                                <span className="text-white font-bold text-xl tabular-nums">
                                    {formatTime(remainingSeconds)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="max-w-7xl mx-auto px-6 pb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Zap className="w-4 h-4 text-indigo-600" />
                            Progress: {Math.round(progress)}%
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {answeredCount}
                            </div>
                            {unansweredCount > 0 && (
                                <div className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-bold flex items-center gap-1.5">
                                    <Flag className="w-3.5 h-3.5" />
                                    {unansweredCount}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 rounded-full shadow-lg"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Question Navigator Dropdown */}
            {showQuestionNav && (
                <div className="absolute top-20 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-indigo-50">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <List className="w-5 h-5 text-indigo-600" />
                            Question Navigator
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">Jump to any question</p>
                    </div>
                    <div className="p-3 grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = answers[q._id] !== undefined;
                            const isCurrent = idx === currentQuestionIndex;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCurrentQuestionIndex(idx);
                                        setShowQuestionNav(false);
                                    }}
                                    className={`aspect-square rounded-xl font-bold text-sm transition-all duration-200 ${isCurrent
                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                                        : isAnswered
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Question Card */}
                    <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                        {currentQuestionIndex + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {currentQuestion.difficulty && (
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold border backdrop-blur-sm bg-white/20 text-white`}>
                                                    {React.createElement(getDifficultyIcon(currentQuestion.difficulty), { className: 'w-3 h-3 inline mr-1' })}
                                                    {currentQuestion.difficulty.toUpperCase()}
                                                </span>
                                            )}
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-bold border border-white/30">
                                                <Star className="w-3 h-3 inline mr-1 fill-white" />
                                                {currentQuestion.points} {currentQuestion.points === 1 ? 'pt' : 'pts'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6 leading-relaxed">
                                {currentQuestion.question}
                            </h2>

                            {/* Options */}
                            <div className="space-y-3">
                                {currentQuestion.options?.map((option, index) => {
                                    const isSelected = answers[currentQuestion._id] === index;
                                    const letter = String.fromCharCode(65 + index);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => selectAnswer(currentQuestion._id, index)}
                                            className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left group ${isSelected
                                                ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-xl shadow-indigo-200 scale-[1.02]'
                                                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 hover:shadow-lg'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-200 ${isSelected
                                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg'
                                                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                                    }`}>
                                                    {letter}
                                                </div>
                                                <span className={`flex-1 text-lg ${isSelected ? 'font-semibold text-indigo-900' : 'text-slate-700'
                                                    }`}>
                                                    {option.text}
                                                </span>
                                                {isSelected && (
                                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                                        <CheckCircle className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Answer Saved Indicator */}
                            {answers[currentQuestion._id] !== undefined && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-emerald-900">Answer saved!</p>
                                        <p className="text-sm text-emerald-700">You can change your answer anytime</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            disabled={currentQuestionIndex === 0}
                            className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Previous
                        </button>

                        <div className="flex-1 flex justify-center">
                            <div className="px-4 py-2 bg-slate-100 rounded-xl">
                                <p className="text-sm font-semibold text-slate-700">
                                    {currentQuestionIndex + 1} / {questions.length}
                                </p>
                            </div>
                        </div>

                        {currentQuestionIndex < questions.length - 1 ? (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                Next Question
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitClick}
                                disabled={answeredCount < questions.length}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                <Award className="w-5 h-5" />
                                Submit Exam
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Submit Exam?</h3>
                                    <p className="text-amber-100 text-sm mt-1">Review before submitting</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-slate-50 rounded-xl">
                                    <p className="text-2xl font-bold text-slate-900">{questions.length}</p>
                                    <p className="text-xs text-slate-600 mt-1">Total</p>
                                </div>
                                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                                    <p className="text-2xl font-bold text-emerald-600">{answeredCount}</p>
                                    <p className="text-xs text-emerald-700 mt-1">Answered</p>
                                </div>
                                {unansweredCount > 0 && (
                                    <div className="text-center p-4 bg-red-50 rounded-xl">
                                        <p className="text-2xl font-bold text-red-600">{unansweredCount}</p>
                                        <p className="text-xs text-red-700 mt-1">Skipped</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-amber-900 font-medium">
                                        Once submitted, you cannot change your answers. Make sure you've reviewed all questions.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200"
                                >
                                    Review Again
                                </button>
                                <button
                                    onClick={confirmSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Exit Confirmation Dialog */}
            {showExitDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <XCircle className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Exit Exam?</h3>
                                    <p className="text-red-100 text-sm mt-1">Your progress will be lost</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-slate-700 mb-6">
                                Are you sure you want to exit? All your answers will be lost and you'll need to start over.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowExitDialog(false)}
                                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                                >
                                    Stay & Continue
                                </button>
                                <button
                                    onClick={confirmExit}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all duration-200 shadow-lg"
                                >
                                    Exit Anyway
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Submitting Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full mx-4">
                        <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Submitting Exam...</h3>
                        <p className="text-slate-600">Please wait while we process your answers</p>
                    </div>
                </div>
            )}
        </div>
    );
}