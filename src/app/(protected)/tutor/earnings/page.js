'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Download,
  TrendingUp,
  CircleAlert,
  Building2,
  RefreshCw,
  Ban,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, FX, pageStyle } from '@/constants/tutorTokens';

const MIN_WITHDRAWAL = 500;
const CURRENCY = 'INR';

const fmtCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const fmtDate = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '-';
  }
};

const statusPillStyle = (status) => {
  if (status === 'paid') return { backgroundColor: C.successBg, borderColor: C.successBorder, color: C.success };
  if (status === 'rejected') return { backgroundColor: C.dangerBg, borderColor: C.dangerBorder, color: C.danger };
  if (status === 'processing') return { backgroundColor: FX.primary08, borderColor: FX.primary20, color: C.btnPrimary };
  return { backgroundColor: C.warningBg, borderColor: C.warningBorder, color: C.warning };
};

function StatCard({ title, value, subtext, icon: Icon, tone = 'default' }) {
  const toneMap = {
    default: { bg: FX.primary08, color: C.btnPrimary },
    success: { bg: C.successBg, color: C.success },
    warning: { bg: C.warningBg, color: C.warning },
    danger: { bg: C.dangerBg, color: C.danger },
  };
  const toneStyle = toneMap[tone] || toneMap.default;

  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p
          style={{
            fontFamily: T.fontFamily,
            fontSize: T.size.xs,
            color: C.textMuted,
            fontWeight: T.weight.bold,
            textTransform: 'uppercase',
            letterSpacing: T.tracking.wide,
          }}
        >
          {title}
        </p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: toneStyle.bg }}>
          <Icon className="w-4 h-4" style={{ color: toneStyle.color }} />
        </div>
      </div>
      <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, color: C.heading, fontWeight: T.weight.black }}>{value}</p>
      <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>{subtext}</p>
    </div>
  );
}

