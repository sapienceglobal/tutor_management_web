'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
    MdWarning, 
    MdDownload, 
    MdHourglassEmpty, 
    MdSearch, 
    MdPeople, 
    MdVideocam, 
    MdLayers, 
    MdRefresh,
    MdOpenInNew
} from 'react-icons/md';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';
// Focus Handlers
const onFocusHandler = e => {
    e.target.style.border = `1px solid ${C.btnPrimary}`;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = e => {
    e.target.style.border = `1px solid ${C.cardBorder}`;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};



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
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                        Loading attendance reports...
                    </p>
                </div>
            </div>
        );
    }

    const riskBadge = (level) => {
        if (level === 'high') return { label: 'High', bg: C.dangerBg, border: C.dangerBorder, color: C.danger };
        if (level === 'medium') return { label: 'Medium', bg: C.warningBg, border: C.warningBorder, color: C.warning };
        return { label: 'Low', bg: C.successBg, border: C.successBorder, color: C.success };
    };

    return (
        <div className="w-full min-h-screen space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" style={{ width: 48, height: 48, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                        <MdVideocam style={{ width: 24, height: 24, color: C.iconColor }} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.bold, margin: '0 0 2px 0' }}>
                            Attendance Reports
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0 }}>
                            Live + batch attendance analytics with low-attendance risk visibility
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <button
                        onClick={() => fetchAttendanceReport(false)}
                        disabled={refreshing}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 h-11 px-5 cursor-pointer border-none transition-colors"
                        style={{ backgroundColor: C.innerBg, color: C.btnPrimary, borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}
                    >
                        {refreshing ? <MdHourglassEmpty style={{ width: 18, height: 18 }} className="animate-spin" /> : <MdRefresh style={{ width: 18, height: 18 }} />} Refresh
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.base, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}
                    >
                        {exporting ? <MdHourglassEmpty style={{ width: 18, height: 18 }} className="animate-spin" /> : <MdDownload style={{ width: 18, height: 18 }} />} Export CSV
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-100">
                <StatCard 
                    label="Overall Attendance" 
                    value={`${summary?.overallAttendanceRate ?? 0}%`} 
                    subtext={`${summary?.totalStudents ?? 0} tracked students`} 
                    icon={MdPeople} 
                    iconBg={(summary?.overallAttendanceRate ?? 0) < 70 ? C.warningBg : '#EEF2FF'}
                    iconColor={(summary?.overallAttendanceRate ?? 0) < 70 ? C.warning : '#4F46E5'}
                />
                <StatCard 
                    label="Live Attendance" 
                    value={`${summary?.liveAttendanceRate ?? 0}%`} 
                    subtext={`${summary?.liveSessions ?? 0} sessions`} 
                    icon={MdVideocam} 
                    iconBg="#ECFDF5"
                    iconColor="#10B981"
                />
                <StatCard 
                    label="Batch Attendance" 
                    value={`${summary?.batchAttendanceRate ?? 0}%`} 
                    subtext={`${summary?.batchSessions ?? 0} recorded sessions`} 
                    icon={MdLayers} 
                    iconBg="#FFF7ED"
                    iconColor="#F59E0B"
                />
                <StatCard 
                    label="Low Attendance" 
                    value={summary?.lowAttendanceStudents ?? 0} 
                    subtext={`Filtered avg ${avgFilteredAttendance}%`} 
                    icon={MdWarning} 
                    iconBg={(summary?.lowAttendanceStudents ?? 0) > 0 ? C.dangerBg : C.successBg}
                    iconColor={(summary?.lowAttendanceStudents ?? 0) > 0 ? C.danger : C.success}
                />
            </div>

            {/* Search & Filters */}
            <div className="p-5 flex flex-col xl:flex-row gap-4 items-center justify-between animate-in fade-in duration-500 delay-200" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative w-full xl:flex-1">
                    <MdSearch style={{ width: 20, height: 20, color: C.textMuted }} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by student, course, batch..."
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ ...baseInputStyle, minWidth: '220px', flex: 1, cursor: 'pointer' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        <option value="all">All Risk Levels</option>
                        <option value="at-risk">At-Risk (High + Medium)</option>
                        <option value="high">High Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="low">Low Risk</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...baseInputStyle, minWidth: '220px', flex: 1, cursor: 'pointer' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        <option value="overallRate">Sort by Overall Rate</option>
                        <option value="liveRate">Sort by Live Rate</option>
                        <option value="batchRate">Sort by Batch Rate</option>
                        <option value="inactivityDays">Sort by Inactivity</option>
                        <option value="name">Sort by Name</option>
                    </select>
                </div>
            </div>

            {/* Main Tables Area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-500 delay-300">
                
                {/* Course Attendance */}
                <div className="overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-4 flex items-center gap-2.5 shrink-0" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 36, height: 36, backgroundColor: C.iconBg }}>
                            <MdLayers style={{ width: 16, height: 16, color: C.iconColor }} />
                        </div>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>Course Attendance</h2>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {courseReports.length > 0 ? (
                            <div className="min-w-[600px]">
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    {['Course', 'Overall', 'Live', 'Batch', 'Students'].map((h) => (
                                        <span key={h} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 p-4">
                                    {courseReports.map((course) => (
                                        <div key={course.courseId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-4 py-3 items-center transition-colors" 
                                            style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                            <p className="truncate pr-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{course.title}</p>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.btnPrimary }}>{course.overallAttendanceRate}%</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{course.liveAttendanceRate}%</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>{course.batchAttendanceRate}%</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{course.enrolledStudents}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <div className="flex items-center justify-center mb-3" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                    <MdVideocam style={{ width: 28, height: 28, color: C.textMuted, opacity: 0.5 }} />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No course attendance data yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Batch Attendance */}
                <div className="overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-4 flex items-center gap-2.5 shrink-0" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 36, height: 36, backgroundColor: C.iconBg }}>
                            <MdPeople style={{ width: 16, height: 16, color: C.iconColor }} />
                        </div>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>Batch Attendance</h2>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {batchReports.length > 0 ? (
                            <div className="min-w-[600px]">
                                <div className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr] px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    {['Batch', 'Course', 'Rate', 'Sessions', 'Students'].map((h) => (
                                        <span key={h} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 p-4">
                                    {batchReports.map((batch) => (
                                        <div key={batch.batchId} className="grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr] px-4 py-3 items-center transition-colors" 
                                            style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                            <p className="truncate pr-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{batch.batchName}</p>
                                            <p className="truncate pr-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>{batch.courseTitle}</p>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.btnPrimary }}>{batch.attendanceRate}%</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{batch.sessions}</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>{batch.students}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <div className="flex items-center justify-center mb-3" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                    <MdLayers style={{ width: 28, height: 28, color: C.textMuted, opacity: 0.5 }} />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No batch attendance data yet.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* At-Risk Students */}
            <div className="overflow-hidden flex flex-col animate-in fade-in duration-500 delay-500" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="px-6 py-4 flex items-center gap-2.5 shrink-0" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 36, height: 36, backgroundColor: C.dangerBg }}>
                        <MdWarning style={{ width: 16, height: 16, color: C.danger }} />
                    </div>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>Student Attendance Risk</h2>
                </div>
                <div className="overflow-x-auto custom-scrollbar p-4">
                    {students.length > 0 ? (
                        <div className="min-w-[1000px] flex flex-col gap-2">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_100px] px-4 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {['Student', 'Risk', 'Overall', 'Live', 'Batch', 'Tracked', 'Inactive', 'Action'].map((h) => (
                                    <span key={h} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                                ))}
                            </div>
                            {students.map((student) => {
                                const badge = riskBadge(student.riskLevel);
                                return (
                                    <div key={student.studentId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_100px] px-4 py-4 items-center transition-colors" 
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                        <div className="min-w-0 pr-2">
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>{student.email}</p>
                                        </div>
                                        <div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: '8px', textTransform: 'uppercase', backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                                                {student.riskLevel}
                                            </span>
                                        </div>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading }}>{student.attendance?.overallRate ?? 0}%</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>{student.attendance?.liveRate ?? 0}%</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>{student.attendance?.batchRate ?? 0}%</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>{student.attendance?.trackedSessions ?? 0}</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.danger }}>{student.inactivityDays ?? 'N/A'} days</span>
                                        <Link href={`/tutor/students/${student.studentId}`} className="text-decoration-none">
                                            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 cursor-pointer border-none transition-colors shadow-sm"
                                                style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: '8px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnPrimary; e.currentTarget.style.color = '#ffffff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.btnPrimary; }}>
                                                View <MdOpenInNew style={{ width: 12, height: 12 }} />
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 flex flex-col items-center">
                            <div className="flex items-center justify-center mb-3" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdWarning style={{ width: 28, height: 28, color: C.textMuted, opacity: 0.5 }} />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No students matched current filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}