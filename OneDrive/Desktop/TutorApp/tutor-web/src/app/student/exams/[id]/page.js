'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Timer, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function ExamPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id;

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: optionIndex }
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [submitting, setSubmitting] = useState(false);

    // Fetch Exam
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/exams/${examId}`); // Verify Endpoint
                if (res.data.success) {
                    setExam(res.data.exam);
                    setTimeLeft(res.data.exam.duration * 60);
                }
            } catch (error) {
                console.error('Error fetching exam:', error);
                alert('Failed to load exam.');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [examId, router]);

    // Timer
    useEffect(() => {
        if (!exam || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true); // Auto-submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [exam, timeLeft]);

    const handleSelectOption = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleSubmit = async (auto = false) => {
        if (!auto && !confirm('Are you sure you want to submit?')) return;

        setSubmitting(true);
        try {
            const payload = {
                examId,
                answers: Object.entries(answers).map(([qId, optIdx]) => ({
                    questionId: qId,
                    selectedOption: optIdx
                })),
                timeSpent: (exam.duration * 60) - timeLeft
            };

            const res = await api.post(`/exams/${examId}/submit`, payload);
            if (res.data.success) {
                router.push(`/student/exams/${examId}/result?attemptId=${res.data.attemptId}`);
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
            alert('Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (!exam) return <div className="p-8 text-center">Exam not found</div>;

    const currentQuestion = exam.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;
    const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="font-bold text-lg text-gray-900">{exam.title}</h1>
                    <p className="text-xs text-gray-500">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timeLeft < 60 ? 'text-red-600' : 'text-purple-600'}`}>
                        <Timer className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <Progress value={progress} className="h-1 rounded-none bg-gray-200" indicatorClassName="bg-purple-600" />

            {/* Main Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full p-6 pb-24">
                <Card className="shadow-lg border-0 min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-xl leading-relaxed">
                            {currentQuestionIndex + 1}. {currentQuestion.question}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentQuestion.options.map((option, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleSelectOption(currentQuestion._id, idx)}
                                className={`
                                    p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                                    ${answers[currentQuestion._id] === idx
                                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-md'
                                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs
                                    ${answers[currentQuestion._id] === idx
                                        ? 'border-purple-600 bg-purple-600 text-white'
                                        : 'border-gray-300 text-gray-400'
                                    }
                                `}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="font-medium">{option.text}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </main>

            {/* Footer Navigation */}
            <footer className="bg-white border-t p-4 fixed bottom-0 w-full z-10 lg:pl-64">
                {/* Note: lg:pl-64 accounts for sidebar if present, but this page might be fullscreen. 
                   If fullscreen layout used, remove lg:pl-64. I'll assume full screen for exam to minimize distraction */}
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </Button>

                    {isLastQuestion ? (
                        <Button
                            className="bg-green-600 hover:bg-green-700 min-w-[150px]"
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Submit Exam
                        </Button>
                    ) : (
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        >
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </footer>
        </div>
    );
}
