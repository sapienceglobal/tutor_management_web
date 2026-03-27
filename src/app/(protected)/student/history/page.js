'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    FileText, Calendar, Timer, CheckCircle, ChevronLeft, ChevronRight,
    Download, BarChart3, Eye, Clock, ArrowRight
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

const ITEMS_PER_PAGE = 10;

const getGrade = (pct) => {
    if (pct >= 90) return { label: 'A+', color: C.success };
    if (pct >= 80) return { label: 'A',  color: C.success };
    if (pct >= 70) return { label: 'B+', color: '#3b82f6' };
    if (pct >= 60) return { label: 'B',  color: '#3b82f6' };
    if (pct >= 50) return { label: 'C',  color: C.warning };
    return { label: 'D', color: C.danger };
};

export default function StudentTestsPage() {
    const [attempts, setAttempts]   = useState([]);
    const [allExams, setAllExams]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [activeTab, setActiveTab] = useState('completed');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, examsRes] = await Promise.all([
                    api.get('/exams/student/history-all'),
                    api.get('/exams/student/all'),
                ]);
                if (historyRes.data.success) setAttempts(historyRes.data.attempts || []);
                if (examsRes.data.success)   setAllExams(examsRes.data.exams || []);
            } catch (err) {
                console.error('Error fetching tests data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const upcomingExams      = useMemo(() => allExams.filter(e => !e.isCompleted), [allExams]);
    const completedAttempts  = useMemo(() => attempts, [attempts]);
    const gradedAttempts     = useMemo(() => attempts.filter(a => a.score !== undefined && a.score !== null), [attempts]);

    const activeData    = activeTab === 'upcoming' ? upcomingExams : activeTab === 'graded' ? gradedAttempts : completedAttempts;
    const totalPages    = Math.ceil(activeData.length / ITEMS_PER_PAGE);
    const paginatedData = activeData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-11 h-11">
                    <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                    Loading tests…
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* ── Top Bar ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        My Tests
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55, marginTop: 2 }}>
                        {activeTab === 'upcoming' ? 'Upcoming Tests' : activeTab === 'graded' ? 'Graded Tests' : 'Completed Tests'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => toast('Certificate download coming soon!', { icon: '🎓' })}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-white text-xs rounded-xl transition-all hover:opacity-90"
                        style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                        <Download className="w-3.5 h-3.5" /> Download Certificate
                    </button>
                    <Link href="/student/ai-analytics"
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-xl border transition-all hover:opacity-80"
                        style={{ ...cx.btnSecondary(), fontFamily: T.fontFamily }}>
                        <BarChart3 className="w-3.5 h-3.5" /> View Analytics
                    </Link>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5">
                {[
                    { key: 'upcoming',  label: 'Upcoming' },
                    { key: 'completed', label: `Completed (${completedAttempts.length})` },
                    { key: 'graded',    label: 'Graded' },
                ].map(tab => (
                    <button key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                        className="px-4 py-2 rounded-xl text-xs transition-all"
                        style={activeTab === tab.key
                            ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                            : { ...cx.btnSecondary(), fontFamily: T.fontFamily }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Table Card ────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                {/* Table header */}
                <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                        {activeTab === 'upcoming' ? 'Upcoming Tests' : activeTab === 'graded' ? 'Graded Tests' : 'Completed Tests'}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ backgroundColor: C.innerBg }}>
                                {['#', 'Test Title', activeTab === 'upcoming' ? 'Duration' : 'Course', 'Date',
                                    ...(activeTab !== 'upcoming' ? ['Score', 'Status'] : []), 'Action'
                                ].map(col => (
                                    <th key={col} className="px-5 py-3 text-left"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? paginatedData.map((item, idx) => {
                                const isUpcoming = activeTab === 'upcoming';
                                const score      = item.score || 0;
                                const totalMarks = item.totalMarks || 100;
                                const pct        = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
                                const grade      = getGrade(pct);
                                const passed     = item.passed || item.isPassed;

                                return (
                                    <tr key={item._id || idx}
                                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>

                                        {/* # */}
                                        <td className="px-5 py-3.5"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, fontWeight: T.weight.medium }}>
                                            {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                        </td>

                                        {/* Title */}
                                        <td className="px-5 py-3.5"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.heading, fontWeight: T.weight.semibold }}>
                                            {item.examTitle || item.title || 'Test'}
                                        </td>

                                        {/* Duration / Course */}
                                        <td className="px-5 py-3.5">
                                            {isUpcoming ? (
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text }}>
                                                    {item.duration} mins
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
                                                    style={{ backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                                    {item.courseTitle || 'General'}
                                                </span>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td className="px-5 py-3.5"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                            {new Date(item.date || item.submittedAt || item.startDate || item.createdAt)
                                                .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>

                                        {/* Score */}
                                        {!isUpcoming && (
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {score} / {totalMarks}
                                                    </span>
                                                    <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.innerBg }}>
                                                        <div className="h-full rounded-full"
                                                            style={{ width: `${pct}%`, backgroundColor: pct >= 60 ? C.success : C.danger }} />
                                                    </div>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: grade.color }}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        {/* Status */}
                                        {!isUpcoming && (
                                            <td className="px-5 py-3.5">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                                                    style={passed
                                                        ? { backgroundColor: C.successBg, color: C.success, fontFamily: T.fontFamily }
                                                        : { backgroundColor: C.dangerBg, color: C.danger, fontFamily: T.fontFamily }}>
                                                    {passed ? '✓ Passed' : 'Failed'}
                                                </span>
                                            </td>
                                        )}

                                        {/* Action */}
                                        <td className="px-5 py-3.5">
                                            {isUpcoming ? (
                                                <Link href={`/student/exams/${item._id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs rounded-xl font-bold transition-all hover:opacity-90"
                                                    style={{ backgroundColor: C.success, fontFamily: T.fontFamily }}>
                                                    Attempt
                                                </Link>
                                            ) : (
                                                <Link href={`/student/exams/attempt/${item._id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-bold transition-all hover:opacity-80"
                                                    style={{ backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                                    <Eye className="w-3 h-3" /> View Report
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={activeTab === 'upcoming' ? 5 : 7} className="px-5 py-14 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                                style={{ backgroundColor: C.innerBg }}>
                                                <FileText className="w-5 h-5" style={{ color: C.btnPrimary, opacity: 0.4 }} />
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.4 }}>
                                                No {activeTab} tests found.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Footer / Pagination ───────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-3"
                    style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                    <div className="flex items-center gap-1.5"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        <CheckCircle className="w-3.5 h-3.5" style={{ color: C.success }} />
                        Showing {paginatedData.length} of {activeData.length} · Total {activeData.length}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                                style={cx.btnSecondary()}>
                                <ChevronLeft className="w-3.5 h-3.5" /> Prev
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className="w-8 h-8 rounded-xl text-xs font-bold transition-all"
                                    style={currentPage === i + 1 ? cx.pageActive() : cx.pageInactive()}>
                                    {i + 1}
                                </button>
                            ))}

                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                                style={cx.btnSecondary()}>
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
