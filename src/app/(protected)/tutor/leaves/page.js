'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Plus, Clock, CheckCircle2, XCircle,
    Trash2, ChevronLeft, ChevronRight, ClipboardList, Loader2, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, FX } from '@/constants/tutorTokens';

const LEAVE_TYPES = [
    'Sick Leave', 'Medical Appointment', 'Personal Reasons',
    'Family Emergency', 'Family Function', 'Conference / Training', 'Vacation', 'Other',
];
const ITEMS_PER_PAGE = 5;

const inp = "w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#7573E8] focus:ring-2 focus:ring-[#7573E8]/10 transition-colors bg-white";

function StatusBadge({ status }) {
    const map = {
        pending:  'bg-amber-50 text-amber-700 border-amber-200',
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-50 text-red-600 border-red-200',
    };
    return (
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border capitalize ${map[status] || map.pending}`}>
            {status}
        </span>
    );
}

export default function TutorLeavesPage() {
    const [leaves, setLeaves]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [submitting, setSubmitting]   = useState(false);
    const [showForm, setShowForm]       = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [viewingLeave, setViewingLeave] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const [tutors, setTutors]           = useState([]);
    const { confirmDialog }             = useConfirm();

    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave', startDate: '', endDate: '',
        reason: '', documentUrl: '', substituteId: '',
    });

    useEffect(() => { fetchMyLeaves(); fetchTutors(); }, []);

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const res = await api.get('/leaves/my');
            if (res.data.success) setLeaves(res.data.leaves);
        } catch { toast.error('Failed to load leave history'); }
        finally { setLoading(false); }
    };

    const fetchTutors = async () => {
        try {
            const res = await api.get('/tutors');
            if (res.data.success) setTutors(res.data.data || res.data.tutors || []);
        } catch { /* silent */ }
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
    const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getDuration = (start, end) => {
        const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
        return `${diff} Day${diff !== 1 ? 's' : ''}`;
    };
    const getLeaveType   = (r) => r?.match(/^\[(.+?)\]/)?.[1] || 'Leave';
    const getLeaveReason = (r) => r?.match(/^\[.+?\]\s*(.*)/s)?.[1] || r;

    const resetForm = () => {
        setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '', substituteId: '' });
        setEditingLeave(null);
        setShowForm(false);
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
                endDate:   formData.endDate,
                reason:    `[${formData.leaveType}] ${formData.reason}`,
                documents: formData.documentUrl ? [{ name: 'Supporting Document', url: formData.documentUrl, type: 'url' }] : [],
                substituteId: formData.substituteId || null,
            };
            if (editingLeave) {
                const res = await api.put(`/leaves/${editingLeave._id}`, payload);
                if (res.data.success) toast.success('Leave request updated!');
            } else {
                const res = await api.post('/leaves', payload);
                if (res.data.success) toast.success('Leave application submitted!');
            }
            resetForm();
            fetchMyLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit leave');
        } finally { setSubmitting(false); }
    };

    const handleEdit = (leave) => {
        const match = leave.reason?.match(/^\[(.+?)\]\s*(.*)/s);
        setFormData({
            leaveType:   match ? match[1] : 'Other',
            startDate:   new Date(leave.startDate).toISOString().split('T')[0],
            endDate:     new Date(leave.endDate).toISOString().split('T')[0],
            reason:      match ? match[2] : leave.reason,
            documentUrl: leave.documents?.[0]?.url || '',
            substituteId: leave.substituteId || '',
        });
        setEditingLeave(leave);
        setShowForm(true);
    };

    const handleDelete = async (leaveId) => {
        const ok = await confirmDialog('Delete Leave Request', 'Are you sure you want to delete this leave request?', { variant: 'destructive' });
        if (!ok) return;
        try {
            await api.delete(`/leaves/${leaveId}`);
            toast.success('Leave request deleted');
            fetchMyLeaves();
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete'); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p className="text-sm text-slate-400">Loading leaves...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: T.fontFamily }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                        <Calendar className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Leave Requests</h1>
                        <p className="text-xs text-slate-400">Manage your absences, substitutes, and track approval status</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-opacity"
                    style={{ backgroundColor: C.btnPrimary }}>
                    <Plus className="w-4 h-4" /> New Leave Request
                </button>
            </div>

            {/* ── Leave Form ────────────────────────────────────────────────── */}
            {showForm && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 p-6 space-y-5">
                        <h2 className="text-sm font-bold text-slate-800">
                            {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Leave Type</label>
                                <select value={formData.leaveType}
                                    onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                                    className={inp}>
                                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">From Date</label>
                                    <input type="date" required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className={inp} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">To Date</label>
                                    <input type="date" required
                                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className={inp} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Reason for Leave</label>
                                <textarea required rows={4} maxLength={500}
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Please provide the reason for your leave..."
                                    className={`${inp} resize-none`} />
                                <p className="text-right text-[11px] text-slate-400">{formData.reason.length} / 500</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Attachment <span className="text-slate-400 font-normal">(Optional)</span></label>
                                    <input type="url" value={formData.documentUrl}
                                        onChange={e => setFormData({ ...formData, documentUrl: e.target.value })}
                                        placeholder="Paste document link (Google Drive, etc.)"
                                        className={inp} />
                                    <p className="text-[11px] text-slate-400">Supporting document URL</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Substitute Instructor</label>
                                    <select value={formData.substituteId}
                                        onChange={e => setFormData({ ...formData, substituteId: e.target.value })}
                                        className={inp}>
                                        <option value="">No substitute needed</option>
                                        {tutors.map(t => (
                                            <option key={t._id} value={t._id}>
                                                {t.userId?.name || t.name || 'Unknown Tutor'}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-slate-400">Select another instructor for your classes</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={resetForm}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
                                    style={{ backgroundColor: C.btnPrimary }}>
                                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : (editingLeave ? 'Update Request' : 'Submit Request')}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Guidelines */}
                    <div className="bg-white rounded-xl border border-slate-100 p-5 h-fit">
                        <h3 className="text-sm font-bold text-slate-800 mb-4">Leave Guidelines</h3>
                        <div className="space-y-3">
                            {[
                                { icon: '✏️', text: 'Submit leave requests in advance when possible' },
                                { icon: '📅', text: 'Specify the start and end dates clearly' },
                                { icon: '🗒️', text: 'State the reason for the leave briefly' },
                                { icon: '📎', text: 'Attach supporting documents if required' },
                                { icon: '👤', text: 'Assign a substitute instructor for your classes' },
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <span className="text-base flex-shrink-0">{tip.icon}</span>
                                    <p className="text-xs text-slate-600 leading-relaxed">{tip.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stats + Table (hidden when form open) ─────────────────────── */}
            {!showForm && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Pending',  count: stats.pending,  icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50' },
                            { label: 'Approved', count: stats.approved, icon: CheckCircle2,  color: 'text-emerald-600',bg: 'bg-emerald-50' },
                            { label: 'Rejected', count: stats.rejected, icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50' },
                            { label: 'Total',    count: stats.total,    icon: ClipboardList,  color: '',                bg: '' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg || ''}`}
                                    style={!stat.bg ? { backgroundColor: FX.primary10 } : {}}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`}
                                        style={!stat.color ? { color: C.btnPrimary } : {}} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase">{stat.label}</p>
                                    <p className={`text-xl font-black ${stat.color}`}
                                        style={!stat.color ? { color: C.btnPrimary } : {}}>
                                        {stat.count}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                        {/* Table */}
                        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden">
                            {/* Filter tabs */}
                            <div className="flex items-center gap-1 px-4 py-3 border-b border-slate-100 flex-wrap">
                                {[
                                    { key: 'all',      label: 'All' },
                                    { key: 'pending',  label: `Pending (${stats.pending})` },
                                    { key: 'approved', label: `Approved (${stats.approved})` },
                                    { key: 'rejected', label: `Rejected (${stats.rejected})` },
                                ].map(f => (
                                    <button key={f.key}
                                        onClick={() => { setActiveFilter(f.key); setCurrentPage(1); }}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                                        style={activeFilter === f.key
                                            ? { backgroundColor: C.btnPrimary, color: 'white' }
                                            : { color: '#64748b' }}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Table head */}
                            <div className="grid grid-cols-[32px_2fr_2fr_80px_90px_100px] gap-3 px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                                {['#', 'Type', 'Dates', 'Duration', 'Status', 'Actions'].map(h => (
                                    <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</span>
                                ))}
                            </div>

                            {paginatedLeaves.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {paginatedLeaves.map((leave, idx) => (
                                        <div key={leave._id}
                                            className="grid grid-cols-[32px_2fr_2fr_80px_90px_100px] gap-3 px-5 py-4 items-center hover:bg-slate-50/40 transition-colors">
                                            <span className="text-xs text-slate-400 font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{getLeaveType(leave.reason)}</p>
                                                <p className="text-[11px] text-slate-400">
                                                    {new Date(leave.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <span className="text-xs text-slate-600">
                                                {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-600">{getDuration(leave.startDate, leave.endDate)}</span>
                                            <StatusBadge status={leave.status} />
                                            <div className="flex items-center gap-1.5">
                                                {leave.status === 'pending' ? (
                                                    <button onClick={() => handleEdit(leave)}
                                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors"
                                                        style={{ backgroundColor: FX.primary10, color: C.btnPrimary }}>
                                                        Edit
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setViewingLeave(viewingLeave?._id === leave._id ? null : leave)}
                                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors"
                                                        style={{ backgroundColor: FX.primary10, color: C.btnPrimary }}>
                                                        View
                                                    </button>
                                                )}
                                                {leave.status === 'pending' && (
                                                    <button onClick={() => handleDelete(leave._id)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-14">
                                    <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">No leave requests found.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-1.5 px-5 py-4 border-t border-slate-100">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-colors">
                                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button key={i} onClick={() => setCurrentPage(i + 1)}
                                            className="w-7 h-7 text-xs font-bold rounded-lg transition-colors"
                                            style={currentPage === i + 1
                                                ? { backgroundColor: C.btnPrimary, color: 'white' }
                                                : { color: '#64748b' }}>
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-colors">
                                        Next <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Guidelines sidebar */}
                        <div className="bg-white rounded-xl border border-slate-100 p-5 h-fit">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Leave Request Guidelines</h3>
                            <div className="space-y-3">
                                {[
                                    { icon: '✏️', text: 'Submit leave requests in advance when possible' },
                                    { icon: '📅', text: 'Specify the start and end dates clearly' },
                                    { icon: '🗒️', text: 'State the reason for the leave briefly' },
                                    { icon: '📎', text: 'Attach supporting documents if required' },
                                    { icon: '👤', text: 'Assign a substitute for your batches' },
                                ].map((tip, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <span className="text-base flex-shrink-0">{tip.icon}</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">{tip.text}</p>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-5 py-2.5 text-xs font-semibold rounded-xl border transition-colors"
                                style={{ backgroundColor: FX.primary06, color: C.btnPrimary, borderColor: FX.primary20 }}>
                                View Leave Policy
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* ── View Detail Modal ─────────────────────────────────────────── */}
            {viewingLeave && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingLeave(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}>
                        {/* Modal header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                                    <Calendar className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Leave Details</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={viewingLeave.status} />
                                <button onClick={() => setViewingLeave(null)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors ml-1">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Type</p>
                                <p className="text-sm font-semibold text-slate-800">{getLeaveType(viewingLeave.reason)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Dates</p>
                                <p className="text-sm text-slate-800">
                                    {new Date(viewingLeave.startDate).toLocaleDateString()} – {new Date(viewingLeave.endDate).toLocaleDateString()}
                                    <span className="text-slate-400 ml-2">({getDuration(viewingLeave.startDate, viewingLeave.endDate)})</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Reason</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{getLeaveReason(viewingLeave.reason)}</p>
                            </div>
                            {viewingLeave.adminComment && (
                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Admin Response</p>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl">{viewingLeave.adminComment}</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 pb-6">
                            <button onClick={() => setViewingLeave(null)}
                                className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity"
                                style={{ backgroundColor: C.btnPrimary }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}