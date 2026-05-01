'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    MdHelpOutline,
    MdAutoAwesome,
    MdHourglassEmpty,
    MdArticle,
    MdVisibility,
    MdVisibilityOff,
    MdEdit,
    MdDelete,
    MdAdd,
    MdQuiz,
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R } from '@/constants/studentTokens';

export default function ExamDashboard() {
    const [exams, setExams]     = useState([]);
    const [loading, setLoading] = useState(true);
    const { confirmDialog }     = useConfirm();

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
            'Delete Exam',
            'Are you sure you want to delete this exam? This action cannot be undone.',
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
        <div
            className="space-y-5 w-full min-h-screen pb-8"
            style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg, color: C.text }}
        >
            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5"
                style={{
                    backgroundColor: C.cardBg,
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                    borderRadius:    R['2xl'],
                }}
            >
                <div className="flex items-center gap-3">
                    {/* Icon Pill */}
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdQuiz style={{ width: 20, height: 20, color: C.iconColor }} />
                    </div>
                    <div>
                        <h1
                            style={{
                                fontFamily:  T.fontFamily,
                                color:       C.heading,
                                fontSize:    T.size['2xl'],
                                fontWeight:  T.weight.bold,
                                margin:      '0 0 2px 0',
                                lineHeight:  T.leading.tight,
                            }}
                        >
                            Exams & Quizzes
                        </h1>
                        <p
                            style={{
                                fontFamily:  T.fontFamily,
                                color:       C.text,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.medium,
                                margin:      0,
                            }}
                        >
                            Create and manage assessments for your students.
                        </p>
                    </div>
                </div>

                {/* Create AI Exam CTA */}
                <Link href="/tutor/quizzes/create" className="shrink-0">
                    <button
                        className="flex items-center justify-center gap-2 px-5 py-2.5 transition-opacity hover:opacity-90"
                        style={{
                            background:   C.gradientBtn,
                            color:        '#ffffff',
                            borderRadius: '10px',
                            boxShadow:    S.btn,
                            fontFamily:   T.fontFamily,
                            fontSize:     T.size.base,
                            fontWeight:   T.weight.bold,
                            border:       'none',
                            cursor:       'pointer',
                        }}
                    >
                        <MdAutoAwesome style={{ width: 16, height: 16, color: '#ffffff' }} />
                        Create AI Exam
                    </button>
                </Link>
            </div>

            {/* ── Loading ─────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="relative w-12 h-12">
                        <div
                            className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{
                                borderColor:    `${C.btnPrimary}30`,
                                borderTopColor: C.btnPrimary,
                            }}
                        />
                    </div>
                    <p
                        style={{
                            fontFamily:  T.fontFamily,
                            color:       C.text,
                            fontSize:    T.size.base,
                            fontWeight:  T.weight.medium,
                        }}
                    >
                        Loading exams...
                    </p>
                </div>

            /* ── Empty State ──────────────────────────────────────────────── */
            ) : exams.length === 0 ? (
                <div
                    className="p-14 flex flex-col items-center justify-center text-center border border-dashed"
                    style={{
                        backgroundColor: C.cardBg,
                        borderColor:     C.cardBorder,
                        borderRadius:    R['2xl'],
                        boxShadow:       S.card,
                    }}
                >
                    <div
                        className="flex items-center justify-center mb-5"
                        style={{
                            width:           56,
                            height:          56,
                            backgroundColor: C.innerBg,
                            borderRadius:    R.lg,
                        }}
                    >
                        <MdHelpOutline
                            style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.6 }}
                        />
                    </div>
                    <h2
                        style={{
                            fontFamily:   T.fontFamily,
                            color:        C.heading,
                            fontSize:     T.size.lg,
                            fontWeight:   T.weight.bold,
                            marginBottom: 6,
                        }}
                    >
                        No Exams Created
                    </h2>
                    <p
                        className="max-w-sm mx-auto mb-6"
                        style={{
                            fontFamily:  T.fontFamily,
                            color:       C.text,
                            fontSize:    T.size.base,
                            lineHeight:  T.leading.relaxed,
                        }}
                    >
                        You haven't created any exams yet. Start by generating one with AI!
                    </p>
                    <Link href="/tutor/quizzes/create">
                        <button
                            className="flex items-center justify-center gap-2 px-5 py-2.5 transition-opacity hover:opacity-90"
                            style={{
                                background:   C.gradientBtn,
                                color:        '#ffffff',
                                borderRadius: '10px',
                                boxShadow:    S.btn,
                                fontFamily:   T.fontFamily,
                                fontSize:     T.size.base,
                                fontWeight:   T.weight.bold,
                                border:       'none',
                                cursor:       'pointer',
                            }}
                        >
                            <MdAdd style={{ width: 18, height: 18, color: '#ffffff' }} />
                            Create New Exam
                        </button>
                    </Link>
                </div>

            /* ── Exam List ────────────────────────────────────────────────── */
            ) : (
                <div className="grid gap-3">
                    {exams.map(exam => (
                        <div
                            key={exam?._id}
                            className="px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                                backgroundColor: C.cardBg,
                                border:          `1px solid ${C.cardBorder}`,
                                borderRadius:    '10px',
                                boxShadow:       S.card,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; }}
                        >
                            {/* ── Left: Info ──────────────────────────────── */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                {/* Icon */}
                                <div
                                    className="flex items-center justify-center shrink-0 mt-0.5"
                                    style={{
                                        width:           40,
                                        height:          40,
                                        backgroundColor: C.innerBg,
                                        borderRadius:    '10px',
                                    }}
                                >
                                    <MdArticle style={{ width: 20, height: 20, color: C.btnPrimary }} />
                                </div>

                                {/* Title + Meta */}
                                <div className="min-w-0 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3
                                            className="truncate"
                                            style={{
                                                fontFamily:  T.fontFamily,
                                                color:       C.heading,
                                                fontSize:    T.size.md,
                                                fontWeight:  T.weight.semibold,
                                            }}
                                        >
                                            {exam?.title ?? 'Untitled Exam'}
                                        </h3>

                                        {/* Status Badge */}
                                        <span
                                            className="inline-flex items-center px-2.5 py-0.5 uppercase"
                                            style={{
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.bold,
                                                letterSpacing:   T.tracking.wider,
                                                borderRadius:    '10px',
                                                backgroundColor: exam?.status === 'published' ? C.successBg    : C.innerBg,
                                                color:           exam?.status === 'published' ? C.success       : C.text,
                                                border:          `1px solid ${exam?.status === 'published' ? C.successBorder : C.cardBorder}`,
                                            }}
                                        >
                                            {exam?.status ?? 'draft'}
                                        </span>
                                    </div>

                                    {/* Meta row */}
                                    <div
                                        className="flex items-center gap-2 flex-wrap"
                                        style={{
                                            fontFamily:  T.fontFamily,
                                            color:       C.text,
                                            fontSize:    T.size.xs,
                                            fontWeight:  T.weight.medium,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color:      C.btnPrimary,
                                                fontWeight: T.weight.semibold,
                                            }}
                                        >
                                            {exam?.courseTitle ?? 'Unknown Course'}
                                        </span>
                                        <span style={{ color: C.cardBorder }}>·</span>
                                        <span>
                                            {exam?.createdAt
                                                ? new Date(exam.createdAt).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </span>
                                        <span style={{ color: C.cardBorder }}>·</span>
                                        <span>{exam?.attemptCount ?? 0} Attempts</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Right: Actions ──────────────────────────── */}
                            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                                {/* View Results */}
                                <Link href={`/tutor/quizzes/${exam?._id}/results`}>
                                    <button
                                        className="px-3 py-1.5 flex items-center justify-center transition-opacity hover:opacity-75"
                                        style={{
                                            backgroundColor: C.btnViewAllBg,
                                            border:          `1px solid ${C.cardBorder}`,
                                            color:           C.btnViewAllText,
                                            borderRadius:    '10px',
                                            fontFamily:      T.fontFamily,
                                            fontSize:        T.size.xs,
                                            fontWeight:      T.weight.bold,
                                            cursor:          'pointer',
                                        }}
                                    >
                                        View Results
                                    </button>
                                </Link>

                                {/* Icon Action Buttons */}
                                <div className="flex items-center gap-0.5 ml-1">
                                    {/* Toggle Publish */}
                                    <button
                                        onClick={() => toggleStatus(exam?._id, exam?.status)}
                                        title={exam?.status === 'published' ? 'Unpublish' : 'Publish'}
                                        className="flex items-center justify-center transition-colors cursor-pointer border-none"
                                        style={{
                                            width:           32,
                                            height:          32,
                                            backgroundColor: 'transparent',
                                            borderRadius:    '10px',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        {exam?.status === 'published'
                                            ? <MdVisibility    style={{ width: 18, height: 18, color: C.success }} />
                                            : <MdVisibilityOff style={{ width: 18, height: 18, color: C.text }} />
                                        }
                                    </button>

                                    {/* Edit */}
                                    <Link href={`/tutor/quizzes/${exam?._id}/edit`}>
                                        <button
                                            className="flex items-center justify-center transition-colors cursor-pointer border-none"
                                            style={{
                                                width:           32,
                                                height:          32,
                                                backgroundColor: 'transparent',
                                                borderRadius:    '10px',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <MdEdit style={{ width: 16, height: 16, color: C.text }} />
                                        </button>
                                    </Link>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(exam?._id)}
                                        className="flex items-center justify-center transition-colors cursor-pointer border-none"
                                        style={{
                                            width:           32,
                                            height:          32,
                                            backgroundColor: 'transparent',
                                            borderRadius:    '10px',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.dangerBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <MdDelete style={{ width: 16, height: 16, color: C.danger }} />
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