'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    CalendarClock,
    ClipboardCheck,
    Download,
    FileText,
    Loader2,
    Users,
} from 'lucide-react';
import { C, T, FX, S, pageStyle } from '@/constants/tutorTokens';

function MetricCard({ icon: Icon, title, value, subtitle, tone = 'default' }) {
    const toneStyles = {
        default: { bg: FX.primary08, color: C.btnPrimary },
        success: { bg: C.successBg, color: C.success },
        warning: { bg: C.warningBg, color: C.warning },
        danger: { bg: C.dangerBg, color: C.danger },
    };
    const style = toneStyles[tone] || toneStyles.default;

    return (
        <div
            className="rounded-2xl border p-4"
            style={{
                backgroundColor: C.surfaceWhite,
                borderColor: C.cardBorder,
                boxShadow: S.card,
            }}
        >
            <div className="flex items-center justify-between gap-2 mb-3">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold }}>
                    {title}
                </p>
                <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: style.bg }}
                >
                    <Icon className="w-4 h-4" style={{ color: style.color }} />
                </span>
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], color: C.heading, fontWeight: T.weight.black, lineHeight: T.leading.tight }}>
                {value}
            </p>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                {subtitle}
            </p>
        </div>
    );
}

export default function TutorReportsPage() {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [report, setReport] = useState(null);
    const [courseReports, setCourseReports] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);

    useEffect(() => {
        fetchReports();
    }, []);

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
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await api.get('/tutor/dashboard/reports/export', { responseType: 'blob' });
            const disposition = res.headers?.['content-disposition'] || '';
            let fileName = `tutor-reports-${new Date().toISOString().slice(0, 10)}.csv`;
            const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
            if (fileNameMatch?.[1]) fileName = fileNameMatch[1];

            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Reports exported');
        } catch {
            toast.error('Failed to export reports');
        } finally {
            setExporting(false);
        }
    };

    const formattedGeneratedAt = useMemo(() => {
        if (!report?.generatedAt) return 'N/A';
        return new Date(report.generatedAt).toLocaleString();
    }, [report?.generatedAt]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, color: C.textMuted, fontSize: T.size.sm }}>Loading reports...</p>
            </div>
        );
    }

    const riskBadge = (level) => {
        if (level === 'high') return { label: 'High', bg: C.dangerBg, border: C.dangerBorder, color: C.danger };
        return { label: 'Medium', bg: C.warningBg, border: C.warningBorder, color: C.warning };
    };

    return (
        <div className="space-y-5" style={pageStyle}>
            <div
                className="rounded-2xl p-4 flex items-center justify-between gap-3"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}
                    >
                        <FileText className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            Reports Hub
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Generated: {formattedGeneratedAt}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: C.btnPrimary, boxShadow: S.btn }}
                >
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                    icon={BookOpen}
                    title="Total Courses"
                    value={report?.overview?.totalCourses ?? 0}
                    subtitle={`${report?.overview?.publishedCourses ?? 0} published`}
                />
                <MetricCard
                    icon={Users}
                    title="Total Students"
                    value={report?.overview?.totalStudents ?? 0}
                    subtitle={`${report?.overview?.activeEnrollments ?? 0} active enrollments`}
                />
                <MetricCard
                    icon={CalendarClock}
                    title="Upcoming Items"
                    value={(report?.overview?.upcomingClasses ?? 0) + (report?.overview?.upcomingExams ?? 0)}
                    subtitle={`${report?.overview?.upcomingClasses ?? 0} classes, ${report?.overview?.upcomingExams ?? 0} exams`}
                    tone="warning"
                />
                <MetricCard
                    icon={AlertTriangle}
                    title="At-Risk Students"
                    value={report?.students?.atRiskCount ?? 0}
                    subtitle={`${report?.students?.highRiskCount ?? 0} high risk`}
                    tone={report?.students?.highRiskCount > 0 ? 'danger' : 'success'}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                    icon={BarChart3}
                    title="Course Health"
                    value={`${report?.courses?.averageProgress ?? 0}%`}
                    subtitle={`Completion rate ${report?.courses?.completionRate ?? 0}%`}
                />
                <MetricCard
                    icon={ClipboardCheck}
                    title="Exam Performance"
                    value={`${report?.exams?.averageScore ?? 0}%`}
                    subtitle={`Pass rate ${report?.exams?.passRate ?? 0}%`}
                />
                <MetricCard
                    icon={FileText}
                    title="Assignments"
                    value={`${report?.assignments?.submissionRate ?? 0}%`}
                    subtitle={`${report?.assignments?.pendingReview ?? 0} pending review`}
                />
                <MetricCard
                    icon={Users}
                    title="Attendance"
                    value={`${report?.attendance?.attendanceRate ?? 0}%`}
                    subtitle={`${report?.attendance?.totalSessions ?? 0} sessions tracked`}
                />
            </div>

            <div
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}
            >
                <div className="px-4 py-3 border-b" style={{ borderColor: C.cardBorder }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                        Course Reports
                    </h2>
                </div>
                {courseReports.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead style={{ backgroundColor: FX.primary05 }}>
                                <tr>
                                    {['Course', 'Status', 'Students', 'Progress', 'Assignment Rate', 'Exam Score', 'Attendance'].map((label) => (
                                        <th
                                            key={label}
                                            className="text-left px-4 py-2.5"
                                            style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, letterSpacing: T.tracking.wider, textTransform: 'uppercase' }}
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {courseReports.map((course) => (
                                    <tr key={course.courseId} className="border-t" style={{ borderColor: C.cardBorder }}>
                                        <td className="px-4 py-3">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>
                                                {course.title}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="inline-flex px-2 py-1 rounded-full border"
                                                style={{
                                                    fontFamily: T.fontFamily,
                                                    fontSize: '10px',
                                                    fontWeight: T.weight.bold,
                                                    color: course.status === 'published' ? C.success : C.warning,
                                                    borderColor: course.status === 'published' ? C.successBorder : C.warningBorder,
                                                    backgroundColor: course.status === 'published' ? C.successBg : C.warningBg,
                                                }}
                                            >
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                            {course.students}
                                        </td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                            {course.averageProgress}%
                                        </td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                            {course.assignmentSubmissionRate}%
                                        </td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                            {course.averageExamScore}%
                                        </td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                            {course.attendanceRate}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-4 py-10 text-center">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                            No course report data yet.
                        </p>
                    </div>
                )}
            </div>

            <div
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}
            >
                <div className="px-4 py-3 border-b flex items-center justify-between gap-2" style={{ borderColor: C.cardBorder }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                        At-Risk Students
                    </h2>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        {atRiskStudents.length} flagged
                    </span>
                </div>

                {atRiskStudents.length > 0 ? (
                    <div className="divide-y" style={{ borderColor: C.cardBorder }}>
                        {atRiskStudents.slice(0, 25).map((student) => {
                            const badge = riskBadge(student.riskLevel);
                            return (
                                <div key={student.studentId} className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>
                                                {student.name}
                                            </p>
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded-full border"
                                                style={{
                                                    backgroundColor: badge.bg,
                                                    borderColor: badge.border,
                                                    color: badge.color,
                                                    fontFamily: T.fontFamily,
                                                    fontSize: '10px',
                                                    fontWeight: T.weight.bold,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: T.tracking.wide,
                                                }}
                                            >
                                                {badge.label} • {student.riskScore}
                                            </span>
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 1 }}>
                                            {student.email}
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 4 }}>
                                            {(student.courses || []).join(', ')}
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, marginTop: 4 }}>
                                            {(student.reasons || []).join(' • ')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-[360px]">
                                        {[
                                            { label: 'Progress', value: `${student.indicators?.progress ?? 0}%` },
                                            { label: 'Exam', value: student.indicators?.examAverage === null ? 'N/A' : `${student.indicators.examAverage}%` },
                                            { label: 'Assign', value: `${student.indicators?.assignmentRate ?? 0}%` },
                                            { label: 'Attendance', value: `${student.indicators?.attendanceRate ?? 0}%` },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-lg px-2.5 py-2" style={{ backgroundColor: FX.primary05 }}>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                                                    {item.label}
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold, marginTop: 2 }}>
                                                    {item.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="lg:w-[110px]">
                                        <Link
                                            href={`/tutor/students/${student.studentId}`}
                                            className="inline-flex items-center justify-center w-full px-3 py-2 rounded-xl text-xs font-semibold border"
                                            style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="px-4 py-10 text-center">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                            No at-risk students detected right now.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
