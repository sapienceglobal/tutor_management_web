'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Plus, Clock, CheckCircle2, XCircle, FileText,
    Paperclip, Trash2, Eye, Edit3, ChevronLeft, ChevronRight,
    ClipboardList, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/providers/ConfirmProvider';

const LEAVE_TYPES = [
    'Sick Leave',
    'Medical Appointment',
    'Personal Reasons',
    'Family Emergency',
    'Family Function',
    'Vacation',
    'Other',
];

const ITEMS_PER_PAGE = 5;

export default function UserLeavesPage() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [viewingLeave, setViewingLeave] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const { confirmDialog } = useConfirm();

    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: '',
        documentUrl: '',
    });

    useEffect(() => { fetchMyLeaves(); }, []);

    const fetchMyLeaves = async () => {
        setLoading(true);
        try {
            const response = await api.get('/leaves/my');
            if (response.data.success) {
                setLeaves(response.data.leaves);
            }
        } catch (error) {
            toast.error('Failed to load leave history');
        } finally {
            setLoading(false);
        }
    };

    // Stats
    const stats = useMemo(() => {
        const pending = leaves.filter(l => l.status === 'pending').length;
        const approved = leaves.filter(l => l.status === 'approved').length;
        const rejected = leaves.filter(l => l.status === 'rejected').length;
        return { pending, approved, rejected, total: leaves.length };
    }, [leaves]);

    // Filtered + Paginated
    const filteredLeaves = useMemo(() => {
        if (activeFilter === 'all') return leaves;
        return leaves.filter(l => l.status === activeFilter);
    }, [leaves, activeFilter]);

    const totalPages = Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE);
    const paginatedLeaves = filteredLeaves.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Calculate duration days
    const getDuration = (start, end) => {
        const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
        return `${diff} Day${diff !== 1 ? 's' : ''}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            toast.error('End date cannot be before start date');
            return;
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
                const response = await api.put(`/leaves/${editingLeave._id}`, payload);
                if (response.data.success) {
                    toast.success('Leave request updated!');
                }
            } else {
                const response = await api.post('/leaves', payload);
                if (response.data.success) {
                    toast.success('Leave application submitted!');
                }
            }

            setShowForm(false);
            setEditingLeave(null);
            setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '' });
            fetchMyLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit leave');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (leave) => {
        // Extract leave type from reason if stored as "[Type] reason"
        const match = leave.reason?.match(/^\[(.+?)\]\s*(.*)/s);
        setFormData({
            leaveType: match ? match[1] : 'Other',
            startDate: new Date(leave.startDate).toISOString().split('T')[0],
            endDate: new Date(leave.endDate).toISOString().split('T')[0],
            reason: match ? match[2] : leave.reason,
            documentUrl: leave.documents?.[0]?.url || '',
        });
        setEditingLeave(leave);
        setShowForm(true);
    };

    const handleDelete = async (leaveId) => {
        const confirmed = await confirmDialog(
            'Delete Leave Request',
            'Are you sure you want to delete this leave request?',
            { variant: 'destructive' }
        );
        if (!confirmed) return;
        try {
            await api.delete(`/leaves/${leaveId}`);
            toast.success('Leave request deleted');
            fetchMyLeaves();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    // Parse leave type from reason
    const getLeaveType = (reason) => {
        const match = reason?.match(/^\[(.+?)\]/);
        return match ? match[1] : 'Leave';
    };
    const getLeaveReason = (reason) => {
        const match = reason?.match(/^\[.+?\]\s*(.*)/s);
        return match ? match[1] : reason;
    };

    const statusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700',
            approved: 'bg-emerald-100 text-emerald-700',
            rejected: 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${styles[status] || styles.pending}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading leaves...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Leave Requests</h1>
                <Button
                    onClick={() => { setShowForm(!showForm); setEditingLeave(null); setFormData({ leaveType: 'Sick Leave', startDate: '', endDate: '', reason: '', documentUrl: '' }); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Leave Request
                </Button>
            </div>

            {/* New Leave Request Form */}
            {showForm && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-5">
                            {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Leave Type */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Leave Type</label>
                                <select
                                    value={formData.leaveType}
                                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 appearance-none cursor-pointer"
                                >
                                    {LEAVE_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">From Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">To Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Leave</label>
                                <textarea
                                    required
                                    rows={4}
                                    maxLength={500}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Please provide the reason for your leave..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none"
                                />
                                <p className="text-right text-xs text-slate-400 mt-1">{formData.reason.length} / 500</p>
                            </div>

                            {/* Attachment */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attachment</label>
                                <input
                                    type="url"
                                    value={formData.documentUrl}
                                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                                    placeholder="Paste document link (Google Drive, etc.)"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                                />
                                <p className="text-xs text-slate-400 mt-1">Attach supporting document (optional) • Maximum file size: 5MB</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setShowForm(false); setEditingLeave(null); }}
                                    className="px-6"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">
                                    {submitting ? 'Submitting...' : (editingLeave ? 'Update Request' : 'Submit Request')}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Right: Guidelines */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 h-fit">
                        <h3 className="text-base font-bold text-slate-800 mb-4">Leave Request</h3>
                        <div className="space-y-3">
                            {[
                                { icon: '✏️', text: 'Submit leave requests in advance, if possible' },
                                { icon: '📅', text: 'Specify the start and end dates clearly' },
                                { icon: '🗒️', text: 'State the reason for the leave briefly' },
                                { icon: '📎', text: 'Attach supporting documents if required' },
                            ].map((tip, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-base flex-shrink-0">{tip.icon}</span>
                                    <p className="text-sm text-slate-600 leading-relaxed">{tip.text}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-5 py-2.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
                            View Leave Policy
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {!showForm && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Pending', count: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
                            { label: 'Approved', count: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                            { label: 'Rejected', count: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
                            { label: 'Total', count: stats.total, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                                    <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Grid: Table + Guidelines */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Table */}
                        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            {/* Filters */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-wrap gap-2">
                                <div className="flex items-center gap-1 flex-wrap">
                                    {[
                                        { key: 'all', label: `All` },
                                        { key: 'pending', label: `Pending (${stats.pending})` },
                                        { key: 'approved', label: `Approved (${stats.approved})` },
                                        { key: 'rejected', label: `Rejected (${stats.rejected})` },
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => { setActiveFilter(f.key); setCurrentPage(1); }}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeFilter === f.key
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
                                            <th className="px-5 py-3 text-left font-semibold">#</th>
                                            <th className="px-5 py-3 text-left font-semibold">Reason</th>
                                            <th className="px-5 py-3 text-left font-semibold">Dates</th>
                                            <th className="px-5 py-3 text-left font-semibold">Duration</th>
                                            <th className="px-5 py-3 text-left font-semibold">Status</th>
                                            <th className="px-5 py-3 text-left font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedLeaves.length > 0 ? paginatedLeaves.map((leave, idx) => (
                                            <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3.5 text-slate-500 font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                                <td className="px-5 py-3.5">
                                                    <p className="font-semibold text-slate-800">{getLeaveType(leave.reason)}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {new Date(leave.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600">
                                                    {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} –{' '}
                                                    {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600 font-medium">{getDuration(leave.startDate, leave.endDate)}</td>
                                                <td className="px-5 py-3.5">{statusBadge(leave.status)}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        {leave.status === 'pending' ? (
                                                            <button
                                                                onClick={() => handleEdit(leave)}
                                                                className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-200 transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setViewingLeave(viewingLeave?._id === leave._id ? null : leave)}
                                                                className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-200 transition-colors"
                                                            >
                                                                View
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(leave._id)}
                                                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                                    No leave requests found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-slate-100">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${currentPage === i + 1
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-100'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: Guidelines */}
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                                <h3 className="text-base font-bold text-slate-800 mb-4">Leave Request Guidelines</h3>
                                <div className="space-y-3">
                                    {[
                                        { icon: '✏️', text: 'Submit leave requests in advance, if possible' },
                                        { icon: '📅', text: 'Specify the start and end dates clearly' },
                                        { icon: '🗒️', text: 'State the reason for the leave briefly' },
                                        { icon: '📎', text: 'Attach supporting documents if required' },
                                    ].map((tip, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="text-base flex-shrink-0">{tip.icon}</span>
                                            <p className="text-sm text-slate-600 leading-relaxed">{tip.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-5 py-2.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200">
                                    View Leave Policy
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* View Leave Detail Modal */}
            {viewingLeave && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingLeave(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Leave Details</h3>
                            {statusBadge(viewingLeave.status)}
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase">Type</p>
                                <p className="text-sm text-slate-800 font-medium">{getLeaveType(viewingLeave.reason)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase">Dates</p>
                                <p className="text-sm text-slate-800">
                                    {new Date(viewingLeave.startDate).toLocaleDateString()} – {new Date(viewingLeave.endDate).toLocaleDateString()}
                                    <span className="text-slate-500 ml-2">({getDuration(viewingLeave.startDate, viewingLeave.endDate)})</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase">Reason</p>
                                <p className="text-sm text-slate-700 leading-relaxed">{getLeaveReason(viewingLeave.reason)}</p>
                            </div>
                            {viewingLeave.adminComment && (
                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Admin Response</p>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mt-1">{viewingLeave.adminComment}</p>
                                </div>
                            )}
                        </div>
                        <Button onClick={() => setViewingLeave(null)} className="w-full mt-5 bg-indigo-600 hover:bg-indigo-700 text-white">
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
