'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus, Search, Database, Edit, Trash2, FolderInput,
    ChevronDown, ChevronRight, FolderOpen, Folder, Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'react-hot-toast';

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
            if (res.data.success) setQuestions(res.data.questions);
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
        easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        hard: 'bg-red-50 text-red-600 border-red-200',
    }[d] || 'bg-slate-100 text-slate-600 border-slate-200');

    return (
        <div className="space-y-6" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                            <Database className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Question Bank</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">
                        {questions.length} questions across {topicKeys.length} {topicKeys.length === 1 ? 'category' : 'categories'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/tutor/questions/import">
                        <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 gap-2 text-sm">
                            <FolderInput className="w-4 h-4" /> Import
                        </Button>
                    </Link>
                    <Link href="/tutor/questions/create">
                        <Button size="sm" className="gap-2 text-sm text-white shadow-sm"
                            style={{ backgroundColor: 'var(--theme-primary)' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <Plus className="w-4 h-4" /> Add Question
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search + Controls */}
            <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search questions by text, topic, or skill..."
                        className="pl-9 h-9 text-sm border-slate-200"
                        style={{ '--tw-ring-color': 'var(--theme-primary)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setExpandedTopics(new Set(topicKeys))}
                        className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium">
                        Expand All
                    </button>
                    <button onClick={() => setExpandedTopics(new Set())}
                        className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium">
                        Collapse All
                    </button>
                </div>
            </div>

            {/* States */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                    <p className="text-sm text-slate-400">Loading questions...</p>
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <Database className="h-7 w-7" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 mb-1">
                        {searchTerm ? 'No questions match your search' : 'No questions found'}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">
                        {searchTerm ? 'Try a different search term.' : 'Get started by creating your first question.'}
                    </p>
                    {!searchTerm && (
                        <Link href="/tutor/questions/create">
                            <Button size="sm" className="gap-2 text-white"
                                style={{ backgroundColor: 'var(--theme-primary)' }}>
                                <Plus className="w-4 h-4" /> Create Question
                            </Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {topicKeys.map((topicId) => {
                        const group = groupedQuestions[topicId];
                        const isExpanded = expandedTopics.has(topicId);
                        const mcqCount = group.questions.filter(q => q.type === 'mcq' || (q.options && q.options.length > 0)).length;
                        const subjectiveCount = group.questions.length - mcqCount;

                        return (
                            <div key={topicId} className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-shadow">
                                {/* Topic Header */}
                                <button onClick={() => toggleTopic(topicId)}
                                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {isExpanded
                                            ? <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
                                            : <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                                        <span className="font-semibold text-slate-800 text-sm">{group.name}</span>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                            {group.questions.length} {group.questions.length === 1 ? 'question' : 'questions'}
                                        </span>
                                        {mcqCount > 0 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">
                                                {mcqCount} MCQ
                                            </span>
                                        )}
                                        {subjectiveCount > 0 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-100">
                                                {subjectiveCount} Subjective
                                            </span>
                                        )}
                                    </div>
                                    {isExpanded
                                        ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                                </button>

                                {/* Questions List */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 divide-y divide-slate-50">
                                        {group.questions.map((q) => (
                                            <div key={q._id} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border bg-slate-50 text-slate-600 border-slate-200">
                                                                {q.type || (q.options?.length > 0 ? 'mcq' : 'subjective')}
                                                            </span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${difficultyStyle(q.difficulty)}`}>
                                                                {q.difficulty}
                                                            </span>
                                                            {q.skillId && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                                                                    {q.skillId.name}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-slate-400 font-medium">{q.points} pts</span>
                                                        </div>
                                                        <div className="text-sm font-medium text-slate-700 line-clamp-2"
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} />
                                                        {q.options && q.options.length > 0 && (
                                                            <p className="text-xs text-slate-400">{q.options.length} options</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <Link href={`/tutor/questions/${q._id}/edit`}>
                                                            <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--theme-primary)]/10 transition-colors">
                                                                <Edit className="w-3.5 h-3.5 text-slate-400" />
                                                            </button>
                                                        </Link>
                                                        <button onClick={() => handleDelete(q._id)}
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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