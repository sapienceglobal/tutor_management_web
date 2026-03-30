'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
    Loader2, Search, ArrowUp, CheckSquare, AlertCircle, 
    Download, Filter, ArrowUpRight, TrendingUp, ChevronLeft, ChevronRight, 
    Plus
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { C, T, FX, S, R } from '@/constants/tutorTokens';

// ── Shared Colors & Input Styles ─────────────────────────────────────────────
const outerCard = '#EAE8FA';   
const innerBox  = '#E3DFF8';   

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
    padding: '8px 14px',
    transition: 'all 0.2s ease',
};

const ITEMS_PER_PAGE = 10;

// ── Mock Chart Data (Fallback if API doesn't provide trend) ───────────────
const mockTrendData = [
  { month: 'Nov', score: 65 },
  { month: 'Dec', score: 68 },
  { month: 'Jan', score: 78 },
  { month: 'Feb', score: 88 },
  { month: 'Mar', score: 82 },
  { month: 'Apr', score: 91 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#fff', border: `1px solid ${C.cardBorder}`, borderRadius: R.md, padding: '8px 12px', boxShadow: S.cardHover }}>
                <p style={{ fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, margin: '0 0 4px 0', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ fontSize: T.size.sm, color: C.btnPrimary, fontWeight: T.weight.black, margin: 0 }}>
                    {payload[0].value}% Score
                </p>
            </div>
        );
    }
    return null;
};

