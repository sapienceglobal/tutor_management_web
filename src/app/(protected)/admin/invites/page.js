'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Mail, Users, Plus, Search, Filter, X, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import BulkInviteModal from '@/components/admin/BulkInviteModal';

export default function AdminInvitesPage() {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchInvites();
    }, [currentPage, statusFilter]);

    const fetchInvites = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 20
            };

            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const res = await api.get('/admin/invites', { params });
            if (res.data?.success) {
                setInvites(res.data.data.invites);
                setPagination(res.data.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch invites:', error);
            toast.error('Failed to load invites');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkInvite = async (invites, mode) => {
        try {
            const res = await api.post('/admin/invites/bulk', { invites, type: mode });
            if (res.data?.success) {
                toast.success(res.data.message);
                fetchInvites(); // Refresh the list
            }
        } catch (error) {
            console.error('Bulk invite error:', error);
            toast.error(error.response?.data?.message || 'Failed to create invites');
        }
    };

    const handleResendInvite = async (inviteId) => {
        try {
            const res = await api.post(`/admin/invites/${inviteId}/resend`);
            if (res.data?.success) {
                toast.success('Invite resent successfully');
                fetchInvites();
            }
        } catch (error) {
            console.error('Resend invite error:', error);
            toast.error(error.response?.data?.message || 'Failed to resend invite');
        }
    };

    const handleRevokeInvite = async (inviteId) => {
        if (!confirm('Are you sure you want to revoke this invite?')) {
            return;
        }

        try {
            const res = await api.delete(`/admin/invites/${inviteId}`);
            if (res.data?.success) {
                toast.success('Invite revoked successfully');
                fetchInvites();
            }
        } catch (error) {
            console.error('Revoke invite error:', error);
            toast.error(error.response?.data?.message || 'Failed to revoke invite');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'expired':
                return 'bg-red-100 text-red-800';
            case 'revoked':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'accepted':
                return <CheckCircle className="w-4 h-4" />;
            case 'expired':
            case 'revoked':
                return <X className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const filteredInvites = invites.filter(invite => {
        const matchesSearch = invite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invite.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Invite Management</h1>
                    <p className="text-gray-600 mt-1">Manage invitations for students and tutors</p>
                </div>
                <button
                    onClick={() => setShowBulkModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Bulk Invite
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="expired">Expired</option>
                            <option value="revoked">Revoked</option>
                        </select>
                        <button
                            onClick={fetchInvites}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Invites Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left p-4 font-medium text-gray-900">User</th>
                                <th className="text-left p-4 font-medium text-gray-900">Role</th>
                                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                                <th className="text-left p-4 font-medium text-gray-900">Invited By</th>
                                <th className="text-left p-4 font-medium text-gray-900">Created</th>
                                <th className="text-left p-4 font-medium text-gray-900">Expires</th>
                                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInvites.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">
                                        {searchTerm || statusFilter !== 'all' ? 'No invites found matching your filters' : 'No invites yet. Create your first invite!'}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvites.map((invite) => (
                                    <tr key={invite._id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{invite.name}</p>
                                                <p className="text-sm text-gray-500">{invite.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${invite.role === 'tutor' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {invite.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invite.status)}`}>
                                                {getStatusIcon(invite.status)}
                                                {invite.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-sm text-gray-900">{invite.invitedBy?.name}</p>
                                                <p className="text-xs text-gray-500">{invite.invitedBy?.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(invite.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(invite.expiresAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {invite.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResendInvite(invite._id)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Resend invite"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRevokeInvite(invite._id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Revoke invite"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {invite.status === 'expired' && (
                                                    <button
                                                        onClick={() => handleResendInvite(invite._id)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Resend invite"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invites
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                                    disabled={pagination.page === pagination.pages}
                                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Invite Modal */}
            <BulkInviteModal
                isOpen={showBulkModal}
                onClose={() => setShowBulkModal(false)}
                onSubmit={handleBulkInvite}
            />
        </div>
    );
}
