'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MdStorage,
    MdEdit,
    MdDelete,
    MdDriveFileMoveOutline,
    MdKeyboardArrowDown,
    MdKeyboardArrowRight,
    MdFolderOpen,
    MdFolder,
    MdHourglassEmpty,
    MdSearch,
    MdAdd,
    MdAutoAwesome,
} from 'react-icons/md';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow   = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow   = 'none';
};

const baseInputStyle = {
    backgroundColor: C.innerBg,
    border:          `1px solid ${C.cardBorder}`,
    borderRadius:    '10px',
    color:           C.heading,
    fontFamily:      T.fontFamily,
    fontSize:        T.size.base,
    fontWeight:      T.weight.medium,
    outline:         'none',
    width:           '100%',
    padding:         '10px 16px',
    transition:      'all 0.2s ease',
};

// ─── Shared card style ────────────────────────────────────────────────────────
const sectionCard = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    boxShadow:       S.card,
    borderRadius:    R['2xl'],
};

// ─── Difficulty badge style ───────────────────────────────────────────────────
const difficultyStyle = (d) => ({
    easy:   { bg: C.successBg, color: C.success, border: C.successBorder },
    medium: { bg: C.warningBg, color: C.warning, border: C.warningBorder },
    hard:   { bg: C.dangerBg,  color: C.danger,  border: C.dangerBorder  },
}[d] || { bg: C.innerBg, color: C.text, border: C.cardBorder });

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuestionBankPage() {
    const [questions, setQuestions]           = useState([]);
    const [loading, setLoading]               = useState(true);
    const [searchTerm, setSearchTerm]         = useState('');
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const { confirmDialog }                   = useConfirm();

    useEffect(() => { fetchQuestions(); }, []);

    const fetchQuestions = async () => {
        try {
            const res = await api.get('/question-bank/questions');
            if (res?.data?.success) setQuestions(res.data.questions);
        } catch (error) {
            console.error('Failed to load questions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDialog(
            'Delete Question',
            'Are you sure you want to delete this question?',
            { variant: 'destructive' }
        );
        if (!isConfirmed) return;
        try {
            await api.delete(`/question-bank/questions/${id}`);
            setQuestions(questions.filter(q => q._id !== id));
            toast.success('Question deleted');
        } catch {
            toast.error('Failed to delete question');
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topicId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.skillId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedQuestions = filteredQuestions.reduce((acc, q) => {
        const topicName = q.topicId?.name || 'Uncategorized';
        const topicId   = q.topicId?._id  || 'uncategorized';
        if (!acc[topicId]) acc[topicId] = { name: topicName, questions: [] };
        acc[topicId].questions.push(q);
        return acc;
    }, {});

    const topicKeys = Object.keys(groupedQuestions);

    const toggleTopic = (topicId) => {
        setExpandedTopics(prev => {
            const updated = new Set(prev);
            updated.has(topicId) ? updated.delete(topicId) : updated.add(topicId);
            return updated;
        });
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="relative w-12 h-12">
                <div
                    className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <MdAutoAwesome className="animate-pulse" style={{ width: 18, height: 18, color: C.btnPrimary }} />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium }}>
                Loading questions...
            </p>
        </div>
    );

    return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5"
                style={sectionCard}
            >
                <div className="flex items-center gap-3">
                    {/* Icon Pill */}
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdStorage style={{ width: 20, height: 20, color: C.iconColor }} />
                    </div>
                    <div>
                        <h1
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size['2xl'],
                                fontWeight:  T.weight.bold,
                                color:       C.heading,
                                margin:      '0 0 2px 0',
                                lineHeight:  T.leading.tight,
                            }}
                        >
                            Question Bank
                        </h1>
                        <p
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.medium,
                                color:       C.text,
                                margin:      0,
                            }}
                        >
                            {questions.length} questions across {topicKeys.length} {topicKeys.length === 1 ? 'category' : 'categories'}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <Link href="/tutor/questions/import" className="flex-1 sm:flex-none">
                        <button
                            className="w-full flex items-center justify-center gap-2 h-11 px-5 cursor-pointer border-none transition-opacity hover:opacity-80"
                            style={{
                                backgroundColor: C.btnViewAllBg,
                                color:           C.btnViewAllText,
                                borderRadius:    '10px',
                                border:          `1px solid ${C.cardBorder}`,
                                fontFamily:      T.fontFamily,
                                fontSize:        T.size.base,
                                fontWeight:      T.weight.bold,
                            }}
                        >
                            <MdDriveFileMoveOutline style={{ width: 18, height: 18 }} /> Import
                        </button>
                    </Link>
                    <Link href="/tutor/questions/create" className="flex-1 sm:flex-none">
                        <button
                            className="w-full flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90"
                            style={{
                                background:   C.gradientBtn,
                                color:        '#ffffff',
                                borderRadius: '10px',
                                boxShadow:    S.btn,
                                fontFamily:   T.fontFamily,
                                fontSize:     T.size.base,
                                fontWeight:   T.weight.bold,
                            }}
                        >
                            <MdAdd style={{ width: 18, height: 18 }} /> Add Question
                        </button>
                    </Link>
                </div>
            </div>

            {/* ── Search + Controls ────────────────────────────────────────── */}
            <div
                className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between"
                style={sectionCard}
            >
                {/* Search Input */}
                <div className="relative w-full md:flex-1">
                    <MdSearch
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ width: 18, height: 18, color: C.text }}
                    />
                    <input
                        placeholder="Search questions by text, topic, or skill..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ ...baseInputStyle, paddingLeft: '40px' }}
                        onFocus={onFocusHandler}
                        onBlur={onBlurHandler}
                    />
                </div>

                {/* Expand / Collapse */}
                <div className="flex gap-2 shrink-0 w-full md:w-auto">
                    <button
                        onClick={() => setExpandedTopics(new Set(topicKeys))}
                        className="flex-1 md:flex-none px-4 py-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                        style={{
                            backgroundColor: C.innerBg,
                            color:           C.btnPrimary,
                            borderRadius:    '10px',
                            border:          `1px solid ${C.cardBorder}`,
                            fontFamily:      T.fontFamily,
                            fontSize:        T.size.base,
                            fontWeight:      T.weight.bold,
                        }}
                    >
                        Expand All
                    </button>
                    <button
                        onClick={() => setExpandedTopics(new Set())}
                        className="flex-1 md:flex-none px-4 py-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                        style={{
                            backgroundColor: C.innerBg,
                            color:           C.text,
                            borderRadius:    '10px',
                            border:          `1px solid ${C.cardBorder}`,
                            fontFamily:      T.fontFamily,
                            fontSize:        T.size.base,
                            fontWeight:      T.weight.bold,
                        }}
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* ── Empty State ──────────────────────────────────────────────── */}
            {filteredQuestions.length === 0 ? (
                <div
                    className="text-center py-16 flex flex-col items-center border border-dashed"
                    style={{
                        backgroundColor: C.cardBg,
                        borderColor:     C.cardBorder,
                        borderRadius:    R['2xl'],
                    }}
                >
                    <div
                        className="flex items-center justify-center mb-4"
                        style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: R.lg }}
                    >
                        <MdStorage style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3
                        style={{
                            fontFamily:   T.fontFamily,
                            fontSize:     T.size.lg,
                            fontWeight:   T.weight.bold,
                            color:        C.heading,
                            margin:       '0 0 6px 0',
                        }}
                    >
                        {searchTerm ? 'No questions match your search' : 'No questions found'}
                    </h3>
                    <p
                        style={{
                            fontFamily:   T.fontFamily,
                            fontSize:     T.size.base,
                            fontWeight:   T.weight.medium,
                            color:        C.text,
                            margin:       '0 0 20px 0',
                        }}
                    >
                        {searchTerm ? 'Try a different search term.' : 'Get started by creating your first question.'}
                    </p>
                    {!searchTerm && (
                        <Link href="/tutor/questions/create">
                            <button
                                className="flex items-center justify-center gap-2 h-10 px-6 cursor-pointer border-none transition-opacity hover:opacity-90"
                                style={{
                                    background:   C.gradientBtn,
                                    color:        '#ffffff',
                                    borderRadius: '10px',
                                    boxShadow:    S.btn,
                                    fontFamily:   T.fontFamily,
                                    fontSize:     T.size.base,
                                    fontWeight:   T.weight.bold,
                                }}
                            >
                                <MdAdd style={{ width: 16, height: 16 }} /> Create Question
                            </button>
                        </Link>
                    )}
                </div>

            /* ── Topic Groups ─────────────────────────────────────────────── */
            ) : (
                <div className="space-y-4">
                    {topicKeys.map(topicId => {
                        const group          = groupedQuestions[topicId];
                        const isExpanded     = expandedTopics.has(topicId);
                        const mcqCount       = group.questions.filter(q => q.type === 'mcq' || (q.options && q.options.length > 0)).length;
                        const subjectiveCount = group.questions.length - mcqCount;

                        return (
                            <div
                                key={topicId}
                                className="overflow-hidden"
                                style={sectionCard}
                            >
                                {/* Topic Header */}
                                <button
                                    onClick={() => toggleTopic(topicId)}
                                    className="w-full flex items-center justify-between px-5 py-4 cursor-pointer border-none transition-opacity hover:opacity-80"
                                    style={{
                                        backgroundColor: C.cardBg,
                                        borderBottom:    isExpanded ? `1px solid ${C.cardBorder}` : 'none',
                                    }}
                                >
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {isExpanded
                                            ? <MdFolderOpen style={{ width: 18, height: 18, color: C.btnPrimary, flexShrink: 0 }} />
                                            : <MdFolder     style={{ width: 18, height: 18, color: C.text,       flexShrink: 0 }} />
                                        }
                                        <span
                                            style={{
                                                fontFamily:  T.fontFamily,
                                                fontSize:    T.size.md,
                                                fontWeight:  T.weight.semibold,
                                                color:       C.heading,
                                            }}
                                        >
                                            {group.name}
                                        </span>

                                        {/* Count Badge */}
                                        <span
                                            style={{
                                                fontFamily:  T.fontFamily,
                                                fontSize:    T.size.xs,
                                                fontWeight:  T.weight.bold,
                                                backgroundColor: C.innerBg,
                                                color:       C.text,
                                                padding:     '2px 8px',
                                                borderRadius:'10px',
                                                border:      `1px solid ${C.cardBorder}`,
                                            }}
                                        >
                                            {group.questions.length} {group.questions.length === 1 ? 'question' : 'questions'}
                                        </span>

                                        {/* MCQ Badge */}
                                        {mcqCount > 0 && (
                                            <span
                                                style={{
                                                    fontFamily:      T.fontFamily,
                                                    fontSize:        T.size.xs,
                                                    fontWeight:      T.weight.bold,
                                                    backgroundColor: 'rgba(59,130,246,0.12)',
                                                    color:           '#3b82f6',
                                                    border:          '1px solid rgba(59,130,246,0.2)',
                                                    padding:         '2px 8px',
                                                    borderRadius:    '10px',
                                                    textTransform:   'uppercase',
                                                }}
                                            >
                                                {mcqCount} MCQ
                                            </span>
                                        )}

                                        {/* Subjective Badge */}
                                        {subjectiveCount > 0 && (
                                            <span
                                                style={{
                                                    fontFamily:      T.fontFamily,
                                                    fontSize:        T.size.xs,
                                                    fontWeight:      T.weight.bold,
                                                    backgroundColor: C.warningBg,
                                                    color:           C.warning,
                                                    border:          `1px solid ${C.warningBorder}`,
                                                    padding:         '2px 8px',
                                                    borderRadius:    '10px',
                                                    textTransform:   'uppercase',
                                                }}
                                            >
                                                {subjectiveCount} Subjective
                                            </span>
                                        )}
                                    </div>

                                    {isExpanded
                                        ? <MdKeyboardArrowDown  style={{ width: 20, height: 20, color: C.text, flexShrink: 0 }} />
                                        : <MdKeyboardArrowRight style={{ width: 20, height: 20, color: C.text, flexShrink: 0 }} />
                                    }
                                </button>

                                {/* Questions List */}
                                {isExpanded && (
                                    <div className="flex flex-col">
                                        {group.questions.map((q, qIdx) => {
                                            const diffSty = difficultyStyle(q.difficulty);
                                            return (
                                                <div
                                                    key={q._id}
                                                    className="px-5 py-4 transition-colors"
                                                    style={{
                                                        backgroundColor: C.innerBg,
                                                        borderBottom:    qIdx !== group.questions.length - 1
                                                            ? `1px solid ${C.cardBorder}`
                                                            : 'none',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                >
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1 min-w-0 space-y-3">

                                                            {/* Badges row */}
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {/* Type badge */}
                                                                <span
                                                                    style={{
                                                                        fontFamily:      T.fontFamily,
                                                                        fontSize:        T.size.xs,
                                                                        fontWeight:      T.weight.bold,
                                                                        backgroundColor: C.cardBg,
                                                                        color:           C.heading,
                                                                        border:          `1px solid ${C.cardBorder}`,
                                                                        padding:         '2px 8px',
                                                                        borderRadius:    '10px',
                                                                        textTransform:   'uppercase',
                                                                    }}
                                                                >
                                                                    {q.type || (q.options?.length > 0 ? 'mcq' : 'subjective')}
                                                                </span>

                                                                {/* Difficulty badge */}
                                                                <span
                                                                    style={{
                                                                        fontFamily:      T.fontFamily,
                                                                        fontSize:        T.size.xs,
                                                                        fontWeight:      T.weight.bold,
                                                                        backgroundColor: diffSty.bg,
                                                                        color:           diffSty.color,
                                                                        border:          `1px solid ${diffSty.border}`,
                                                                        padding:         '2px 8px',
                                                                        borderRadius:    '10px',
                                                                        textTransform:   'uppercase',
                                                                    }}
                                                                >
                                                                    {q.difficulty}
                                                                </span>

                                                                {/* Skill badge */}
                                                                {q.skillId && (
                                                                    <span
                                                                        style={{
                                                                            fontFamily:      T.fontFamily,
                                                                            fontSize:        T.size.xs,
                                                                            fontWeight:      T.weight.medium,
                                                                            backgroundColor: C.cardBg,
                                                                            color:           C.text,
                                                                            border:          `1px solid ${C.cardBorder}`,
                                                                            padding:         '2px 8px',
                                                                            borderRadius:    '10px',
                                                                        }}
                                                                    >
                                                                        {q.skillId.name}
                                                                    </span>
                                                                )}

                                                                {/* Points */}
                                                                <span
                                                                    style={{
                                                                        fontFamily:  T.fontFamily,
                                                                        fontSize:    T.size.xs,
                                                                        fontWeight:  T.weight.medium,
                                                                        color:       C.text,
                                                                    }}
                                                                >
                                                                    {q.points} pts
                                                                </span>
                                                            </div>

                                                            {/* Question text */}
                                                            <div
                                                                style={{
                                                                    fontFamily:  T.fontFamily,
                                                                    fontSize:    T.size.base,
                                                                    fontWeight:  T.weight.semibold,
                                                                    color:       C.heading,
                                                                    lineHeight:  T.leading.relaxed,
                                                                }}
                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }}
                                                            />

                                                            {/* Options count */}
                                                            {q.options && q.options.length > 0 && (
                                                                <p
                                                                    style={{
                                                                        fontFamily:  T.fontFamily,
                                                                        fontSize:    T.size.xs,
                                                                        fontWeight:  T.weight.medium,
                                                                        color:       C.text,
                                                                        margin:      0,
                                                                    }}
                                                                >
                                                                    {q.options.length} options
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2 shrink-0">
                                                            <Link href={`/tutor/questions/${q._id}/edit`}>
                                                                <button
                                                                    className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                                                    style={{
                                                                        width:           32,
                                                                        height:          32,
                                                                        backgroundColor: C.cardBg,
                                                                        border:          `1px solid ${C.cardBorder}`,
                                                                        borderRadius:    '10px',
                                                                    }}
                                                                >
                                                                    <MdEdit style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                                                </button>
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(q._id)}
                                                                className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                                                style={{
                                                                    width:           32,
                                                                    height:          32,
                                                                    backgroundColor: C.dangerBg,
                                                                    border:          `1px solid ${C.dangerBorder}`,
                                                                    borderRadius:    '10px',
                                                                }}
                                                            >
                                                                <MdDelete style={{ width: 14, height: 14, color: C.danger }} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}