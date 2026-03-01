'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, CheckCircle2, XCircle, Clock,
    User, Search, Filter, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

export default function AdminLeavesPage() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchLeaves();
    }, [statusFilter, roleFilter]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            let query = '?';
            if (statusFilter !== 'all') query += `status=${statusFilter}&`;
            if (roleFilter !== 'all') query += `role=${roleFilter}`;

            const response = await api.get(`/leaves${query}`);
            if (response.data.success) {
                setLeaves(response.data.leaves);
            }
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
            toast.error('Failed to load leave requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        setActionLoading(id);
        try {
            const comment = status === 'rejected' ? prompt("Enter rejection reason (optional):") : '';
            if (comment === null) {
                setActionLoading(null);
                return; // User cancelled
            }

            const response = await api.put(`/leaves/${id}/status`, {
                status,
                adminComment: comment
            });

            if (response.data.success) {
                toast.success(`Leave ${status} successfully`);
                fetchLeaves(); // Refresh the list
            }
        } catch (error) {
            console.error('Action failed:', error);
            toast.error(`Failed to ${status} leave`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Review and manage student and tutor leave requests</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="tutor">Tutors</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : leaves.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Leave Requests</h3>
                    <p className="text-slate-500 mt-1">There are no leave requests matching your filters.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Applicant</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Leave Duration</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leaves.map((leave) => (
                                    <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {leave.userId?.profileImage ? (
                                                    <img src={leave.userId.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                        {leave.userId?.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-900">{leave.userId?.name}</p>
                                                    <p className="text-xs text-slate-500">{leave.userId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 capitalize font-medium text-slate-700">
                                            {leave.role}
                                        </td>
                                        <td className="px-6 py-4 shrink-0">
                                            <div className="flex flex-col gap-1 text-slate-600">
                                                <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                                                <span className="text-xs text-slate-400">to</span>
                                                <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="line-clamp-2 max-w-xs" title={leave.reason}>
                                                {leave.reason}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.status)}`}>
                                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {leave.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                                        onClick={() => handleAction(leave._id, 'approved')}
                                                        disabled={actionLoading === leave._id}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                        onClick={() => handleAction(leave._id, 'rejected')}
                                                        disabled={actionLoading === leave._id}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" /> Reject
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-slate-400 text-sm">
                                                    Resolved
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
