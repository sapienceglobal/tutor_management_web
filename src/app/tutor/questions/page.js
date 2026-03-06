'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Database,
    Edit,
    Trash2,
    FolderInput,
    ChevronDown,
    ChevronRight,
    FolderOpen,
    Folder,
    FileQuestion
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

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await api.get('/question-bank/questions');
            if (res.data.success) {
                setQuestions(res.data.questions);
            }
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
        } catch (error) {
            console.error('Failed to delete question', error);
            toast.error('Failed to delete question');
        }
    };

    // Filter questions based on search
    const filteredQuestions = questions.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topicId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.skillId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group questions by topic
    const groupedQuestions = filteredQuestions.reduce((acc, q) => {
        const topicName = q.topicId?.name || 'Uncategorized';
        const topicId = q.topicId?._id || 'uncategorized';
        if (!acc[topicId]) {
            acc[topicId] = { name: topicName, questions: [] };
        }
        acc[topicId].questions.push(q);
        return acc;
    }, {});

    const toggleTopic = (topicId) => {
        setExpandedTopics(prev => {
            const updated = new Set(prev);
            if (updated.has(topicId)) {
                updated.delete(topicId);
            } else {
                updated.add(topicId);
            }
            return updated;
        });
    };

    const expandAll = () => {
        setExpandedTopics(new Set(Object.keys(groupedQuestions)));
    };

    const collapseAll = () => {
        setExpandedTopics(new Set());
    };

    const topicKeys = Object.keys(groupedQuestions);
    const totalTopics = topicKeys.length;

    const difficultyColor = (d) => {
        switch (d) {
            case 'easy': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
            case 'medium': return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
            case 'hard': return 'bg-red-100 text-red-700 hover:bg-red-100';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Question Bank</h1>
                    <p className="text-gray-500 mt-1">
                        {questions.length} questions across {totalTopics} {totalTopics === 1 ? 'category' : 'categories'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/tutor/questions/import">
                        <Button variant="outline">
                            <FolderInput className="w-4 h-4 mr-2" />
                            Import
                        </Button>
                    </Link>
                    <Link href="/tutor/questions/create">
                        <Button className="bg-[#3b0d46] hover:bg-[#2a0933]">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Question
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search & Controls */}
            <div className="flex gap-3 items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search questions by text, topic, or skill..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={expandAll} className="text-xs text-slate-500">
                        Expand All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll} className="text-xs text-slate-500">
                        Collapse All
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Database className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">
                        {searchTerm ? 'No questions match your search' : 'No questions found'}
                    </h3>
                    <p className="text-slate-500 mb-6">
                        {searchTerm ? 'Try a different search term.' : 'Get started by creating your first question.'}
                    </p>
                    {!searchTerm && (
                        <Link href="/tutor/questions/create">
                            <Button>Create Question</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {topicKeys.map((topicId) => {
                        const group = groupedQuestions[topicId];
                        const isExpanded = expandedTopics.has(topicId);
                        const mcqCount = group.questions.filter(q => q.type === 'mcq' || (q.options && q.options.length > 0)).length;
                        const subjectiveCount = group.questions.length - mcqCount;

                        return (
                            <div key={topicId} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                {/* Topic Header — Clickable Accordion */}
                                <button
                                    onClick={() => toggleTopic(topicId)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded
                                            ? <FolderOpen className="w-5 h-5 text-purple-600" />
                                            : <Folder className="w-5 h-5 text-slate-400" />
                                        }
                                        <span className="font-semibold text-lg text-slate-900">{group.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {group.questions.length} {group.questions.length === 1 ? 'question' : 'questions'}
                                        </Badge>
                                        {mcqCount > 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{mcqCount} MCQ</span>
                                        )}
                                        {subjectiveCount > 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">{subjectiveCount} Subjective</span>
                                        )}
                                    </div>
                                    {isExpanded
                                        ? <ChevronDown className="w-5 h-5 text-slate-400" />
                                        : <ChevronRight className="w-5 h-5 text-slate-400" />
                                    }
                                </button>

                                {/* Questions inside this topic */}
                                {isExpanded && (
                                    <div className="border-t divide-y">
                                        {group.questions.map((q) => (
                                            <div key={q._id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline" className="uppercase text-xs font-semibold">
                                                                {q.type || (q.options?.length > 0 ? 'mcq' : 'subjective')}
                                                            </Badge>
                                                            <Badge className={`uppercase text-xs font-semibold ${difficultyColor(q.difficulty)}`}>
                                                                {q.difficulty}
                                                            </Badge>
                                                            {q.skillId && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {q.skillId.name}
                                                                </Badge>
                                                            )}
                                                            <span className="text-xs text-slate-400">{q.points} pts</span>
                                                        </div>
                                                        <div
                                                            className="text-slate-800 font-medium text-sm line-clamp-2"
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }}
                                                        />
                                                        {q.options && q.options.length > 0 && (
                                                            <p className="text-xs text-slate-400">{q.options.length} options</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Link href={`/tutor/questions/${q._id}/edit`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Edit className="w-4 h-4 text-slate-500" />
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(q._id)}>
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
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
