'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus, Edit, Eye, EyeOff, Trash2, FileQuestion, Sparkles, Loader2, FileText
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ExamDashboard() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/tutor/all');
                if (res.data.success) {
                    setExams(res.data.exams.filter(e => e.type !== 'practice'));
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
        const isConfirmed = await confirmDialog("Delete Exam", "Are you sure you want to delete this exam? This action cannot be undone.", { variant: 'destructive' });
        if (!isConfirmed) return;
        try {
            const res = await api.delete(`/exams/${id}`);
            if (res.data.success) {
                setExams(exams.filter(exam => exam._id !== id));
                toast.success('Exam deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting exam:', error);
            toast.error('Failed to delete exam');
        }
    };

    const toggleStatus = async (examId, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        try {
            await api.patch(`/exams/${examId}`, { status: newStatus });
            setExams(exams.map(e =>
                e._id === examId ? { ...e, status: newStatus, isPublished: newStatus === 'published' } : e
            ));
            toast.success(`Exam ${newStatus} successfully!`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                            <FileQuestion className="w-4 h-4 text-orange-500" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Exams & Quizzes</h1>
                    </div>
                    <p className="text-sm text-slate-400 pl-0.5">Create and manage assessments for your students.</p>
                </div>
                <Link href="/tutor/quizzes/create">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200 gap-2">
                        <Sparkles className="w-4 h-4" />
                        Create AI Exam
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
                    <p className="text-sm text-slate-400">Loading exams...</p>
                </div>
            ) : exams.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-14 text-center">
                    <div className="mx-auto w-16 h-16 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mb-5">
                        <FileQuestion className="h-8 w-8 text-orange-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-1">No Exams Created</h2>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto mb-7">
                        You haven't created any exams yet. Start by generating one with AI!
                    </p>
                    <Link href="/tutor/quizzes/create">
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                            <Plus className="w-4 h-4" /> Create New Exam
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-3">
                    {exams.map((exam) => (
                        <div
                            key={exam._id}
                            className="bg-white px-5 py-4 rounded-xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                            {/* Left: info */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FileText className="w-5 h-5 text-orange-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-semibold text-slate-800 text-sm">{exam.title}</h3>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                            ${exam.status === 'published'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                                            }`}>
                                            {exam.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                                        <span className="font-medium text-orange-500">{exam.courseTitle || 'Unknown Course'}</span>
                                        <span>·</span>
                                        <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                                        <span>·</span>
                                        <span>{exam.attemptCount} Attempts</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: actions */}
                            <div className="flex items-center gap-1.5 w-full md:w-auto flex-shrink-0">
                                <Link href={`/tutor/quizzes/${exam._id}/results`}>
                                    <Button variant="outline" size="sm" className="text-xs border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600">
                                        View Results
                                    </Button>
                                </Link>
                                <button
                                    onClick={() => toggleStatus(exam._id, exam.status)}
                                    title={exam.status === 'published' ? 'Unpublish' : 'Publish'}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
                                >
                                    {exam.status === 'published'
                                        ? <Eye className="w-4 h-4 text-emerald-500" />
                                        : <EyeOff className="w-4 h-4 text-slate-400" />
                                    }
                                </button>
                                <Link href={`/tutor/quizzes/${exam._id}/edit`}>
                                    <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100">
                                        <Edit className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(exam._id)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}