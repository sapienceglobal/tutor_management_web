'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import {
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  MessageSquare,
  UserRound,
  CircleAlert,
} from 'lucide-react';
import { C, T, FX, S, R } from '@/constants/tutorTokens';

// Input focus handlers
const onFocusHandler = e => {
  e.target.style.borderColor = C.btnPrimary;
  e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
  e.target.style.borderColor = 'transparent';
  e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
  backgroundColor: '#E3DFF8',
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

function MetricCard({ title, value, subtext, tone = 'default', icon: Icon }) {
  const toneMap = {
    default: { bg: '#EAE8FA', color: C.btnPrimary },
    success: { bg: C.successBg, color: C.success },
    warning: { bg: C.warningBg, color: C.warning },
    danger: { bg: C.dangerBg, color: C.danger },
  };
  const toneStyle = toneMap[tone] || toneMap.default;

  return (
    <div className="p-4 flex items-center justify-between" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: toneStyle.bg, borderRadius: R.md }}>
          <Icon size={20} color={toneStyle.color} />
        </div>
        <div>
          <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{title}</p>
          <div className="flex items-center gap-3 mt-1">
            <p style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>{value}</p>
            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: toneStyle.color, backgroundColor: toneStyle.bg, padding: '2px 8px', borderRadius: R.md }}>
              {subtext}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const riskStyle = (risk) => {
  if (risk === 'high') return { backgroundColor: C.dangerBg, borderColor: C.dangerBorder, color: C.danger };
  if (risk === 'medium') return { backgroundColor: C.warningBg, borderColor: C.warningBorder, color: C.warning };
  return { backgroundColor: C.successBg, borderColor: C.successBorder, color: C.success };
};

