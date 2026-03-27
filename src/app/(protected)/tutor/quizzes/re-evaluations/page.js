'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  RefreshCw,
  Search,
  ClipboardCheck,
  CircleAlert,
  CheckCircle2,
  XCircle,
  Clock3,
  UserRound,
  FileText,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, FX, S, pageStyle } from '@/constants/tutorTokens';

const statusMeta = {
  pending: {
    label: 'Pending',
    bg: C.warningBg,
    border: C.warningBorder,
    color: C.warning,
    icon: Clock3,
  },
  approved: {
    label: 'Approved',
    bg: C.successBg,
    border: C.successBorder,
    color: C.success,
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    bg: C.dangerBg,
    border: C.dangerBorder,
    color: C.danger,
    icon: XCircle,
  },
};

function StatCard({ title, value, icon: Icon, tone = 'default' }) {
  const toneMap = {
    default: { bg: FX.primary08, color: C.btnPrimary, border: C.cardBorder },
    pending: { bg: C.warningBg, color: C.warning, border: C.warningBorder },
    approved: { bg: C.successBg, color: C.success, border: C.successBorder },
    rejected: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
  };
  const picked = toneMap[tone] || toneMap.default;

  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
      <div className="flex items-center justify-between">
        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold }}>{title}</p>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ backgroundColor: picked.bg, borderColor: picked.border }}>
          <Icon className="w-4 h-4" style={{ color: picked.color }} />
        </span>
      </div>
      <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, marginTop: 6 }}>
        {value}
      </p>
    </div>
  );
}

