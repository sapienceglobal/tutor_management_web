'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
    CheckCircle, XCircle, Home, RotateCcw, Award, Download, TrendingUp
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const getStatus = (item) => {
    if (item?.status) return item.status;
    const hasAnswer = item?.selectedIndex !== undefined && item?.selectedIndex !== null && item?.selectedIndex >= 0;
    if (!hasAnswer) return 'unanswered';
    return item?.isCorrect ? 'correct' : 'incorrect';
};

const getStatusChip = (status) => {
    if (status === 'correct') return 'bg-emerald-100 text-emerald-700';
    if (status === 'incorrect') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
};

const getOptionText = (option) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return option.text || '';
};

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
    const [examData, setExamData] = useState(null);
    const [viewingSolution, setViewingSolution] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!attemptId) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get(`/exams/attempt/${attemptId}`);
                if (res.data.success) {
                    setResult(res.data.attempt);
                    setDetailedResults(Array.isArray(res.data.detailedResults) ? res.data.detailedResults : []);
                    setExamTitle(res.data.exam?.title || '');
                    setExamData(res.data.exam || null);
                    if (res.data.attempt?.isPassed) triggerConfetti();
                }
            } catch (error) {
                console.error('Error fetching result:', error);
                toast.error('Failed to load result details');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [attemptId]);

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;
        const rand = (min, max) => Math.random() * (max - min) + min;
        const interval = setInterval(() => {
            if (Date.now() > end) return clearInterval(interval);
            confetti({ particleCount: 40, startVelocity: 30, spread: 360, origin: { x: rand(0.1, 0.9), y: rand(0.1, 0.5) } });
        }, 250);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium text-sm animate-pulse">Calculating Results...</p>
                </div>
            </div>
        );
    }

    if (!result) return <div className="p-10 text-center text-slate-500">Result not found</div>;

    const isPassed = result.isPassed;
    const percentage = result.percentage || (result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0);
    const allResults = detailedResults || [];
    const correctCount = allResults.filter((item) => getStatus(item) === 'correct').length;
    const incorrectCount = allResults.filter((item) => getStatus(item) === 'incorrect').length;
    const unansweredCount = allResults.filter((item) => getStatus(item) === 'unanswered').length;
    const hiddenAnswers = allResults.some((item) => item.canViewCorrectAnswer === false);
    const hiddenSolutions = allResults.some((item) => item.canViewSolution === false);
    const selectedResult = viewingSolution !== null ? allResults[viewingSolution] : null;

    const getGrade = (pct) => {
        if (pct >= 90) return 'A+';
        if (pct >= 80) return 'A';
        if (pct >= 70) return 'B+';
        if (pct >= 60) return 'B';
        if (pct >= 50) return 'C';
        return 'D';
    };

    return (
        <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/student/dashboard" className="hover:text-indigo-600">Home</Link>
                    <span>{'>'}</span>
                    <Link href="/student/exams" className="hover:text-indigo-600">Tests</Link>
                    <span>{'>'}</span>
                    <span className="font-semibold text-slate-800">Test Results</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => toast('Certificate download coming soon!')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" /> Download Certificate
                    </button>
                    <button
                        onClick={() => toast('Report download coming soon!')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" /> Download Report
                    </button>
                    {!isPassed && (
                        <Button
                            onClick={() => router.push(`/student/exams/${examId}`)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4"
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retake Test
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">{examTitle}</h1>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span>Date: {new Date(result.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>|</span>
                    <span>Duration: {examData?.duration || '-'} mins</span>
                    <span>|</span>
                    <span>Total Marks: {result.totalMarks}</span>
                    <span>|</span>
                    <span>Attempt: {result.attemptNumber || 1}</span>
                </div>
                <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold ${isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {isPassed ? `Completed with ${result.score} Marks` : `Scored ${result.score} Marks`}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Score Obtained</p>
                    <div className="flex items-end gap-1">
                        <span className="text-2xl font-black text-slate-800">{result.score}</span>
                        <span className="text-sm text-slate-400 font-medium mb-0.5">/{result.totalMarks}</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Percentage</p>
                    <span className={`text-2xl font-black ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>{percentage}%</span>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Rank</p>
                    <span className="text-2xl font-black text-slate-800">-</span>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Grade</p>
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-lg font-black rounded-lg">{getGrade(percentage)}</span>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1">Status</p>
                    <div className={`flex items-center gap-1.5 ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPassed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="text-lg font-bold">{isPassed ? 'Passed' : 'Failed'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Performance Analytics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-emerald-600 font-medium">Correct</p>
                                        <p className="text-xl font-black text-emerald-700">{correctCount}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-red-600 font-medium">Incorrect</p>
                                        <p className="text-xl font-black text-red-700">{incorrectCount}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-slate-500 font-medium">Unanswered</p>
                                        <p className="text-xl font-black text-slate-700">{unansweredCount}</p>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                                        <span>Score Progress</span>
                                        <span>{percentage}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, delay: 0.3 }}
                                            className={`h-full rounded-full ${isPassed ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                        <motion.path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={isPassed ? '#10b981' : '#ef4444'}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            initial={{ strokeDasharray: '0, 100' }}
                                            animate={{ strokeDasharray: `${percentage}, 100` }}
                                            transition={{ duration: 1.5, delay: 0.5 }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xs text-slate-400">Total</span>
                                        <span className="text-xl font-black text-slate-800">{result.score}<span className="text-sm text-slate-400">/{result.totalMarks}</span></span>
                                        <span className={`text-sm font-bold ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>{percentage}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {allResults.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-800">Question Review (All Questions)</h2>
                                {hiddenAnswers && (
                                    <p className="text-xs text-amber-700 mt-1">Answer key hidden by tutor for some/all questions.</p>
                                )}
                                {hiddenSolutions && (
                                    <p className="text-xs text-amber-700">Solution hidden by tutor for some/all questions.</p>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                                            <th className="px-5 py-3 text-left font-semibold">Q. No.</th>
                                            <th className="px-5 py-3 text-left font-semibold">Question</th>
                                            <th className="px-5 py-3 text-left font-semibold">Status</th>
                                            <th className="px-5 py-3 text-left font-semibold">Your Answer</th>
                                            <th className="px-5 py-3 text-left font-semibold">Correct Answer</th>
                                            <th className="px-5 py-3 text-left font-semibold">Marks</th>
                                            <th className="px-5 py-3 text-left font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {allResults.map((item, idx) => {
                                            const status = getStatus(item);
                                            const selectedAnswer = item.selectedAnswerText
                                                || getOptionText(item.options?.[item.selectedIndex])
                                                || '-';
                                            const correctAnswer = item.canViewCorrectAnswer
                                                ? (item.correctAnswerText || getOptionText(item.options?.[item.correctIndex]) || '-')
                                                : 'Hidden';
                                            return (
                                                <tr key={item.questionId || idx} className="hover:bg-slate-50/50">
                                                    <td className="px-5 py-3 text-slate-500 font-medium">{item.questionNumber || idx + 1}</td>
                                                    <td className="px-5 py-3 text-slate-700 max-w-[220px] truncate">{item.question}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(status)}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-700 font-medium">{selectedAnswer}</td>
                                                    <td className="px-5 py-3 font-medium">
                                                        <span className={item.canViewCorrectAnswer ? 'text-emerald-700' : 'text-slate-500'}>{correctAnswer}</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-500">{item.pointsEarned} / {item.pointsPossible}</td>
                                                    <td className="px-5 py-3">
                                                        {item.canViewSolution && item.solutionText ? (
                                                            <button
                                                                onClick={() => setViewingSolution(viewingSolution === idx ? null : idx)}
                                                                className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                                                            >
                                                                {viewingSolution === idx ? 'Hide Solution' : 'View Solution'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">Hidden</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {selectedResult?.canViewSolution && selectedResult?.solutionText && (
                                <div className="px-6 py-4 bg-indigo-50 border-t border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Solution Explanation</p>
                                    <p className="text-sm text-slate-700">{selectedResult.solutionText}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {allResults.length > 0 && incorrectCount === 0 && unansweredCount === 0 && (
                        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 text-center">
                            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                            <h3 className="text-lg font-bold text-emerald-800">Perfect Score!</h3>
                            <p className="text-sm text-emerald-600">You answered all questions correctly. Excellent work!</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <h3 className="text-base font-bold text-slate-800 mb-4">Question Analysis</h3>
                        <div className="space-y-2">
                            {isPassed ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span className="text-slate-700">Strong performance overall</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span className="text-slate-700">Excellent accuracy</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp className="w-4 h-4 text-amber-500" />
                                        <span className="text-slate-700">Room for improvement</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp className="w-4 h-4 text-amber-500" />
                                        <span className="text-slate-700">Review incorrect and unanswered questions</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {(incorrectCount > 0 || unansweredCount > 0) && (
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                            <h3 className="text-base font-bold text-slate-800 mb-3">Weakness</h3>
                            <div className="space-y-2">
                                {incorrectCount > 0 && (
                                    <div className="text-sm text-slate-600">{incorrectCount} incorrect question(s) need improvement.</div>
                                )}
                                {unansweredCount > 0 && (
                                    <div className="text-sm text-slate-600">{unansweredCount} unanswered question(s) need revision.</div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <h3 className="text-base font-bold text-slate-800 mb-3">AI Recommendation</h3>
                        <div className="space-y-2">
                            {isPassed ? (
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span className="text-slate-700">Move on to the next module</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span className="text-slate-700">Practice similar questions</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        <span className="text-slate-700">Revise weak topics</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <Link
                            href="/student/ai-analytics"
                            className="block w-full text-center mt-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                            Generate AI Study Plan
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <Button
                            onClick={() => router.push('/student/dashboard')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                            <Home className="w-4 h-4 mr-2" /> Back to Dashboard
                        </Button>
                        {!isPassed && (
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/student/exams/${examId}`)}
                                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ExamResultPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh]" />}>
            <ExamResultPageClient />
        </Suspense>
    );
}
