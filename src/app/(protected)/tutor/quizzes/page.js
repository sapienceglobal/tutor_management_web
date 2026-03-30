'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Plus, Edit, Eye, EyeOff, Trash2, FileQuestion, Sparkles, Loader2, FileText
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R } from '@/constants/tutorTokens';

export default function ExamDashboard() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/tutor/all');
                if (res?.data?.success) {
                    setExams(res.data.exams.filter(e => e?.type !== 'practice'));
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
        const isConfirmed = await confirmDialog(
            "Delete Exam", 
            "Are you sure you want to delete this exam? This action cannot be undone.", 
            { variant: 'destructive' }
        );
        if (!isConfirmed) return;
        
        try {
            const res = await api.delete(`/exams/${id}`);
            if (res?.data?.success) {
                setExams(exams.filter(exam => exam?._id !== id));
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
                e?._id === examId ? { ...e, status: newStatus, isPublished: newStatus === 'published' } : e
            ));
            toast.success(`Exam ${newStatus} successfully!`);
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6 w-full" style={{ fontFamily: T.fontFamily }}>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <div 
                            className="w-8 h-8 flex items-center justify-center shrink-0"
                            style={{ 
                                backgroundColor: C.iconBg, 
                                borderRadius: R.md 
                            }}
                        >
                            <FileQuestion size={18} color={C.iconColor} />
                        </div>
                        <h1 style={{ 
                            color: C.heading, 
                            fontSize: T.size['2xl'], 
                            fontWeight: T.weight.black 
                        }}>
                            Exams & Quizzes
                        </h1>
                    </div>
                    <p style={{ 
                        color: C.textMuted, 
                        fontSize: T.size.sm, 
                        fontWeight: T.weight.medium,
                        paddingLeft: '2px' 
                    }}>
                        Create and manage assessments for your students.
                    </p>
                </div>
                <Link href="/tutor/quizzes/create" className="shrink-0">
                    <button 
                        className="flex items-center justify-center gap-2 px-4 py-2.5 transition-opacity hover:opacity-90"
                        style={{
                            background: C.gradientBtn,
                            color: '#ffffff',
                            borderRadius: R.xl,
                            boxShadow: S.btn,
                            fontSize: T.size.sm,
                            fontWeight: T.weight.bold,
                            fontFamily: T.fontFamily,
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <Sparkles size={16} color="#ffffff" />
                        Create AI Exam
                    </button>
                </Link>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                    <p style={{ color: C.textMuted, fontSize: T.size.sm, fontFamily: T.fontFamily }}>
                        Loading exams...
                    </p>
                </div>
            ) : exams.length === 0 ? (
                <div 
                    className="p-14 flex flex-col items-center justify-center text-center"
                    style={{
                        backgroundColor: C.cardBg, // Outer Card
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: R['2xl'],
                        boxShadow: S.card
                    }}
                >
                    <div 
                        className="w-16 h-16 flex items-center justify-center mb-5"
                        style={{
                            backgroundColor: '#E3DFF8', // Inner Box
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: R['2xl']
                        }}
                    >
                        <FileQuestion size={32} color={C.btnPrimary} />
                    </div>
                    <h2 style={{ 
                        color: C.heading, 
                        fontSize: T.size.lg, 
                        fontWeight: T.weight.bold,
                        marginBottom: '4px' 
                    }}>
                        No Exams Created
                    </h2>
                    <p 
                        className="max-w-sm mx-auto mb-7"
                        style={{ 
                            color: C.textMuted, 
                            fontSize: T.size.sm,
                            lineHeight: T.leading.relaxed 
                        }}
                    >
                        You haven't created any exams yet. Start by generating one with AI!
                    </p>
                    <Link href="/tutor/quizzes/create">
                        <button 
                            className="flex items-center justify-center gap-2 px-5 py-2.5 transition-opacity hover:opacity-90"
                            style={{
                                background: C.gradientBtn,
                                color: '#ffffff',
                                borderRadius: R.xl,
                                boxShadow: S.btn,
                                fontSize: T.size.sm,
                                fontWeight: T.weight.bold,
                                fontFamily: T.fontFamily,
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={16} color="#ffffff" /> 
                            Create New Exam
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-3">
                    {exams.map((exam) => (
                        <div
                            key={exam?._id}
                            className="px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-transform hover:-translate-y-0.5"
                            style={{
                                backgroundColor: C.cardBg, // Outer Card Wrapper
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: R.xl,
                                boxShadow: S.card
                            }}
                        >
                            {/* Left: info */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div 
                                    className="w-10 h-10 flex items-center justify-center shrink-0 mt-0.5"
                                    style={{
                                        backgroundColor: '#E3DFF8', // Inner Box/Icon Wrapper
                                        borderRadius: R.xl
                                    }}
                                >
                                    <FileText size={20} color={C.btnPrimary} />
                                </div>
                                <div className="min-w-0 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 
                                            className="truncate"
                                            style={{ 
                                                color: C.heading, 
                                                fontSize: T.size.md, 
                                                fontWeight: T.weight.bold 
                                            }}
                                        >
                                            {exam?.title ?? 'Untitled Exam'}
                                        </h3>
                                        <span 
                                            className="inline-flex items-center px-2.5 py-0.5 uppercase tracking-wide"
                                            style={{
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.bold,
                                                borderRadius: R.full,
                                                backgroundColor: exam?.status === 'published' ? C.successBg : '#D3D3F1',
                                                color: exam?.status === 'published' ? C.success : C.btnViewAllText,
                                                border: `1px solid ${exam?.status === 'published' ? C.successBorder : C.cardBorder}`
                                            }}
                                        >
                                            {exam?.status ?? 'draft'}
                                        </span>
                                    </div>
                                    <div 
                                        className="flex items-center gap-2 flex-wrap"
                                        style={{ 
                                            color: C.textMuted, 
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.medium 
                                        }}
                                    >
                                        <span style={{ color: C.btnPrimary, fontWeight: T.weight.semibold }}>
                                            {exam?.courseTitle ?? 'Unknown Course'}
                                        </span>
                                        <span>·</span>
                                        <span>{exam?.createdAt ? new Date(exam.createdAt).toLocaleDateString() : 'N/A'}</span>
                                        <span>·</span>
                                        <span>{exam?.attemptCount ?? 0} Attempts</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: actions */}
                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                                <Link href={`/tutor/quizzes/${exam?._id}/results`}>
                                    <button 
                                        className="px-3 py-1.5 flex items-center justify-center transition-opacity hover:opacity-70"
                                        style={{
                                            backgroundColor: '#E3DFF8', // Inner box style for nested button
                                            border: `1px solid ${C.cardBorder}`,
                                            color: C.btnViewAllText,
                                            borderRadius: R.lg,
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.bold,
                                            fontFamily: T.fontFamily,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        View Results
                                    </button>
                                </Link>
                                
                                <div className="flex items-center gap-1 ml-2">
                                    <button
                                        onClick={() => toggleStatus(exam?._id, exam?.status)}
                                        title={exam?.status === 'published' ? 'Unpublish' : 'Publish'}
                                        className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: R.md
                                        }}
                                    >
                                        {exam?.status === 'published'
                                            ? <Eye size={18} color={C.success} />
                                            : <EyeOff size={18} color={C.textMuted} />
                                        }
                                    </button>
                                    <Link href={`/tutor/quizzes/${exam?._id}/edit`}>
                                        <button 
                                            className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                borderRadius: R.md
                                            }}
                                        >
                                            <Edit size={16} color={C.textMuted} />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(exam?._id)}
                                        className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            borderRadius: R.md
                                        }}
                                    >
                                        <Trash2 size={16} color={C.danger} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}