'use client';

import { useState, useEffect } from 'react';
import {
    MdAccessTime, MdCheckCircleOutline, MdCancel, MdSearch,
    MdFilterList, MdPerson, MdCheckCircle, MdChevronLeft, MdChevronRight, MdHourglassEmpty
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
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
            if (response.data?.success) {
                setLeaves(response.data.leaves || []);
            } else {
                // Mock Data for UI testing if DB is empty/fails
                setLeaves([
                    { _id: '1', userId: { name: 'Aarav Sharma', email: 'aarav@example.com' }, role: 'student', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 172800000).toISOString(), reason: 'Attending a family function out of station.', status: 'pending' },
                    { _id: '2', userId: { name: 'Priya Verma', email: 'priya@tutor.com' }, role: 'tutor', startDate: new Date(Date.now() - 86400000).toISOString(), endDate: new Date().toISOString(), reason: 'Medical emergency, need to visit the hospital.', status: 'approved' },
                    { _id: '3', userId: { name: 'Rohan Gupta', email: 'rohan@example.com' }, role: 'student', startDate: new Date(Date.now() - 345600000).toISOString(), endDate: new Date(Date.now() - 172800000).toISOString(), reason: 'Fever and cold.', status: 'rejected' }
                ]);
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

    // Client-side stats for the top cards
    const totalPending = leaves.filter(l => l.status === 'pending').length;
    const totalApproved = leaves.filter(l => l.status === 'approved').length;
    const totalRejected = leaves.filter(l => l.status === 'rejected').length;

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
            
            {/* ── Header ── */}
            <div className="mb-2">
                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                    Leave Management
                </h1>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                    Review and manage student and instructor leave requests
                </p>
            </div>

            {/* ── KPI Stats Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard 
                    icon={MdAccessTime}
                    value={totalPending}
                    label="Pending Requests"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard 
                    icon={MdCheckCircleOutline}
                    value={totalApproved}
                    label="Approved Leaves"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
                <StatCard 
                    icon={MdCancel}
                    value={totalRejected}
                    label="Rejected Leaves"
                    iconBg={C.dangerBg}
                    iconColor={C.danger}
                />
            </div>

            {/* ── Main Integrated Table Area ── */}
            <div className="flex flex-col overflow-hidden mb-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                
                {/* Filters Toolbar */}
                <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.surfaceWhite }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Leave Applications</h2>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex items-center group w-full sm:w-auto">
                            <MdFilterList className="absolute left-3 transition-colors pointer-events-none" style={{ width: 16, height: 16, color: C.textMuted }} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ ...baseInputStyle, paddingLeft: '36px', minWidth: '140px', cursor: 'pointer' }}
                                onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="relative flex items-center group w-full sm:w-auto">
                            <MdPerson className="absolute left-3 transition-colors pointer-events-none" style={{ width: 16, height: 16, color: C.textMuted }} />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                style={{ ...baseInputStyle, paddingLeft: '36px', minWidth: '140px', cursor: 'pointer' }}
                                onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                            >
                                <option value="all">All Roles</option>
                                <option value="student">Students</option>
                                <option value="tutor">Instructors</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Applicant</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Leave Duration</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Reason</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16">
                                        <div className="p-14 text-center border border-dashed"
                                             style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4"
                                                 style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdAccessTime style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Leaves Found</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No leave requests found matching your filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : leaves.map((leave) => (
                                <tr key={leave._id} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center shrink-0 overflow-hidden" 
                                                 style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.iconBg, color: C.iconColor, fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold }}>
                                                {leave.userId?.profileImage ? (
                                                    <img src={leave.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    leave.userId?.name?.charAt(0).toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{leave.userId?.name || 'Unknown'}</span>
                                                    <span style={{ 
                                                        padding: '2px 8px', 
                                                        borderRadius: '10px', 
                                                        fontFamily: T.fontFamily, 
                                                        fontSize: '9px', 
                                                        fontWeight: T.weight.bold, 
                                                        textTransform: 'uppercase', 
                                                        letterSpacing: T.tracking.wider,
                                                        backgroundColor: leave.role === 'tutor' ? C.btnViewAllBg : C.innerBg,
                                                        color: leave.role === 'tutor' ? C.btnPrimary : C.text,
                                                        border: `1px solid ${C.cardBorder}`
                                                    }}>
                                                        {leave.role === 'tutor' ? 'Instructor' : 'Student'}
                                                    </span>
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: '2px 0 0 0' }}>{leave.userId?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <div className="flex flex-col gap-0.5">
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{new Date(leave.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted }}>to</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{new Date(leave.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 16px' }}>
                                        <p className="line-clamp-2 max-w-[280px]" title={leave.reason} style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, lineHeight: 1.6, margin: 0 }}>
                                            {leave.reason}
                                        </p>
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
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                            backgroundColor: leave.status === 'approved' ? C.successBg : leave.status === 'rejected' ? C.dangerBg : C.warningBg,
                                            color: leave.status === 'approved' ? C.success : leave.status === 'rejected' ? C.danger : C.warning,
                                            border: `1px solid ${leave.status === 'approved' ? C.successBorder : leave.status === 'rejected' ? C.dangerBorder : C.warningBorder}`
                                        }}>
                                            {leave.status === 'approved' && <MdCheckCircle style={{ width: 14, height: 14 }} />}
                                            {leave.status === 'rejected' && <MdCancel style={{ width: 14, height: 14 }} />}
                                            {leave.status === 'pending' && <MdAccessTime style={{ width: 14, height: 14 }} />}
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        {leave.status === 'pending' ? (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleAction(leave._id, 'approved')}
                                                    disabled={actionLoading === leave._id}
                                                    className="flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                                    style={{ padding: '6px 12px', backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.success; e.currentTarget.style.color = '#ffffff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.successBg; e.currentTarget.style.color = C.success; }}
                                                >
                                                    {actionLoading === leave._id ? <MdHourglassEmpty style={{ width: 14, height: 14 }} className="animate-spin" /> : <MdCheckCircleOutline style={{ width: 14, height: 14 }} />}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(leave._id, 'rejected')}
                                                    disabled={actionLoading === leave._id}
                                                    className="flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                                    style={{ padding: '6px 12px', backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.danger; e.currentTarget.style.color = '#ffffff'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                                                >
                                                    {actionLoading === leave._id ? <MdHourglassEmpty style={{ width: 14, height: 14 }} className="animate-spin" /> : <MdCancel style={{ width: 14, height: 14 }} />}
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, fontStyle: 'italic' }}>— Processed —</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination Footer */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: C.surfaceWhite, borderTop: `1px solid ${C.cardBorder}` }}>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>Showing {leaves.length} of {leaves.length} requests</span>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; }}>
                            <MdChevronLeft style={{ width: 20, height: 20 }} />
                        </button>
                        <button className="flex items-center justify-center border-none cursor-default"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                            1
                        </button>
                        <button className="flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; }}>
                            <MdChevronRight style={{ width: 20, height: 20 }} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}