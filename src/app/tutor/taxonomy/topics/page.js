'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { format } from 'date-fns';

export default function TopicsPage() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const res = await api.get('/taxonomy/topics');
            if (res.data.success) {
                setTopics(res.data.topics);
            }
        } catch (error) {
            console.error('Failed to fetch topics:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTopics = topics.filter(topic =>
        topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Topics</h1>
                    <p className="text-sm text-slate-500">Manage subject topics for questions and recommendations.</p>
                </div>
                <Link href="/tutor/taxonomy/topics/create">
                    <Button className="bg-[#3b0d46] hover:bg-[#2a0933]">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Topic
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="border-b pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">All Topics</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search topics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 flex justify-center text-slate-500">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : filteredTopics.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p>No topics found.</p>
                            <p className="text-sm mt-1">Create topics to categorize your questions.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Linked Course</th>
                                        <th className="px-6 py-4">Created Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTopics.map((topic) => (
                                        <tr key={topic._id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {topic.name}
                                                {topic.description && (
                                                    <p className="text-xs text-slate-500 mt-1 font-normal line-clamp-1">{topic.description}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {topic.courseId ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                        {topic.courseId.title}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">None</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {format(new Date(topic.createdAt), 'MMM d, yyyy')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
