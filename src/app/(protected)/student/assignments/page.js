'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Upload, ChevronDown, X, FileText } from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { getAudienceDisplay } from '@/lib/audienceDisplay';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

const PAGE_SIZE = 5;

export default function StudentAssignmentsPage() {
    const [enrollments, setEnrollments]       = useState([]);
    const [allRows, setAllRows]               = useState([]);
    const [loading, setLoading]               = useState(true);
    const [activeTab, setActiveTab]           = useState('All Assignments');
    const [courseFilter, setCourseFilter]     = useState('');
    const [titleFilter, setTitleFilter]       = useState('');
    const [showTitleChip, setShowTitleChip]   = useState(false);
    const [currentPage, setCurrentPage]       = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const enrollRes = await api.get('/enrollments/my-enrollments');
                const enrollmentsList = enrollRes.data?.enrollments || [];
                setEnrollments(enrollmentsList);

                const rows = [];
                for (const enr of enrollmentsList) {
                    const cid = enr.courseId?._id || enr.courseId;
                    if (!cid) continue;
                    const res = await assignmentService.getCourseAssignments(cid);
                    const assignments = res.assignments || [];
                    const courseTitle = enr.courseId?.title || 'Course';
                    assignments.forEach(a => rows.push({ ...a, courseTitle, courseId: cid }));
                }
                rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                setAllRows(rows);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const now = new Date();
    const getStatus = (row) => {
        const sub = row.mySubmission;
        const due = row.dueDate ? new Date(row.dueDate) : null;
        if (sub?.status === 'graded')    return { label: 'Submitted', type: 'submitted', isGraded: true };
        if (sub?.status === 'submitted') return { label: 'Submitted', type: 'submitted' };
        if (due && due < now)            return { label: 'Overdue',   type: 'overdue' };
        return { label: 'Pending', type: 'pending' };
    };

    const filtered = allRows.filter(row => {
        const status = getStatus(row);
        if (activeTab === 'Pending'   && status.type !== 'pending')   return false;
        if (activeTab === 'Submitted' && status.type !== 'submitted') return false;
        if (activeTab === 'Overdue'   && status.type !== 'overdue')   return false;
        if (courseFilter && !row.courseTitle.toLowerCase().includes(courseFilter.toLowerCase())) return false;
        if (titleFilter  && !row.title.toLowerCase().includes(titleFilter.toLowerCase()))        return false;
        return true;
    });

    const pendingCount   = allRows.filter(r => getStatus(r).type === 'pending').length;
    const submittedCount = allRows.filter(r => getStatus(r).type === 'submitted').length;
    const overdueCount   = allRows.filter(r => getStatus(r).type === 'overdue').length;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                    Loading assignments…
                </p>
            </div>
        </div>
    );

    // ── Status badge helper ──────────────────────────────────────────────────
    const statusStyle = (type) => {
        if (type === 'overdue')   return { backgroundColor: C.dangerBg,  color: C.danger,  fontFamily: T.fontFamily };
        if (type === 'submitted') return { backgroundColor: C.successBg, color: C.success, fontFamily: T.fontFamily };
        return { backgroundColor: C.warningBg, color: C.warning, fontFamily: T.fontFamily };
    };

    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        Assignments
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55, marginTop: 2 }}>
                        {allRows.length} total · {pendingCount} pending
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/student/assignments/upload">
                        <button className="flex items-center gap-2 px-4 py-2.5 text-white text-sm rounded-xl transition-all hover:opacity-90"
                            style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                            <Upload className="w-4 h-4" /> Upload Assignment
                        </button>
                    </Link>
                    <div className="relative">
                        <select className="appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border cursor-pointer"
                            style={{ ...cx.input(), fontFamily: T.fontFamily, fontWeight: T.weight.medium }}>
                            <option>Sort</option>
                            <option>Due Date</option>
                            <option>Date Assigned</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: C.textMuted }} />
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-1.5" style={{ borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: 8 }}>
                {[
                    { key: 'All Assignments', label: 'All Assignments' },
                    { key: 'Pending',   label: `${pendingCount} Pending` },
                    { key: 'Submitted', label: 'Submitted' },
                    { key: 'Overdue',   label: `${overdueCount} Overdue`, danger: true },
                ].map(tab => (
                    <button key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                        className="px-4 py-2 rounded-xl text-xs transition-all"
                        style={activeTab === tab.key
                            ? { backgroundColor: tab.danger ? C.danger : C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                            : { ...cx.btnSecondary(), fontFamily: T.fontFamily }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Filter bar ────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                {showTitleChip && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                        Assignment Title
                        <button onClick={() => { setShowTitleChip(false); setTitleFilter(''); }}
                            className="p-0.5 rounded-full hover:opacity-70">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                )}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: C.textMuted }} />
                    <input type="text" placeholder="Filter by Course"
                        value={courseFilter}
                        onChange={e => setCourseFilter(e.target.value)}
                        style={{ ...cx.input(), width: '100%', padding: '9px 14px 9px 36px' }}
                        onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                    />
                </div>
            </div>

            {/* ── Table ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ backgroundColor: C.innerBg }}>
                                {['#', 'Assignment Title', 'Course', 'Date Assigned', 'Due Date', 'Status', 'Actions'].map(col => (
                                    <th key={col} className="px-5 py-3 text-left"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.length > 0 ? pageRows.map((row, idx) => {
                                const status      = getStatus(row);
                                const audienceInfo = getAudienceDisplay(row);
                                const globalIdx   = (currentPage - 1) * PAGE_SIZE + idx + 1;
                                return (
                                    <tr key={row._id}
                                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>

                                        <td className="px-5 py-4"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, fontWeight: T.weight.medium }}>
                                            {globalIdx}
                                        </td>

                                        <td className="px-5 py-4">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                                {row.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${audienceInfo.badgeClass}`}>
                                                    {audienceInfo.label}
                                                </span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>
                                                    {audienceInfo.reason}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text }}>
                                            {row.courseTitle}
                                        </td>

                                        <td className="px-5 py-4"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                            {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </td>

                                        <td className="px-5 py-4"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                            {row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                                                style={statusStyle(status.type)}>
                                                {status.type === 'submitted' && '✓ '}
                                                {status.type === 'overdue'   && '⊙ '}
                                                {status.label}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <Link href={`/student/courses/${row.courseId}/assignments/${row._id}`}>
                                                <button className="px-3 py-1.5 text-xs rounded-xl font-bold transition-all hover:opacity-80"
                                                    style={status.type === 'overdue'
                                                        ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily }
                                                        : { backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                                    {status.type === 'overdue' ? 'Upload' : 'View'}
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="px-5 py-14 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                                style={{ backgroundColor: C.innerBg }}>
                                                <FileText className="w-5 h-5" style={{ color: C.btnPrimary, opacity: 0.4 }} />
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.4 }}>
                                                No assignments match your filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-1.5 px-5 py-4"
                        style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <button disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                            style={cx.btnSecondary()}>
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setCurrentPage(p)}
                                className="w-8 h-8 rounded-xl text-xs font-bold transition-all"
                                style={currentPage === p ? cx.pageActive() : cx.pageInactive()}>
                                {p}
                            </button>
                        ))}
                        <button disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                            style={cx.btnSecondary()}>
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}