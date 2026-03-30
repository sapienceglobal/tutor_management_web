'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Loader2, RefreshCw, Search, ClipboardCheck, CircleAlert, CheckCircle2, XCircle, Clock3, UserRound, FileText, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
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
    backgroundColor: '#E3DFF8',
    border: `1.5px solid transparent`,
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

const statusMeta = {
  pending: { label: 'Pending', bg: C.warningBg, border: C.warningBorder, color: C.warning, icon: Clock3 },
  approved: { label: 'Approved', bg: C.successBg, border: C.successBorder, color: C.success, icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: C.dangerBg, border: C.dangerBorder, color: C.danger, icon: XCircle },
};

function StatCard({ title, value, icon: Icon, tone = 'default' }) {
  const toneMap = {
    default: { bg: '#E3DFF8', color: C.btnPrimary, border: C.cardBorder },
    pending: { bg: C.warningBg, color: C.warning, border: C.warningBorder },
    approved: { bg: C.successBg, color: C.success, border: C.successBorder },
    rejected: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
  };
  const picked = toneMap[tone] || toneMap.default;

  return (
    <div className="p-5 flex flex-col justify-between h-full transition-transform hover:-translate-y-0.5" style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card, minHeight: '130px' }}>
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{title}</p>
        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: picked.bg, borderRadius: R.md }}>
          <Icon size={20} color={picked.color} />
        </div>
      </div>
      <p style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>
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
      toast.error(error?.response?.data?.message || 'Failed to load requests');
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
      toast.error(error?.response?.data?.message || `Failed to ${actionLabel} request`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
        <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading re-evaluation queue...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
            <ClipboardCheck size={24} color={C.btnPrimary} />
          </div>
          <div>
            <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>Re-evaluation Requests</h1>
            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Review student score appeals and publish final decision</p>
          </div>
        </div>
        <button
          onClick={() => fetchRequests(false)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
          style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
        >
          {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Pending" value={summary.pending || 0} icon={Clock3} tone="pending" />
        <StatCard title="Approved" value={summary.approved || 0} icon={CheckCircle2} tone="approved" />
        <StatCard title="Rejected" value={summary.rejected || 0} icon={XCircle} tone="rejected" />
        <StatCard title="Total Requests" value={summary.total || 0} icon={FileText} />
      </div>

      {/* Filters */}
      <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by student name, email, or exam title..."
            style={{ ...baseInputStyle, paddingLeft: '36px', backgroundColor: C.surfaceWhite }}
            onFocus={onFocusHandler} onBlur={onBlurHandler}
          />
        </div>
        <div className="w-full md:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, width: '100%', minWidth: '180px' }}
              onFocus={onFocusHandler} onBlur={onBlurHandler}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
        </div>
      </div>

      {/* List */}
      {requests.length > 0 ? (
        <div className="space-y-4">
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
              <div key={item._id} className="p-6 transition-all" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 6px 0' }}>{examTitle}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>
                        <UserRound size={16} /> {studentName}
                      </div>
                      <span style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>{studentEmail}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 shrink-0" style={{ fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', padding: '4px 10px', borderRadius: R.md, backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}` }}>
                    <StatusIcon size={14} /> {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Original Score</p>
                    <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{currentScore} <span style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted }}>/ {totalMarks}</span></p>
                  </div>
                  <div className="p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Final Score</p>
                    <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{revisedScore} <span style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted }}>/ {totalMarks}</span></p>
                  </div>
                  <div className="p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Requested On</p>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 mb-6" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                  <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 6px 0' }}>Student Reason</p>
                  <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.5 }}>{item.reason}</p>
                </div>

                {item.status === 'pending' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                    <div className="space-y-2">
                      <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Revised Score (optional)</label>
                      <input type="number" min={0} max={totalMarks} step="0.01" value={draft.revisedScore ?? ''} onChange={(e) => updateDraft(item._id, { revisedScore: e.target.value })}
                        style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite }} placeholder={`0 - ${totalMarks}`} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                    </div>
                    <div className="space-y-2">
                      <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Tutor Remarks</label>
                      <textarea rows={2} value={draft.tutorRemarks ?? ''} onChange={(e) => updateDraft(item._id, { tutorRemarks: e.target.value })}
                        style={{ ...baseInputStyle, resize: 'vertical', minHeight: '60px', backgroundColor: C.surfaceWhite }} placeholder="Add feedback for student..." onFocus={onFocusHandler} onBlur={onBlurHandler} />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-3 mt-2">
                      <button onClick={() => handleReview(item, 'rejected')} disabled={processingId === item._id}
                        className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50 shadow-sm"
                        style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: R.xl, border: `1px solid ${C.dangerBorder}`, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        {processingId === item._id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Reject
                      </button>
                      <button onClick={() => handleReview(item, 'approved')} disabled={processingId === item._id}
                        className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                        style={{ backgroundColor: C.success, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        {processingId === item._id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 mt-2" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 6px 0' }}>Tutor Decision Note</p>
                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, margin: 0, lineHeight: 1.5 }}>
                      {item.tutorRemarks?.trim() || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No remarks shared.</span>}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
          <CircleAlert size={48} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 8px 0' }}>No requests found</p>
          <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>No re-evaluation requests matched current filters.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
          Showing page {pagination.page} of {pagination.pages} • {pagination.total} total
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={pagination.page <= 1}
            className="flex-1 sm:flex-none flex items-center justify-center h-10 px-5 cursor-pointer border-none disabled:opacity-50 transition-opacity hover:opacity-80 shadow-sm"
            style={{ backgroundColor: '#EAE8FA', color: C.heading, borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
            Previous
          </button>
          <button onClick={() => setPage((prev) => Math.min(pagination.pages || 1, prev + 1))} disabled={pagination.page >= (pagination.pages || 1)}
            className="flex-1 sm:flex-none flex items-center justify-center h-10 px-5 cursor-pointer border-none disabled:opacity-50 transition-opacity hover:opacity-80 shadow-sm"
            style={{ backgroundColor: '#EAE8FA', color: C.heading, borderRadius: R.md, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}