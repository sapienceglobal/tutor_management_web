'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    FileQuestion,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Sparkles,
    Calendar,
    Filter
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ExamDashboard() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/tutor/all');
                if (res.data.success) {
                    setExams(res.data.exams);
                }
            } catch (error) {
                console.error('Error fetching exams:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const handleDelete = async (examId) => {
        if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await api.delete(`/exams/${examId}`);
            if (res.data.success) {
                setExams(exams.filter(e => e._id !== examId));
            }
        } catch (error) {
            console.error('Error deleting exam:', error);
            alert('Failed to delete exam');
        }
    };

    const toggleStatus = async (examId, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        try {
            await api.patch(`/exams/${examId}`, { status: newStatus });
            setExams(exams.map(e => 
                e._id === examId ? { ...e, status: newStatus, isPublished: newStatus === 'published' } : e
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Exams & Quizzes</h1>
                    <p className="text-gray-500 mt-1">Create and manage assessments for your students.</p>
                </div>
                <Link href="/tutor/exams/create">
                    <Button className="shadow-lg shadow-purple-500/20 bg-purple-600 hover:bg-purple-700">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create AI Exam
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-20">Loading exams...</div>
            ) : exams.length === 0 ? (
                <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                    <div className="mx-auto h-20 w-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                        <FileQuestion className="h-10 w-10 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">No Exams Created</h2>
                    <p className="text-gray-500 max-w-md mx-auto mt-2 mb-8">
                        You haven't created any exams yet. Start by generating one with AI!
                    </p>
                    <Link href="/tutor/exams/create">
                        <Button>Create New Exam</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {exams.map((exam) => (
                        <div key={exam._id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-gray-900">{exam.title}</h3>
                                    <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                                        {exam.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <span className="font-medium text-purple-600">{exam.courseTitle || 'Unknown Course'}</span>
                                    <span>•</span>
                                    <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{exam.attemptCount} Attempts</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Link href={`/tutor/exams/${exam._id}/results`}>
                                    <Button variant="outline" size="sm">
                                        View Results
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleStatus(exam._id, exam.status)}
                                    title={exam.status === 'published' ? 'Unpublish' : 'Publish'}
                                >
                                    {exam.status === 'published' ? (
                                        <Eye className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                    )}
                                </Button>
                                <Link href={`/tutor/exams/${exam._id}/edit`}>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(exam._id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
