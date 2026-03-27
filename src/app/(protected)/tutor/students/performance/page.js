'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { AlertTriangle, ArrowUpDown, Loader2, Search, ShieldAlert, UserRoundCheck, Users } from 'lucide-react';
import { C, T, FX, S, pageStyle } from '@/constants/tutorTokens';

const VALID_RISK_FILTERS = ['all', 'at-risk', 'high', 'medium', 'low'];

function MetricCard({ title, value, subtext, tone = 'default', icon: Icon }) {
    const toneMap = {
        default: { bg: FX.primary08, color: C.btnPrimary },
        success: { bg: C.successBg, color: C.success },
        warning: { bg: C.warningBg, color: C.warning },
        danger: { bg: C.dangerBg, color: C.danger },
    };
    const toneStyle = toneMap[tone] || toneMap.default;

    return (
        <div
            className="rounded-2xl border p-4"
            style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}
        >
            <div className="flex items-center justify-between mb-2.5">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold }}>
                    {title}
                </p>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: toneStyle.bg }}>
                    <Icon className="w-4 h-4" style={{ color: toneStyle.color }} />
                </span>
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], color: C.heading, fontWeight: T.weight.black, lineHeight: T.leading.tight }}>
                {value}
            </p>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                {subtext}
            </p>
        </div>
    );
}

export default function TutorStudentPerformancePage() {
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [riskFilter, setRiskFilter] = useState('all');
    const [sortBy, setSortBy] = useState('riskScore');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const fromUrl = String(new URLSearchParams(window.location.search).get('risk') || '').toLowerCase();
        if (VALID_RISK_FILTERS.includes(fromUrl)) setRiskFilter(fromUrl);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchReport(loading);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [riskFilter, debouncedSearch, sortBy]);

    const fetchReport = async (isFirstLoad = false) => {
        try {
            if (isFirstLoad) setLoading(true);
            else setRefreshing(true);

            const res = await api.get('/tutor/dashboard/reports/students', {
                params: {
                    risk: riskFilter,
                    search: debouncedSearch || undefined,
                    sortBy,
                    sortOrder: 'desc',
                },
            });

            if (res.data?.success) {
                setStudents(res.data.students || []);
                setSummary(res.data.summary || null);
                setReport(res.data.report || null);
            } else {
                toast.error('Failed to load student performance');
            }
        } catch (error) {
            console.error('Failed to load student performance:', error);
            toast.error('Failed to load student performance');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const avgRiskScore = useMemo(() => {
        if (!students.length) return 0;
        return (students.reduce((sum, student) => sum + Number(student.riskScore || 0), 0) / students.length).toFixed(1);
    }, [students]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                    Loading student performance...
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
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}
                    >
                        <UserRoundCheck className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                            Student Performance
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Risk analytics, engagement trends, and intervention priorities
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/tutor/students/at-risk"
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border text-xs font-semibold"
                        style={{ borderColor: C.warningBorder, color: C.warning, backgroundColor: C.warningBg }}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        At-Risk Queue
                    </Link>
                    <button
                        onClick={() => fetchReport(false)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border text-xs font-semibold disabled:opacity-60"
                        style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                    >
                        {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpDown className="w-3.5 h-3.5" />}
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Students"
                    value={summary?.filteredStudents ?? 0}
                    subtext={`of ${summary?.totalStudents ?? 0} tracked`}
                    icon={Users}
                />
                <MetricCard
                    title="At-Risk Students"
                    value={summary?.atRiskCount ?? 0}
                    subtext={`${summary?.highRiskCount ?? 0} high risk`}
                    tone={(summary?.highRiskCount ?? 0) > 0 ? 'danger' : 'warning'}
                    icon={AlertTriangle}
                />
                <MetricCard
                    title="Average Risk Score"
                    value={avgRiskScore}
                    subtext="Current filtered list"
                    tone={Number(avgRiskScore) >= 60 ? 'danger' : Number(avgRiskScore) >= 40 ? 'warning' : 'success'}
                    icon={ShieldAlert}
                />
                <MetricCard
                    title="Average Course Progress"
                    value={`${report?.courses?.averageProgress ?? 0}%`}
                    subtext={`Completion rate ${report?.courses?.completionRate ?? 0}%`}
                    tone="success"
                    icon={UserRoundCheck}
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
                        placeholder="Search by student, email, course..."
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
                    <option value="riskScore">Sort by Risk Score</option>
                    <option value="progress">Sort by Progress</option>
                    <option value="examAverage">Sort by Exam Avg</option>
                    <option value="assignmentRate">Sort by Assignment Rate</option>
                    <option value="attendanceRate">Sort by Attendance Rate</option>
                    <option value="inactivityDays">Sort by Inactivity</option>
                    <option value="name">Sort by Name</option>
                </select>
            </div>

            <div
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}
            >
                <div className="px-4 py-3 border-b" style={{ borderColor: C.cardBorder }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                        Student Intelligence Table
                    </h2>
                </div>

                {students.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                            <thead style={{ backgroundColor: FX.primary05 }}>
                                <tr>
                                    {['Student', 'Risk', 'Progress', 'Exam Avg', 'Assignment', 'Attendance', 'Inactive', 'Courses', 'Actions'].map((header) => (
                                        <th
                                            key={header}
                                            className="text-left px-4 py-2.5"
                                            style={{
                                                fontFamily: T.fontFamily,
                                                fontSize: '10px',
                                                color: C.textMuted,
                                                fontWeight: T.weight.bold,
                                                letterSpacing: T.tracking.wider,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const isHigh = student.riskLevel === 'high';
                                    const isMedium = student.riskLevel === 'medium';
                                    const riskColor = isHigh ? C.danger : isMedium ? C.warning : C.success;
                                    const riskBg = isHigh ? C.dangerBg : isMedium ? C.warningBg : C.successBg;
                                    const riskBorder = isHigh ? C.dangerBorder : isMedium ? C.warningBorder : C.successBorder;

                                    return (
                                        <tr key={student.studentId} className="border-t" style={{ borderColor: C.cardBorder }}>
                                            <td className="px-4 py-3">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>
                                                    {student.name}
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                    {student.email}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="inline-flex items-center px-2 py-1 rounded-full border"
                                                    style={{
                                                        fontFamily: T.fontFamily,
                                                        fontSize: '10px',
                                                        fontWeight: T.weight.bold,
                                                        color: riskColor,
                                                        borderColor: riskBorder,
                                                        backgroundColor: riskBg,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: T.tracking.wide,
                                                    }}
                                                >
                                                    {student.riskLevel} • {student.riskScore}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                {student.indicators?.progress ?? 0}%
                                            </td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                {student.indicators?.examAverage === null ? 'N/A' : `${student.indicators?.examAverage}%`}
                                            </td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                {student.indicators?.assignmentRate ?? 0}%
                                            </td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                {student.indicators?.attendanceRate ?? 0}%
                                            </td>
                                            <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                                                {student.indicators?.inactivityDays ?? 'N/A'} days
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="max-w-[280px] truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                    {(student.courses || []).join(', ')}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/tutor/students/${student.studentId}`}
                                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold border"
                                                    style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                                                >
                                                    View Profile
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-4 py-12 text-center">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                            No students matched the current filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
