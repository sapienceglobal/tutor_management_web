'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Plus, Clock, CheckCircle2, XCircle, FileText,
    Trash2, Eye, Edit3, ChevronLeft, ChevronRight,
    ClipboardList, Sparkles, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

const LEAVE_TYPES = [
    'Sick Leave', 'Medical Appointment', 'Personal Reasons',
    'Family Emergency', 'Family Function', 'Vacation', 'Other',
];

const ITEMS_PER_PAGE = 5;

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        pending:  { bg: C.warningBg,  color: C.warning,  label: 'Pending'  },
        approved: { bg: C.successBg,  color: C.success,  label: 'Approved' },
        rejected: { bg: C.dangerBg,   color: C.danger,   label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
            style={{ backgroundColor: s.bg, color: s.color, fontFamily: T.fontFamily }}>
            {s.label}
        </span>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, count, icon: Icon, accentColor }) {
    return (
        <div className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:shadow-md"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accentColor}18` }}>
                <Icon className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.statLabel, fontWeight: T.weight.semibold }}>
                    {label}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: accentColor, lineHeight: T.leading.tight }}>
                    {count}
                </p>
            </div>
        </div>
    );
}

export default function UserLeavesPage() {
    const [leaves, setLeaves]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [submitting, setSubmitting]     = useState(false);
    const [showForm, setShowForm]         = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [viewingLeave, setViewingLeave] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const { confirmDialog }               = useConfirm();

    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '',
    });

    useEffect(() => { fetchMyLeaves(); }, []);

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('/leaves/my');
            if (res.data.success) setLeaves(res.data.leaves);
        } catch { toast.error('Failed to load leave history'); }
        finally { setLoading(false); }
    };

    const stats = useMemo(() => ({
        pending:  leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        total:    leaves.length,
    }), [leaves]);

    const filteredLeaves = useMemo(() =>
        activeFilter === 'all' ? leaves : leaves.filter(l => l.status === activeFilter),
        [leaves, activeFilter]
    );

    const totalPages     = Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE);
    const paginatedLeaves = filteredLeaves.slice(
        (currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE
    );

    const getDuration = (start, end) => {
        const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
        return `${diff} Day${diff !== 1 ? 's' : ''}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            toast.error('End date cannot be before start date'); return;
        }
        setSubmitting(true);
        try {
            const payload = {
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: `[${formData.leaveType}] ${formData.reason}`,
                documents: formData.documentUrl ? [{ name: 'Supporting Document', url: formData.documentUrl, type: 'url' }] : [],
            };
            if (editingLeave) {
                await api.put(`/leaves/${editingLeave._id}`, payload);
                toast.success('Leave request updated!');
            } else {
                await api.post('/leaves', payload);
                toast.success('Leave application submitted!');
            }
            setShowForm(false); setEditingLeave(null);
            setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '' });
            fetchMyLeaves();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit leave');
        } finally { setSubmitting(false); }
    };

    const handleEdit = (leave) => {
        const match = leave.reason?.match(/^\[(.+?)\]\s*(.*)/s);
        setFormData({
            leaveType: match ? match[1] : 'Other',
            startDate: new Date(leave.startDate).toISOString().split('T')[0],
            endDate: new Date(leave.endDate).toISOString().split('T')[0],
            reason: match ? match[2] : leave.reason,
            documentUrl: leave.documents?.[0]?.url || '',
        });
        setEditingLeave(leave); setShowForm(true);
    };

    const handleDelete = async (leaveId) => {
        const ok = await confirmDialog('Delete Leave Request', 'Are you sure?', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/leaves/${leaveId}`);
            toast.success('Leave request deleted');
            fetchMyLeaves();
        } catch { toast.error('Failed to delete'); }
    };

    const getLeaveType   = (r) => r?.match(/^\[(.+?)\]/)?.[1] || 'Leave';
    const getLeaveReason = (r) => r?.match(/^\[.+?\]\s*(.*)/s)?.[1] || r;

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                    Loading leave requests…
                </p>
            </div>
        </div>
    );

    // ── Shared input style ───────────────────────────────────────────────────
    const inputStyle = {
        ...cx.input(),
        width: '100%',
        padding: '10px 14px',
        outline: 'none',
        transition: 'border-color 0.15s',
    };

    const labelStyle = {
        display: 'block',
        fontFamily: T.fontFamily,
        fontSize: T.size.xs,
        fontWeight: T.weight.bold,
        color: C.statLabel,
        textTransform: 'uppercase',
        letterSpacing: T.tracking.wider,
        marginBottom: 6,
    };

    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* ── Page Header ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        Leave Requests
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55, marginTop: 2 }}>
                        Manage your leave applications
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(!showForm); setEditingLeave(null);
                        setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '' });
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                    <Plus className="w-4 h-4" /> New Request
                </button>
            </div>

            {/* ── Leave Form ───────────────────────────────────────────── */}
            {showForm && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    {/* Form */}
                    <div className="xl:col-span-2 rounded-2xl p-6"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, marginBottom: 20 }}>
                            {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Leave Type */}
                            <div>
                                <label style={labelStyle}>Leave Type</label>
                                <select value={formData.leaveType}
                                    onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}>
                                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[['startDate', 'From Date', new Date().toISOString().split('T')[0]],
                                  ['endDate',   'To Date',   formData.startDate || new Date().toISOString().split('T')[0]]]
                                .map(([field, label, minDate]) => (
                                    <div key={field}>
                                        <label style={labelStyle}>{label}</label>
                                        <input type="date" required min={minDate}
                                            value={formData[field]}
                                            onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                                            style={inputStyle} />
                                    </div>
                                ))}
                            </div>

                            {/* Reason */}
                            <div>
                                <label style={labelStyle}>Reason for Leave</label>
                                <textarea required rows={4} maxLength={500}
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Please provide the reason for your leave…"
                                    style={{ ...inputStyle, resize: 'none' }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, textAlign: 'right', marginTop: 4 }}>
                                    {formData.reason.length} / 500
                                </p>
                            </div>

                            {/* Attachment */}
                            <div>
                                <label style={labelStyle}>Attachment (optional)</label>
                                <input type="url" value={formData.documentUrl}
                                    onChange={e => setFormData({ ...formData, documentUrl: e.target.value })}
                                    placeholder="Paste document link (Google Drive, etc.)"
                                    style={inputStyle} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 4 }}>
                                    Attach supporting document • Max 5MB
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button"
                                    onClick={() => { setShowForm(false); setEditingLeave(null); }}
                                    className="px-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                                    style={cx.btnSecondary()}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-6 py-2.5 text-white rounded-xl text-sm disabled:opacity-50 transition-all hover:opacity-90"
                                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                                    {submitting ? 'Submitting…' : (editingLeave ? 'Update Request' : 'Submit Request')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Guidelines */}
                    <div className="rounded-2xl p-5 h-fit"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, marginBottom: 16 }}>
                            Guidelines
                        </h3>
                        <div className="space-y-3">
                            {[
                                { icon: '✏️', text: 'Submit leave requests in advance, if possible' },
                                { icon: '📅', text: 'Specify the start and end dates clearly' },
                                { icon: '🗒️', text: 'State the reason for the leave briefly' },
                                { icon: '📎', text: 'Attach supporting documents if required' },
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-base flex-shrink-0">{tip.icon}</span>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: T.leading.relaxed }}>
                                        {tip.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                            style={{ ...cx.btnSecondary(), border: `1px solid ${C.cardBorder}` }}>
                            View Leave Policy
                        </button>
                    </div>
                </div>
            )}

            {/* ── Stats + Table ─────────────────────────────────────────── */}
            {!showForm && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard label="Pending"  count={stats.pending}  icon={Clock}         accentColor={C.warning} />
                        <StatCard label="Approved" count={stats.approved} icon={CheckCircle2}  accentColor={C.success} />
                        <StatCard label="Rejected" count={stats.rejected} icon={XCircle}       accentColor={C.danger}  />
                        <StatCard label="Total"    count={stats.total}    icon={ClipboardList}  accentColor={C.btnPrimary} />
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                        {/* Table */}
                        <div className="xl:col-span-2 rounded-2xl overflow-hidden"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                            {/* Filter bar */}
                            <div className="flex items-center flex-wrap gap-1 px-4 py-3"
                                style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {[
                                    { key: 'all',      label: 'All' },
                                    { key: 'pending',  label: `Pending (${stats.pending})` },
                                    { key: 'approved', label: `Approved (${stats.approved})` },
                                    { key: 'rejected', label: `Rejected (${stats.rejected})` },
                                ].map(f => (
                                    <button key={f.key}
                                        onClick={() => { setActiveFilter(f.key); setCurrentPage(1); }}
                                        className="px-3 py-1.5 rounded-xl text-xs transition-all"
                                        style={activeFilter === f.key
                                            ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                                            : { ...cx.btnSecondary(), fontFamily: T.fontFamily }}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr style={{ backgroundColor: C.innerBg }}>
                                            {['#', 'Type', 'Dates', 'Duration', 'Status', 'Actions'].map(col => (
                                                <th key={col} className="px-5 py-3 text-left"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedLeaves.length > 0 ? paginatedLeaves.map((leave, idx) => (
                                            <tr key={leave._id}
                                                style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>

                                                <td className="px-5 py-3.5"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, fontWeight: T.weight.medium }}>
                                                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                                        {getLeaveType(leave.reason)}
                                                    </p>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                                                        {new Date(leave.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-3.5"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text }}>
                                                    {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                                                    {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>

                                                <td className="px-5 py-3.5"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                                                    {getDuration(leave.startDate, leave.endDate)}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <StatusBadge status={leave.status} />
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        {leave.status === 'pending' ? (
                                                            <button onClick={() => handleEdit(leave)}
                                                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                                                style={{ backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                                                Edit
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setViewingLeave(viewingLeave?._id === leave._id ? null : leave)}
                                                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                                                                style={{ backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                                                View
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDelete(leave._id)}
                                                            className="p-1.5 rounded-xl transition-all hover:opacity-80"
                                                            style={{ backgroundColor: C.dangerBg, color: C.danger }}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-14 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                                            style={{ backgroundColor: C.innerBg }}>
                                                            <Calendar className="w-5 h-5" style={{ color: C.btnPrimary, opacity: 0.4 }} />
                                                        </div>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.4 }}>
                                                            No leave requests found.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1.5 px-5 py-4"
                                    style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                                        style={cx.btnSecondary()}>
                                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button key={i} onClick={() => setCurrentPage(i + 1)}
                                            className="w-8 h-8 rounded-xl text-xs font-bold transition-all"
                                            style={currentPage === i + 1 ? cx.pageActive() : cx.pageInactive()}>
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                                        style={cx.btnSecondary()}>
                                        Next <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Guidelines */}
                        <div className="space-y-4">
                            <div className="rounded-2xl p-5"
                                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, marginBottom: 16 }}>
                                    Leave Guidelines
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { icon: '✏️', text: 'Submit leave requests in advance, if possible' },
                                        { icon: '📅', text: 'Specify the start and end dates clearly' },
                                        { icon: '🗒️', text: 'State the reason for the leave briefly' },
                                        { icon: '📎', text: 'Attach supporting documents if required' },
                                    ].map((tip, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="text-base flex-shrink-0">{tip.icon}</span>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: T.leading.relaxed }}>
                                                {tip.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                                    style={cx.btnSecondary()}>
                                    View Leave Policy
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── View Modal ────────────────────────────────────────────── */}
            {viewingLeave && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingLeave(null)}>
                    <div className="rounded-2xl shadow-2xl max-w-md w-full p-6"
                        style={{ backgroundColor: C.surfaceWhite }}
                        onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between mb-5">
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                Leave Details
                            </h3>
                            <StatusBadge status={viewingLeave.status} />
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Type',   value: getLeaveType(viewingLeave.reason) },
                                { label: 'Dates',  value: `${new Date(viewingLeave.startDate).toLocaleDateString()} – ${new Date(viewingLeave.endDate).toLocaleDateString()} (${getDuration(viewingLeave.startDate, viewingLeave.endDate)})` },
                                { label: 'Reason', value: getLeaveReason(viewingLeave.reason) },
                            ].map(item => (
                                <div key={item.label}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 4 }}>
                                        {item.label}
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, lineHeight: T.leading.relaxed }}>
                                        {item.value}
                                    </p>
                                </div>
                            ))}

                            {viewingLeave.adminComment && (
                                <div className="pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 4 }}>
                                        Admin Response
                                    </p>
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.innerBg }}>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text }}>
                                            {viewingLeave.adminComment}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setViewingLeave(null)}
                            className="w-full mt-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90"
                            style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}