// ── Metric Card Component (Styled exactly like image) ─────────────────────
function TopMetricCard({ title, value, subtext, icon: Icon, colorClass, bgClass, trendIcon: TrendIcon }) {
    return (
        <div className="p-5 flex flex-col justify-between h-[120px]" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bgClass }}>
                    <Icon size={16} color={colorClass} />
                </div>
                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{title}</p>
            </div>
            <div className="flex items-end gap-3 mt-auto">
                <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>{value}</p>
                {subtext && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full mb-1" 
                        style={{ backgroundColor: bgClass, color: colorClass, fontSize: '10px', fontWeight: T.weight.bold }}>
                        {TrendIcon && <TrendIcon size={10} />} {subtext}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Grade Calculator Helper ────────────────────────────────────────────────
const getGrade = (score) => {
    if (!score && score !== 0) return 'N/A';
    if (score >= 90) return { letter: 'A', color: C.success, bg: C.successBg };
    if (score >= 70) return { letter: 'B', color: C.warning, bg: C.warningBg };
    if (score >= 50) return { letter: 'C', color: '#F97316', bg: '#FFEDD5' };
    return { letter: 'F', color: C.danger, bg: C.dangerBg };
};

export default function TutorStudentPerformancePage() {
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    
    // Filters & Pagination
    const [searchInput, setSearchInput] = useState('');
    const [batchFilter, setBatchFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [sortBy, setSortBy] = useState('score');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tutor/dashboard/reports/students', {
                params: { sortOrder: 'desc' }, 
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
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await api.get('/tutor/dashboard/reports/students/export', { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Student_Performance_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Report exported successfully');
        } catch {
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    // ── Local Filtering & Sorting ──────────────────────────────────────────
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchInput.toLowerCase()) || 
                                  (s.studentId && s.studentId.toLowerCase().includes(searchInput.toLowerCase()));
            const matchesBatch = batchFilter === 'all' ? true : s.batch === batchFilter;
            const matchesCourse = courseFilter === 'all' ? true : s.courses?.includes(courseFilter);
            return matchesSearch && matchesBatch && matchesCourse;
        }).sort((a, b) => {
            if (sortBy === 'score') return (b.indicators?.examAverage || 0) - (a.indicators?.examAverage || 0);
            if (sortBy === 'progress') return (b.indicators?.progress || 0) - (a.indicators?.progress || 0);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });
    }, [students, searchInput, batchFilter, courseFilter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    // FIX: Using filteredStudents.length instead of filteredCourses.length
    const startItem = filteredStudents.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem   = Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length);

    // Reset pagination on filter change
    useEffect(() => { setCurrentPage(1); }, [searchInput, batchFilter, courseFilter, sortBy]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading student performance...</p>
            </div>
        );
    }

    // Calculated Mock Stats
    const avgScore = summary?.overallExamAverage ?? 82; 
    const completedCourses = report?.courses?.completedCount ?? 178;
    const incompleteAssigns = summary?.totalPendingAssignments ?? 56;

    return (
        <div className="w-full min-h-screen p-6 pb-24 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Dashboard</span>
                        <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>/</span>
                        <span style={{ fontSize: T.size.xs, fontWeight: T.weight.black, color: C.heading, textTransform: 'uppercase' }}>Student Performance</span>
                    </div>
                    <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: 0 }}>
                        Student Performance
                    </h1>
                </div>
                <Link href="/tutor/students/add" className="text-decoration-none">
                    <button className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        <Plus size={16} /> Add Student
                    </button>
                </Link>
            </div>

            {/* Top 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TopMetricCard 
                    title="Average Score" value={`${avgScore}%`} subtext="+ 5.2%" 
                    icon={ArrowUpRight} colorClass={C.success} bgClass={C.successBg} trendIcon={ArrowUp} 
                />
                <TopMetricCard 
                    title="Completed Courses" value={`${completedCourses}`} subtext="+ 15%" 
                    icon={CheckSquare} colorClass={C.btnPrimary} bgClass={'#E3DFF8'} trendIcon={ArrowUp} 
                />
                <div className="p-5 flex flex-col justify-between h-[120px]" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.dangerBg }}>
                            <AlertCircle size={16} color={C.danger} />
                        </div>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Incomplete Assignments</p>
                    </div>
                    <div className="flex items-end gap-3 mt-auto">
                        <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>{incompleteAssigns}</p>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="overflow-hidden flex flex-col h-[320px]" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="px-6 py-4 flex items-center justify-between z-10 relative">
                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Average Score Trend</h2>
                    <select style={{ ...baseInputStyle, width: '150px', height: '36px' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                        <option>Last 6 Months</option>
                        <option>Last 12 Months</option>
                    </select>
                </div>
                <div className="flex-1 -mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockTrendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={C.btnPrimary} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={C.btnPrimary} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="month" stroke={C.textMuted} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                            <YAxis stroke={C.textMuted} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(117,115,232,0.1)', strokeWidth: 2 }} />
                            <Line type="monotone" dataKey="score" stroke={C.btnPrimary} strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: C.btnPrimary, strokeWidth: 2 }} activeDot={{ r: 6, fill: C.btnPrimary, strokeWidth: 0 }} fill="url(#colorScore)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center pb-4 pt-1 z-10 relative">
                    <span className="flex items-center gap-2" style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.btnPrimary }} /> Avg Score
                    </span>
                </div>
            </div>

            {/* Student Table Area */}
            <div className="overflow-hidden flex flex-col" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="p-5" style={{ backgroundColor: innerBox, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Student Performance</h2>
                    
                    {/* Filters */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>Filter by:</span>
                            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ ...baseInputStyle, width: '140px', height: '38px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="all">All Batches</option>
                            </select>
                            <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{ ...baseInputStyle, width: '140px', height: '38px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="all">All Courses</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>Sort by:</span>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...baseInputStyle, width: '120px', height: '38px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="score">Score</option>
                                <option value="progress">Progress</option>
                                <option value="name">Name</option>
                            </select>
                            <button className="flex items-center justify-center gap-1.5 h-[38px] px-4 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm shrink-0"
                                style={{ backgroundColor: C.btnPrimary, color: '#fff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <Filter size={14} /> Filter
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search students by name, email, ID..."
                                style={{ ...baseInputStyle, paddingLeft: '36px', height: '40px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                        </div>
                        <button onClick={handleExport} disabled={exporting} className="flex items-center justify-center gap-2 h-10 px-4 cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                            style={{ backgroundColor: C.surfaceWhite, color: C.heading, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.cardBorder}` }}>
                            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[1000px]">
                        {/* Table Header */}
                        <div className="grid grid-cols-[40px_2fr_1.5fr_1fr_80px_80px_100px] gap-4 px-5 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                            {['', 'Student', 'Course/Batch', 'Progress', 'Score', 'Rank', 'Status'].map((h, i) => (
                                <span key={i} className={i >= 3 ? 'text-center' : ''} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                            ))}
                        </div>

                        {/* Table Rows */}
                        {paginatedStudents.length > 0 ? (
                            <div className="flex flex-col">
                                {paginatedStudents.map((student, idx) => {
                                    const progress = student.indicators?.progress ?? 0;
                                    const score = student.indicators?.examAverage ?? 0;
                                    const gradeInfo = getGrade(score);
                                    
                                    // Status pill styling
                                    const isComplete = progress >= 90;
                                    const statusText = isComplete ? 'Completed' : 'Pending';
                                    const statusBg = isComplete ? C.successBg : C.warningBg;
                                    const statusColor = isComplete ? C.success : C.warning;
                                    const statusBorder = isComplete ? C.successBorder : C.warningBorder;

                                    return (
                                        <div key={student.studentId} className="grid grid-cols-[40px_2fr_1.5fr_1fr_80px_80px_100px] gap-4 px-5 py-3 items-center transition-colors hover:bg-white/40" 
                                            style={{ borderBottom: idx !== paginatedStudents.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                            
                                            <div className="flex justify-center">
                                                <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: C.btnPrimary }} />
                                            </div>

                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.heading, fontWeight: T.weight.bold }}>
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                                                    <p className="truncate" style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, margin: 0, textTransform: 'uppercase' }}>STU100{idx+11}</p>
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                    {(student.courses || ['Data Science - Batch A'])[0]}
                                                </p>
                                            </div>

                                            {/* Progress with Letter Grade */}
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="flex flex-col w-full max-w-[80px]">
                                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{progress}%</span>
                                                    <div className="w-full h-1.5 rounded-full overflow-hidden mt-1" style={{ backgroundColor: '#E3DFF8' }}>
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: C.btnPrimary }} />
                                                    </div>
                                                </div>
                                                <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs" style={{ backgroundColor: getGrade(progress).bg, color: getGrade(progress).color }}>
                                                    {getGrade(progress).letter}
                                                </span>
                                            </div>

                                            {/* Score Grade */}
                                            <div className="text-center flex justify-center">
                                                <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm" style={{ backgroundColor: gradeInfo.bg, color: gradeInfo.color }}>
                                                    {gradeInfo.letter}
                                                </span>
                                            </div>

                                            <div className="text-center">
                                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                    #{idx + 1}
                                                </span>
                                            </div>

                                            <div className="text-center">
                                                <span style={{ fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', padding: '4px 10px', borderRadius: R.full, backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusBorder}` }}>
                                                    {statusText}
                                                </span>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No students matched the current filters.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Pagination */}
                {filteredStudents.length > 0 && (
                    <div className="px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: innerBox, borderTop: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center gap-2">
                            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Rows per page:</span>
                            <select style={{ ...baseInputStyle, width: '60px', height: '28px', padding: '2px 8px', fontSize: T.size.xs }}>
                                <option>10</option>
                            </select>
                        </div>
                        
                        <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                            Showing {startItem} to {endItem} of {filteredStudents.length} students
                        </p>

                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="flex items-center justify-center w-7 h-7 cursor-pointer border-none disabled:opacity-50 transition-opacity hover:opacity-80"
                                style={{ backgroundColor: 'transparent', color: C.heading }}>
                                <ChevronLeft size={16} />
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)}
                                    className="flex items-center justify-center w-7 h-7 cursor-pointer border-none transition-all shadow-sm"
                                    style={{
                                        backgroundColor: currentPage === page ? C.btnPrimary : 'transparent',
                                        color: currentPage === page ? '#fff' : C.heading,
                                        borderRadius: R.sm, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily,
                                    }}>
                                    {page}
                                </button>
                            ))}
                            
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="flex items-center justify-center w-7 h-7 cursor-pointer border-none disabled:opacity-50 transition-opacity hover:opacity-80"
                                style={{ backgroundColor: 'transparent', color: C.heading }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}