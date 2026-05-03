'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import {
    MdWarning,
    MdHourglassEmpty,
    MdSearch,
    MdRefresh,
    MdShield,
    MdGppBad,
    MdVerifiedUser,
    MdMessage,
    MdPerson,
    MdError,
    MdAutoAwesome,
} from 'react-icons/md';
import { C, T, S, R } from '@/constants/studentTokens';

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

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({ title, value, subtext, tone = 'default', icon: Icon }) {
    const toneMap = {
        default: { bg: C.innerBg,    color: C.btnPrimary },
        success: { bg: C.successBg,  color: C.success    },
        warning: { bg: C.warningBg,  color: C.warning    },
        danger:  { bg: C.dangerBg,   color: C.danger     },
    };
    const ts = toneMap[tone] || toneMap.default;

    return (
        <div
            className="p-4 flex items-center justify-between"
            style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
        >
            <div className="flex items-center gap-4">
                <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: ts.bg, borderRadius: '10px' }}
                >
                    <Icon style={{ width: 20, height: 20, color: ts.color }} />
                </div>
                <div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                        {title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1 }}>
                            {value}
                        </p>
                        <span
                            style={{
                                fontFamily:      T.fontFamily,
                                fontSize:        T.size.xs,
                                fontWeight:      T.weight.bold,
                                color:           ts.color,
                                backgroundColor: ts.bg,
                                padding:         '2px 8px',
                                borderRadius:    '10px',
                            }}
                        >
                            {subtext}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Risk badge style ─────────────────────────────────────────────────────────