export default function TutorAtRiskStudentsPage() {
  const router = useRouter();
  const { confirmDialog } = useConfirm();

  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockingId, setBlockingId] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('riskScore');
  const [minRiskScore, setMinRiskScore] = useState(45);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [riskFilter, sortBy, minRiskScore, debouncedSearch]);

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
          risk: riskFilter !== 'all' ? riskFilter : undefined,
          search: debouncedSearch || undefined,
          sortBy,
          sortOrder: 'desc',
          minRiskScore,
          page,
          limit: 20,
        },
      });

      if (!res.data?.success) {
        toast.error('Failed to load at-risk students');
        return;
      }

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
    const action = isBlocked ? 'unblock' : 'block';

    const ok = await confirmDialog(
      `${isBlocked ? 'Unblock' : 'Block'} Student`,
      `${isBlocked ? 'Allow' : 'Restrict'} ${student.name} from viewing you as tutor?`,
      { variant: isBlocked ? 'default' : 'destructive' }
    );
    if (!ok) return;

    try {
      setBlockingId(student.studentId);
      await api.post(`/tutor/dashboard/students/${student.studentId}/${action}`);
      setStudents((prev) =>
        prev.map((item) =>
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
        <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading at-risk students...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
      
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ color: C.heading, fontSize: T.size['2xl'], fontWeight: T.weight.black, margin: '0 0 4px 0' }}>At-Risk Students</h1>
          <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Dashboard / At-Risk Students</p>
        </div>
        <button
          onClick={() => fetchAtRiskStudents(false)}
          disabled={refreshing}
          className="flex items-center justify-center h-10 px-5 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-60 shadow-md"
          style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh Data
        </button>
      </div>

      {/* ── Stats Section ─────────────────────────────────────────────── */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
        <MetricCard title="Filtered At-Risk" value={summary?.filteredAtRiskCount ?? 0} subtext={`of ${summary?.atRiskCount ?? 0} total`} tone="warning" icon={ShieldAlert} />
        <MetricCard title="High Risk" value={summary?.highRiskCount ?? 0} subtext="Immediate action needed" tone={(summary?.highRiskCount ?? 0) > 0 ? 'danger' : 'default'} icon={AlertTriangle} />
        <MetricCard title="Medium Risk" value={summary?.mediumRiskCount ?? 0} subtext="Monitor and support" tone="warning" icon={UserRound} />
        <MetricCard title="Tracked Students" value={summary?.totalStudents ?? 0} subtext="Across your courses" icon={UserRound} />
      </div>

      {/* ── Filters Section ───────────────────────────────────────────── */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search students..."
            style={{ ...baseInputStyle, paddingLeft: '36px' }}
            onFocus={onFocusHandler} onBlur={onBlurHandler}
          />
        </div>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          style={baseInputStyle}
          onFocus={onFocusHandler} onBlur={onBlurHandler}
        >
          <option value="all">High + Medium</option>
          <option value="high">High Risk Only</option>
          <option value="medium">Medium Risk Only</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
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

        <div className="flex flex-col justify-center px-2">
          <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, marginBottom: '6px' }}>Min Risk Score: <span style={{ color: C.heading }}>{minRiskScore}</span></label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minRiskScore}
            onChange={(e) => setMinRiskScore(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: C.btnPrimary }}
          />
        </div>
      </div>

      {/* ── Data Table ────────────────────────────────────────────────── */}
      <div className="p-5 overflow-x-auto" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
        <div className="min-w-[1050px]">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_2.5fr_2fr] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Student</span>
            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Courses</span>
            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Progress</span>
            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Risk</span>
            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Indicators (Exam / Assgn / Inactive)</span>
            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Actions</span>
          </div>

          {/* Rows */}
          {students.length > 0 ? (
            <div className="flex flex-col gap-2">
              {students.map((student) => (
                <div key={String(student.studentId)} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_2.5fr_2fr] gap-4 px-4 py-4 items-center"
                     style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                  
                  {/* Student */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center shrink-0"
                        style={{ 
                            width: '40px', height: '40px', borderRadius: R.full, 
                            background: student.isBlockedByTutor ? C.dangerBg : C.gradientBtn,
                            color: student.isBlockedByTutor ? C.danger : '#ffffff',
                            fontSize: T.size.md, fontWeight: T.weight.bold,
                            border: student.isBlockedByTutor ? `1px solid ${C.dangerBorder}` : 'none'
                        }}>
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                      <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{student.email}</p>
                    </div>
                  </div>

                  {/* Courses */}
                  <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                    {(student.courses || []).join(', ') || 'N/A'}
                  </p>

                  {/* Progress */}
                  <div className="flex flex-col justify-center">
                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{student.indicators?.progress ?? 0}%</span>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#EAE8FA', borderRadius: R.full, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${student.indicators?.progress ?? 0}%`, backgroundColor: student.riskLevel === 'high' ? C.danger : C.warning, borderRadius: R.full, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>

                  {/* Risk */}
                  <div className="flex items-center">
                    <span className="uppercase" style={{ ...riskStyle(student.riskLevel), fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: R.md, border: `1px solid ${riskStyle(student.riskLevel).borderColor}` }}>
                      {student.riskLevel} • {student.riskScore}
                    </span>
                  </div>

                  {/* Indicators */}
                  <div className="flex items-center gap-4">
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, marginBottom: '2px' }}>Exam Avg</span>
                      <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{student.indicators?.examAverage === null ? 'N/A' : `${student.indicators?.examAverage}%`}</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, marginBottom: '2px' }}>Assgn</span>
                      <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{student.indicators?.assignmentRate ?? 0}%</span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, marginBottom: '2px' }}>Inactive</span>
                      <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{student.indicators?.inactivityDays ?? 'N/A'} d</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/tutor/messages?studentId=${student.studentId}`)}
                      className="flex items-center justify-center w-8 h-8 cursor-pointer transition-opacity hover:opacity-70"
                      style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}`, borderRadius: R.md, color: C.btnPrimary }} title="Message">
                      <MessageSquare size={14} />
                    </button>
                    <Link href={`/tutor/students/${student.studentId}`}>
                      <button className="flex items-center justify-center w-8 h-8 cursor-pointer transition-opacity hover:opacity-70"
                        style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}`, borderRadius: R.md, color: C.btnPrimary }} title="View Profile">
                        <UserRound size={14} />
                      </button>
                    </Link>
                    <button onClick={() => handleToggleBlock(student)} disabled={blockingId === student.studentId}
                      className="flex items-center justify-center w-8 h-8 cursor-pointer transition-opacity hover:opacity-70 disabled:opacity-50"
                      style={{ 
                          backgroundColor: student.isBlockedByTutor ? C.successBg : C.dangerBg, 
                          color: student.isBlockedByTutor ? C.success : C.danger,
                          border: `1px solid ${student.isBlockedByTutor ? C.successBorder : C.dangerBorder}`,
                          borderRadius: R.md 
                      }} 
                      title={student.isBlockedByTutor ? 'Unblock' : 'Block'}>
                      {blockingId === student.studentId ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : student.isBlockedByTutor ? (
                        <ShieldCheck size={14} />
                      ) : (
                        <ShieldBan size={14} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="flex items-center justify-center mb-4" style={{ width: '64px', height: '64px', backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                <CircleAlert size={32} color={C.textMuted} />
              </div>
              <p style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 8px 0' }}>No at-risk students found.</p>
              <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-5 mt-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
          <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
            Showing page {pagination.page} of {pagination.pages} • {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1}
              className="h-8 px-4 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ backgroundColor: '#E3DFF8', border: `1px solid ${C.cardBorder}`, borderRadius: R.md, color: C.heading, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(pagination.pages || 1, prev + 1))}
              disabled={pagination.page >= (pagination.pages || 1)}
              className="h-8 px-4 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ backgroundColor: '#E3DFF8', border: `1px solid ${C.cardBorder}`, borderRadius: R.md, color: C.heading, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}