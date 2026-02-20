'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Database,
    Filter,
    Edit,
    Trash2,
    FileJson,
    Layers,
    FolderInput
} from 'lucide-react';
import api from '@/lib/axios';

export default function QuestionBankPage() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
        if (!confirm('Are you sure you want to delete this question?')) return;
        try {
            await api.delete(`/question-bank/questions/${id}`);
            setQuestions(questions.filter(q => q._id !== id));
        } catch (error) {
            console.error('Failed to delete question', error);
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Question Bank</h1>
                    <p className="text-gray-500 mt-1">Manage your centralized repository of questions.</p>
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

            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search questions..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4 text-slate-500" />
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-20">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Database className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No questions found</h3>
                    <p className="text-slate-500 mb-6">Get started by creating your first question.</p>
                    <Link href="/tutor/questions/create">
                        <Button>Create Question</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredQuestions.map((q) => (
                        <Card key={q._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="uppercase text-xs font-semibold">
                                                {q.type}
                                            </Badge>
                                            <Badge className={`uppercase text-xs font-semibold ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                    q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                                        'bg-red-100 text-red-700 hover:bg-red-100'
                                                }`}>
                                                {q.difficulty}
                                            </Badge>
                                            {q.topic && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {q.topic.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div
                                            className="prose prose-sm max-w-none text-slate-800 font-medium"
                                            dangerouslySetInnerHTML={{ __html: q.question }}
                                        />
                                        <div className="text-sm text-slate-500">
                                            {q.options?.length} Options • {q.points} Points
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(q._id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
