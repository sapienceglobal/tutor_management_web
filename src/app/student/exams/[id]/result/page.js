'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Home, RotateCcw, Award, ArrowRight, Share2, Download, BarChart2 } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

function ExamResultPageClient() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attemptId');
    const examId = params.id;

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [detailedResults, setDetailedResults] = useState([]);
    const [examTitle, setExamTitle] = useState('');

    useEffect(() => {
        const fetchResult = async () => {
            if (!attemptId) return;
            try {
                const res = await api.get(`/exams/attempt/${attemptId}`);
                if (res.data.success) {
                    setResult(res.data.attempt);
                    setDetailedResults(res.data.detailedResults || []);
                    setExamTitle(res.data.exam?.title || '');
                    if (res.data.attempt.isPassed) {
                        triggerConfetti();
                    }
                }
            } catch (error) {
                console.error('Error fetching result:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [attemptId, examId]);

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const random = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: random(0.1, 0.3) } });
            confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: random(0.7, 0.9) } });
        }, 250);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium animate-pulse">Calculating Results...</p>
            </div>
        </div>
    );
    if (!result) return <div className="p-10 text-center text-slate-500">Result not found</div>;

    const isPassed = result.isPassed;
    const scoreColor = isPassed ? 'text-emerald-600' : 'text-rose-600';
    const bgColor = isPassed ? 'bg-emerald-50' : 'bg-rose-50';
    const borderColor = isPassed ? 'border-emerald-100' : 'border-rose-100';
    const Icon = isPassed ? Award : XCircle;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full"
            >
                <Card className={`overflow-hidden border-0 shadow-2xl shadow-slate-200/50 bg-white rounded-[2rem]`}>
                    <div className={`${bgColor} p-10 text-center space-y-6 relative overflow-hidden`}>
                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-rose-400'} blur-3xl`}></div>
                            <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full ${isPassed ? 'bg-teal-400' : 'bg-orange-400'} blur-3xl`}></div>
                        </div>

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className={`relative mx-auto w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/5 ${scoreColor}`}
                        >
                            <Icon className="w-12 h-12" />
                        </motion.div>

                        <div className="relative z-10">
                            <h1 className={`text-4xl font-extrabold ${scoreColor} mb-2 tracking-tight`}>
                                {isPassed ? 'Build Completed!' : 'Keep Going!'}
                            </h1>
                            <p className="text-slate-600 text-lg max-w-sm mx-auto">
                                You have {isPassed ? 'successfully passed' : 'completed'} this assessment.
                                {isPassed && " Outstanding performance!"}
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:shadow-lg hover:shadow-slate-100/50 transition-shadow">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Score</p>
                                <p className="text-3xl font-black text-slate-800">{result.score} <span className="text-lg text-slate-400 font-medium">/ {result.totalMarks}</span></p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:shadow-lg hover:shadow-slate-100/50 transition-shadow">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Percentage</p>
                                <p className={`text-3xl font-black ${scoreColor}`}>{result.percentage}%</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-slate-600">Performance Status</span>
                                <span className={scoreColor}>{isPassed ? 'Excellent' : 'Needs Improvement'}</span>
                            </div>
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.percentage}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full rounded-full ${isPassed ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-rose-500 to-orange-500'}`}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
                            <Button
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:-translate-y-0.5"
                                onClick={() => router.push(`/student/courses`)}
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Back to Dashboard
                            </Button>

                            {!isPassed ? (
                                <Button
                                    variant="outline"
                                    className="flex-1 border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl h-12 font-bold"
                                    onClick={() => router.push(`/student/exams/${examId}`)}
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Try Again
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="flex-1 border-2 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl h-12 font-bold"
                                    onClick={() => alert('Certificate download coming soon!')}
                                >
                                    <ArrowRight className="w-5 h-5 mr-2" />
                                    Next Module
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Analysis */}
                {detailedResults.length > 0 && (
                    <div className="mt-8 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800 text-center">Detailed Analysis</h2>
                        {detailedResults.map((q, index) => (
                            <Card key={index} className="overflow-hidden border border-slate-200 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-semibold text-lg text-slate-800">
                                            <span className="text-indigo-600 mr-2">{q.questionNumber}.</span>
                                            {q.question}
                                        </h3>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {q.isCorrect ? 'Correct' : 'Incorrect'}
                                        </div>
                                    </div>

                                    <div className="space-y-3 pl-6">
                                        {q.options.map((opt, optIndex) => {
                                            const isSelected = q.selectedIndex === optIndex;
                                            const isCorrect = q.correctIndex === optIndex;

                                            let optionClass = "p-3 rounded-lg border text-sm transition-all ";
                                            if (isCorrect) {
                                                optionClass += "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium";
                                            } else if (isSelected && !isCorrect) {
                                                optionClass += "bg-rose-50 border-rose-200 text-rose-800";
                                            } else {
                                                optionClass += "bg-slate-50 border-slate-100 text-slate-600";
                                            }

                                            return (
                                                <div key={optIndex} className={optionClass}>
                                                    <div className="flex items-center justify-between">
                                                        <span>{opt}</span>
                                                        {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                                                        {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {q.explanation && (
                                        <div className="mt-4 pl-6 pt-4 border-t border-slate-100">
                                            <p className="text-sm text-slate-500 font-medium mb-1">Explanation:</p>
                                            <p className="text-sm text-slate-700">{q.explanation}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Additional Actions */}
                <div className="flex justify-center gap-6 mt-8 text-slate-400">
                    <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors text-sm font-medium">
                        <Share2 className="w-4 h-4" /> Share Result
                    </button>
                    <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" /> Download Report
                    </button>
                    <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors text-sm font-medium">
                        <BarChart2 className="w-4 h-4" /> View Analytics
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function ExamResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
            <ExamResultPageClient />
        </Suspense>
    );
}
