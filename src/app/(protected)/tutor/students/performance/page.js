'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    MdSearch,
    MdArrowUpward,
    MdCheckBox,
    MdWarning,
    MdDownload,
    MdFilterList,
    MdArrowOutward,
    MdTrendingUp,
    MdChevronLeft,
    MdChevronRight,
    MdAdd,
} from 'react-icons/md';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

// ─── Base Input Style — directive 13 ─────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    padding: '8px 14px',
    transition: 'all 0.2s ease',
};

const ITEMS_PER_PAGE = 10;

// ─── Mock Chart Data ──────────────────────────────────────────────────────────
const mockTrendData = [
    { month: 'Nov', score: 65 },
    { month: 'Dec', score: 68 },
    { month: 'Jan', score: 78 },
    { month: 'Feb', score: 88 },
    { month: 'Mar', score: 82 },
    { month: 'Apr', score: 91 },
];

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '8px 12px', boxShadow: S.cardHover, fontFamily: T.fontFamily }}>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.bold, margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    {label}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.btnPrimary, fontWeight: T.weight.bold, margin: 0 }}>
                    {payload[0].value}% Score
                </p>
            </div>
        );
    }
    return null;
};

// ─── Metric Card ──────────────────────────────────────────────────────────────
function TopMetricCard({ title, value, subtext, icon: Icon, iconColor, iconBg, trendIcon: TrendIcon }) {
    return (
        <div
            className="flex flex-col justify-between"
            style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, padding: 20, minHeight: 120 }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: iconBg }}>
                    <Icon style={{ width: 16, height: 16, color: iconColor }} />
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                    {title}
                </p>
            </div>
            <div className="flex items-end gap-3 mt-auto">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
                {subtext && (
                    <span
                        className="flex items-center gap-1 mb-1"
                        style={{ backgroundColor: iconBg, color: iconColor, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '4px 8px', borderRadius: '10px' }}
                    >
                        {TrendIcon && <TrendIcon style={{ width: 10, height: 10 }} />} {subtext}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Grade Helper ─────────────────────────────────────────────────────────────
const getGrade = (score) => {
    if (!score && score !== 0) return { letter: 'N/A', color: C.text, bg: C.innerBg };
    if (score >= 90) return { letter: 'A', color: C.success, bg: C.successBg };
    if (score >= 70) return { letter: 'B', color: C.warning, bg: C.warningBg };
    if (score >= 50) return { letter: 'C', color: '#F97316', bg: '#FFEDD5' };
    return { letter: 'F', color: C.danger, bg: C.dangerBg };
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TutorStudentPerformancePage() {
    const [students, setStudents]   = useState([]);
    const [summary, setSummary]     = useState(null);
    const [report, setReport]       = useState(null);
    const [loading, setLoading]     = useState(true);
    const [exporting, setExporting] = useState(false);

    const [searchInput, setSearchInput]   = useState('');
    const [batchFilter, setBatchFilter]   = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [sortBy, setSortBy]             = useState('score');
    const [currentPage, setCurrentPage]   = useState(1);

    useEffect(() => { fetchReport(); }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tutor/dashboard/reports/students', { params: { sortOrder: 'desc' } });
            if (res.data?.success) {
                setStudents(res.data.students || []);
                setSummary(res.data.summary || null);
                setReport(res.data.report || null);
            } else { toast.error('Failed to load student performance'); }
        } catch (error) {
            console.error('Failed to load student performance:', error);
            toast.error('Failed to load student performance');
        } finally { setLoading(false); }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await api.get('/tutor/dashboard/reports/students/export', { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url  = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Student_Performance_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click(); link.remove();
            toast.success('Report exported successfully');
        } catch { toast.error('Failed to export report'); }
        finally { setExporting(false); }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch  = s.name.toLowerCase().includes(searchInput.toLowerCase()) || (s.studentId && s.studentId.toLowerCase().includes(searchInput.toLowerCase()));
            const matchesBatch   = batchFilter  === 'all' ? true : s.batch === batchFilter;
            const matchesCourse  = courseFilter === 'all' ? true : s.courses?.includes(courseFilter);
            return matchesSearch && matchesBatch && matchesCourse;
        }).sort((a, b) => {
            if (sortBy === 'score')    return (b.indicators?.examAverage || 0) - (a.indicators?.examAverage || 0);
            if (sortBy === 'progress') return (b.indicators?.progress   || 0) - (a.indicators?.progress   || 0);
            if (sortBy === 'name')     return a.name.localeCompare(b.name);
            return 0;
        });
    }, [students, searchInput, batchFilter, courseFilter, sortBy]);

    const totalPages       = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const startItem        = filteredStudents.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem          = Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length);

    useEffect(() => { setCurrentPage(1); }, [searchInput, batchFilter, courseFilter, sortBy]);

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
            <div className="flex flex-col items-center gap-3">
                <div className="rounded-full border-[3px] animate-spin" style={{ width: 48, height: 48, borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                    Loading student performance...
                </p>
            </div>
        </div>
    );

    const avgScore           = summary?.overallExamAverage ?? 82;
    const completedCourses   = report?.courses?.completedCount ?? 178;
    const incompleteAssigns  = summary?.totalPendingAssignments ?? 56;

    return (
        <div className="w-full min-h-screen pb-24 space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header ── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, padding: 20 }}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase' }}>Dashboard</span>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>/</span>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase' }}>Student Performance</span>
                    </div>
                    <h1 style={{ fontFamily: T.fontFamily, color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.bold, margin: 0 }}>
                        Student Performance
                    </h1>
                </div>
                <Link href="/tutor/students/add">
                    <button
                        className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90 w-full sm:w-auto"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', boxShadow: S.btn, height: 40, padding: '0 20px' }}
                    >
                        <MdAdd style={{ width: 16, height: 16 }} /> Add Student
                    </button>
                </Link>
            </div>

            {/* ── Metric Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TopMetricCard
                    title="Average Score" value={`${avgScore}%`} subtext="+ 5.2%"
                    icon={MdArrowOutward} iconColor={C.success} iconBg={C.successBg} trendIcon={MdArrowUpward}
                />
                <TopMetricCard
                    title="Completed Courses" value={`${completedCourses}`} subtext="+ 15%"
                    icon={MdCheckBox} iconColor={C.btnPrimary} iconBg={C.btnViewAllBg} trendIcon={MdArrowUpward}
                />
                {/* Incomplete Assignments — custom card (no subtext badge) */}
                <div
                    className="flex flex-col justify-between"
                    style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, padding: 20, minHeight: 120 }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: C.dangerBg }}>
                            <MdWarning style={{ width: 16, height: 16, color: C.danger }} />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            Incomplete Assignments
                        </p>
                    </div>
                    <div className="flex items-end gap-3 mt-auto">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1 }}>
                            {incompleteAssigns}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Chart Area ── */}
            <div
                className="overflow-hidden flex flex-col"
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, height: 320 }}
            >
                <div className="px-6 py-4 flex items-center justify-between relative z-10" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                        Average Score Trend
                    </h2>
                    <select
                        style={{ ...baseInputStyle, width: 150, height: 36 }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    >
                        <option>Last 6 Months</option>
                        <option>Last 12 Months</option>
                    </select>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockTrendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={C.btnPrimary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={C.btnPrimary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.cardBorder} />
                            <XAxis dataKey="month" stroke={C.text} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} fontFamily={T.fontFamily} />
                            <YAxis stroke={C.text} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} fontFamily={T.fontFamily} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: `${C.btnPrimary}15`, strokeWidth: 2 }} />
                            <Line type="monotone" dataKey="score" stroke={C.btnPrimary} strokeWidth={3}
                                dot={{ r: 4, fill: C.cardBg, stroke: C.btnPrimary, strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: C.btnPrimary, strokeWidth: 0 }}
                                fill="url(#colorScore)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center pb-4 pt-1 relative z-10">
                    <span className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>
                        <div style={{ width: 10, height: 10, borderRadius: R.full, backgroundColor: C.btnPrimary }} /> Avg Score
                    </span>
                </div>
            </div>

            {/* ── Student Table ── */}
            <div
                className="overflow-hidden flex flex-col"
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                {/* Table header + filters */}
                <div style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}`, padding: 20 }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>
                        Student Performance
                    </h2>

                    {/* Filters row */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>Filter by:</span>
                            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ ...baseInputStyle, width: 140, height: 38 }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="all">All Batches</option>
                            </select>
                            <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{ ...baseInputStyle, width: 140, height: 38 }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="all">All Courses</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>Sort by:</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...baseInputStyle, width: 120, height: 38 }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="score">Score</option>
                                <option value="progress">Progress</option>
                                <option value="name">Name</option>
                            </select>
                            <button
                                className="flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:opacity-80 shrink-0"
                                style={{ backgroundColor: C.btnPrimary, color: '#fff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', height: 38, padding: '0 16px' }}
                            >
                                <MdFilterList style={{ width: 14, height: 14 }} /> Filter
                            </button>
                        </div>
                    </div>

                    {/* Search + Export */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="relative w-full max-w-sm">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: C.text }} />
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search students by name, email, ID..."
                                style={{ ...baseInputStyle, paddingLeft: 36, height: 40, width: '100%' }}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-80 shrink-0"
                            style={{ backgroundColor: C.cardBg, color: C.heading, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}`, height: 40, padding: '0 16px' }}
                        >
                            {exporting
                                ? <div className="rounded-full border-2 animate-spin" style={{ width: 14, height: 14, borderColor: `${C.text}30`, borderTopColor: C.text }} />
                                : <MdDownload style={{ width: 14, height: 14 }} />}
                            Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar">
                    <div style={{ minWidth: 1000 }}>
                        {/* Column headers */}
                        <div
                            className="grid gap-4 px-5 py-3"
                            style={{ gridTemplateColumns: '40px 2fr 1.5fr 1fr 80px 80px 100px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}
                        >
                            {['', 'Student', 'Course/Batch', 'Progress', 'Score', 'Rank', 'Status'].map((h, i) => (
                                <span
                                    key={i}
                                    className={i >= 3 ? 'text-center' : ''}
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                >
                                    {h}
                                </span>
                            ))}
                        </div>

                        {/* Rows */}
                        {paginatedStudents.length > 0 ? (
                            <div className="flex flex-col">
                                {paginatedStudents.map((student, idx) => {
                                    const progress  = student.indicators?.progress    ?? 0;
                                    const score     = student.indicators?.examAverage ?? 0;
                                    const gradeInfo = getGrade(score);

                                    const isComplete   = progress >= 90;
                                    const statusText   = isComplete ? 'Completed' : 'Pending';
                                    const statusBg     = isComplete ? C.successBg    : C.warningBg;
                                    const statusColor  = isComplete ? C.success      : C.warning;
                                    const statusBorder = isComplete ? C.successBorder : C.warningBorder;

                                    return (
                                        <div
                                            key={student.studentId}
                                            className="grid gap-4 px-5 py-3 items-center transition-colors"
                                            style={{
                                                gridTemplateColumns: '40px 2fr 1.5fr 1fr 80px 80px 100px',
                                                borderBottom: idx !== paginatedStudents.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            {/* Checkbox */}
                                            <div className="flex justify-center">
                                                <input type="checkbox" style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.btnPrimary }} />
                                            </div>

                                            {/* Student info */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="flex items-center justify-center shrink-0"
                                                    style={{ width: 40, height: 40, borderRadius: R.full, backgroundColor: C.btnViewAllBg, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontWeight: T.weight.bold, color: C.heading }}
                                                >
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                                        {student.name}
                                                    </p>
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, margin: 0, textTransform: 'uppercase' }}>
                                                        STU100{idx + 11}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Course/Batch */}
                                            <div className="min-w-0">
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                    {(student.courses || ['Data Science - Batch A'])[0]}
                                                </p>
                                            </div>

                                            {/* Progress + grade letter */}
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="flex flex-col w-full" style={{ maxWidth: 80 }}>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {progress}%
                                                    </span>
                                                    <div className="w-full overflow-hidden mt-1" style={{ height: 6, borderRadius: '10px', backgroundColor: C.innerBg }}>
                                                        <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: C.btnPrimary, borderRadius: '10px' }} />
                                                    </div>
                                                </div>
                                                <span
                                                    className="shrink-0 flex items-center justify-center"
                                                    style={{ width: 24, height: 24, borderRadius: '10px', backgroundColor: getGrade(progress).bg, color: getGrade(progress).color, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                                >
                                                    {getGrade(progress).letter}
                                                </span>
                                            </div>

                                            {/* Score grade badge */}
                                            <div className="text-center flex justify-center">
                                                <span
                                                    className="flex items-center justify-center"
                                                    style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: gradeInfo.bg, color: gradeInfo.color, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                                >
                                                    {gradeInfo.letter}
                                                </span>
                                            </div>

                                            {/* Rank */}
                                            <div className="text-center">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    #{idx + 1}
                                                </span>
                                            </div>

                                            {/* Status badge */}
                                            <div className="text-center">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '10px', backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}>
                                                    {statusText}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>
                                    No students matched the current filters.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Pagination Footer ── */}
                {filteredStudents.length > 0 && (
                    <div
                        className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-4"
                        style={{ backgroundColor: C.innerBg, borderTop: `1px solid ${C.cardBorder}` }}
                    >
                        <div className="flex items-center gap-2">
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>Rows per page:</span>
                            <select style={{ ...baseInputStyle, width: 60, height: 28, padding: '2px 8px', fontSize: T.size.xs }}>
                                <option>10</option>
                            </select>
                        </div>

                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, margin: 0 }}>
                            Showing {startItem} to {endItem} of {filteredStudents.length} students
                        </p>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center justify-center cursor-pointer disabled:opacity-50 transition-all hover:opacity-80"
                                style={{ width: 28, height: 28, backgroundColor: 'transparent', border: 'none', color: C.heading }}
                            >
                                <MdChevronLeft style={{ width: 16, height: 16 }} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className="flex items-center justify-center cursor-pointer transition-all"
                                    style={{
                                        width: 28, height: 28,
                                        backgroundColor: currentPage === page ? C.btnPrimary : 'transparent',
                                        color: currentPage === page ? '#ffffff' : C.heading,
                                        borderRadius: '10px',
                                        fontFamily: T.fontFamily,
                                        fontSize: T.size.xs,
                                        fontWeight: T.weight.bold,
                                        border: 'none',
                                    }}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center justify-center cursor-pointer disabled:opacity-50 transition-all hover:opacity-80"
                                style={{ width: 28, height: 28, backgroundColor: 'transparent', border: 'none', color: C.heading }}
                            >
                                <MdChevronRight style={{ width: 16, height: 16 }} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}