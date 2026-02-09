'use client';

import { useState, useEffect, useRef } from 'react';
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
    X
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
        // Initialize questions (shuffle if needed)
        let examQuestions = [...exam.questions];
        if (exam.shuffleQuestions) {
            examQuestions = shuffleArray(examQuestions);
        }

        // Shuffle options if needed
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
            const answersData = questions.map(q => ({
                questionId: q._id,
                selectedOption: answers[q._id] ?? -1
            }));

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
                    showSubmissionConfirmation();
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit exam');
        } finally {
            setIsSubmitting(false);
        }
    };

    const showSubmissionConfirmation = () => {
        alert('Exam submitted successfully! Results will be published by your instructor.');
        onClose();
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
    const isTimeCritical = remainingSeconds < 300; // Last 5 minutes
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'text-green-600 bg-green-100 border-green-300';
            case 'medium': return 'text-orange-600 bg-orange-100 border-orange-300';
            case 'hard': return 'text-red-600 bg-red-100 border-red-300';
            default: return 'text-gray-600 bg-gray-100 border-gray-300';
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
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExitClick}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-700" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">{exam.title}</h1>
                            <p className="text-sm text-slate-600">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </p>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isTimeCritical
                            ? 'bg-red-600 animate-pulse'
                            : 'bg-blue-600'
                        }`}>
                        <Timer className="w-5 h-5 text-white" />
                        <span className="text-white font-bold text-lg">
                            {formatTime(remainingSeconds)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileQuestion className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-semibold text-slate-900">
                                Progress: {currentQuestionIndex + 1}/{questions.length}
                            </span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${answeredCount === questions.length
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                            {answeredCount === questions.length ? (
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                            ) : (
                                <Flag className="w-4 h-4 inline mr-1" />
                            )}
                            {answeredCount}/{questions.length}
                        </div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Question Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Question Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                Q{currentQuestionIndex + 1}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-slate-900 mb-4 leading-relaxed">
                                    {currentQuestion.question}
                                </h2>
                                <div className="flex items-center gap-3">
                                    {currentQuestion.difficulty && (
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(currentQuestion.difficulty)}`}>
                                            {React.createElement(getDifficultyIcon(currentQuestion.difficulty), { className: 'w-3 h-3 inline mr-1' })}
                                            {currentQuestion.difficulty.toUpperCase()}
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-300">
                                        <Star className="w-3 h-3 inline mr-1 fill-amber-600" />
                                        {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center">
                                <FileQuestion className="w-4 h-4" />
                            </div>
                            Choose the correct answer:
                        </div>

                        {currentQuestion.options?.map((option, index) => {
                            const isSelected = answers[currentQuestion._id] === index;
                            const letter = String.fromCharCode(65 + index);

                            return (
                                <button
                                    key={index}
                                    onClick={() => selectAnswer(currentQuestion._id, index)}
                                    className={`w-full p-5 rounded-xl border-2 transition-all text-left ${isSelected
                                            ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-200'
                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-slate-600 border-slate-300'
                                            }`}>
                                            {letter}
                                        </div>
                                        <span className={`flex-1 ${isSelected ? 'font-semibold text-blue-900' : 'text-slate-700'
                                            }`}>
                                            {option.text}
                                        </span>
                                        {isSelected && (
                                            <CheckCircle className="w-6 h-6 text-blue-600 fill-blue-600" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Answer Status */}
                    {answers[currentQuestion._id] !== undefined && (
                        <div className="p-4 bg-green-100 border-2 border-green-300 rounded-xl flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 fill-green-600" />
                            <span className="font-semibold text-green-800">Answer saved successfully</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bg-white border-t border-slate-200 p-6">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    {currentQuestionIndex > 0 && (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Previous
                        </button>
                    )}

                    {currentQuestionIndex < questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            Next Question
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmitClick}
                            disabled={answeredCount < questions.length}
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Award className="w-5 h-5" />
                            Submit Exam
                        </button>
                    )}
                </div>
            </div>

            {/* Submit Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Submit Exam?</h3>
                                <p className="text-slate-600">Please review your answers before submitting.</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Total Questions:</span>
                                <span className="font-bold text-slate-900">{questions.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-700">Answered:</span>
                                <span className="font-bold text-green-600">{answeredCount}</span>
                            </div>
                            {unansweredCount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-700">Unanswered:</span>
                                    <span className="font-bold text-red-600">{unansweredCount}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    Once submitted, you cannot change your answers.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Review Again
                            </button>
                            <button
                                onClick={confirmSubmit}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exit Confirmation Dialog */}
            {showExitDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Exit Exam?</h3>
                                <p className="text-slate-600">Your progress will be lost if you exit now.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExitDialog(false)}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors"
                            >
                                Stay
                            </button>
                            <button
                                onClick={confirmExit}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submitting Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Submitting your exam...</h3>
                        <p className="text-slate-600">Please wait</p>
                    </div>
                </div>
            )}
        </div>
    );
}