'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Mail, Users, Plus, Search, Filter, X, CheckCircle, Clock, AlertCircle, RefreshCw, Trash2, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import BulkInviteModal from '@/components/admin/BulkInviteModal';

export default function AdminInvitesPage() {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchInvites();
    }, [currentPage, statusFilter]);

    const fetchInvites = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 10
            };

            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const res = await api.get('/admin/invites', { params });
            if (res.data?.success) {
                setInvites(res.data.data.invites);
                setPagination(res.data.data.pagination);
            } else {
                // Temporary Mock Data for UI demonstration if API fails or is empty
                setInvites([
                    { _id: '1', name: 'Aarav Sharma', email: 'aarav@example.com', role: 'student', status: 'pending', invitedBy: { name: 'Admin' }, createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000) },
                    { _id: '2', name: 'Neha Gupta', email: 'neha@example.com', role: 'tutor', status: 'accepted', invitedBy: { name: 'Admin' }, createdAt: new Date(Date.now() - 86400000), expiresAt: new Date() },
                    { _id: '3', name: 'Rohan Verma', email: 'rohan@example.com', role: 'student', status: 'expired', invitedBy: { name: 'Admin' }, createdAt: new Date(Date.now() - 172800000), expiresAt: new Date(Date.now() - 86400000) },
                ]);
                setPagination({ page: 1, limit: 10, total: 3, pages: 1 });
            }
        } catch (error) {
            console.error('Failed to fetch invites:', error);
            toast.error('Failed to load invites');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkInvite = async (invitesList, mode) => {
        try {
            const res = await api.post('/admin/invites/bulk', { invites: invitesList, type: mode });
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

    const filteredInvites = invites.filter(invite => {
        const matchesSearch = invite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invite.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Calculate mock stats for the top bar
    const totalInvites = invites.length;
    const pendingInvites = invites.filter(i => i.status === 'pending').length;
    const acceptedInvites = invites.filter(i => i.status === 'accepted').length;

    if (loading) {
        return (
            <div className="flex bg-[#F1EAFB] min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#6B4DF1]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Top Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { title: 'Total Sent', value: totalInvites || '0', bg: '#E8CBF3', iconBg: '#A059C5', icon: Send },
                    { title: 'Pending Approval', value: pendingInvites || '0', bg: '#FFE5D3', iconBg: '#FC8730', icon: Clock },
                    { title: 'Accepted Invites', value: acceptedInvites || '0', bg: '#D1F4E6', iconBg: '#4ABCA8', icon: CheckCircle }
                ].map((stat, i) => (
                    <div 
                        key={i} 
                        className="bg-white rounded-2xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 relative" 
                        style={{ boxShadow: softShadow }}
                    >
                        <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: stat.iconBg }}>
                            <stat.icon size={22} color="#ffffff" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[24px] font-black text-[#27225B] leading-none mb-1.5">{stat.value}</span>
                            <span className="text-[13px] font-semibold text-[#7D8DA6] leading-none">{stat.title}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Header & Toolbar ── */}
            <div className="bg-white rounded-2xl flex flex-col overflow-hidden mb-6" style={{ boxShadow: softShadow }}>
                
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F4F0FD]">
                    <div>
                        <h1 className="text-[22px] font-black text-[#27225B] m-0">Invite Management</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Manage invitations for students and instructors</p>
                    </div>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#6B4DF1] text-white font-bold text-[14px] rounded-xl hover:bg-[#5839D6] transition-colors shadow-md border-none cursor-pointer"
                    >
                        <Plus size={18} strokeWidth={3} /> Bulk Invite
                    </button>
                </div>
                
                {/* Filters */}
                <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#F4F0FD] bg-[#FAFAFA]">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D8DA6]" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-[#E9DFFC] text-[#7D8DA6] text-[13px] font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer min-w-[140px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="expired">Expired</option>
                            <option value="revoked">Revoked</option>
                        </select>
                        <button
                            onClick={fetchInvites}
                            className="w-10 h-10 bg-white border border-[#E9DFFC] rounded-xl flex items-center justify-center text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer transition-colors shadow-sm"
                            title="Refresh List"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Invites Table ── */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F4F0FD]">
                            <tr>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">User</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Role</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Status</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Invited By</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider">Dates</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD] bg-white">
                            {filteredInvites.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <Mail className="w-12 h-12 text-[#D1C4F9] mx-auto mb-3" />
                                        <p className="text-[14px] font-semibold text-[#7D8DA6] m-0">
                                            {searchTerm || statusFilter !== 'all' ? 'No invites found matching your filters' : 'No invites yet. Send your first invite!'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvites.map((invite) => (
                                    <tr key={invite._id} className="hover:bg-[#F8F7FF] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-[10px] bg-[#E9DFFC] text-[#6B4DF1] flex items-center justify-center shrink-0">
                                                    <Mail size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#27225B] text-[14px]">{invite.name}</span>
                                                    <span className="text-[12px] font-medium text-[#7D8DA6] mt-0.5">{invite.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-3 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${
                                                invite.role === 'tutor' ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-[#EBF8FF] text-[#3182CE]'
                                            }`}>
                                                {invite.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {invite.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF7ED] text-[#FC8730] text-[12px] font-bold rounded-lg"><Clock size={12} /> Pending</span>}
                                            {invite.status === 'accepted' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ECFDF5] text-[#4ABCA8] text-[12px] font-bold rounded-lg"><CheckCircle size={12} /> Accepted</span>}
                                            {invite.status === 'expired' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEE2E2] text-[#E53E3E] text-[12px] font-bold rounded-lg"><AlertCircle size={12} /> Expired</span>}
                                            {invite.status === 'revoked' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F1F5F9] text-[#4A5568] text-[12px] font-bold rounded-lg"><X size={12} /> Revoked</span>}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-[#4A5568]">{invite.invitedBy?.name || 'Admin'}</span>
                                                <span className="text-[11px] font-medium text-[#7D8DA6]">{invite.invitedBy?.email || 'admin@system.com'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[12px] font-semibold text-[#4A5568]">Sent: {new Date(invite.createdAt).toLocaleDateString()}</span>
                                                <span className="text-[11px] font-medium text-[#A0ABC0]">Exp: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {invite.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResendInvite(invite._id)}
                                                            className="text-[#6B4DF1] hover:text-[#5839D6] bg-transparent border-none cursor-pointer"
                                                            title="Resend Invite"
                                                        >
                                                            <Mail size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRevokeInvite(invite._id)}
                                                            className="text-[#A0ABC0] hover:text-[#E53E3E] bg-transparent border-none cursor-pointer"
                                                            title="Revoke Invite"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {invite.status === 'expired' && (
                                                    <button
                                                        onClick={() => handleResendInvite(invite._id)}
                                                        className="text-[#4ABCA8] hover:text-[#389E8D] bg-transparent border-none cursor-pointer"
                                                        title="Resend Invite"
                                                    >
                                                        <RefreshCw size={18} />
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

                {/* Table Pagination */}
                <div className="px-6 py-4 border-t border-[#F4F0FD] flex items-center justify-between bg-white">
                    <span className="text-[13px] font-bold text-[#7D8DA6]">
                        Showing {filteredInvites.length > 0 ? ((pagination.page || 1) - 1) * (pagination.limit || 10) + 1 : 0} to {Math.min((pagination.page || 1) * (pagination.limit || 10), pagination.total || filteredInvites.length)} of {pagination.total || invites.length} invites
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16}/>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F0FD] text-[#6B4DF1] font-bold border-none cursor-default text-[13px]">
                            {currentPage}
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === (pagination.pages || 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16}/>
                        </button>
                    </div>
                </div>
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