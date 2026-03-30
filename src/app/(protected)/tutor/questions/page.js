'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus, Search, Database, Edit, Trash2, FolderInput,
    ChevronDown, ChevronRight, FolderOpen, Folder, Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: '#E3DFF8', // STRICTLY INNER COLOR
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

export default function QuestionBankPage() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const { confirmDialog } = useConfirm();

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
        const isConfirmed = await confirmDialog("Delete Question", "Are you sure you want to delete this question?", { variant: 'destructive' });
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
        const topicId = q.topicId?._id || 'uncategorized';
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

    const difficultyStyle = (d) => ({
        easy: { bg: C.successBg, color: C.success, border: C.successBorder },
        medium: { bg: C.warningBg, color: C.warning, border: C.warningBorder },
        hard: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
    }[d] || { bg: '#EAE8FA', color: C.textMuted, border: C.cardBorder }); // Replaced white with #EAE8FA

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading questions...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* Page Header (OUTER BOX) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Database size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Question Bank</h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                            {questions.length} questions across {topicKeys.length} {topicKeys.length === 1 ? 'category' : 'categories'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <Link href="/tutor/questions/import" className="flex-1 sm:flex-none text-decoration-none">
                        <button className="w-full flex items-center justify-center gap-2 h-11 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-md"
                            style={{ backgroundColor: '#E3DFF8', color: C.heading, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <FolderInput size={16} /> Import
                        </button>
                    </Link>
                    <Link href="/tutor/questions/create" className="flex-1 sm:flex-none text-decoration-none">
                        <button className="w-full flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <Plus size={16} /> Add Question
                        </button>
                    </Link>
                </div>
            </div>

            {/* Search + Controls (OUTER BOX) */}
            <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                    <input
                        placeholder="Search questions by text, topic, or skill..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...baseInputStyle, paddingLeft: '36px', backgroundColor: '#E3DFF8' }} // Inner box color
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <div className="flex gap-2 shrink-0 w-full md:w-auto">
                    <button onClick={() => setExpandedTopics(new Set(topicKeys))}
                        className="flex-1 md:flex-none px-4 py-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        Expand All
                    </button>
                    <button onClick={() => setExpandedTopics(new Set())}
                        className="flex-1 md:flex-none px-4 py-2 h-10 cursor-pointer border-none transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#E3DFF8', color: C.textMuted, borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Lists */}
            {filteredQuestions.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                    <div className="w-14 h-14 flex items-center justify-center mb-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Database size={28} color={C.btnPrimary} />
                    </div>
                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                        {searchTerm ? 'No questions match your search' : 'No questions found'}
                    </h3>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: '0 0 20px 0' }}>
                        {searchTerm ? 'Try a different search term.' : 'Get started by creating your first question.'}
                    </p>
                    {!searchTerm && (
                        <Link href="/tutor/questions/create" className="text-decoration-none">
                            <button className="flex items-center justify-center gap-2 h-10 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <Plus size={16} /> Create Question
                            </button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {topicKeys.map((topicId) => {
                        const group = groupedQuestions[topicId];
                        const isExpanded = expandedTopics.has(topicId);
                        const mcqCount = group.questions.filter(q => q.type === 'mcq' || (q.options && q.options.length > 0)).length;
                        const subjectiveCount = group.questions.length - mcqCount;

                        return (
                            <div key={topicId} className="overflow-hidden transition-shadow" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                
                                {/* Topic Header (OUTER COLOR to blend seamlessly) */}
                                <button onClick={() => toggleTopic(topicId)}
                                    className="w-full flex items-center justify-between px-5 py-4 cursor-pointer border-none transition-colors hover:opacity-80"
                                    style={{ backgroundColor: '#EAE8FA', borderBottom: isExpanded ? `1px solid ${C.cardBorder}` : 'none' }}>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {isExpanded ? <FolderOpen size={18} color={C.btnPrimary} className="shrink-0" /> : <Folder size={18} color={C.textMuted} className="shrink-0" />}
                                        <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>{group.name}</span>
                                        <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: '#E3DFF8', color: C.textMuted, padding: '2px 8px', borderRadius: R.md }}>
                                            {group.questions.length} {group.questions.length === 1 ? 'question' : 'questions'}
                                        </span>
                                        {mcqCount > 0 && (
                                            <span style={{ fontSize: '10px', fontWeight: T.weight.black, backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 8px', borderRadius: R.full, textTransform: 'uppercase' }}>
                                                {mcqCount} MCQ
                                            </span>
                                        )}
                                        {subjectiveCount > 0 && (
                                            <span style={{ fontSize: '10px', fontWeight: T.weight.black, backgroundColor: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}`, padding: '2px 8px', borderRadius: R.full, textTransform: 'uppercase' }}>
                                                {subjectiveCount} Subjective
                                            </span>
                                        )}
                                    </div>
                                    {isExpanded ? <ChevronDown size={18} color={C.textMuted} className="shrink-0" /> : <ChevronRight size={18} color={C.textMuted} className="shrink-0" />}
                                </button>

                                {/* Questions List (INNER COLOR for contrast) */}
                                {isExpanded && (
                                    <div className="flex flex-col">
                                        {group.questions.map((q, qIdx) => {
                                            const diffSty = difficultyStyle(q.difficulty);
                                            return (
                                                <div key={q._id} className="px-5 py-4 transition-colors hover:opacity-80" 
                                                    style={{ backgroundColor: '#E3DFF8', borderBottom: qIdx !== group.questions.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1 min-w-0 space-y-3">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {/* Badges - using #EAE8FA instead of white */}
                                                                <span style={{ fontSize: '10px', fontWeight: T.weight.black, backgroundColor: '#EAE8FA', color: C.heading, border: `1px solid ${C.cardBorder}`, padding: '2px 8px', borderRadius: R.md, textTransform: 'uppercase' }}>
                                                                    {q.type || (q.options?.length > 0 ? 'mcq' : 'subjective')}
                                                                </span>
                                                                <span style={{ fontSize: '10px', fontWeight: T.weight.black, backgroundColor: diffSty.bg, color: diffSty.color, border: `1px solid ${diffSty.border}`, padding: '2px 8px', borderRadius: R.md, textTransform: 'uppercase' }}>
                                                                    {q.difficulty}
                                                                </span>
                                                                {q.skillId && (
                                                                    <span style={{ fontSize: '10px', fontWeight: T.weight.bold, backgroundColor: '#EAE8FA', color: C.textMuted, border: `1px solid ${C.cardBorder}`, padding: '2px 8px', borderRadius: R.md }}>
                                                                        {q.skillId.name}
                                                                    </span>
                                                                )}
                                                                <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>{q.points} pts</span>
                                                            </div>
                                                            <div style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading, lineHeight: 1.5 }}
                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} />
                                                            {q.options && q.options.length > 0 && (
                                                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{q.options.length} options</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <Link href={`/tutor/questions/${q._id}/edit`} className="text-decoration-none">
                                                                {/* Buttons using #EAE8FA instead of white */}
                                                                <button className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                                                    style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}` }}>
                                                                    <Edit size={14} color={C.btnPrimary} />
                                                                </button>
                                                            </Link>
                                                            <button onClick={() => handleDelete(q._id)}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                                                style={{ backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}` }}>
                                                                <Trash2 size={14} color={C.danger} />
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