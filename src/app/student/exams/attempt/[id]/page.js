'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    ArrowLeft,
    Download,
    TrendingUp
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const getOptionText = (option) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return option.text || '';
};

const getStatus = (item) => {
    if (item?.status) return item.status;
    if (item?.userSelectedOption === -1 || item?.userSelectedOption === undefined) return 'unanswered';
    return item?.isCorrect ? 'correct' : 'incorrect';
};

export default function ExamResultPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewingSolution, setViewingSolution] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await api.get(`/student/exams/attempt/${id}`);
                if (res.data.success) {
                    setResult(res.data.attempt);
                }
            } catch (error) {
                console.error('Failed to load result', error);
                toast.error('Failed to load result.');
                router.push('/student/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [id, router]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (!result) return null;

    const hiddenAnswers = (result.analysis || []).some((item) => item.canViewCorrectAnswer === false);
    const hiddenSolutions = (result.analysis || []).some((item) => item.canViewSolution === false);

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <Button variant="ghost" onClick={() => router.push('/student/dashboard')} className="text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className={cn(
                        'h-2',
                        result.isPassed ? 'bg-emerald-500' : 'bg-red-500'
                    )} />

                    <div className="p-8 md:p-12 text-center">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">{result.examTitle}</h1>
                        <p className="text-slate-500 mb-8">completed on {new Date(result.submittedAt).toLocaleDateString()}</p>

                        <div className="flex flex-col items-center justify-center mb-8">
                            <div className={cn(
                                'w-40 h-40 rounded-full flex flex-col items-center justify-center border-8 mb-4 shadow-lg',
                                result.isPassed ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'
                            )}>
                                <span className="text-5xl font-extrabold">{Math.round(result.percentage)}%</span>
                                <span className="text-sm font-semibold uppercase tracking-wider mt-1">{result.isPassed ? 'Passed' : 'Failed'}</span>
                            </div>
                            <p className="text-slate-600 font-medium text-lg">
                                Score: <span className="font-bold text-slate-900">{result.score}</span> / {result.totalMarks}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center border-t border-slate-100 pt-8">
                            <div className="p-4 rounded-xl bg-slate-50">
                                <p className="text-slate-500 text-sm font-medium mb-1">Time Taken</p>
                                <p className="text-slate-900 font-bold flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {formatTime(result.timeSpent)}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-50">
                                <p className="text-emerald-600 text-sm font-medium mb-1">Correct</p>
                                <p className="text-emerald-900 font-bold flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    {result.correctCount}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-50">
                                <p className="text-red-600 text-sm font-medium mb-1">Incorrect</p>
                                <p className="text-red-900 font-bold flex items-center justify-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    {result.incorrectCount}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50">
                                <p className="text-slate-500 text-sm font-medium mb-1">Unattempted</p>
                                <p className="text-slate-900 font-bold flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-slate-400" />
                                    {result.unansweredCount}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-indigo-50">
                                <p className="text-indigo-600 text-sm font-medium mb-1">Percentile</p>
                                <p className="text-indigo-900 font-bold flex items-center justify-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    {result.percentile != null ? `Top ${100 - result.percentile}%` : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800">Detailed Analysis</h2>
                    {hiddenAnswers && (
                        <p className="text-sm text-amber-700">Answer key hidden by tutor for some/all questions.</p>
                    )}
                    {hiddenSolutions && (
                        <p className="text-sm text-amber-700">Solution hidden by tutor for some/all questions.</p>
                    )}

                    {result.analysis && result.analysis.map((item, index) => {
                        const status = getStatus(item);
                        const selectedAnswer = item.selectedAnswerText || getOptionText(item.options?.[item.userSelectedOption]) || '-';
                        const correctAnswer = item.canViewCorrectAnswer
                            ? (item.correctAnswerText || getOptionText(item.options?.[item.correctOption]) || '-')
                            : 'Hidden';

                        return (
                            <div key={item._id || index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                                            {item.questionNumber || index + 1}
                                        </span>
                                        <p className="text-slate-800 font-medium text-lg pt-0.5">{item.question}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className={cn(
                                            'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
                                            status === 'correct' ? 'bg-emerald-100 text-emerald-700' : status === 'incorrect' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                        )}>
                                            {status}
                                        </span>
                                    </div>
                                </div>

                                <div className="ml-11 space-y-2">
                                    <p className="text-sm text-slate-600"><span className="font-semibold">Your Answer:</span> {selectedAnswer}</p>
                                    <p className={cn(
                                        'text-sm',
                                        item.canViewCorrectAnswer ? 'text-emerald-700' : 'text-slate-500'
                                    )}>
                                        <span className="font-semibold">Correct Answer:</span> {correctAnswer}
                                    </p>
                                    <p className="text-xs text-slate-500">Marks: {item.pointsEarned ?? 0} / {item.pointsPossible ?? item.points ?? 1}</p>
                                </div>

                                <div className="grid gap-2 ml-11 mt-4">
                                    {(item.options || []).map((opt, optIdx) => {
                                        const text = getOptionText(opt);
                                        const isSelected = item.userSelectedOption === optIdx;
                                        const isCorrectOption = item.canViewCorrectAnswer && item.correctOption === optIdx;

                                        let containerClass = 'border-slate-200 bg-white text-slate-600';
                                        let badgeClass = 'border-slate-300 bg-slate-100 text-slate-500';

                                        if (isCorrectOption) {
                                            containerClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/20';
                                            badgeClass = 'border-emerald-600 bg-emerald-600 text-white';
                                        } else if (isSelected && status === 'incorrect') {
                                            containerClass = 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500/20';
                                            badgeClass = 'border-red-600 bg-red-600 text-white';
                                        } else if (isSelected) {
                                            containerClass = 'border-indigo-400 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-300/30';
                                            badgeClass = 'border-indigo-600 bg-indigo-600 text-white';
                                        }

                                        return (
                                            <div
                                                key={optIdx}
                                                className={cn(
                                                    'flex items-center justify-between p-3 rounded-lg border text-sm transition-all',
                                                    containerClass
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        'w-6 h-6 flex items-center justify-center rounded-full text-xs border font-bold',
                                                        badgeClass
                                                    )}>
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </span>
                                                    <span className="font-medium">{text}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="ml-11 mt-4">
                                    {item.canViewSolution && item.solutionText ? (
                                        <button
                                            onClick={() => setViewingSolution(viewingSolution === index ? null : index)}
                                            className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            {viewingSolution === index ? 'Hide Solution' : 'View Solution'}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-400">Solution hidden</span>
                                    )}
                                </div>

                                {viewingSolution === index && item.canViewSolution && item.solutionText && (
                                    <div className="ml-11 mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Solution Explanation</p>
                                        <p className="text-sm text-slate-700">{item.solutionText}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
