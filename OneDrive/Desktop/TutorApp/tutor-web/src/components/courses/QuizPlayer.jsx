'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, RefreshCcw } from 'lucide-react';
import api from '@/lib/axios';

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
                alert(error.response.data.message || "Cannot start quiz.");
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
            alert('Failed to submit quiz. Please try again.');
            setStatus('active');
        }
    };

    if (status === 'intro') {
        const quiz = lesson.content.quiz;
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="bg-blue-100 p-4 rounded-full mb-6 text-blue-600">
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{quiz?.title || lesson.title}</h2>
                <p className="text-slate-400 mb-6 max-w-md">{quiz?.description || "Test your knowledge with this quiz."}</p>

                <div className="grid grid-cols-3 gap-6 mb-8 w-full max-w-md">
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs uppercase mb-1">Questions</p>
                        <p className="text-xl font-bold text-white">{quiz?.questions?.length || '?'}</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs uppercase mb-1">Pass Score</p>
                        <p className="text-xl font-bold text-white">{quiz?.passingScore || 70}%</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs uppercase mb-1">Time</p>
                        <p className="text-xl font-bold text-white">{quiz?.timeLimit ? `${quiz.timeLimit}m` : 'No Limit'}</p>
                    </div>
                </div>

                <Button onClick={handleStart} size="lg" className="w-full max-w-xs text-lg">
                    Start Quiz
                </Button>
            </div>
        );
    }

    if (status === 'loading' || status === 'submitting') {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
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
                        <p className="text-sm text-slate-400">Question {currentQuestionIndex + 1} of {quizData.questions.length}</p>
                        <h3 className="text-lg font-bold text-white">{quizData.title}</h3>
                    </div>
                    {timeLeft !== null && (
                        <div className={`flex items-center gap-2 font-mono ${timeLeft < 60 ? 'text-red-500' : 'text-slate-300'}`}>
                            <Clock className="w-4 h-4" />
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </div>
                    )}
                </div>

                <Progress value={progress} className="h-2 mb-8 bg-slate-700" />

                {/* Question Card */}
                <Card className="flex-1 bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-xl text-white leading-relaxed">
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
                                <div key={idx} className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${answers[currentQuestion._id] === idx
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-slate-600 hover:bg-slate-700'
                                    }`}>
                                    <RadioGroupItem value={String(idx)} id={`opt-${idx}`} className="text-blue-500 border-slate-400" />
                                    <Label htmlFor={`opt-${idx}`} className="text-white flex-1 cursor-pointer">{option.text}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>

                {/* Footer Controls */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className="bg-transparent border-slate-600 text-white hover:bg-slate-800"
                    >
                        Previous
                    </Button>

                    {isLastQuestion ? (
                        <Button
                            onClick={handleSubmit}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Submit Quiz
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
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
            <div className="flex flex-col items-center justify-center p-8 text-center h-full overflow-y-auto">
                <div className={`p-4 rounded-full mb-6 ${isPassed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {isPassed ? <CheckCircle className="w-16 h-16" /> : <AlertCircle className="w-16 h-16" />}
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">{isPassed ? 'Congratulations!' : 'Keep Practicing'}</h2>
                <p className="text-slate-400 mb-8 max-w-md">{message}</p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
                    <div className="bg-slate-800 p-4 rounded-xl">
                        <p className="text-slate-400 text-sm mb-1">Score</p>
                        <p className={`text-3xl font-bold ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                            {attempt.score}%
                        </p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl">
                        <p className="text-slate-400 text-sm mb-1">Points</p>
                        <p className="text-3xl font-bold text-white">
                            {attempt.pointsEarned} / {attempt.pointsPossible}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {result.allowRetake && (
                        <Button onClick={handleStart} variant="outline" className="border-slate-600 text-white hover:bg-slate-800 gap-2">
                            <RefreshCcw className="w-4 h-4" />
                            Retake Quiz
                        </Button>
                    )}
                    <Button onClick={() => onComplete ? onComplete() : null} className="bg-blue-600 hover:bg-blue-700">
                        Continue Learning
                    </Button>
                </div>

                {/* Detailed results could go below if needed */}
            </div>
        );
    }

    return null;
}
