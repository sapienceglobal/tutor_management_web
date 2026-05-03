'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    MdWarning,
    MdBarChart,
    MdMenuBook,
    MdSchedule,
    MdAssignmentTurnedIn,
    MdDownload,
    MdArticle,
    MdHourglassEmpty,
    MdPeople,
    MdSearch,
    MdAutoAwesome,
} from 'react-icons/md';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow   = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow   = 'none';
};

const baseInputStyle = {
    backgroundColor: C.innerBg,
    border:          `1px solid ${C.cardBorder}`,
    borderRadius:    '10px',
    color:           C.heading,
    fontFamily:      T.fontFamily,
    fontSize:        T.size.base,
    fontWeight:      T.weight.medium,
    outline:         'none',
    width:           '100%',
    padding:         '10px 16px',
    transition:      'all 0.2s ease',
};

const sectionCard = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    boxShadow:       S.card,
    borderRadius:    R['2xl'],
};

// ─── Risk badge helper ────────────────────────────────────────────────────────
const riskBadge = (level) => {
    if (level === 'high') return { label: 'High',   bg: C.dangerBg,  border: C.dangerBorder,  color: C.danger  };
    return                       { label: 'Medium', bg: C.warningBg, border: C.warningBorder, color: C.warning };
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TutorReportsPage() {
    const [loading, setLoading]           = useState(true);
    const [exporting, setExporting]       = useState(false);
    const [report, setReport]             = useState(null);
    const [courseReports, setCourseReports] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [searchTerm, setSearchTerm]     = useState('');

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tutor/dashboard/reports/summary');
            if (res.data?.success) {
                setReport(res.data.report || null);
                setCourseReports(res.data.courseReports || []);
                setAtRiskStudents(res.data.atRiskStudents || []);
            } else {
                toast.error('Failed to load reports');
            }
        } catch (error) {
            console.error('Failed to load tutor reports:', error);
            toast.error('Failed to load reports');
        } finally { setLoading(false); }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await api.get('/tutor/dashboard/reports/export', { responseType: 'blob' });
            const disposition    = res.headers?.['content-disposition'] || '';
            let fileName         = `tutor-reports-${new Date().toISOString().slice(0, 10)}.csv`;
            const fileNameMatch  = disposition.match(/filename="?([^"]+)"?/i);
            if (fileNameMatch?.[1]) fileName = fileNameMatch[1];

            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url  = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Reports exported');
        } catch {
            toast.error('Failed to export reports');
        } finally { setExporting(false); }
    };

    const formattedGeneratedAt = useMemo(() => {
        if (!report?.generatedAt) return 'N/A';
        return new Date(report.generatedAt).toLocaleString();
    }, [report?.generatedAt]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="relative w-12 h-12">
                <div
                    className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <MdAutoAwesome className="animate-pulse" style={{ width: 18, height: 18, color: C.btnPrimary }} />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium }}>
                Loading reports...
            </p>
        </div>
    );

    return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                style={sectionCard}
            >
                <div className="flex items-center gap-3">
                    {/* Icon Pill */}
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdArticle style={{ width: 20, height: 20, color: C.iconColor }} />
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
                            Reports Hub
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
                            Generated: {formattedGeneratedAt}
                        </p>
                    </div>
                </div>

                {/* Export Button */}
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                    style={{
                        background:   C.gradientBtn,
                        color:        '#ffffff',
                        borderRadius: '10px',
                        boxShadow:    S.btn,
                        fontFamily:   T.fontFamily,
                        fontSize:     T.size.base,
                        fontWeight:   T.weight.bold,
                    }}
                >
                    {exporting
                        ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />
                        : <MdDownload       style={{ width: 16, height: 16 }} />
                    }
                    Export CSV
                </button>
            </div>

            {/* ── Overview Metrics (StatCard) ──────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    icon={MdMenuBook}
                    value={report?.overview?.totalCourses ?? 0}
                    label="Total Courses"
                    subtext={`${report?.overview?.publishedCourses ?? 0} published`}
                    iconBg={C.innerBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard
                    icon={MdPeople}
                    value={report?.overview?.totalStudents ?? 0}
                    label="Total Students"
                    subtext={`${report?.overview?.activeEnrollments ?? 0} active enrollments`}
                    iconBg={C.innerBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard
                    icon={MdSchedule}
                    value={(report?.overview?.upcomingClasses ?? 0) + (report?.overview?.upcomingExams ?? 0)}
                    label="Upcoming Items"
                    subtext={`${report?.overview?.upcomingClasses ?? 0} classes, ${report?.overview?.upcomingExams ?? 0} exams`}
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard
                    icon={MdWarning}
                    value={report?.students?.atRiskCount ?? 0}
                    label="At-Risk Students"
                    subtext={`${report?.students?.highRiskCount ?? 0} high risk`}
                    iconBg={(report?.students?.highRiskCount ?? 0) > 0 ? C.dangerBg : C.successBg}
                    iconColor={(report?.students?.highRiskCount ?? 0) > 0 ? C.danger  : C.success}
                />
            </div>

            {/* ── Performance Metrics (StatCard) ───────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    icon={MdBarChart}
                    value={`${report?.courses?.averageProgress ?? 0}%`}
                    label="Course Health"
                    subtext={`Completion rate ${report?.courses?.completionRate ?? 0}%`}
                    iconBg={C.innerBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard
                    icon={MdAssignmentTurnedIn}
                    value={`${report?.exams?.averageScore ?? 0}%`}
                    label="Exam Performance"
                    subtext={`Pass rate ${report?.exams?.passRate ?? 0}%`}
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard
                    icon={MdArticle}
                    value={`${report?.assignments?.submissionRate ?? 0}%`}
                    label="Assignments"
                    subtext={`${report?.assignments?.pendingReview ?? 0} pending review`}
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard
                    icon={MdPeople}
                    value={`${report?.attendance?.attendanceRate ?? 0}%`}
                    label="Attendance"
                    subtext={`${report?.attendance?.totalSessions ?? 0} sessions tracked`}
                    iconBg={C.innerBg}
                    iconColor={C.btnPrimary}
                />
            </div>

            {/* ── Bottom Grid ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Course Reports Table */}
                <div
                    className="xl:col-span-2 overflow-hidden flex flex-col"
                    style={{ ...sectionCard, height: '500px' }}
                >
                    {/* Table Header */}
                    <div
                        className="px-5 py-4 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div
                                className="flex items-center justify-center rounded-lg shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                            >
                                <MdMenuBook style={{ width: 18, height: 18, color: C.iconColor }} />
                            </div>
                            <h2
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size.xl,
                                    fontWeight:  T.weight.semibold,
                                    color:       C.heading,
                                    margin:      0,
                                }}
                            >
                                Course Reports
                            </h2>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <MdSearch
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ width: 18, height: 18, color: C.text }}
                            />
                            <input
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ ...baseInputStyle, paddingLeft: '40px', backgroundColor: C.cardBg }}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {courseReports.length > 0 ? (
                            <div className="min-w-[800px]">
                                {/* Column Headers */}
                                <div
                                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-5 py-3"
                                    style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                >
                                    {['Course', 'Status', 'Students', 'Progress', 'Exam Score', 'Attendance'].map(label => (
                                        <span
                                            key={label}
                                            style={{
                                                fontFamily:    T.fontFamily,
                                                fontSize:      T.size.xs,
                                                fontWeight:    T.weight.bold,
                                                color:         C.text,
                                                textTransform: 'uppercase',
                                                letterSpacing: T.tracking.wider,
                                            }}
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                {/* Rows */}
                                <div className="flex flex-col gap-2 p-3">
                                    {courseReports
                                        .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(course => {
                                            const isPublished = course.status === 'published';
                                            return (
                                                <div
                                                    key={course.courseId}
                                                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-3 py-3 items-center transition-all"
                                                    style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = C.btnPrimary}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}
                                                >
                                                    <p className="truncate pr-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                                        {course.title}
                                                    </p>
                                                    <div>
                                                        <span
                                                            style={{
                                                                fontFamily:      T.fontFamily,
                                                                fontSize:        T.size.xs,
                                                                fontWeight:      T.weight.bold,
                                                                padding:         '4px 8px',
                                                                borderRadius:    '10px',
                                                                textTransform:   'uppercase',
                                                                backgroundColor: isPublished ? C.successBg  : C.warningBg,
                                                                color:           isPublished ? C.success    : C.warning,
                                                                border:          `1px solid ${isPublished ? C.successBorder : C.warningBorder}`,
                                                            }}
                                                        >
                                                            {course.status}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{course.students}</span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold,    color: C.btnPrimary }}>{course.averageProgress}%</span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold,    color: C.heading }}>{course.averageExamScore}%</span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{course.attendanceRate}%</span>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <div
                                    className="flex items-center justify-center mb-3"
                                    style={{ width: 48, height: 48, backgroundColor: C.innerBg, borderRadius: R.lg }}
                                >
                                    <MdMenuBook style={{ width: 24, height: 24, color: C.text, opacity: 0.3 }} />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                    No course report data yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* At-Risk Students List */}
                <div
                    className="xl:col-span-1 overflow-hidden flex flex-col"
                    style={{ ...sectionCard, height: '500px' }}
                >
                    {/* Panel Header */}
                    <div
                        className="px-5 py-4 shrink-0 flex items-center justify-between gap-2"
                        style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div
                                className="flex items-center justify-center rounded-lg shrink-0"
                                style={{ width: 40, height: 40, backgroundColor: C.dangerBg }}
                            >
                                <MdWarning style={{ width: 18, height: 18, color: C.danger }} />
                            </div>
                            <h2
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size.xl,
                                    fontWeight:  T.weight.semibold,
                                    color:       C.heading,
                                    margin:      0,
                                }}
                            >
                                At-Risk Students
                            </h2>
                        </div>
                        <span
                            style={{
                                fontFamily:      T.fontFamily,
                                backgroundColor: C.dangerBg,
                                color:           C.danger,
                                padding:         '4px 10px',
                                borderRadius:    '10px',
                                fontSize:        T.size.xs,
                                fontWeight:      T.weight.bold,
                                border:          `1px solid ${C.dangerBorder}`,
                            }}
                        >
                            {atRiskStudents.length} flagged
                        </span>
                    </div>

                    {/* Panel Body */}
                    <div className="flex-1 overflow-auto custom-scrollbar p-3 space-y-3">
                        {atRiskStudents.length > 0 ? (
                            atRiskStudents.slice(0, 25).map(student => {
                                const badge = riskBadge(student.riskLevel);
                                return (
                                    <div
                                        key={student.studentId}
                                        className="p-4"
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                    >
                                        {/* Name + Badge */}
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="min-w-0">
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, margin: '0 0 2px 0' }}>
                                                    {student.name}
                                                </p>
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                    {student.email}
                                                </p>
                                            </div>
                                            <span
                                                className="shrink-0 uppercase"
                                                style={{
                                                    fontFamily:      T.fontFamily,
                                                    fontSize:        T.size.xs,
                                                    fontWeight:      T.weight.bold,
                                                    backgroundColor: badge.bg,
                                                    color:           badge.color,
                                                    border:          `1px solid ${badge.border}`,
                                                    padding:         '2px 6px',
                                                    borderRadius:    '10px',
                                                }}
                                            >
                                                {badge.label} • {student.riskScore}
                                            </span>
                                        </div>

                                        {/* Indicator mini-cards */}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {[
                                                { label: 'Progress',   value: `${student.indicators?.progress ?? 0}%` },
                                                { label: 'Exam',       value: student.indicators?.examAverage === null ? 'N/A' : `${student.indicators.examAverage}%` },
                                                { label: 'Assign',     value: `${student.indicators?.assignmentRate ?? 0}%` },
                                                { label: 'Attendance', value: `${student.indicators?.attendanceRate ?? 0}%` },
                                            ].map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2"
                                                    style={{ backgroundColor: C.cardBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                                >
                                                    <p
                                                        style={{
                                                            fontFamily:    T.fontFamily,
                                                            fontSize:      T.size.xs,
                                                            fontWeight:    T.weight.bold,
                                                            color:         C.text,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: T.tracking.wider,
                                                            margin:        '0 0 2px 0',
                                                        }}
                                                    >
                                                        {item.label}
                                                    </p>
                                                    <p
                                                        style={{
                                                            fontFamily:  T.fontFamily,
                                                            fontSize:    T.size.base,
                                                            fontWeight:  T.weight.bold,
                                                            color:       C.heading,
                                                            margin:      0,
                                                        }}
                                                    >
                                                        {item.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Risk Reasons */}
                                        <p
                                            className="line-clamp-2 mb-3"
                                            style={{
                                                fontFamily:  T.fontFamily,
                                                fontSize:    T.size.xs,
                                                color:       C.danger,
                                                fontWeight:  T.weight.semibold,
                                            }}
                                        >
                                            {(student.reasons || []).join(' • ')}
                                        </p>

                                        {/* View Profile Button */}
                                        <Link href={`/tutor/students/${student.studentId}`}>
                                            <button
                                                className="w-full h-8 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                                                style={{
                                                    backgroundColor: C.btnViewAllBg,
                                                    color:           C.btnViewAllText,
                                                    borderRadius:    '10px',
                                                    fontFamily:      T.fontFamily,
                                                    fontSize:        T.size.xs,
                                                    fontWeight:      T.weight.bold,
                                                    border:          `1px solid ${C.cardBorder}`,
                                                }}
                                            >
                                                View Profile
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                                <div
                                    className="flex items-center justify-center mb-3"
                                    style={{ width: 48, height: 48, backgroundColor: C.innerBg, borderRadius: R.lg }}
                                >
                                    <MdWarning style={{ width: 24, height: 24, color: C.text, opacity: 0.3 }} />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                    No at-risk students
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, margin: 0 }}>
                                    Everyone is performing well.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}