'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, RefreshCcw } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function QuizPlayer({ lesson, onComplete }) {
    const [status, setStatus] = useState('intro'); // intro, loading, active, submitting, result
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOptionIndex }
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [startTime, setStartTime] = useState(null);

    // Initial check or load
    useEffect(() => {
        if (lesson.content?.quiz) {
            // We could auto-start or wait for user to click start
            // Let's wait for user to click start in 'intro' mode
        }
    }, [lesson]);

    // Timer effect
    useEffect(() => {
        let interval;
        if (status === 'active' && timeLeft !== null && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleSubmit(); // Auto submit
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, timeLeft]);

    const handleStart = async () => {
        setStatus('loading');
        try {
            const res = await api.post(`/quiz/start/${lesson._id}`);
            if (res.data.success) {
                setQuizData(res.data.quiz);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setResult(null);
                setStartTime(Date.now());

                if (res.data.quiz.timeLimit) {
                    setTimeLeft(res.data.quiz.timeLimit * 60);
                } else {
                    setTimeLeft(null);
                }

                setStatus('active');
            }
        } catch (error) {
            console.error('Failed to start quiz:', error);
            // Handle error (e.g., max attempts reached)
            if (error.response?.status === 403) {
                toast.error(error.response.data.message || "Cannot start quiz.");
                setStatus('intro'); // Or error state
            }
        }
    };

    const handleSelectOption = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setStatus('submitting');
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);

        // Format answers for backend
        const formattedAnswers = Object.entries(answers).map(([qId, optIdx]) => ({
            questionId: qId,
            selectedOptionIndex: optIdx,
            timeTaken: 0 // We aren't tracking per-question time strictly here yet
        }));

        // Add unanswered questions as well if needed, backend might handle skipping
        // But better to send what we have. API expects array of answers.

        try {
            const res = await api.post(`/quiz/submit/${lesson._id}`, {
                answers: formattedAnswers,
                timeSpent
            });

            if (res.data.success) {
                setResult(res.data);
                setStatus('result');
                if (res.data.attempt.isPassed && onComplete) {
                    onComplete();
                }
            }
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            toast.error('Failed to submit quiz. Please try again.');
            setStatus('active');
        }
    };

    if (status === 'intro') {
        const quiz = lesson.content.quiz;
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="bg-indigo-500/10 p-4 rounded-full mb-6 text-indigo-500">
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white">{quiz?.title || lesson.title}</h2>
                <p className="text-slate-400 mb-6 max-w-md">{quiz?.description || "Test your knowledge with this quiz."}</p>

                <div className="grid grid-cols-3 gap-6 mb-8 w-full max-w-md">
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase mb-1 font-bold">Questions</p>
                        <p className="text-xl font-bold text-white">{quiz?.questions?.length || '?'}</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase mb-1 font-bold">Pass Score</p>
                        <p className="text-xl font-bold text-white">{quiz?.passingScore || 70}%</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase mb-1 font-bold">Time</p>
                        <p className="text-xl font-bold text-white">{quiz?.timeLimit ? `${quiz.timeLimit}m` : 'No Limit'}</p>
                    </div>
                </div>

                <Button onClick={handleStart} size="lg" className="w-full max-w-xs text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20">
                    Start Quiz
                </Button>
            </div>
        );
    }

    if (status === 'loading' || status === 'submitting') {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-300">{status === 'loading' ? 'Preparing your quiz...' : 'Submitting results...'}</p>
            </div>
        );
    }

    if (status === 'active' && quizData) {
        const currentQuestion = quizData.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
        const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

        return (
            <div className="max-w-3xl mx-auto p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-sm text-indigo-400 font-medium tracking-wide uppercase mb-1">Question {currentQuestionIndex + 1} of {quizData.questions.length}</p>
                        <h3 className="text-lg font-bold text-white max-w-2xl truncate">{quizData.title}</h3>
                    </div>
                    {timeLeft !== null && (
                        <div className={`flex items-center gap-2 font-mono font-bold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-200'}`}>
                            <Clock className="w-4 h-4" />
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </div>
                    )}
                </div>

                <Progress value={progress} className="h-1.5 mb-8 bg-slate-700" indicatorClassName="bg-indigo-500" />

                {/* Question Card */}
                <Card className="flex-1 bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl md:text-2xl text-white leading-relaxed font-medium">
                            {currentQuestion.question}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RadioGroup
                            value={String(answers[currentQuestion._id] ?? '')}
                            onValueChange={(val) => handleSelectOption(currentQuestion._id, parseInt(val))}
                            className="space-y-3"
                        >
                            {currentQuestion.options.map((option, idx) => (
                                <div key={idx} className={`flex items-center space-x-3 rounded-xl border p-4 transition-all cursor-pointer ${answers[currentQuestion._id] === idx
                                    ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-900/10'
                                    : 'border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                                    }`}
                                    onClick={() => handleSelectOption(currentQuestion._id, idx)}
                                >
                                    <RadioGroupItem value={String(idx)} id={`opt-${idx}`} className="text-indigo-500 border-slate-500 data-[state=checked]:border-indigo-500 data-[state=checked]:text-indigo-500" />
                                    <Label htmlFor={`opt-${idx}`} className="text-slate-200 flex-1 cursor-pointer text-lg">{option.text}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Footer Controls */}
                <div className="flex justify-between mt-8">
                    <Button
                        variant="ghost"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                        Previous
                    </Button>

                    {isLastQuestion ? (
                        <Button
                            onClick={handleSubmit}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-900/20"
                        >
                            Submit Quiz
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 shadow-lg shadow-indigo-900/20"
                        >
                            Next Question
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (status === 'result' && result) {
        const { attempt, message, detailedResults } = result;
        const isPassed = attempt.isPassed;

        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full overflow-y-auto w-full max-w-4xl mx-auto">
                <div className={`p-6 rounded-full mb-6 bg-slate-800 border-4 shadow-2xl ${isPassed ? 'border-emerald-500/30 text-emerald-500' : 'border-rose-500/30 text-rose-500'}`}>
                    {isPassed ? <CheckCircle className="w-16 h-16" /> : <AlertCircle className="w-16 h-16" />}
                </div>

                <h2 className="text-4xl font-bold text-white mb-2">{isPassed ? 'Congratulations!' : 'Keep Practicing'}</h2>
                <p className="text-slate-400 mb-10 text-lg max-w-md">{message}</p>

                <div className="grid grid-cols-2 gap-6 w-full max-w-lg mb-10">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Score</p>
                        <p className={`text-4xl font-bold ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {attempt.score}%
                        </p>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Points</p>
                        <p className="text-4xl font-bold text-white">
                            {attempt.pointsEarned} <span className="text-xl text-slate-500">/ {attempt.pointsPossible}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {result.allowRetake && (
                        <Button onClick={handleStart} variant="outline" className="border-slate-600 text-white hover:bg-slate-800 hover:text-white gap-2 h-12 px-6">
                            <RefreshCcw className="w-4 h-4" />
                            Retake Quiz
                        </Button>
                    )}
                    <Button onClick={() => onComplete ? onComplete() : null} className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 shadow-lg shadow-indigo-900/20">
                        Continue Learning
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
