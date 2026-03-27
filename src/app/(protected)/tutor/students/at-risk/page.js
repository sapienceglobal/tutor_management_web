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
import { C, T, FX, S, pageStyle } from '@/constants/tutorTokens';

function MetricCard({ title, value, subtext, tone = 'default', icon: Icon }) {
  const toneMap = {
    default: { bg: FX.primary08, color: C.btnPrimary },
    success: { bg: C.successBg, color: C.success },
    warning: { bg: C.warningBg, color: C.warning },
    danger: { bg: C.dangerBg, color: C.danger },
  };
  const toneStyle = toneMap[tone] || toneMap.default;

  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold }}>{title}</p>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: toneStyle.bg }}>
          <Icon className="w-4 h-4" style={{ color: toneStyle.color }} />
        </span>
      </div>
      <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], color: C.heading, fontWeight: T.weight.black }}>{value}</p>
      <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>{subtext}</p>
    </div>
  );
}

const priorityStyle = (priority) => {
  if (priority === 'critical') return { backgroundColor: C.dangerBg, borderColor: C.dangerBorder, color: C.danger };
  if (priority === 'high') return { backgroundColor: C.warningBg, borderColor: C.warningBorder, color: C.warning };
  return { backgroundColor: FX.primary08, borderColor: FX.primary20, color: C.btnPrimary };
};

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>Loading at-risk students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={pageStyle}>
      <div className="rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
            <AlertTriangle className="w-4 h-4" style={{ color: C.warning }} />
          </div>
          <div>
            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>At-Risk Students</h1>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
              Identify and intervene early using AI risk signals
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchAtRiskStudents(false)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border text-xs font-semibold disabled:opacity-60"
          style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Filtered At-Risk" value={summary?.filteredAtRiskCount ?? 0} subtext={`of ${summary?.atRiskCount ?? 0} at-risk total`} tone="warning" icon={ShieldAlert} />
        <MetricCard title="High Risk" value={summary?.highRiskCount ?? 0} subtext="Immediate action needed" tone={(summary?.highRiskCount ?? 0) > 0 ? 'danger' : 'default'} icon={AlertTriangle} />
        <MetricCard title="Medium Risk" value={summary?.mediumRiskCount ?? 0} subtext="Monitor and support" tone="warning" icon={UserRound} />
        <MetricCard title="Tracked Students" value={summary?.totalStudents ?? 0} subtext="Across your courses" icon={UserRound} />
      </div>

      <div className="rounded-2xl border p-3 grid grid-cols-1 lg:grid-cols-4 gap-3" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
        <label className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by student, reason, course..."
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
          <option value="all">High + Medium</option>
          <option value="high">High Risk Only</option>
          <option value="medium">Medium Risk Only</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-10 rounded-xl border px-3 text-sm"
          style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
        >
          <option value="riskScore">Sort by Risk Score</option>
          <option value="inactivityDays">Sort by Inactivity</option>
          <option value="progress">Sort by Progress</option>
          <option value="examAverage">Sort by Exam Avg</option>
          <option value="assignmentRate">Sort by Assignment Rate</option>
          <option value="attendanceRate">Sort by Attendance</option>
          <option value="name">Sort by Name</option>
        </select>

        <div className="lg:col-span-4">
          <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Minimum Risk Score: {minRiskScore}</label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minRiskScore}
            onChange={(e) => setMinRiskScore(Number(e.target.value))}
            className="w-full mt-1"
          />
        </div>
      </div>

      <div className="space-y-3">
        {students.length > 0 ? (
          students.map((student) => (
            <div key={String(student.studentId)} className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                    {student.name}
                  </p>
                  <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                    {student.email}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide" style={riskStyle(student.riskLevel)}>
                    {student.riskLevel} • {student.riskScore}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide" style={priorityStyle(student.interventionPriority)}>
                    {student.interventionPriority}
                  </span>
                  {student.isBlockedByTutor && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: C.dangerBg, borderColor: C.dangerBorder, color: C.danger }}>
                      blocked
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                <div className="rounded-xl border p-2" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>Progress</p>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>{student.indicators?.progress ?? 0}%</p>
                </div>
                <div className="rounded-xl border p-2" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>Exam Avg</p>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                    {student.indicators?.examAverage === null ? 'N/A' : `${student.indicators?.examAverage}%`}
                  </p>
                </div>
                <div className="rounded-xl border p-2" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>Assignment</p>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>{student.indicators?.assignmentRate ?? 0}%</p>
                </div>
                <div className="rounded-xl border p-2" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>Attendance</p>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>{student.indicators?.attendanceRate ?? 0}%</p>
                </div>
                <div className="rounded-xl border p-2" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>Inactive</p>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                    {student.indicators?.inactivityDays ?? 'N/A'} days
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl border p-2.5" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide, marginBottom: 6 }}>
                    Risk Reasons
                  </p>
                  <div className="space-y-1">
                    {(student.reasons || []).slice(0, 3).map((reason, idx) => (
                      <p key={`${student.studentId}-reason-${idx}`} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                        • {reason}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border p-2.5" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide, marginBottom: 6 }}>
                    Recommended Actions
                  </p>
                  <div className="space-y-1">
                    {(student.recommendedActions || []).map((action, idx) => (
                      <p key={`${student.studentId}-action-${idx}`} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                        • {action}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                  Courses: {(student.courses || []).join(', ')}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => router.push(`/tutor/messages?studentId=${student.studentId}`)}
                    className="h-8 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5"
                    style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message
                  </button>
                  <Link
                    href={`/tutor/students/${student.studentId}`}
                    className="h-8 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5"
                    style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                  >
                    <UserRound className="w-3.5 h-3.5" />
                    View Profile
                  </Link>
                  <button
                    onClick={() => handleToggleBlock(student)}
                    disabled={blockingId === student.studentId}
                    className="h-8 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                    style={student.isBlockedByTutor
                      ? { borderColor: C.successBorder, color: C.success, backgroundColor: C.successBg }
                      : { borderColor: C.dangerBorder, color: C.danger, backgroundColor: C.dangerBg }}
                  >
                    {blockingId === student.studentId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : student.isBlockedByTutor ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldBan className="w-3.5 h-3.5" />
                    )}
                    {student.isBlockedByTutor ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
            <CircleAlert className="w-7 h-7 mx-auto mb-2" style={{ color: C.textMuted }} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
              No at-risk students matched current filters.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
          Showing page {pagination.page} of {pagination.pages} • {pagination.total} total
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={pagination.page <= 1}
            className="h-8 px-3 rounded-xl border text-xs font-semibold disabled:opacity-60"
            style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
          >
            Previous
          </button>
          <button
            onClick={() => setPage((prev) => Math.min(pagination.pages || 1, prev + 1))}
            disabled={pagination.page >= (pagination.pages || 1)}
            className="h-8 px-3 rounded-xl border text-xs font-semibold disabled:opacity-60"
            style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