const riskStyle = (risk) => {
    if (risk === 'high')   return { backgroundColor: C.dangerBg,  borderColor: C.dangerBorder,  color: C.danger  };
    if (risk === 'medium') return { backgroundColor: C.warningBg, borderColor: C.warningBorder, color: C.warning };
    return                        { backgroundColor: C.successBg, borderColor: C.successBorder, color: C.success };
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TutorAtRiskStudentsPage() {
    const router          = useRouter();
    const { confirmDialog } = useConfirm();

    const [students, setStudents]       = useState([]);
    const [summary, setSummary]         = useState(null);
    const [pagination, setPagination]   = useState({ total: 0, page: 1, pages: 1, limit: 20 });
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [blockingId, setBlockingId]   = useState(null);

    const [searchInput, setSearchInput]         = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [riskFilter, setRiskFilter]           = useState('all');
    const [sortBy, setSortBy]                   = useState('riskScore');
    const [minRiskScore, setMinRiskScore]       = useState(45);
    const [page, setPage]                       = useState(1);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => { setPage(1); }, [riskFilter, sortBy, minRiskScore, debouncedSearch]);

    useEffect(() => {
        fetchAtRiskStudents(loading);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [riskFilter, sortBy, minRiskScore, debouncedSearch, page]);

    const fetchAtRiskStudents = async (isFirstLoad = false) => {
        try {
            if (isFirstLoad) setLoading(true);
            else setRefreshing(true);

            const res = await api.get('/tutor/dashboard/reports/at-risk', {
                params: {
                    risk:         riskFilter !== 'all' ? riskFilter : undefined,
                    search:       debouncedSearch || undefined,
                    sortBy,
                    sortOrder:    'desc',
                    minRiskScore,
                    page,
                    limit:        20,
                },
            });

            if (!res.data?.success) { toast.error('Failed to load at-risk students'); return; }

            setStudents(res.data.students || []);
            setSummary(res.data.summary || null);
            setPagination(res.data.pagination || { total: 0, page: 1, pages: 1, limit: 20 });
        } catch (error) {
            console.error('Load at-risk students error:', error);
            toast.error(error.response?.data?.message || 'Failed to load at-risk students');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggleBlock = async (student) => {
        const isBlocked = Boolean(student.isBlockedByTutor);
        const action    = isBlocked ? 'unblock' : 'block';

        const ok = await confirmDialog(
            `${isBlocked ? 'Unblock' : 'Block'} Student`,
            `${isBlocked ? 'Allow' : 'Restrict'} ${student.name} from viewing you as tutor?`,
            { variant: isBlocked ? 'default' : 'destructive' }
        );
        if (!ok) return;

        try {
            setBlockingId(student.studentId);
            await api.post(`/tutor/dashboard/students/${student.studentId}/${action}`);
            setStudents(prev =>
                prev.map(item =>
                    String(item.studentId) === String(student.studentId)
                        ? { ...item, isBlockedByTutor: !isBlocked }
                        : item
                )
            );
            toast.success(`Student ${action}ed successfully`);
        } catch (error) {
            console.error('Block/unblock student error:', error);
            toast.error(error.response?.data?.message || `Failed to ${action} student`);
        } finally {
            setBlockingId(null);
        }
    };

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
                Loading at-risk students...
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
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5"
                style={sectionCard}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.dangerBg }}
                    >
                        <MdWarning style={{ width: 20, height: 20, color: C.danger }} />
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
                            At-Risk Students
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
                            Dashboard / At-Risk Students
                        </p>
                    </div>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={() => fetchAtRiskStudents(false)}
                    disabled={refreshing}
                    className="flex items-center justify-center h-10 px-5 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60"
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
                    {refreshing
                        ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />
                        : <MdRefresh        style={{ width: 16, height: 16 }} />
                    }
                    Refresh Data
                </button>
            </div>

            {/* ── Stats ───────────────────────────────────────────────────── */}
            <div
                className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
                style={sectionCard}
            >
                <MetricCard title="Filtered At-Risk" value={summary?.filteredAtRiskCount ?? 0} subtext={`of ${summary?.atRiskCount ?? 0} total`}               tone="warning"                                                            icon={MdShield}  />
                <MetricCard title="High Risk"         value={summary?.highRiskCount   ?? 0}     subtext="Immediate action needed"                                  tone={(summary?.highRiskCount ?? 0) > 0 ? 'danger' : 'default'}          icon={MdWarning} />
                <MetricCard title="Medium Risk"       value={summary?.mediumRiskCount ?? 0}     subtext="Monitor and support"                                      tone="warning"                                                            icon={MdPerson}  />
                <MetricCard title="Tracked Students"  value={summary?.totalStudents   ?? 0}     subtext="Across your courses"                                      tone="default"                                                            icon={MdPerson}  />
            </div>

            {/* ── Filters ─────────────────────────────────────────────────── */}
            <div
                className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-4"
                style={sectionCard}
            >
                {/* Search */}
                <div className="relative lg:col-span-2">
                    <MdSearch
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ width: 18, height: 18, color: C.text }}
                    />
                    <input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search students..."
                        style={{ ...baseInputStyle, paddingLeft: '40px' }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>

                {/* Risk Filter */}
                <select
                    value={riskFilter}
                    onChange={e => setRiskFilter(e.target.value)}
                    style={baseInputStyle}
                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                >
                    <option value="all">High + Medium</option>
                    <option value="high">High Risk Only</option>
                    <option value="medium">Medium Risk Only</option>
                </select>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={baseInputStyle}
                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                >
                    <option value="riskScore">Sort by Risk Score</option>
                    <option value="inactivityDays">Sort by Inactivity</option>
                    <option value="progress">Sort by Progress</option>
                    <option value="examAverage">Sort by Exam Avg</option>
                    <option value="assignmentRate">Sort by Assignment Rate</option>
                    <option value="attendanceRate">Sort by Attendance</option>
                    <option value="name">Sort by Name</option>
                </select>

                {/* Min Risk Score Slider */}
                <div className="flex flex-col justify-center px-2">
                    <label
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size.xs,
                            fontWeight:  T.weight.bold,
                            color:       C.text,
                            marginBottom: '6px',
                        }}
                    >
                        Min Risk Score:{' '}
                        <span style={{ color: C.heading, fontWeight: T.weight.bold }}>{minRiskScore}</span>
                    </label>
                    <input
                        type="range" min={0} max={100} step={5}
                        value={minRiskScore}
                        onChange={e => setMinRiskScore(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: C.btnPrimary }}
                    />
                </div>
            </div>

            {/* ── Data Table ──────────────────────────────────────────────── */}
            <div className="p-5 overflow-x-auto" style={sectionCard}>
                <div className="min-w-[1050px]">

                    {/* Table Header */}
                    <div
                        className="grid grid-cols-[2fr_1.5fr_1fr_1fr_2.5fr_2fr] gap-4 px-4 pb-3 mb-2"
                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                    >
                        {['Student', 'Courses', 'Progress', 'Risk', 'Indicators (Exam / Assgn / Inactive)', 'Actions'].map(h => (
                            <span
                                key={h}
                                style={{
                                    fontFamily:    T.fontFamily,
                                    fontSize:      T.size.xs,
                                    fontWeight:    T.weight.bold,
                                    color:         C.text,
                                    textTransform: 'uppercase',
                                    letterSpacing: T.tracking.wider,
                                }}
                            >
                                {h}
                            </span>
                        ))}
                    </div>

                    {/* Rows */}
                    {students.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {students.map(student => (
                                <div
                                    key={String(student.studentId)}
                                    className="grid grid-cols-[2fr_1.5fr_1fr_1fr_2.5fr_2fr] gap-4 px-4 py-4 items-center transition-all duration-150"
                                    style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = C.btnPrimary}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}
                                >
                                    {/* Student */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="flex items-center justify-center shrink-0"
                                            style={{
                                                width:           40,
                                                height:          40,
                                                borderRadius:    '10px',
                                                background:      student.isBlockedByTutor ? C.dangerBg    : C.gradientBtn,
                                                color:           student.isBlockedByTutor ? C.danger      : '#ffffff',
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.md,
                                                fontWeight:      T.weight.bold,
                                                border:          student.isBlockedByTutor ? `1px solid ${C.dangerBorder}` : 'none',
                                            }}
                                        >
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading, margin: '0 0 2px 0' }}>
                                                {student.name}
                                            </p>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                {student.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Courses */}
                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                                        {(student.courses || []).join(', ') || 'N/A'}
                                    </p>

                                    {/* Progress */}
                                    <div className="flex flex-col justify-center">
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                            {student.indicators?.progress ?? 0}%
                                        </span>
                                        <div
                                            style={{
                                                width:        '100%',
                                                height:       '6px',
                                                backgroundColor: C.cardBg,
                                                borderRadius: R.full,
                                                overflow:     'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height:          '100%',
                                                    width:           `${student.indicators?.progress ?? 0}%`,
                                                    backgroundColor: student.riskLevel === 'high' ? C.danger : C.warning,
                                                    borderRadius:    R.full,
                                                    transition:      'width 0.3s ease',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Risk Badge */}
                                    <div className="flex items-center">
                                        <span
                                            className="uppercase"
                                            style={{
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.bold,
                                                padding:         '4px 8px',
                                                borderRadius:    '10px',
                                                border:          `1px solid ${riskStyle(student.riskLevel).borderColor}`,
                                                ...riskStyle(student.riskLevel),
                                            }}
                                        >
                                            {student.riskLevel} • {student.riskScore}
                                        </span>
                                    </div>

                                    {/* Indicators */}
                                    <div className="flex items-center gap-4">
                                        {[
                                            { label: 'Exam Avg', value: student.indicators?.examAverage === null ? 'N/A' : `${student.indicators?.examAverage}%` },
                                            { label: 'Assgn',    value: `${student.indicators?.assignmentRate ?? 0}%` },
                                            { label: 'Inactive', value: `${student.indicators?.inactivityDays ?? 'N/A'} d` },
                                        ].map(({ label, value }) => (
                                            <div key={label}>
                                                <span
                                                    style={{
                                                        display:       'block',
                                                        fontFamily:    T.fontFamily,
                                                        fontSize:      T.size.xs,
                                                        color:         C.text,
                                                        fontWeight:    T.weight.bold,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: T.tracking.wider,
                                                        marginBottom:  2,
                                                    }}
                                                >
                                                    {label}
                                                </span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {/* Message */}
                                        <button
                                            onClick={() => router.push(`/tutor/messages?studentId=${student.studentId}`)}
                                            className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-75"
                                            style={{ width: 32, height: 32, backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}
                                            title="Message"
                                        >
                                            <MdMessage style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                        </button>

                                        {/* View Profile */}
                                        <Link href={`/tutor/students/${student.studentId}`}>
                                            <button
                                                className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-75"
                                                style={{ width: 32, height: 32, backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}
                                                title="View Profile"
                                            >
                                                <MdPerson style={{ width: 14, height: 14, color: C.btnPrimary }} />
                                            </button>
                                        </Link>

                                        {/* Block / Unblock */}
                                        <button
                                            onClick={() => handleToggleBlock(student)}
                                            disabled={blockingId === student.studentId}
                                            className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-75 disabled:opacity-50"
                                            style={{
                                                width:           32,
                                                height:          32,
                                                backgroundColor: student.isBlockedByTutor ? C.successBg  : C.dangerBg,
                                                color:           student.isBlockedByTutor ? C.success    : C.danger,
                                                border:          `1px solid ${student.isBlockedByTutor ? C.successBorder : C.dangerBorder}`,
                                                borderRadius:    '10px',
                                            }}
                                            title={student.isBlockedByTutor ? 'Unblock' : 'Block'}
                                        >
                                            {blockingId === student.studentId
                                                ? <MdHourglassEmpty style={{ width: 14, height: 14 }} className="animate-spin" />
                                                : student.isBlockedByTutor
                                                    ? <MdVerifiedUser style={{ width: 14, height: 14 }} />
                                                    : <MdGppBad       style={{ width: 14, height: 14 }} />
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="text-center py-20 flex flex-col items-center">
                            <div
                                className="flex items-center justify-center mb-4"
                                style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: R.lg }}
                            >
                                <MdError style={{ width: 28, height: 28, color: C.text, opacity: 0.4 }} />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 6px 0' }}>
                                No at-risk students found.
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                Try adjusting your filters or search term.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Pagination ──────────────────────────────────────────── */}
                <div
                    className="flex items-center justify-between pt-5 mt-3"
                    style={{ borderTop: `1px solid ${C.cardBorder}` }}
                >
                    <p
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size.base,
                            fontWeight:  T.weight.medium,
                            color:       C.text,
                            margin:      0,
                        }}
                    >
                        Showing page {pagination.page} of {pagination.pages} · {pagination.total} total
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={pagination.page <= 1}
                            className="h-8 px-4 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-75 disabled:opacity-40"
                            style={{
                                backgroundColor: C.btnViewAllBg,
                                color:           C.btnViewAllText,
                                border:          `1px solid ${C.cardBorder}`,
                                borderRadius:    '10px',
                                fontFamily:      T.fontFamily,
                                fontSize:        T.size.base,
                                fontWeight:      T.weight.bold,
                            }}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(prev => Math.min(pagination.pages || 1, prev + 1))}
                            disabled={pagination.page >= (pagination.pages || 1)}
                            className="h-8 px-4 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-75 disabled:opacity-40"
                            style={{
                                backgroundColor: C.btnViewAllBg,
                                color:           C.btnViewAllText,
                                border:          `1px solid ${C.cardBorder}`,
                                borderRadius:    '10px',
                                fontFamily:      T.fontFamily,
                                fontSize:        T.size.base,
                                fontWeight:      T.weight.bold,
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}