export default function EarningsPage() {
  const { confirmDialog } = useConfirm();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [months, setMonths] = useState(6);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('bank');

  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalTransactions: 0,
    pendingAmount: 0,
    paidAmount: 0,
    rejectedAmount: 0,
    withdrawableBalance: 0,
    activeRequests: 0,
    minimumPayoutAmount: MIN_WITHDRAWAL,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [courseRevenue, setCourseRevenue] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const [requestForm, setRequestForm] = useState({
    amount: '',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    upiId: '',
  });

  useEffect(() => {
    fetchReport(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months, statusFilter]);

  const fetchReport = async (initial = false) => {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/tutors/payouts/report', {
        params: {
          months,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });

      if (!res.data?.success) {
        toast.error('Failed to load earnings report');
        return;
      }

      setSummary(res.data.summary || {});
      setMonthlyRevenue(res.data.monthlyRevenue || []);
      setCourseRevenue(res.data.courseRevenue || []);
      setRecentPayments(res.data.recentPayments || []);
      setPayouts(res.data.payouts || []);
    } catch (error) {
      console.error('Load earnings report error:', error);
      toast.error(error.response?.data?.message || 'Failed to load earnings report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();

    const amount = Number(requestForm.amount);
    const minimum = summary.minimumPayoutAmount || MIN_WITHDRAWAL;
    if (!Number.isFinite(amount) || amount <= 0) return toast.error('Enter a valid amount');
    if (amount < minimum) return toast.error(`Minimum withdrawal amount is ${fmtCurrency(minimum)}`);
    if (amount > Number(summary.withdrawableBalance || 0)) {
      return toast.error(`Amount exceeds withdrawable balance (${fmtCurrency(summary.withdrawableBalance)})`);
    }

    const payload = {
      amount,
      bankDetails:
        payoutMethod === 'upi'
          ? { upiId: requestForm.upiId.trim() }
          : {
              accountHolderName: requestForm.accountHolderName.trim(),
              accountNumber: requestForm.accountNumber.trim(),
              bankName: requestForm.bankName.trim(),
              ifscCode: requestForm.ifscCode.trim().toUpperCase(),
              upiId: requestForm.upiId.trim(),
            },
    };

    setSubmitting(true);
    try {
      const res = await api.post('/tutors/payouts/request', payload);
      if (!res.data?.success) return toast.error('Failed to submit payout request');

      toast.success('Payout request submitted');
      setRequestModalOpen(false);
      setRequestForm({
        amount: '',
        accountHolderName: '',
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        upiId: '',
      });
      fetchReport(false);
    } catch (error) {
      console.error('Request payout error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit payout request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPayout = async (payout) => {
    const ok = await confirmDialog('Cancel Payout Request', `Cancel payout request of ${fmtCurrency(payout.amount)}?`, {
      variant: 'destructive',
    });
    if (!ok) return;

    try {
      const res = await api.patch(`/tutors/payouts/${payout._id}/cancel`);
      if (!res.data?.success) return toast.error('Failed to cancel request');
      toast.success('Payout request cancelled');
      fetchReport(false);
    } catch (error) {
      console.error('Cancel payout error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/tutors/payouts/export', {
        params: { months },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute('download', `tutor-payout-report-${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export payout report error:', error);
      toast.error(error.response?.data?.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const revenueTrend = useMemo(() => {
    if (monthlyRevenue.length < 2) return null;
    const prev = Number(monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0);
    const curr = Number(monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0);
    if (prev <= 0) return null;
    return Number((((curr - prev) / prev) * 100).toFixed(1));
  }, [monthlyRevenue]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>Loading earnings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={pageStyle}>
      <div
        className="rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
            <DollarSign className="w-4 h-4" style={{ color: C.btnPrimary }} />
          </div>
          <div>
            <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, color: C.heading, fontWeight: T.weight.bold }}>Earnings & Payouts</h1>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Revenue analytics, payout requests, and payment reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="h-9 rounded-xl border px-3 text-sm"
            style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={18}>Last 18 months</option>
          </select>

          <button
            onClick={() => fetchReport(false)}
            disabled={refreshing}
            className="h-9 px-3 rounded-xl border text-xs font-semibold disabled:opacity-60 inline-flex items-center gap-1.5"
            style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="h-9 px-3 rounded-xl border text-xs font-semibold disabled:opacity-60 inline-flex items-center gap-1.5"
            style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </button>

          <button
            onClick={() => setRequestModalOpen(true)}
            disabled={Number(summary.withdrawableBalance || 0) < (summary.minimumPayoutAmount || MIN_WITHDRAWAL)}
            className="h-9 px-4 rounded-xl text-xs font-semibold text-white disabled:opacity-60 inline-flex items-center gap-1.5"
            style={{ backgroundColor: C.btnPrimary }}
          >
            <Plus className="w-3.5 h-3.5" />
            Request Payout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="Total Revenue" value={fmtCurrency(summary.totalEarnings)} subtext="All-time course revenue" icon={TrendingUp} />
        <StatCard title="Withdrawable" value={fmtCurrency(summary.withdrawableBalance)} subtext={`Min payout ${fmtCurrency(summary.minimumPayoutAmount || MIN_WITHDRAWAL)}`} icon={Wallet} tone="success" />
        <StatCard title="Pending" value={fmtCurrency(summary.pendingAmount)} subtext={`${summary.activeRequests || 0} active request(s)`} icon={Clock} tone={(summary.pendingAmount || 0) > 0 ? 'warning' : 'default'} />
        <StatCard title="Paid Out" value={fmtCurrency(summary.paidAmount)} subtext="Settled payouts" icon={CheckCircle2} tone="success" />
        <StatCard title="Rejected" value={fmtCurrency(summary.rejectedAmount)} subtext={`${summary.totalTransactions || 0} total transaction(s)`} icon={XCircle} tone={(summary.rejectedAmount || 0) > 0 ? 'danger' : 'default'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>Monthly Revenue</h3>
              <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Revenue and successful transactions for the selected period</p>
            </div>
            {revenueTrend !== null && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={revenueTrend >= 0 ? { backgroundColor: C.successBg, color: C.success } : { backgroundColor: C.dangerBg, color: C.danger }}>
                {revenueTrend >= 0 ? '+' : ''}
                {revenueTrend}% vs previous month
              </span>
            )}
          </div>

          <div className="space-y-2">
            {monthlyRevenue.map((row) => {
              const maxRevenue = Math.max(1, ...monthlyRevenue.map((r) => Number(r.revenue || 0)));
              const widthPct = (Number(row.revenue || 0) / maxRevenue) * 100;
              return (
                <div key={row.monthKey} className="grid grid-cols-[88px_1fr_160px] gap-3 items-center">
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>{row.monthLabel}</p>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: FX.primary05 }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, widthPct)}%`, backgroundColor: C.btnPrimary }} />
                  </div>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.heading, fontWeight: T.weight.bold, textAlign: 'right' }}>
                    {fmtCurrency(row.revenue)} ({row.transactions} txns)
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
          <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>Revenue by Course</h3>
          <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginBottom: 10 }}>Top earning courses</p>
          <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
            {courseRevenue.length > 0 ? (
              courseRevenue.slice(0, 10).map((row) => (
                <div key={String(row.courseId)} className="rounded-xl border p-2.5" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                  <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.heading, fontWeight: T.weight.bold }}>{row.title}</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>{row.transactions} payments</span>
                    <span style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted }}>{row.revenueSharePct}% share</span>
                  </div>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.btnPrimary, fontWeight: T.weight.bold, marginTop: 2 }}>{fmtCurrency(row.revenue)}</p>
                </div>
              ))
            ) : (
              <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>No course revenue data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>Payment Reports</h3>
        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginBottom: 10 }}>Recent successful student payments</p>
        {recentPayments.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>Date</th>
                  <th className="py-2" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>Student</th>
                  <th className="py-2" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>Course</th>
                  <th className="py-2 text-right" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wide }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.slice(0, 12).map((payment) => (
                  <tr key={payment._id} className="border-t" style={{ borderColor: C.cardBorder }}>
                    <td className="py-2.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>{fmtDate(payment.paidAt)}</td>
                    <td className="py-2.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>{payment.student?.name || 'Student'}</td>
                    <td className="py-2.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>{payment.course?.title || '-'}</td>
                    <td className="py-2.5 text-right" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.heading, fontWeight: T.weight.bold }}>{fmtCurrency(payment.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center">
            <CircleAlert className="w-6 h-6 mx-auto mb-2" style={{ color: C.textMuted }} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>No successful payments recorded yet.</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>Payout History</h3>
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Track payout request status and settlement details</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border px-3 text-sm"
            style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {payouts.length > 0 ? (
          <div className="space-y-2">
            {payouts.map((payout) => (
              <div key={payout._id} className="rounded-xl border p-3" style={{ borderColor: C.cardBorder, backgroundColor: FX.primary04 }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>{fmtCurrency(payout.amount)}</p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Requested on {fmtDate(payout.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide" style={statusPillStyle(payout.status)}>
                      {payout.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : payout.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {payout.status}
                    </span>
                    {payout.status === 'pending' && (
                      <button
                        onClick={() => handleCancelPayout(payout)}
                        className="h-7 px-2.5 rounded-lg border text-[10px] font-semibold inline-flex items-center gap-1"
                        style={{ borderColor: C.dangerBorder, color: C.danger, backgroundColor: C.dangerBg }}
                      >
                        <Ban className="w-3 h-3" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                    Method:{' '}
                    {payout.bankDetails?.upiId
                      ? `UPI (${payout.bankDetails.upiId})`
                      : `${payout.bankDetails?.bankName || 'Bank'} • ${
                          payout.bankDetails?.accountNumber ? `****${String(payout.bankDetails.accountNumber).slice(-4)}` : '-'
                        }`}
                  </p>
                  <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Processed: {fmtDate(payout.processedDate)}</p>
                  {payout.transactionId ? (
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Transaction ID: {payout.transactionId}</p>
                  ) : (
                    <span />
                  )}
                  {payout.adminNotes ? (
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Notes: {payout.adminNotes}</p>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Building2 className="w-6 h-6 mx-auto mb-2" style={{ color: C.textMuted }} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>No payout requests found for this filter.</p>
          </div>
        )}
      </div>

      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, color: C.heading, fontWeight: T.weight.bold }}>Request Payout</h3>
              <button
                onClick={() => setRequestModalOpen(false)}
                className="h-8 px-2.5 rounded-lg border text-xs font-semibold"
                style={{ borderColor: C.cardBorder, color: C.textMuted, backgroundColor: C.surfaceWhite }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-3">
              <div>
                <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>Amount (INR)</label>
                <input
                  type="number"
                  min={summary.minimumPayoutAmount || MIN_WITHDRAWAL}
                  max={Math.floor(Number(summary.withdrawableBalance || 0))}
                  step="0.01"
                  required
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full mt-1 h-10 rounded-xl border px-3 text-sm"
                  style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                />
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, marginTop: 4 }}>Withdrawable: {fmtCurrency(summary.withdrawableBalance)}</p>
              </div>

              <div className="flex items-center gap-2">
                {['bank', 'upi'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayoutMethod(method)}
                    className="h-9 px-3 rounded-xl border text-xs font-semibold capitalize"
                    style={
                      payoutMethod === method
                        ? { borderColor: C.btnPrimary, color: C.btnPrimary, backgroundColor: FX.primary08 }
                        : { borderColor: C.cardBorder, color: C.textMuted, backgroundColor: C.surfaceWhite }
                    }
                  >
                    {method}
                  </button>
                ))}
              </div>

              {payoutMethod === 'bank' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    required
                    placeholder="Bank name"
                    value={requestForm.bankName}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    className="h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                  />
                  <input
                    required
                    placeholder="Account holder name"
                    value={requestForm.accountHolderName}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, accountHolderName: e.target.value }))}
                    className="h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                  />
                  <input
                    required
                    placeholder="Account number"
                    value={requestForm.accountNumber}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    className="h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                  />
                  <input
                    required
                    placeholder="IFSC code"
                    value={requestForm.ifscCode}
                    onChange={(e) => setRequestForm((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                    className="h-10 rounded-xl border px-3 text-sm"
                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                  />
                </div>
              ) : (
                <input
                  required
                  placeholder="UPI ID (example@bank)"
                  value={requestForm.upiId}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, upiId: e.target.value }))}
                  className="w-full h-10 rounded-xl border px-3 text-sm"
                  style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                />
              )}

              {payoutMethod === 'bank' && (
                <input
                  placeholder="UPI ID (optional)"
                  value={requestForm.upiId}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, upiId: e.target.value }))}
                  className="w-full h-10 rounded-xl border px-3 text-sm"
                  style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                />
              )}

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="h-9 px-3 rounded-xl border text-xs font-semibold"
                  style={{ borderColor: C.cardBorder, color: C.textMuted, backgroundColor: C.surfaceWhite }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 rounded-xl text-xs font-semibold text-white disabled:opacity-60 inline-flex items-center gap-1.5"
                  style={{ backgroundColor: C.btnPrimary }}
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
