'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Download, Loader2, Search, Users, Video, Layers3 } from 'lucide-react';
import { C, T, FX, S, R } from '@/constants/tutorTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

function StatCard({ title, value, subtext, icon: Icon, tone = 'default' }) {
    const toneStyles = {
        default: { bg: '#E3DFF8', color: C.btnPrimary },
        success: { bg: C.successBg, color: C.success },
        warning: { bg: C.warningBg, color: C.warning },
        danger: { bg: C.dangerBg, color: C.danger },
    };
    const style = toneStyles[tone] || toneStyles.default;

    return (
        <div className="p-5 flex flex-col justify-between transition-transform hover:-translate-y-0.5" 
            style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, minHeight: '120px' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', margin: 0 }}>
                    {title}
                </p>
                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg, borderRadius: R.xl }}>
                    <Icon size={20} color={style.color} />
                </div>
            </div>
            <div className="mt-auto">
                <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: style.color === C.btnPrimary ? C.heading : style.color, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
                {subtext && (
                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '6px 0 0 0' }}>
                        {subtext}
                    </p>
                )}
            </div>
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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading attendance reports...</p>
            </div>
        );
    }

    const riskBadge = (level) => {
        if (level === 'high') return { label: 'High', bg: C.dangerBg, border: C.dangerBorder, color: C.danger };
        if (level === 'medium') return { label: 'Medium', bg: C.warningBg, border: C.warningBorder, color: C.warning };
        return { label: 'Low', bg: C.successBg, border: C.successBorder, color: C.success };
    };

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <Video size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Attendance Reports
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                            Live + batch attendance analytics with low-attendance risk visibility
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                        onClick={() => fetchAttendanceReport(false)}
                        disabled={refreshing}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-md"
                        style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                    >
                        {refreshing ? <Loader2 size={16} className="animate-spin" /> : 'Refresh'}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                    >
                        {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export CSV
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Overall Attendance" value={`${summary?.overallAttendanceRate ?? 0}%`} subtext={`${summary?.totalStudents ?? 0} tracked students`} icon={Users} tone={(summary?.overallAttendanceRate ?? 0) < 70 ? 'warning' : 'default'} />
                <StatCard title="Live Attendance" value={`${summary?.liveAttendanceRate ?? 0}%`} subtext={`${summary?.liveSessions ?? 0} sessions`} icon={Video} tone="default" />
                <StatCard title="Batch Attendance" value={`${summary?.batchAttendanceRate ?? 0}%`} subtext={`${summary?.batchSessions ?? 0} recorded sessions`} icon={Layers3} tone="default" />
                <StatCard title="Low Attendance" value={summary?.lowAttendanceStudents ?? 0} subtext={`Filtered avg ${avgFilteredAttendance}%`} icon={AlertTriangle} tone={(summary?.lowAttendanceStudents ?? 0) > 0 ? 'danger' : 'success'} />
            </div>

            {/* Search & Filters */}
            <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by student, course, batch..."
                        style={{ ...baseInputStyle, paddingLeft: '36px' }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ ...baseInputStyle, minWidth: '160px', flex: 1 }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        <option value="all">All Risk Levels</option>
                        <option value="at-risk">At-Risk (High + Medium)</option>
                        <option value="high">High Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="low">Low Risk</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...baseInputStyle, minWidth: '160px', flex: 1 }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        <option value="overallRate">Sort by Overall Rate</option>
                        <option value="liveRate">Sort by Live Rate</option>
                        <option value="batchRate">Sort by Batch Rate</option>
                        <option value="inactivityDays">Sort by Inactivity</option>
                        <option value="name">Sort by Name</option>
                    </select>
                </div>
            </div>

            {/* Main Tables Area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Course Attendance */}
                <div className="overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-5 py-4 shrink-0" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Course Attendance</h2>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {courseReports.length > 0 ? (
                            <div className="min-w-[600px]">
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-5 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    {['Course', 'Overall', 'Live', 'Batch', 'Students'].map((h) => (
                                        <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>{h}</span>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    {courseReports.map((course) => (
                                        <div key={course.courseId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-3 py-3 items-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                            <p className="truncate pr-2" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{course.title}</p>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.btnPrimary }}>{course.overallAttendanceRate}%</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{course.liveAttendanceRate}%</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>{course.batchAttendanceRate}%</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{course.enrolledStudents}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <Video size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No course attendance data yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Batch Attendance */}
                <div className="overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-5 py-4 shrink-0" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Batch Attendance</h2>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {batchReports.length > 0 ? (
                            <div className="min-w-[600px]">
                                <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr] px-5 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    {['Batch', 'Course', 'Rate', 'Sessions', 'Students'].map((h) => (
                                        <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>{h}</span>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    {batchReports.map((batch) => (
                                        <div key={batch.batchId} className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr] px-3 py-3 items-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                            <p className="truncate pr-2" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{batch.batchName}</p>
                                            <p className="truncate pr-2" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{batch.courseTitle}</p>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.btnPrimary }}>{batch.attendanceRate}%</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{batch.sessions}</span>
                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>{batch.students}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <Layers3 size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No batch attendance data yet.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* At-Risk Students */}
            <div className="overflow-hidden flex flex-col" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="px-5 py-4 shrink-0" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Student Attendance Risk</h2>
                </div>
                <div className="overflow-x-auto custom-scrollbar p-3">
                    {students.length > 0 ? (
                        <div className="min-w-[1000px] flex flex-col gap-2">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_100px] px-3 py-2">
                                {['Student', 'Risk', 'Overall', 'Live', 'Batch', 'Tracked', 'Inactive', 'Action'].map((h) => (
                                    <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>{h}</span>
                                ))}
                            </div>
                            {students.map((student) => {
                                const badge = riskBadge(student.riskLevel);
                                return (
                                    <div key={student.studentId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_100px] px-3 py-4 items-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                        <div className="min-w-0 pr-2">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                                            <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{student.email}</p>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: R.md, textTransform: 'uppercase', backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                                                {student.riskLevel}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{student.attendance?.overallRate ?? 0}%</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>{student.attendance?.liveRate ?? 0}%</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>{student.attendance?.batchRate ?? 0}%</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>{student.attendance?.trackedSessions ?? 0}</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.danger }}>{student.inactivityDays ?? 'N/A'} days</span>
                                        <Link href={`/tutor/students/${student.studentId}`} className="text-decoration-none">
                                            <button className="w-full py-1.5 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                                                style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                                                View
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 flex flex-col items-center">
                            <AlertTriangle size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No students matched current filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}