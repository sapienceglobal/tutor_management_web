'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
    MdMail, 
    MdAdd, 
    MdSearch, 
    MdClose, 
    MdCheckCircle, 
    MdAccessTime, 
    MdWarning, 
    MdRefresh, 
    MdDelete, 
    MdSend, 
    MdChevronLeft, 
    MdChevronRight 
} from 'react-icons/md';
import BulkInviteModal from '@/components/admin/BulkInviteModal';
import StatCard from '@/components/StatCard';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

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
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Top Stats Row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard 
                    icon={MdSend}
                    value={totalInvites || '0'}
                    label="Total Sent"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdAccessTime}
                    value={pendingInvites || '0'}
                    label="Pending Approval"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard 
                    icon={MdCheckCircle}
                    value={acceptedInvites || '0'}
                    label="Accepted Invites"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
            </div>

            {/* ── Header & Toolbar ── */}
            <div className="flex flex-col overflow-hidden mb-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            Invite Management
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: '4px 0 0 0' }}>
                            Manage invitations for students and instructors
                        </p>
                    </div>
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 transition-opacity hover:opacity-90 cursor-pointer"
                        style={{ padding: '10px 24px', background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}
                    >
                        <MdAdd style={{ width: 18, height: 18 }} /> Bulk Invite
                    </button>
                </div>
                
                {/* Filters */}
                <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                    <div className="relative w-full md:w-96 group">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" style={{ width: 18, height: 18, color: C.textMuted }} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...baseInputStyle, paddingLeft: '36px' }}
                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ ...baseInputStyle, minWidth: '140px', padding: '10px 16px', cursor: 'pointer' }}
                            onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="expired">Expired</option>
                            <option value="revoked">Revoked</option>
                        </select>
                        <button
                            onClick={fetchInvites}
                            className="flex items-center justify-center transition-colors cursor-pointer"
                            title="Refresh List"
                            style={{ width: 44, height: 44, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', color: C.textMuted }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; }}
                        >
                            <MdRefresh style={{ width: 18, height: 18 }} />
                        </button>
                    </div>
                </div>

                {/* ── Invites Table ── */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>User</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Role</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Invited By</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Dates</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvites.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16">
                                        <div className="p-14 text-center border border-dashed"
                                             style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4"
                                                 style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdMail style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Invites Found</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                {searchTerm || statusFilter !== 'all' ? 'No invites found matching your filters' : 'No invites yet. Send your first invite!'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvites.map((invite) => (
                                    <tr key={invite._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center shrink-0" 
                                                     style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.iconBg }}>
                                                    <MdMail style={{ width: 18, height: 18, color: C.iconColor }} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{invite.name}</span>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2 }}>{invite.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                fontFamily: T.fontFamily, 
                                                fontSize: T.size.xs, 
                                                fontWeight: T.weight.bold, 
                                                borderRadius: '10px', 
                                                textTransform: 'uppercase', 
                                                letterSpacing: T.tracking.wider,
                                                backgroundColor: invite.role === 'tutor' ? C.btnViewAllBg : C.innerBg,
                                                color: invite.role === 'tutor' ? C.btnPrimary : C.text,
                                                border: `1px solid ${C.cardBorder}`
                                            }}>
                                                {invite.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.bold,
                                                borderRadius: '10px',
                                                textTransform: 'capitalize',
                                                backgroundColor: invite.status === 'accepted' ? C.successBg : invite.status === 'expired' ? C.dangerBg : invite.status === 'revoked' ? C.innerBg : C.warningBg,
                                                color: invite.status === 'accepted' ? C.success : invite.status === 'expired' ? C.danger : invite.status === 'revoked' ? C.textMuted : C.warning,
                                                border: `1px solid ${invite.status === 'accepted' ? C.successBorder : invite.status === 'expired' ? C.dangerBorder : invite.status === 'revoked' ? C.cardBorder : C.warningBorder}`
                                            }}>
                                                {invite.status === 'pending' && <MdAccessTime style={{ width: 14, height: 14 }} />}
                                                {invite.status === 'accepted' && <MdCheckCircle style={{ width: 14, height: 14 }} />}
                                                {invite.status === 'expired' && <MdWarning style={{ width: 14, height: 14 }} />}
                                                {invite.status === 'revoked' && <MdClose style={{ width: 14, height: 14 }} />}
                                                {invite.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="flex flex-col">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{invite.invitedBy?.name || 'Admin'}</span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, marginTop: 2 }}>{invite.invitedBy?.email || 'admin@system.com'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="flex flex-col gap-1">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>Sent: {new Date(invite.createdAt).toLocaleDateString()}</span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.semibold, color: C.textMuted }}>Exp: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                            <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {invite.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleResendInvite(invite._id)}
                                                            className="transition-colors border-none cursor-pointer"
                                                            title="Resend Invite"
                                                            style={{ backgroundColor: 'transparent', color: C.btnPrimary }}
                                                            onMouseEnter={e => e.currentTarget.style.color = '#5839D6'}
                                                            onMouseLeave={e => e.currentTarget.style.color = C.btnPrimary}
                                                        >
                                                            <MdMail style={{ width: 20, height: 20 }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRevokeInvite(invite._id)}
                                                            className="transition-colors border-none cursor-pointer"
                                                            title="Revoke Invite"
                                                            style={{ backgroundColor: 'transparent', color: C.textMuted }}
                                                            onMouseEnter={e => e.currentTarget.style.color = C.danger}
                                                            onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
                                                        >
                                                            <MdDelete style={{ width: 20, height: 20 }} />
                                                        </button>
                                                    </>
                                                )}
                                                {invite.status === 'expired' && (
                                                    <button
                                                        onClick={() => handleResendInvite(invite._id)}
                                                        className="transition-colors border-none cursor-pointer"
                                                        title="Resend Invite"
                                                        style={{ backgroundColor: 'transparent', color: C.success }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#389E8D'}
                                                        onMouseLeave={e => e.currentTarget.style.color = C.success}
                                                    >
                                                        <MdRefresh style={{ width: 20, height: 20 }} />
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
                <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: C.surfaceWhite, borderTop: `1px solid ${C.cardBorder}` }}>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>
                        Showing {filteredInvites.length > 0 ? ((pagination.page || 1) - 1) * (pagination.limit || 10) + 1 : 0} to {Math.min((pagination.page || 1) * (pagination.limit || 10), pagination.total || filteredInvites.length)} of {pagination.total || invites.length} invites
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}
                            onMouseEnter={e => { if(currentPage !== 1) { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; } }}
                            onMouseLeave={e => { if(currentPage !== 1) { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; } }}
                        >
                            <MdChevronLeft style={{ width: 20, height: 20 }} />
                        </button>
                        <button className="flex items-center justify-center border-none cursor-default"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                            {currentPage}
                        </button>
                        <button 
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === (pagination.pages || 1)}
                            className="flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}
                            onMouseEnter={e => { if(currentPage !== (pagination.pages || 1)) { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; } }}
                            onMouseLeave={e => { if(currentPage !== (pagination.pages || 1)) { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; } }}
                        >
                            <MdChevronRight style={{ width: 20, height: 20 }} />
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