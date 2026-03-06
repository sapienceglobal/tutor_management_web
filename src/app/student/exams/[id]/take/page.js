'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Clock,
    Maximize,
    Minimize,
    ChevronRight,
    Menu,
    Lock,
    Zap,
    Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function TakeExamPage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const AUTOSAVE_KEY = `exam_autosave_${id}`;

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selections, setSelections] = useState({});
    const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { confirmDialog } = useConfirm();
    const timeLeftRef = useRef(0);

    // --- Section-based timing state ---
    const [sectionTimers, setSectionTimers] = useState({}); // { sectionIndex: secondsLeft }
    const [activeSection, setActiveSection] = useState(0);
    const [lockedSections, setLockedSections] = useState(new Set());
    const hasSections = exam?.sections?.length > 0;

    // --- Adaptive testing state ---
    const [adaptiveQuestion, setAdaptiveQuestion] = useState(null);
    const [adaptiveAnswered, setAdaptiveAnswered] = useState([]);
    const [adaptiveSelection, setAdaptiveSelection] = useState(null);
    const [adaptiveFinished, setAdaptiveFinished] = useState(false);
    const [adaptiveLoading, setAdaptiveLoading] = useState(false);
    const [lastCorrect, setLastCorrect] = useState(null);
    const isAdaptive = exam?.isAdaptive || false;

    // --- Tab-switch detection ---
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const attemptIdRef = useRef(null);

    // Keep ref in sync for auto-save interval
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

    // Tab-switch detection for test integrity
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden && exam && !loading) {
                const newCount = tabSwitchCount + 1;
                setTabSwitchCount(newCount);
                toast.error(`⚠️ Tab switch detected (${newCount})! This is being recorded.`, { duration: 4000 });

                // Log to backend if we have an attempt ID
                if (attemptIdRef.current) {
                    try {
                        await api.post(`/student/exams/${attemptIdRef.current}/tab-switch`);
                    } catch (err) {
                        console.error('Tab switch log failed:', err);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [exam, loading, tabSwitchCount]);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/student/exams/${id}`);
                if (res.data.success) {
                    const fetchedExam = res.data.exam;
                    setExam(fetchedExam);

                    // --- Auto-Save Restore ---
                    try {
                        const saved = localStorage.getItem(AUTOSAVE_KEY);
                        if (saved) {
                            const parsed = JSON.parse(saved);
                            if (parsed.examId === id) {
                                setSelections(parsed.selections || {});
                                setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
                                setVisitedQuestions(new Set(parsed.visitedQuestions || [0]));
                                const savedTime = parsed.timeLeft;
                                if (typeof savedTime === 'number' && savedTime > 0 && savedTime <= fetchedExam.duration * 60) {
                                    setTimeLeft(savedTime);
                                } else {
                                    setTimeLeft(fetchedExam.duration * 60);
                                }
                                toast.success('Your previous progress has been restored.', { icon: '💾' });
                            } else {
                                setTimeLeft(fetchedExam.duration * 60);
                            }
                        } else {
                            setTimeLeft(fetchedExam.duration * 60);
                        }
                    } catch {
                        setTimeLeft(fetchedExam.duration * 60);
                    }

                    // Initialize section timers
                    if (fetchedExam.sections && fetchedExam.sections.length > 0) {
                        const timers = {};
                        fetchedExam.sections.forEach((sec, idx) => {
                            timers[idx] = sec.duration * 60;
                        });
                        setSectionTimers(timers);
                    }

                    // If adaptive, fetch first question
                    if (fetchedExam.isAdaptive) {
                        fetchNextAdaptiveQuestion([], null);
                    }
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

    // --- Adaptive: fetch next question ---
    const fetchNextAdaptiveQuestion = async (answeredIds, wasCorrect) => {
        setAdaptiveLoading(true);
        try {
            const res = await api.post(`/student/exams/${id}/next-question`, {
                answeredQuestionIds: answeredIds,
                lastAnswerCorrect: wasCorrect,
            });
            if (res.data.success) {
                if (res.data.finished) {
                    setAdaptiveFinished(true);
                } else {
                    setAdaptiveQuestion(res.data.question);
                    setAdaptiveSelection(null);
                }
            }
        } catch (err) {
            console.error('Adaptive fetch error:', err);
            toast.error('Failed to load next question.');
        } finally {
            setAdaptiveLoading(false);
        }
    };

    // --- Adaptive: submit current answer and fetch next ---
    const handleAdaptiveSubmitAnswer = async () => {
        if (adaptiveSelection === null) {
            toast.error('Please select an option.');
            return;
        }
        const q = adaptiveQuestion;
        const newAnswered = [...adaptiveAnswered, { questionId: q._id, selectedOption: adaptiveSelection }];
        setAdaptiveAnswered(newAnswered);

        // We don't know if it's correct client-side; pass null and let backend decide difficulty
        // For now, we'll just alternate. The backend handles difficulty selection.
        await fetchNextAdaptiveQuestion(newAnswered.map(a => a.questionId), lastCorrect);
    };

    // --- Section timer effect ---
    useEffect(() => {
        if (loading || !exam || !hasSections) return;

        const sectionTimer = setInterval(() => {
            setSectionTimers(prev => {
                const updated = { ...prev };
                let anyChanged = false;
                Object.keys(updated).forEach(secIdx => {
                    const idx = Number(secIdx);
                    if (!lockedSections.has(idx) && updated[idx] > 0) {
                        updated[idx] -= 1;
                        anyChanged = true;
                        if (updated[idx] <= 0) {
                            // Lock this section
                            setLockedSections(prevLocked => {
                                const newLocked = new Set(prevLocked);
                                newLocked.add(idx);
                                return newLocked;
                            });
                            toast.error(`Section "${exam.sections[idx]?.name}" time is up!`);
                        }
                    }
                });
                return anyChanged ? updated : prev;
            });
        }, 1000);

        return () => clearInterval(sectionTimer);
    }, [loading, exam, hasSections, lockedSections]);

    // Helper: get section index for a question index
    const getSectionForQuestion = (qIdx) => {
        if (!hasSections) return -1;
        return exam.sections.findIndex(s => qIdx >= s.questionStartIndex && qIdx <= s.questionEndIndex);
    };

    // Helper: is current question in a locked section?
    const isQuestionLocked = (qIdx) => {
        if (!hasSections) return false;
        const secIdx = getSectionForQuestion(qIdx);
        return secIdx !== -1 && lockedSections.has(secIdx);
    };

    // --- Auto-Save Effect: save every 10 seconds ---
    useEffect(() => {
        if (loading || !exam) return;

        const autoSaveInterval = setInterval(() => {
            try {
                const dataToSave = {
                    examId: id,
                    selections,
                    currentQuestionIndex,
                    visitedQuestions: [...visitedQuestions],
                    timeLeft: timeLeftRef.current,
                    savedAt: Date.now(),
                };
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
            } catch (e) {
                // localStorage full or unavailable — silently ignore
            }
        }, 10000);

        return () => clearInterval(autoSaveInterval);
    }, [loading, exam, selections, currentQuestionIndex, visitedQuestions, id]);

    // Helper to clear auto-save data
    const clearAutoSave = useCallback(() => {
        try { localStorage.removeItem(AUTOSAVE_KEY); } catch { }
    }, [AUTOSAVE_KEY]);

    useEffect(() => {
        if (loading || !exam || isAdaptive) return;

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
    }, [loading, exam, isAdaptive]);

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
        const hasAnswer = (sel.optionIndex !== undefined && sel.optionIndex !== null) || (sel.textAnswer && sel.textAnswer.trim().length > 0);
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
        if (isQuestionLocked(currentQuestionIndex)) {
            toast.error('This section\'s time has expired.');
            return;
        }
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
        if (isQuestionLocked(currentQuestionIndex)) return;
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
            // For adaptive exams, use adaptiveAnswered
            const answersToSubmit = isAdaptive
                ? adaptiveAnswered
                : Object.entries(selections).map(([qIdx, data]) => ({
                    questionId: exam.questions[qIdx]._id,
                    selectedOption: data.optionIndex ?? -1,
                    textAnswer: data.textAnswer || '',
                }));

            const timeSpent = (exam.duration * 60) - timeLeft;

            const res = await api.post(`/student/exams/${id}/submit`, {
                answers: answersToSubmit,
                timeSpent,
                startedAt: new Date(Date.now() - (timeSpent * 1000)).toISOString()
            });

            if (res.data.success) {
                clearAutoSave();
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

    // --- ADAPTIVE MODE RENDER ---
    if (isAdaptive) {
        return (
            <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
                <header className="h-14 bg-gradient-to-r from-indigo-700 to-purple-700 text-white flex items-center justify-between px-6 shadow-md z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-300" />
                        <span className="font-semibold text-base">{exam.title}</span>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">ADAPTIVE</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 px-4 py-2 rounded-md text-sm font-medium">
                            {adaptiveAnswered.length} / {exam.questions?.length || '?'} Answered
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center p-8">
                    {adaptiveLoading ? (
                        <div className="text-center space-y-4">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
                            <p className="text-slate-500">Loading next question...</p>
                        </div>
                    ) : adaptiveFinished ? (
                        <div className="text-center space-y-6 max-w-md">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                <Zap className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">All Questions Completed!</h2>
                            <p className="text-slate-500">You've answered all adaptive questions. Click below to submit your test.</p>
                            <Button onClick={() => handleSubmit(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 text-lg font-semibold">
                                Submit Test
                            </Button>
                        </div>
                    ) : adaptiveQuestion ? (
                        <div className="max-w-3xl w-full">
                            <div className="mb-4 flex items-center gap-3">
                                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                    Difficulty: {adaptiveQuestion.difficulty?.charAt(0).toUpperCase() + adaptiveQuestion.difficulty?.slice(1)}
                                </span>
                                <span className="text-sm text-slate-400">
                                    {adaptiveQuestion.points || 1} point{(adaptiveQuestion.points || 1) > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="mb-8">
                                <p className="text-slate-700 text-xl leading-relaxed font-medium">{adaptiveQuestion.question}</p>
                            </div>
                            <div className="grid gap-3">
                                {adaptiveQuestion.options.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setAdaptiveSelection(idx)}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all",
                                            adaptiveSelection === idx
                                                ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                            adaptiveSelection === idx ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"
                                        )}>
                                            {['A', 'B', 'C', 'D'][idx]}
                                        </div>
                                        <span className={cn("text-base", adaptiveSelection === idx ? "text-indigo-900 font-medium" : "text-slate-600")}>
                                            {opt.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button
                                    onClick={handleAdaptiveSubmitAnswer}
                                    disabled={adaptiveSelection === null}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 font-semibold text-base disabled:opacity-50"
                                >
                                    Next Question <ChevronRight className="w-5 h-5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
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

                    {/* Section Tabs (if sections exist) */}
                    {hasSections && (
                        <div className="h-10 border-b border-slate-200 flex items-center gap-1 px-4 bg-slate-50 shrink-0 overflow-x-auto">
                            {exam.sections.map((sec, secIdx) => (
                                <button
                                    key={secIdx}
                                    onClick={() => {
                                        setActiveSection(secIdx);
                                        setCurrentQuestionIndex(sec.questionStartIndex);
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5",
                                        activeSection === secIdx
                                            ? "bg-indigo-100 text-indigo-700"
                                            : lockedSections.has(secIdx)
                                                ? "bg-red-50 text-red-400 line-through"
                                                : "text-slate-500 hover:bg-slate-100"
                                    )}
                                >
                                    {lockedSections.has(secIdx) && <Lock className="w-3 h-3" />}
                                    {sec.name}
                                    <span className={cn(
                                        "text-[10px] ml-1 px-1.5 py-0.5 rounded-full font-mono",
                                        lockedSections.has(secIdx) ? "bg-red-100 text-red-500" : "bg-slate-200 text-slate-600"
                                    )}>
                                        {lockedSections.has(secIdx) ? '00:00' : formatTime(sectionTimers[secIdx] || 0)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Top Bar */}
                    <div className="h-14 border-b border-slate-200 flex items-center px-6 justify-between bg-white shrink-0">
                        <h2 className="font-semibold text-slate-700 text-base">
                            Q{currentQuestionIndex + 1} of {exam.questions.length} <span className="text-slate-300 mx-2">|</span> <span className="text-slate-400 uppercase text-sm">{exam.courseTitle || 'GENERAL'}</span>
                            {isQuestionLocked(currentQuestionIndex) && (
                                <span className="ml-3 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">LOCKED</span>
                            )}
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
                                {currentQ.options && currentQ.options.length > 0 ? (
                                    <>
                                        <p className="text-sm text-slate-500 bg-slate-50 inline-block px-3 py-1.5 rounded border border-slate-200">
                                            Choose one from below options
                                        </p>

                                        <div className="grid gap-3 mt-6">
                                            {currentQ.options.map((opt, idx) => {
                                                const isSelected = currentSel?.optionIndex === idx;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => !isQuestionLocked(currentQuestionIndex) && handleOptionSelect(idx)}
                                                        className={cn(
                                                            "flex items-center gap-4 p-4 rounded-lg border transition-all",
                                                            isQuestionLocked(currentQuestionIndex)
                                                                ? "opacity-50 cursor-not-allowed bg-slate-50"
                                                                : "cursor-pointer",
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
                                    </>
                                ) : (
                                    <div className="mt-4">
                                        <p className="text-sm text-slate-500 bg-amber-50 inline-flex items-center gap-2 px-3 py-1.5 rounded border border-amber-200 mb-4">
                                            ✍️ Write your answer below
                                        </p>
                                        <textarea
                                            value={currentSel?.textAnswer || ''}
                                            onChange={(e) => {
                                                if (isQuestionLocked(currentQuestionIndex)) return;
                                                setSelections(prev => ({
                                                    ...prev,
                                                    [currentQuestionIndex]: {
                                                        ...prev[currentQuestionIndex],
                                                        textAnswer: e.target.value
                                                    }
                                                }));
                                            }}
                                            disabled={isQuestionLocked(currentQuestionIndex)}
                                            placeholder="Type your detailed answer here..."
                                            className="w-full min-h-[200px] p-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 resize-y disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">This question will be reviewed and graded by your instructor.</p>
                                    </div>
                                )}
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