export default function TutorReevaluationRequestsPage() {
  const { confirmDialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [examIdFilter, setExamIdFilter] = useState('');
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState({});
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const examId = params.get('examId');
    if (examId) setExamIdFilter(examId);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, examIdFilter]);

  useEffect(() => {
    fetchRequests(loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, page]);

  const queryParams = useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search || undefined,
    examId: examIdFilter || undefined,
    page,
    limit: 20,
  }), [statusFilter, search, examIdFilter, page]);

  const fetchRequests = async (firstLoad = false) => {
    try {
      if (firstLoad) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/exams/re-evaluation-requests', { params: queryParams });
      if (!res.data?.success) {
        toast.error('Failed to load re-evaluation requests');
        return;
      }

      setRequests(res.data.requests || []);
      setSummary(res.data.summary || { pending: 0, approved: 0, rejected: 0, total: 0 });
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1, limit: 20 });
    } catch (error) {
      console.error('Load re-evaluation requests error:', error);
      toast.error(error.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateDraft = (requestId, next) => {
    setDrafts((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || {}),
        ...next,
      },
    }));
  };

  const handleReview = async (item, decision) => {
    const draft = drafts[item._id] || {};
    const actionLabel = decision === 'approved' ? 'approve' : 'reject';

    const ok = await confirmDialog(
      `${decision === 'approved' ? 'Approve' : 'Reject'} Request`,
      `Are you sure you want to ${actionLabel} this re-evaluation request?`,
      { variant: decision === 'approved' ? 'default' : 'destructive' }
    );
    if (!ok) return;

    try {
      setProcessingId(item._id);
      const payload = {
        decision,
        tutorRemarks: draft.tutorRemarks?.trim() || '',
      };

      if (decision === 'approved' && draft.revisedScore !== undefined && String(draft.revisedScore).trim() !== '') {
        payload.revisedScore = Number(draft.revisedScore);
      }

      const res = await api.patch(`/exams/re-evaluation-requests/${item._id}/review`, payload);
      if (!res.data?.success) {
        toast.error(`Failed to ${actionLabel} request`);
        return;
      }

      toast.success(res.data?.message || `Request ${actionLabel}d`);
      fetchRequests(false);
    } catch (error) {
      console.error('Review request error:', error);
      toast.error(error.response?.data?.message || `Failed to ${actionLabel} request`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
          Loading re-evaluation queue...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={pageStyle}>
      <div className="rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: FX.primary08, border: `1px solid ${FX.primary25}` }}>
            <ClipboardCheck className="w-4 h-4" style={{ color: C.btnPrimary }} />
          </div>
          <div>
            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
              Re-evaluation Requests
            </h1>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
              Review student score appeals and publish final decision
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchRequests(false)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 border text-xs font-semibold disabled:opacity-60"
          style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Pending" value={summary.pending || 0} icon={Clock3} tone="pending" />
        <StatCard title="Approved" value={summary.approved || 0} icon={CheckCircle2} tone="approved" />
        <StatCard title="Rejected" value={summary.rejected || 0} icon={XCircle} tone="rejected" />
        <StatCard title="Total Requests" value={summary.total || 0} icon={FileText} />
      </div>

      <div className="rounded-2xl border p-3 grid grid-cols-1 lg:grid-cols-4 gap-3" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
        <label className="relative lg:col-span-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by student name, email, or exam title..."
            className="w-full h-10 rounded-xl border pl-9 pr-3 text-sm"
            style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
          />
        </label>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border px-3 text-sm"
          style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((item) => {
            const status = statusMeta[item.status] || statusMeta.pending;
            const StatusIcon = status.icon;
            const examTitle = item.examId?.title || 'Exam';
            const studentName = item.studentId?.name || 'Student';
            const studentEmail = item.studentId?.email || 'N/A';
            const totalMarks = item.examId?.totalMarks || 0;
            const currentScore = item.originalScore ?? item.revisedScore ?? 0;
            const revisedScore = item.revisedScore ?? currentScore;
            const draft = drafts[item._id] || {};

            return (
              <div key={item._id} className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                      {examTitle}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        <UserRound className="w-3.5 h-3.5" />
                        {studentName}
                      </span>
                      <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        {studentEmail}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: status.bg, borderColor: status.border, color: status.color }}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                  <div className="rounded-xl border p-2.5" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                      Original Score
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                      {currentScore} / {totalMarks}
                    </p>
                  </div>
                  <div className="rounded-xl border p-2.5" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                      Final Score
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                      {revisedScore} / {totalMarks}
                    </p>
                  </div>
                  <div className="rounded-xl border p-2.5" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>
                      Requested On
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border p-3 mt-3" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide, marginBottom: 4 }}>
                    Student Reason
                  </p>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: T.leading.relaxed }}>
                    {item.reason}
                  </p>
                </div>

                {item.status === 'pending' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <label className="space-y-1">
                      <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        Revised Score (optional)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={totalMarks}
                        step="0.01"
                        value={draft.revisedScore ?? ''}
                        onChange={(e) => updateDraft(item._id, { revisedScore: e.target.value })}
                        className="w-full h-10 rounded-xl border px-3 text-sm"
                        style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                        placeholder={`0 - ${totalMarks}`}
                      />
                    </label>
                    <label className="space-y-1">
                      <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        Tutor Remarks
                      </span>
                      <textarea
                        rows={2}
                        value={draft.tutorRemarks ?? ''}
                        onChange={(e) => updateDraft(item._id, { tutorRemarks: e.target.value })}
                        className="w-full rounded-xl border px-3 py-2 text-sm resize-y"
                        style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading, backgroundColor: C.surfaceWhite }}
                        placeholder="Add feedback for student..."
                      />
                    </label>

                    <div className="md:col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => handleReview(item, 'approved')}
                        disabled={processingId === item._id}
                        className="h-9 px-4 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                        style={{ borderColor: C.successBorder, color: C.success, backgroundColor: C.successBg }}
                      >
                        {processingId === item._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(item, 'rejected')}
                        disabled={processingId === item._id}
                        className="h-9 px-4 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                        style={{ borderColor: C.dangerBorder, color: C.danger, backgroundColor: C.dangerBg }}
                      >
                        {processingId === item._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border p-3 mt-3" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide, marginBottom: 4 }}>
                      Tutor Decision Note
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>
                      {item.tutorRemarks?.trim() || 'No remarks shared.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
          <CircleAlert className="w-7 h-7 mx-auto mb-2" style={{ color: C.textMuted }} />
          <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
            No re-evaluation requests matched current filters.
          </p>
        </div>
      )}

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
