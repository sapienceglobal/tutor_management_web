'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    BookOpen,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Sparkles,
    Calendar,
    Filter,
    Edit2,
    PlayCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function PracticeSetsPage() {
    const [practiceSets, setPracticeSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/tutor/all');
                if (res.data.success) {
                    // Filter for Practice Sets
                    setPracticeSets(res.data.exams.filter(e => e.type === 'practice'));
                }
            } catch (error) {
                console.error('Error fetching exams:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const handleDelete = async (id) => {
        const isConfirmed = await confirmDialog("Delete Practice Set", "Are you sure you want to delete this practice set?", { variant: 'destructive' });
        if (!isConfirmed) {
            return;
        }

        try {
            const res = await api.delete(`/exams/${id}`);
            if (res.data.success) {
                setPracticeSets(practiceSets.filter(set => set._id !== id));
                toast.success('Practice set deleted');
            }
        } catch (error) {
            console.error('Error deleting practice set:', error);
            toast.error('Failed to delete');
        }
    };

    const toggleStatus = async (examId, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        try {
            await api.patch(`/exams/${examId}`, { status: newStatus });
            setExams(exams.map(e =>
                e._id === examId ? { ...e, status: newStatus } : e
            ));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Practice Sets</h1>
                    <p className="text-gray-500 mt-1">Manage practice materials for self-paced learning.</p>
                </div>
                <Link href="/tutor/practice-sets/create">
                    <Button className="shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Create Practice Set
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-20">Loading practice sets...</div>
            ) : exams.length === 0 ? (
                <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                    <div className="mx-auto h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                        <BookOpen className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">No Practice Sets Created</h2>
                    <p className="text-gray-500 max-w-md mx-auto mt-2 mb-8">
                        Create practice questions for your students to review their knowledge.
                    </p>
                    <Link href="/tutor/practice-sets/create">
                        <Button className="bg-emerald-600 hover:bg-emerald-700">Create New Set</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {exams.map((exam) => (
                        <div key={exam._id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-gray-900">{exam.title}</h3>
                                    <Badge variant={exam.status === 'published' ? 'default' : 'secondary'} className={exam.status === 'published' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                                        {exam.status}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <span className="font-medium text-emerald-600">{exam.courseTitle || 'Unknown Course'}</span>
                                    <span>•</span>
                                    <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{exam.attemptCount} Attempts</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleStatus(exam._id, exam.status)}
                                    title={exam.status === 'published' ? 'Unpublish' : 'Publish'}
                                >
                                    {exam.status === 'published' ? (
                                        <Eye className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                    )}
                                </Button>
                                <Link href={`/tutor/quizzes/${exam._id}/edit`}>
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
