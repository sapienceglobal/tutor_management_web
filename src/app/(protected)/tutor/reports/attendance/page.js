'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Download, Loader2, Search, Users, Video, Layers3 } from 'lucide-react';
import { C, T, FX, S, pageStyle } from '@/constants/tutorTokens';

function StatCard({ title, value, subtext, icon: Icon, tone = 'default' }) {
    const toneStyles = {
        default: { bg: FX.primary08, color: C.btnPrimary },
        success: { bg: C.successBg, color: C.success },
        warning: { bg: C.warningBg, color: C.warning },
        danger: { bg: C.dangerBg, color: C.danger },
    };
    const toneStyle = toneStyles[tone] || toneStyles.default;

    return (
        <div
            className="rounded-2xl border p-4"
            style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}
        >
            <div className="flex items-center justify-between mb-3">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold }}>
                    {title}
                </p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: toneStyle.bg }}>
                    <Icon className="w-4 h-4" style={{ color: toneStyle.color }} />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: T.leading.tight }}>
                {value}
            </p>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                {subtext}
            </p>
        </div>
    );
}

export default function TutorAttendanceReportsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [summary, setSummary] = useState(null);
    const [courseReports, setCourseReports] = useState([]);
    const [batchReports, setBatchReports] = useState([]);
    const [students, setStudents] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('all');
    const [sortBy, setSortBy] = useState('overallRate');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchAttendanceReport(loading);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, riskFilter, sortBy]);

    const fetchAttendanceReport = async (isFirstLoad = false) => {
        try {
            if (isFirstLoad) setLoading(true);
            else setRefreshing(true);

            const res = await api.get('/tutor/dashboard/reports/attendance', {
                params: {
                    risk: riskFilter,
                    search: debouncedSearch || undefined,
                    sortBy,
                    sortOrder: sortBy === 'name' ? 'asc' : 'asc',
                },
            });

            if (res.data?.success) {
                setSummary(res.data.summary || null);
                setCourseReports(res.data.courseReports || []);
                setBatchReports(res.data.batchReports || []);
                setStudents(res.data.students || []);
            } else {
                toast.error('Failed to load attendance report');
            }
        } catch (error) {
            console.error('Failed to load attendance report:', error);
            toast.error('Failed to load attendance report');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await api.get('/tutor/dashboard/reports/attendance/export', {
                responseType: 'blob',
            });
            const disposition = res.headers?.['content-disposition'] || '';
            let fileName = `tutor-attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
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
            toast.success('Attendance report downloaded');
        } catch {
            toast.error('Failed to export attendance report');
        } finally {
            setExporting(false);
        }
    };

    const avgFilteredAttendance = useMemo(() => {
        if (!students.length) return 0;
        const total = students.reduce((sum, student) => sum + Number(student.attendance?.overallRate || 0), 0);
        return Number((total / students.length).toFixed(1));
    }, [students]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                    Loading attendance reports...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={pageStyle}>
            <div
                className="rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                        <Video className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                            Attendance Reports
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Live + batch attendance analytics with low-attendance risk visibility
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchAttendanceReport(false)}
                        disabled={refreshing}
                        className="px-3 py-2 rounded-xl border text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
                        style={{ backgroundColor: C.btnPrimary }}
                    >
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Overall Attendance"
                    value={`${summary?.overallAttendanceRate ?? 0}%`}
                    subtext={`${summary?.totalStudents ?? 0} tracked students`}
                    icon={Users}
                    tone={(summary?.overallAttendanceRate ?? 0) < 70 ? 'warning' : 'success'}
                />
                <StatCard
                    title="Live Attendance"
                    value={`${summary?.liveAttendanceRate ?? 0}%`}
                    subtext={`${summary?.liveSessions ?? 0} sessions`}
                    icon={Video}
                />
                <StatCard
                    title="Batch Attendance"
                    value={`${summary?.batchAttendanceRate ?? 0}%`}
                    subtext={`${summary?.batchSessions ?? 0} recorded sessions`}
                    icon={Layers3}
                />
                <StatCard
                    title="Low Attendance"
                    value={summary?.lowAttendanceStudents ?? 0}
                    subtext={`Filtered avg ${avgFilteredAttendance}%`}
                    icon={AlertTriangle}
                    tone={(summary?.lowAttendanceStudents ?? 0) > 0 ? 'danger' : 'success'}
                />
            </div>

            <div
                className="rounded-2xl border p-3 grid grid-cols-1 lg:grid-cols-3 gap-3"
                style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}
            >
                <label className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by student, course, batch..."
                        className="w-full h-10 rounded-xl border pl-9 pr-3 text-sm"
                        style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                    />
                </label>

                <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                >
                    <option value="all">All Risk Levels</option>
                    <option value="at-risk">At-Risk (High + Medium)</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                >
                    <option value="overallRate">Sort by Overall Rate</option>
                    <option value="liveRate">Sort by Live Rate</option>
                    <option value="batchRate">Sort by Batch Rate</option>
                    <option value="inactivityDays">Sort by Inactivity</option>
                    <option value="name">Sort by Name</option>
                </select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: C.cardBorder }}>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                            Course Attendance
                        </h2>
                    </div>
                    <div className="max-h-[360px] overflow-auto">
                        <table className="w-full min-w-[560px]">
                            <thead style={{ backgroundColor: FX.primary05 }}>
                                <tr>
                                    {['Course', 'Overall', 'Live', 'Batch', 'Students'].map((h) => (
                                        <th key={h} className="text-left px-4 py-2.5" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {courseReports.map((course) => (
                                    <tr key={course.courseId} className="border-t" style={{ borderColor: C.cardBorder }}>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>{course.title}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{course.overallAttendanceRate}%</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{course.liveAttendanceRate}%</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{course.batchAttendanceRate}%</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{course.enrolledStudents}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: C.cardBorder }}>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                            Batch Attendance
                        </h2>
                    </div>
                    <div className="max-h-[360px] overflow-auto">
                        <table className="w-full min-w-[560px]">
                            <thead style={{ backgroundColor: FX.primary05 }}>
                                <tr>
                                    {['Batch', 'Course', 'Rate', 'Sessions', 'Students'].map((h) => (
                                        <th key={h} className="text-left px-4 py-2.5" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {batchReports.map((batch) => (
                                    <tr key={batch.batchId} className="border-t" style={{ borderColor: C.cardBorder }}>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>{batch.batchName}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{batch.courseTitle}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{batch.attendanceRate}%</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{batch.sessions}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{batch.students}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: C.cardBorder }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                        Student Attendance Risk
                    </h2>
                </div>

                {students.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                            <thead style={{ backgroundColor: FX.primary05 }}>
                                <tr>
                                    {['Student', 'Risk', 'Overall', 'Live', 'Batch', 'Tracked', 'Inactive', 'Action'].map((h) => (
                                        <th key={h} className="text-left px-4 py-2.5" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const tone = student.riskLevel === 'high' ? 'danger' : student.riskLevel === 'medium' ? 'warning' : 'success';
                                    const bg = tone === 'danger' ? C.dangerBg : tone === 'warning' ? C.warningBg : C.successBg;
                                    const border = tone === 'danger' ? C.dangerBorder : tone === 'warning' ? C.warningBorder : C.successBorder;
                                    const color = tone === 'danger' ? C.danger : tone === 'warning' ? C.warning : C.success;
                                    return (
                                        <tr key={student.studentId} className="border-t" style={{ borderColor: C.cardBorder }}>
                                            <td className="px-4 py-3">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>{student.name}</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>{student.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2 py-1 rounded-full border" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wide, backgroundColor: bg, borderColor: border, color }}>
                                                    {student.riskLevel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{student.attendance?.overallRate ?? 0}%</td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{student.attendance?.liveRate ?? 0}%</td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{student.attendance?.batchRate ?? 0}%</td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{student.attendance?.trackedSessions ?? 0}</td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{student.inactivityDays ?? 'N/A'} days</td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/tutor/students/${student.studentId}`}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold border"
                                                    style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-4 py-10 text-center">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                            No students matched current filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
