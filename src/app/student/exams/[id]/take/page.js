'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Clock,
    Maximize,
    Minimize,
    ChevronRight,
    Menu,
    Lock
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function TakeExamPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selections, setSelections] = useState({});
    const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/student/exams/${id}`);
                if (res.data.success) {
                    setExam(res.data.exam);
                    setTimeLeft(res.data.exam.duration * 60);
                }
            } catch (error) {
                console.error('Failed to load exam', error);
                toast.error('Failed to load exam. Please try again.');
                router.push('/student/exams');
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [id, router]);

    useEffect(() => {
        if (loading || !exam) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, exam]);

    useEffect(() => {
        setVisitedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.add(currentQuestionIndex);
            return newSet;
        });
    }, [currentQuestionIndex]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const getQuestionStatus = (index) => {
        const sel = selections[index] || {};
        const hasAnswer = sel.optionIndex !== undefined && sel.optionIndex !== null;
        const isMarked = !!sel.isMarked;
        const isVisited = visitedQuestions.has(index);

        if (isMarked && hasAnswer) return 'marked_answered';
        if (isMarked && !hasAnswer) return 'marked';
        if (hasAnswer) return 'answered';
        if (isVisited && !hasAnswer) return 'not_answered';
        return 'not_visited';
    };

    const getStatusCounts = () => {
        let counts = { answered: 0, marked: 0, marked_answered: 0, not_visited: 0, not_answered: 0 };
        if (!exam) return counts;

        exam.questions.forEach((_, idx) => {
            const status = getQuestionStatus(idx);
            counts[status]++;
        });
        return counts;
    };

    const handleOptionSelect = (optionIndex) => {
        setSelections(prev => {
            const current = prev[currentQuestionIndex] || {};
            return {
                ...prev,
                [currentQuestionIndex]: {
                    ...current,
                    optionIndex
                }
            };
        });
    };

    const handleClearResponse = () => {
        setSelections(prev => {
            const newSelections = { ...prev };
            const current = newSelections[currentQuestionIndex];
            if (current) {
                newSelections[currentQuestionIndex] = { ...current, optionIndex: null };
            }
            return newSelections;
        });
    };

    const handleMarkForReview = () => {
        setSelections(prev => {
            const current = prev[currentQuestionIndex] || {};
            return {
                ...prev,
                [currentQuestionIndex]: {
                    ...current,
                    isMarked: !current.isMarked
                }
            };
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit) {
            const isConfirmed = await confirmDialog("Finish Test", "Are you sure you want to finish the test?");
            if (!isConfirmed) return;
        }

        try {
            const answers = Object.entries(selections).map(([qIdx, data]) => ({
                questionId: exam.questions[qIdx]._id,
                selectedOption: data.optionIndex ?? -1,
            }));

            const timeSpent = (exam.duration * 60) - timeLeft;

            const res = await api.post(`/student/exams/${id}/submit`, {
                answers,
                timeSpent,
                startedAt: new Date(Date.now() - (timeSpent * 1000)).toISOString()
            });

            if (res.data.success) {
                toast.success('Test Submitted Successfully!');
                router.replace(`/student/exams/attempt/${res.data.attemptId}`);
            }
        } catch (error) {
            console.error('Submit failed', error);
            toast.error('Submission failed. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    const currentQ = exam.questions[currentQuestionIndex];
    const currentSel = selections[currentQuestionIndex];
    const counts = getStatusCounts();

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
            {/* Dark Header */}
            <header className="h-14 bg-[#334155] text-white flex items-center justify-between px-6 shadow-md z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-base">{exam.title}</span>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="bg-[#16a34a] hover:bg-[#15803d] text-white border-0 hidden md:flex font-medium px-4 h-9">
                        <Lock className="w-4 h-4 mr-2" />
                        All Questions
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-[#475569] px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatTime(timeLeft)}
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-slate-300 hover:text-white hover:bg-white/10 h-9 w-9">
                        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </Button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Question Area */}
                <main className="flex-1 flex flex-col overflow-hidden relative bg-white">

                    {/* Top Bar */}
                    <div className="h-14 border-b border-slate-200 flex items-center px-6 justify-between bg-white shrink-0">
                        <h2 className="font-semibold text-slate-700 text-base">
                            Q{currentQuestionIndex + 1} of {exam.questions.length} <span className="text-slate-300 mx-2">|</span> <span className="text-slate-400 uppercase text-sm">{exam.courseTitle || 'GENERAL'}</span>
                        </h2>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <p className="text-slate-700 text-lg leading-relaxed">
                                    {currentQ.question}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-slate-500 bg-slate-50 inline-block px-3 py-1.5 rounded border border-slate-200">
                                    Choose one from below options
                                </p>

                                <div className="grid gap-3 mt-6">
                                    {currentQ.options.map((opt, idx) => {
                                        const isSelected = currentSel?.optionIndex === idx;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleOptionSelect(idx)}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                                                    isSelected
                                                        ? "border-sky-400 bg-sky-50/50 ring-1 ring-sky-400/20"
                                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                                                    isSelected
                                                        ? "bg-sky-500 text-white"
                                                        : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                                <span className={cn(
                                                    "text-base",
                                                    isSelected ? "text-slate-900 font-medium" : "text-slate-600"
                                                )}>
                                                    {opt.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="h-20 border-t border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleClearResponse}
                                className="border-red-300 text-red-600 hover:bg-red-50 h-10 px-5"
                            >
                                Clear Answer
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleMarkForReview}
                                className="border-amber-300 text-amber-600 hover:bg-amber-50 h-10 px-5"
                            >
                                Mark for Review
                            </Button>
                        </div>

                        <Button
                            onClick={currentQuestionIndex === exam.questions.length - 1 ? () => handleSubmit(false) : handleNext}
                            className="bg-[#1e293b] hover:bg-slate-800 text-white px-8 h-10 font-semibold"
                        >
                            {currentQuestionIndex === exam.questions.length - 1 ? 'Save & Finish' : 'Save'}
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className={cn(
                    "w-[350px] bg-white border-l border-slate-200 flex flex-col transition-all duration-300 absolute right-0 h-full lg:relative z-20 shadow-xl lg:shadow-none",
                    !isSidebarOpen && "translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden"
                )}>
                    {/* Header */}
                    <div className="h-14 border-b border-slate-200 flex items-center justify-between px-5 bg-white shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="font-medium text-slate-600 text-sm">
                                {counts.answered}/{exam.questions.length} Answered
                            </span>
                        </div>
                        <Menu className="w-5 h-5 text-slate-400 cursor-pointer lg:hidden" onClick={() => setIsSidebarOpen(false)} />
                    </div>

                    {/* Question Grid */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
                        <div className="grid grid-cols-5 gap-3">
                            {exam.questions.map((_, idx) => {
                                const status = getQuestionStatus(idx);
                                const isCurrent = currentQuestionIndex === idx;

                                // Colors based on status
                                let baseClass = "bg-white border text-slate-700";
                                let stripClass = "bg-slate-200";

                                if (status === 'answered') {
                                    baseClass = "border-emerald-500 text-slate-700";
                                    stripClass = "bg-emerald-500";
                                } else if (status === 'not_answered') {
                                    baseClass = "border-red-500 text-slate-700";
                                    stripClass = "bg-red-500"; // Red bottom strip
                                } else if (status === 'marked') {
                                    baseClass = "border-purple-500 text-slate-700";
                                    stripClass = "bg-purple-500";
                                } else if (status === 'marked_answered') {
                                    baseClass = "border-amber-500 text-slate-700";
                                    stripClass = "bg-amber-500";
                                } else {
                                    // Not Visited
                                    baseClass = "border-slate-300 text-slate-400"; // Lighter text
                                    stripClass = "bg-slate-300";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={cn(
                                            "relative aspect-[5/4] rounded-md overflow-hidden flex flex-col transition-all shadow-sm group hover:shadow-md",
                                            baseClass,
                                            isCurrent && "ring-2 ring-blue-500 ring-offset-2 z-10 font-bold"
                                        )}
                                    >
                                        <div className="flex-1 flex items-center justify-center text-lg">
                                            {idx + 1}
                                        </div>
                                        <div className={cn("h-3 w-full", stripClass)} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="p-5 border-t border-slate-200 bg-white shrink-0 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border border-emerald-500 bg-white flex flex-col overflow-hidden">
                                    <div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-700">{counts.answered}</div>
                                    <div className="h-2.5 w-full bg-emerald-500"></div>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">Answered</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border border-red-500 bg-white flex flex-col overflow-hidden">
                                    <div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-700">{counts.not_answered}</div>
                                    <div className="h-2.5 w-full bg-red-500"></div>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">Not Answered</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border border-purple-500 bg-white flex flex-col overflow-hidden">
                                    <div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-700">{counts.marked}</div>
                                    <div className="h-2.5 w-full bg-purple-500"></div>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">Marked</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border border-amber-500 bg-white flex flex-col overflow-hidden">
                                    <div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-700">{counts.marked_answered}</div>
                                    <div className="h-2.5 w-full bg-amber-500"></div>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">Ans & Marked</span>
                            </div>
                            <div className="flex items-center gap-3 col-span-2">
                                <div className="w-10 h-10 rounded border border-slate-300 bg-white flex flex-col overflow-hidden">
                                    <div className="flex-1 flex items-center justify-center text-xs font-semibold text-slate-500">{counts.not_visited}</div>
                                    <div className="h-2.5 w-full bg-slate-300"></div>
                                </div>
                                <span className="text-xs text-slate-500 font-medium">Not Visited</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => handleSubmit(false)}
                            className="w-full bg-[#ef4444] hover:bg-red-600 text-white font-semibold py-6 text-base shadow-lg shadow-red-50 rounded transition-all"
                        >
                            Finish Test
                        </Button>
                    </div>
                </aside>

                {/* Mobile Toggle */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="fixed bottom-6 right-6 z-50 p-4 bg-[#334155] text-white rounded-full shadow-2xl lg:hidden"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    );
}