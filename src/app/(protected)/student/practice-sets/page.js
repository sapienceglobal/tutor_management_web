'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Zap,
    Clock,
    ArrowRight,
    Trophy,
    Activity,
    BrainCircuit,
    Search,
    X
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { getAudienceDisplay, getAudienceScope } from '@/lib/audienceDisplay';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

export default function StudentPracticeSetsPage() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Modal state for viewing exam attempts history
    const [selectedExamForHistory, setSelectedExamForHistory] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [attemptsStats, setAttemptsStats] = useState(null);
    const [attemptsLoading, setAttemptsLoading] = useState(false);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/student/all');
                if (res.data.success) {
                    // Filter for practice sets
                    setExams(res.data.exams.filter(e => e.type === 'practice'));
                }
            } catch (error) {
                console.error('Failed to load exams', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    // Fetch attempt history for a specific practice set
    const handleOpenHistory = async (exam) => {
        setSelectedExamForHistory(exam);
        setAttemptsLoading(true);
        try {
            const res = await api.get(`/exams/${exam._id}/my-attempts`);
            if (res.data.success) {
                setAttempts(res.data.attempts || []);
                setAttemptsStats(res.data.stats || null);
            }
        } catch (error) {
            console.error('Failed to load exam attempts', error);
        } finally {
            setAttemptsLoading(false);
        }
    };

    // Filter logic combining Scope & Search Term
    const filteredExams = useMemo(() => {
        return exams.filter(e => {
            const scope = getAudienceScope(e);
            const matchesScope =
                activeTab === 'all' ? true :
                activeTab === 'institute' ? (scope === 'institute' || scope === 'batch' || scope === 'private') :
                activeTab === 'global' ? scope === 'global' :
                true;

            const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.courseTitle && e.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()));

            return matchesScope && matchesSearch;
        });
    }, [exams, activeTab, searchTerm]);

    // Calculate dynamic stats
    const stats = useMemo(() => {
        const all = exams.length;
        const practiced = exams.filter(e => e.myAttemptCount > 0).length;
        const unattempted = all - practiced;
        return { all, practiced, unattempted };
    }, [exams]);

    // Input style object incorporating brand tokens and focus rings
    const inputStyle = {
        backgroundColor: C.surfaceWhite,
        border: `1.5px solid ${isFocused ? C.btnPrimary : C.cardBorder}`,
        borderRadius: '10px',
        color: C.heading,
        fontFamily: T.fontFamily,
        fontSize: T.size.base,
        fontWeight: T.weight.semibold,
        outline: 'none',
        width: '100%',
        padding: '10px 16px 10px 40px',
        boxShadow: isFocused ? `0 0 0 3px ${C.btnPrimary}15` : 'none',
        transition: 'all 0.2s ease',
    };

    if (loading) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
                style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
            >
                <div
                    className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{
                        borderColor: `${C.btnPrimary}30`,
                        borderTopColor: C.btnPrimary,
                    }}
                />
                <p
                    style={{
                        color: C.textMuted,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                    }}
                >
                    Loading practice sets...
                </p>
            </div>
        );
    }

    return (
        <div
            className="w-full space-y-6"
            style={{
                fontFamily: T.fontFamily,
                color: C.text,
            }}
        >
            {/* Header Card */}
            <div
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 lg:p-8"
                style={{
                    backgroundColor: C.outerCard,
                    borderRadius: R["2xl"],
                    border: `1px solid ${C.cardBorder}`,
                    boxShadow: S.card,
                }}
            >
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: C.innerBox, borderRadius: "10px" }}
                    >
                        <BrainCircuit size={24} style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1
                            style={{
                                color: C.heading,
                                fontSize: T.size.xl,
                                fontWeight: T.weight.bold,
                                margin: "0 0 4px 0",
                            }}
                        >
                            Practice Sets
                        </h1>
                        <p
                            style={{
                                color: C.textMuted,
                                fontSize: T.size.base,
                                fontWeight: T.weight.semibold,
                                margin: 0,
                            }}
                        >
                            Unlimited practice to master your subjects. Learn from mistakes with immediate feedback.
                        </p>
                    </div>
                </div>

                {/* Scope Filter Tabs */}
                {exams.length > 0 && (
                    <div
                        className="flex items-center p-1 w-full md:w-auto self-start md:self-auto"
                        style={{
                            backgroundColor: C.innerBg,
                            borderRadius: R.xl,
                            border: `1px solid ${C.cardBorder}`,
                        }}
                    >
                        {[
                            { id: 'all', label: 'All Practice' },
                            { id: 'institute', label: 'My Institute' },
                            { id: 'global', label: 'Global' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex-1 md:flex-none px-4 py-2 cursor-pointer border-none transition-all"
                                style={{
                                    backgroundColor: activeTab === tab.id ? C.surfaceWhite : 'transparent',
                                    color: activeTab === tab.id ? C.btnPrimary : C.textMuted,
                                    borderRadius: R.lg,
                                    boxShadow: activeTab === tab.id ? S.card : 'none',
                                    fontSize: T.size.sm,
                                    fontWeight: T.weight.bold,
                                    fontFamily: T.fontFamily,
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Stat Cards Grid */}
            {exams.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Practice"
                        value={stats.all}
                        icon={BrainCircuit}
                        iconBg="#E3DFF8"
                        iconColor={C.btnPrimary}
                    />
                    <StatCard
                        label="Completed / Practiced"
                        value={stats.practiced}
                        icon={Trophy}
                        iconBg={C.successBg}
                        iconColor={C.success}
                    />
                    <StatCard
                        label="Unattempted"
                        value={stats.unattempted}
                        icon={Zap}
                        iconBg={C.warningBg}
                        iconColor={C.warning}
                    />
                </div>
            )}

            {/* Search Input Controls */}
            {exams.length > 0 && (
                <div
                    className="p-4"
                    style={{
                        backgroundColor: C.outerCard,
                        borderRadius: R["2xl"],
                        border: `1px solid ${C.cardBorder}`,
                        boxShadow: S.card,
                    }}
                >
                    <div className="relative w-full md:w-80">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: C.textMuted }}
                        />
                        <input
                            type="text"
                            placeholder="Search practice sets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={inputStyle}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                    </div>
                </div>
            )}

            {/* Practice Sets List Grid */}
            {filteredExams.length === 0 ? (
                <div
                    className="text-center py-20 flex flex-col items-center"
                    style={{
                        backgroundColor: C.outerCard,
                        borderRadius: R["2xl"],
                        border: `1px solid ${C.cardBorder}`,
                        boxShadow: S.card,
                    }}
                >
                    <BrainCircuit
                        size={48}
                        style={{ color: C.textMuted, opacity: 0.3, marginBottom: "16px" }}
                    />
                    <p
                        style={{
                            fontSize: T.size.lg,
                            fontWeight: T.weight.bold,
                            color: C.heading,
                            margin: "0 0 4px 0",
                        }}
                    >
                        No Practice Sets Found
                    </p>
                    <p
                        style={{
                            fontSize: T.size.base,
                            fontWeight: T.weight.semibold,
                            color: C.textMuted,
                            margin: 0,
                        }}
                    >
                        {searchTerm 
                            ? "Try adjusting your search query." 
                            : "There are no practice sets available matching the selected scope."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredExams.map((exam, index) => {
                        const audienceInfo = getAudienceDisplay(exam);
                        return (
                            <motion.div
                                key={exam._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="h-full"
                            >
                                <div
                                    className="flex flex-col transition-all duration-300 group"
                                    style={{
                                        backgroundColor: C.cardBg,
                                        border: `1px solid ${C.cardBorder}`,
                                        boxShadow: S.card,
                                        borderRadius: R['2xl'],
                                        overflow: 'hidden',
                                        height: '100%',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}
                                >
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            {/* Badges / Category */}
                                            <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                                                <span
                                                    style={{
                                                        backgroundColor: C.innerBg,
                                                        color: C.text,
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.xs,
                                                        fontWeight: T.weight.bold,
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${C.cardBorder}`,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.04em'
                                                    }}
                                                >
                                                    {exam.courseTitle || 'General Practice'}
                                                </span>
                                                <span
                                                    className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider ${audienceInfo.badgeClass}`}
                                                    style={{ fontWeight: T.weight.bold }}
                                                >
                                                    {audienceInfo.label}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3
                                                className="line-clamp-2 transition-colors duration-300"
                                                style={{
                                                    fontFamily: T.fontFamily,
                                                    fontSize: T.size.lg,
                                                    fontWeight: T.weight.bold,
                                                    color: C.heading,
                                                    lineHeight: T.leading.snug,
                                                    minHeight: '2.8rem',
                                                    marginBottom: '12px',
                                                }}
                                            >
                                                {exam.title}
                                            </h3>

                                            {/* Details / Stats */}
                                            <div className="flex items-center gap-4 mt-3">
                                                <div
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5"
                                                    style={{
                                                        backgroundColor: C.innerBg,
                                                        borderRadius: '8px',
                                                        border: `1px solid ${C.cardBorder}`,
                                                    }}
                                                >
                                                    <Clock className="w-4 h-4" style={{ color: C.textMuted }} />
                                                    <span
                                                        style={{
                                                            fontFamily: T.fontFamily,
                                                            fontSize: T.size.base,
                                                            fontWeight: T.weight.semibold,
                                                            color: C.heading,
                                                        }}
                                                    >
                                                        {exam.duration} mins
                                                    </span>
                                                </div>
                                                <div
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5"
                                                    style={{
                                                        backgroundColor: C.innerBg,
                                                        borderRadius: '8px',
                                                        border: `1px solid ${C.cardBorder}`,
                                                    }}
                                                >
                                                    <Activity className="w-4 h-4" style={{ color: C.textMuted }} />
                                                    <span
                                                        style={{
                                                            fontFamily: T.fontFamily,
                                                            fontSize: T.size.base,
                                                            fontWeight: T.weight.semibold,
                                                            color: C.heading,
                                                        }}
                                                    >
                                                        {exam.totalQuestions} Qs
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Attempt Indicator */}
                                            {exam.myAttemptCount > 0 && (
                                                <div
                                                    className="mt-4 flex items-center gap-2 p-2.5"
                                                    style={{
                                                        backgroundColor: C.successBg,
                                                        border: `1px solid ${C.successBorder}`,
                                                        borderRadius: '8px',
                                                        color: C.success,
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.xs,
                                                        fontWeight: T.weight.bold,
                                                    }}
                                                >
                                                    <Trophy className="w-3.5 h-3.5" />
                                                    <span>You've practiced {exam.myAttemptCount} times</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Button Section */}
                                        <div className="mt-6 pt-5 flex gap-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                            <Link href={`/student/exams/${exam._id}`} className="flex-1 text-decoration-none">
                                                <button
                                                    className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{
                                                        background: C.gradientBtn,
                                                        color: '#ffffff',
                                                        fontFamily: T.fontFamily,
                                                        fontSize: T.size.base,
                                                        fontWeight: T.weight.bold,
                                                        height: '44px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        boxShadow: S.btn,
                                                    }}
                                                >
                                                    Start Practice
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            {exam.myAttemptCount > 0 && (
                                                <button
                                                    onClick={() => handleOpenHistory(exam)}
                                                    className="flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                                    style={{
                                                        backgroundColor: C.btnViewAllBg,
                                                        color: C.btnViewAllText,
                                                        border: `1px solid ${C.cardBorder}`,
                                                        borderRadius: '10px',
                                                        width: '44px',
                                                        height: '44px',
                                                    }}
                                                    title="Practice History"
                                                >
                                                    <Trophy className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Attempts History Modal */}
            <AnimatePresence>
                {selectedExamForHistory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setSelectedExamForHistory(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            transition={{ type: 'spring', duration: 0.4 }}
                            className="w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
                            style={{
                                backgroundColor: C.cardBg,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: R['2xl'],
                                boxShadow: S.card,
                                fontFamily: T.fontFamily,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div
                                className="p-5 flex items-center justify-between"
                                style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                            >
                                <div>
                                    <span
                                        style={{
                                            color: C.btnPrimary,
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.bold,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em',
                                        }}
                                    >
                                        Practice Attempts History
                                    </span>
                                    <h2
                                        style={{
                                            color: C.heading,
                                            fontSize: T.size.lg,
                                            fontWeight: T.weight.bold,
                                            margin: '4px 0 0 0',
                                        }}
                                    >
                                        {selectedExamForHistory.title}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedExamForHistory(null)}
                                    className="p-1.5 rounded-lg border-none cursor-pointer transition-colors"
                                    style={{
                                        backgroundColor: C.innerBg,
                                        color: C.text,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.cardBorder}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                {attemptsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full border-[3px] animate-spin"
                                            style={{
                                                borderColor: `${C.btnPrimary}30`,
                                                borderTopColor: C.btnPrimary,
                                            }}
                                        />
                                        <p style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.semibold }}>
                                            Fetching previous attempts...
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Quick Stats Summary */}
                                        {attemptsStats && (
                                            <div
                                                className="grid grid-cols-3 gap-4 p-4"
                                                style={{
                                                    backgroundColor: C.innerBg,
                                                    borderRadius: '12px',
                                                    border: `1px solid ${C.cardBorder}`,
                                                }}
                                            >
                                                <div className="text-center">
                                                    <span style={{ fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold, display: 'block', textTransform: 'uppercase' }}>
                                                        Total Practices
                                                    </span>
                                                    <span style={{ fontSize: T.size['2xl'], color: C.heading, fontWeight: T.weight.bold }}>
                                                        {attemptsStats.totalAttempts}
                                                    </span>
                                                </div>
                                                <div className="text-center" style={{ borderLeft: `1px solid ${C.cardBorder}`, borderRight: `1px solid ${C.cardBorder}` }}>
                                                    <span style={{ fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold, display: 'block', textTransform: 'uppercase' }}>
                                                        Best Score
                                                    </span>
                                                    <span style={{ fontSize: T.size['2xl'], color: C.success, fontWeight: T.weight.bold }}>
                                                        {attemptsStats.bestScore}
                                                    </span>
                                                </div>
                                                <div className="text-center">
                                                    <span style={{ fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold, display: 'block', textTransform: 'uppercase' }}>
                                                        Avg Score
                                                    </span>
                                                    <span style={{ fontSize: T.size['2xl'], color: C.btnPrimary, fontWeight: T.weight.bold }}>
                                                        {attemptsStats.averageScore}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Attempts List Timeline */}
                                        {attempts.length === 0 ? (
                                            <p className="text-center text-slate-500 py-6">
                                                No attempts found for this practice set.
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                <h3 style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, marginBottom: '12px' }}>
                                                    Attempt Log
                                                </h3>
                                                {attempts.map((attempt, idx) => {
                                                    const formattedDate = new Date(attempt.submittedAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    });
                                                    const isPassed = attempt.isPassed;
                                                    return (
                                                        <div
                                                            key={attempt._id}
                                                            className="flex items-center justify-between p-4 transition-colors"
                                                            style={{
                                                                backgroundColor: C.cardBg,
                                                                border: `1px solid ${C.cardBorder}`,
                                                                borderRadius: '12px',
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-10 h-10 flex items-center justify-center shrink-0"
                                                                    style={{
                                                                        backgroundColor: isPassed ? C.successBg : C.dangerBg,
                                                                        borderRadius: '8px',
                                                                    }}
                                                                >
                                                                    <Trophy className="w-5 h-5" style={{ color: isPassed ? C.success : C.danger }} />
                                                                </div>
                                                                <div>
                                                                    <span style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>
                                                                        Attempt #{attempts.length - idx}
                                                                    </span>
                                                                    <span style={{ fontSize: T.size.xs, color: C.textMuted, display: 'block' }}>
                                                                        {formattedDate}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                <div className="text-right">
                                                                    <span style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>
                                                                        {attempt.score} / {attempt.totalMarks}
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            fontSize: '10px',
                                                                            fontWeight: T.weight.bold,
                                                                            color: isPassed ? C.success : C.danger,
                                                                            textTransform: 'uppercase',
                                                                            display: 'block',
                                                                        }}
                                                                    >
                                                                        {isPassed ? 'Passed' : 'Failed'}
                                                                    </span>
                                                                </div>
                                                                <Link
                                                                    href={`/student/exams/${selectedExamForHistory._id}/result?attemptId=${attempt._id}`}
                                                                    className="text-decoration-none"
                                                                >
                                                                    <button
                                                                        className="px-4 py-2 cursor-pointer transition-colors"
                                                                        style={{
                                                                            backgroundColor: C.btnViewAllBg,
                                                                            color: C.btnViewAllText,
                                                                            border: `1px solid ${C.cardBorder}`,
                                                                            borderRadius: '8px',
                                                                            fontSize: T.size.xs,
                                                                            fontWeight: T.weight.bold,
                                                                        }}
                                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.cardBorder}
                                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                                                    >
                                                                        Review
                                                                    </button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
