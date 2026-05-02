'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    MdArticle, MdCalendarToday, MdTimer, MdCheckCircle, MdChevronLeft, MdChevronRight,
    MdDownload, MdInsertChartOutlined, MdVisibility, MdAccessTime, MdArrowForward, MdCancel
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';

const ITEMS_PER_PAGE = 10;

// ─── Theme Colors ─────────────────────────────────────────────────────────────

const getGrade = (pct) => {
    if (pct >= 90) return { label: 'A+', color: C.success, bg: C.successBg };
    if (pct >= 80) return { label: 'A',  color: C.success, bg: C.successBg };
    if (pct >= 70) return { label: 'B+', color: '#3b82f6', bg: '#eff6ff' };
    if (pct >= 60) return { label: 'B',  color: '#3b82f6', bg: '#eff6ff' };
    if (pct >= 50) return { label: 'C',  color: C.warning, bg: C.warningBg };
    return { label: 'D', color: C.danger, bg: C.dangerBg };
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
                if (historyRes.data?.success) setAttempts(historyRes.data.attempts || []);
                if (examsRes.data?.success)   setAllExams(examsRes.data.exams || []);
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
    const totalPages    = Math.ceil(activeData.length / ITEMS_PER_PAGE) || 1;
    const paginatedData = activeData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3" style={{ backgroundColor: C.pageBgAlt, fontFamily: T.fontFamily }}>
            <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
            <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>Loading your tests...</p>
        </div>
    );

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Top Bar ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card, borderRadius: R['2xl'] }}>
                <div>
                    <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                        Test History
                    </h1>
                    <p style={{ fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                        Review your past attempts and upcoming schedules.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => toast('Certificate download coming soon!')} className="flex items-center justify-center gap-2 h-10 px-4 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm w-full sm:w-auto"
                        style={{ backgroundColor: C.surfaceWhite, color: C.heading, borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                        <MdDownload size={14} /> Certificate
                    </button>
                    <Link href="/student/ai-analytics" className="text-decoration-none">
                        <button className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <MdInsertChartOutlined size={16} /> Analytics
                        </button>
                    </Link>
                </div>
            </div>

            {/* ── Main Area ────────────────────────────────────────────── */}
            <div className="overflow-hidden flex flex-col" style={{ backgroundColor: C.outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                {/* Tabs Header */}
                <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: C.innerBox, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex bg-white p-1 border shadow-sm" style={{ borderColor: C.cardBorder, borderRadius: '10px' }}>
                        {[
                            { key: 'upcoming',  label: 'Upcoming' },
                            { key: 'completed', label: `Completed (${completedAttempts.length})` },
                            { key: 'graded',    label: 'Graded' },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                                className="px-4 py-2 text-xs capitalize transition-all cursor-pointer border-none"
                                style={activeTab === tab.key 
                                    ? { backgroundColor: C.btnPrimary, color: '#fff', fontWeight: T.weight.bold, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderRadius: '8px' } 
                                    : { backgroundColor: 'transparent', color: C.textMuted, fontWeight: T.weight.semibold, borderRadius: '8px' }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
                    {activeData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <MdArticle size={48} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No tests found</p>
                            <p style={{ fontSize: T.size.base, color: C.textMuted, margin: 0, fontWeight: T.weight.semibold }}>You don't have any {activeTab} tests at the moment.</p>
                        </div>
                    ) : (
                        <div className="min-w-[900px]">
                            {/* Table Head */}
                            <div className="grid grid-cols-[40px_2.5fr_1.5fr_1fr_1fr_1fr_120px] gap-4 px-6 py-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                                {['#', 'Test Title', activeTab === 'upcoming' ? 'Duration' : 'Course', 'Date', ...(activeTab !== 'upcoming' ? ['Score', 'Status'] : []), 'Action'].map((h, i) => (
                                    <span key={h} className={i === 6 ? 'text-right' : ''} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                                ))}
                            </div>

                            {/* Table Rows */}
                            <div className="flex flex-col p-3 gap-2" style={{ backgroundColor: C.cardBg }}>
                                {paginatedData.map((item, idx) => {
                                    const isUpcoming = activeTab === 'upcoming';
                                    const score      = item.score || 0;
                                    const totalMarks = item.totalMarks || 100;
                                    const pct        = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
                                    const grade      = getGrade(pct);
                                    const passed     = item.passed || item.isPassed;

                                    return (
                                        <div key={item._id || idx} className="grid grid-cols-[40px_2.5fr_1.5fr_1fr_1fr_1fr_120px] gap-4 px-4 py-4 items-center transition-colors hover:bg-slate-50"
                                            style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                            
                                            <span style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                                {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                            </span>

                                            <p className="truncate pr-4" style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                {item.examTitle || item.title || 'Test'}
                                            </p>

                                            <div className="pr-4">
                                                {isUpcoming ? (
                                                    <span style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <MdTimer size={14} /> {item.duration} mins
                                                    </span>
                                                ) : (
                                                    <span className="truncate block" style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                                        {item.courseTitle || 'General'}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                                                {new Date(item.date || item.submittedAt || item.startDate || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>

                                            {!isUpcoming && (
                                                <div>
                                                    {item.status === 'Pending' ? (
                                                        <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.warning }}>Results Hidden</span>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{score}</span>
                                                                <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>/ {totalMarks}</span>
                                                            </div>
                                                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 60 ? C.success : C.danger }} />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {!isUpcoming && (
                                                <div>
                                                    {item.status === 'Pending' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 border"
                                                            style={{ backgroundColor: C.warningBg, borderColor: C.warning, color: C.warning, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', borderRadius: '8px' }}>
                                                            <MdAccessTime size={10} /> Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 border"
                                                            style={{ backgroundColor: passed ? C.successBg : C.dangerBg, borderColor: passed ? C.successBorder : C.dangerBorder, color: passed ? C.success : C.danger, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', borderRadius: '8px' }}>
                                                            {passed ? <MdCheckCircle size={10} /> : <MdCancel size={10} />} {passed ? 'Passed' : 'Failed'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="text-right">
                                                {isUpcoming ? (
                                                    <Link href={`/student/exams/${item._id}`} className="text-decoration-none">
                                                        <button className="flex items-center justify-center gap-1.5 h-9 w-full cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                                            style={{ backgroundColor: C.success, color: '#fff', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, borderRadius: '10px' }}>
                                                            Attempt <MdArrowForward size={14} />
                                                        </button>
                                                    </Link>
                                                ) : (
                                                    <Link href={`/student/exams/attempt/${item._id}`} className="text-decoration-none">
                                                        <button className="flex items-center justify-center gap-1.5 h-9 w-full cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                                                            style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, borderRadius: '10px' }}>
                                                            <MdVisibility size={14} /> Report
                                                        </button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                {totalPages > 1 && activeData.length > 0 && (
                    <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                        <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                            Showing page {currentPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer border-none disabled:opacity-40 transition-colors bg-white shadow-sm"
                                style={{ borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <MdChevronLeft size={16} color={C.heading} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className="w-8 h-8 flex items-center justify-center cursor-pointer border-none transition-colors text-xs"
                                    style={currentPage === i + 1 ? { backgroundColor: C.btnPrimary, color: '#fff', fontWeight: T.weight.bold, borderRadius: '10px', boxShadow: S.card } : { backgroundColor: 'transparent', color: C.textMuted, fontWeight: T.weight.bold, borderRadius: '10px' }}>
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer border-none disabled:opacity-40 transition-colors bg-white shadow-sm"
                                style={{ borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <MdChevronRight size={16} color={C.heading} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}