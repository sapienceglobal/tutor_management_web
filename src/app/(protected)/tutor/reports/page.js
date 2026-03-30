'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    AlertTriangle, BarChart3, BookOpen, CalendarClock,
    ClipboardCheck, Download, FileText, Loader2, Users, Search
} from 'lucide-react';
import { C, T, S, R } from '@/constants/tutorTokens';

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
    backgroundColor: '#E3DFF8', // Inner Box Color
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

function MetricCard({ icon: Icon, title, value, subtitle, tone = 'default' }) {
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
                <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ backgroundColor: style.bg, borderRadius: R.md }}>
                    <Icon size={16} color={style.color} />
                </div>
            </div>
            <div className="mt-auto">
                <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: style.color === C.btnPrimary ? C.heading : style.color, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '4px 0 0 0' }}>
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

export default function TutorReportsPage() {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [report, setReport] = useState(null);
    const [courseReports, setCourseReports] = useState([]);
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // Added Search state for UI completeness

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

    const riskBadge = (level) => {
        if (level === 'high') return { label: 'High', bg: C.dangerBg, border: C.dangerBorder, color: C.danger };
        return { label: 'Medium', bg: C.warningBg, border: C.warningBorder, color: C.warning };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading reports...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <FileText size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Reports Hub
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                            Generated: {formattedGeneratedAt}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export CSV
                </button>
            </div>

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard icon={BookOpen} title="Total Courses" value={report?.overview?.totalCourses ?? 0} subtitle={`${report?.overview?.publishedCourses ?? 0} published`} />
                <MetricCard icon={Users} title="Total Students" value={report?.overview?.totalStudents ?? 0} subtitle={`${report?.overview?.activeEnrollments ?? 0} active enrollments`} />
                <MetricCard icon={CalendarClock} title="Upcoming Items" value={(report?.overview?.upcomingClasses ?? 0) + (report?.overview?.upcomingExams ?? 0)} subtitle={`${report?.overview?.upcomingClasses ?? 0} classes, ${report?.overview?.upcomingExams ?? 0} exams`} tone="warning" />
                <MetricCard icon={AlertTriangle} title="At-Risk Students" value={report?.students?.atRiskCount ?? 0} subtitle={`${report?.students?.highRiskCount ?? 0} high risk`} tone={report?.students?.highRiskCount > 0 ? 'danger' : 'success'} />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard icon={BarChart3} title="Course Health" value={`${report?.courses?.averageProgress ?? 0}%`} subtitle={`Completion rate ${report?.courses?.completionRate ?? 0}%`} />
                <MetricCard icon={ClipboardCheck} title="Exam Performance" value={`${report?.exams?.averageScore ?? 0}%`} subtitle={`Pass rate ${report?.exams?.passRate ?? 0}%`} />
                <MetricCard icon={FileText} title="Assignments" value={`${report?.assignments?.submissionRate ?? 0}%`} subtitle={`${report?.assignments?.pendingReview ?? 0} pending review`} />
                <MetricCard icon={Users} title="Attendance" value={`${report?.attendance?.attendanceRate ?? 0}%`} subtitle={`${report?.attendance?.totalSessions ?? 0} sessions tracked`} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Course Reports Table */}
                <div className="xl:col-span-2 overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-5 py-4 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Course Reports</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                            <input 
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ ...baseInputStyle, paddingLeft: '36px', backgroundColor: C.surfaceWhite }}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {courseReports.length > 0 ? (
                            <div className="min-w-[800px]">
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-5 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    {['Course', 'Status', 'Students', 'Progress', 'Exam Score', 'Attendance'].map((label) => (
                                        <span key={label} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>{label}</span>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 p-3">
                                    {courseReports.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map((course) => {
                                        const isPublished = course.status === 'published';
                                        return (
                                            <div key={course.courseId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-3 py-3 items-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                                <p className="truncate pr-2" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{course.title}</p>
                                                <div>
                                                    <span style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: R.md, textTransform: 'uppercase', backgroundColor: isPublished ? C.successBg : C.warningBg, color: isPublished ? C.success : C.warning, border: `1px solid ${isPublished ? C.successBorder : C.warningBorder}` }}>
                                                        {course.status}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.text }}>{course.students}</span>
                                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.btnPrimary }}>{course.averageProgress}%</span>
                                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{course.averageExamScore}%</span>
                                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.text }}>{course.attendanceRate}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <BookOpen size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No course report data yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* At-Risk Students List */}
                <div className="xl:col-span-1 overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-5 py-4 shrink-0 flex items-center justify-between gap-2" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>At-Risk Students</h2>
                        <span style={{ backgroundColor: C.dangerBg, color: C.danger, padding: '4px 10px', borderRadius: R.full, fontSize: '10px', fontWeight: T.weight.black, border: `1px solid ${C.dangerBorder}` }}>
                            {atRiskStudents.length} flagged
                        </span>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar p-3 space-y-3">
                        {atRiskStudents.length > 0 ? (
                            atRiskStudents.slice(0, 25).map((student) => {
                                const badge = riskBadge(student.riskLevel);
                                return (
                                    <div key={student.studentId} className="p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div className="min-w-0">
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                                                <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{student.email}</p>
                                            </div>
                                            <span className="shrink-0 uppercase" style={{ fontSize: '10px', fontWeight: T.weight.black, backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '2px 6px', borderRadius: R.md }}>
                                                {badge.label} • {student.riskScore}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {[
                                                { label: 'Progress', value: `${student.indicators?.progress ?? 0}%` },
                                                { label: 'Exam', value: student.indicators?.examAverage === null ? 'N/A' : `${student.indicators.examAverage}%` },
                                                { label: 'Assign', value: `${student.indicators?.assignmentRate ?? 0}%` },
                                                { label: 'Attendance', value: `${student.indicators?.attendanceRate ?? 0}%` },
                                            ].map((item, idx) => (
                                                <div key={idx} className="p-2" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.md, border: `1px solid ${C.cardBorder}` }}>
                                                    <p style={{ fontSize: '9px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 2px 0' }}>{item.label}</p>
                                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{item.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="line-clamp-2 mb-3" style={{ fontSize: '11px', color: C.danger, fontWeight: T.weight.bold }}>
                                            {(student.reasons || []).join(' • ')}
                                        </p>

                                        <Link href={`/tutor/students/${student.studentId}`} className="text-decoration-none">
                                            <button className="w-full h-8 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 border-none"
                                                style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                                                View Profile
                                            </button>
                                        </Link>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                                <AlertTriangle size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>No at-risk students</p>
                                <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: 0 }}>Everyone is performing well.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}