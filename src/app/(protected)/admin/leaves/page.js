'use client';

import { useState, useEffect } from 'react';
import {
    Calendar, CheckCircle2, XCircle, Clock,
    User, Search, Filter, AlertCircle, ChevronLeft, ChevronRight, CheckCircle, X, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

export default function AdminLeavesPage() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

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
            <div className="flex bg-[#F1EAFB] min-h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F1EAFB', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="mb-2">
                <h1 className="text-[22px] font-black text-[#27225B] m-0">Leave Management</h1>
                <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Review and manage student and instructor leave requests</p>
            </div>

            {/* ── KPI Stats Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 relative" style={{ boxShadow: softShadow }}>
                    <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm bg-[#FFF7ED] border border-[#FDBA74]">
                        <Clock size={22} className="text-[#FC8730]" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[24px] font-black text-[#27225B] leading-none mb-1.5">{totalPending}</span>
                        <span className="text-[13px] font-bold text-[#7D8DA6] leading-none">Pending Requests</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 relative" style={{ boxShadow: softShadow }}>
                    <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm bg-[#ECFDF5] border border-[#A7F3D0]">
                        <CheckCircle size={22} className="text-[#4ABCA8]" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[24px] font-black text-[#27225B] leading-none mb-1.5">{totalApproved}</span>
                        <span className="text-[13px] font-bold text-[#7D8DA6] leading-none">Approved Leaves</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 relative" style={{ boxShadow: softShadow }}>
                    <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm bg-[#FEE2E2] border border-[#FECACA]">
                        <X size={22} className="text-[#E53E3E]" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[24px] font-black text-[#27225B] leading-none mb-1.5">{totalRejected}</span>
                        <span className="text-[13px] font-bold text-[#7D8DA6] leading-none">Rejected Leaves</span>
                    </div>
                </div>
            </div>

            {/* ── Main Integrated Table Area ── */}
            <div className="bg-white rounded-3xl flex flex-col overflow-hidden mb-6" style={{ boxShadow: softShadow }}>
                
                {/* Filters Toolbar */}
                <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#F4F0FD] bg-[#FDFBFF]">
                    <h2 className="text-[16px] font-black text-[#27225B] m-0">Leave Applications</h2>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex items-center">
                            <Filter className="absolute left-3 w-4 h-4 text-[#A0ABC0]" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] cursor-pointer outline-none min-w-[140px]"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="relative flex items-center">
                            <User className="absolute left-3 w-4 h-4 text-[#A0ABC0]" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] cursor-pointer outline-none min-w-[130px]"
                            >
                                <option value="all">All Roles</option>
                                <option value="student">Students</option>
                                <option value="tutor">Instructors</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto px-6 pb-2">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-[#F4F0FD] rounded-xl">
                            <tr>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase first:rounded-l-xl">Applicant</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase">Leave Duration</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase">Reason</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase">Status</th>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase text-right last:rounded-r-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD]">
                            {leaves.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <Calendar className="w-12 h-12 text-[#D1C4F9] mx-auto mb-3" />
                                        <p className="text-[14px] font-bold text-[#7D8DA6] m-0">
                                            No leave requests found matching your filters.
                                        </p>
                                    </td>
                                </tr>
                            ) : leaves.map((leave) => (
                                <tr key={leave._id} className="hover:bg-[#F8F7FF] transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-[10px] bg-[#E9DFFC] text-[#6B4DF1] flex items-center justify-center font-bold text-[14px] shrink-0 border border-[#D1C4F9] overflow-hidden">
                                                {leave.userId?.profileImage ? (
                                                    <img src={leave.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    leave.userId?.name?.charAt(0).toUpperCase() || 'U'
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#27225B] text-[14px] m-0">{leave.userId?.name || 'Unknown'}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${leave.role === 'tutor' ? 'bg-[#F4F0FD] text-[#6B4DF1]' : 'bg-[#EBF8FF] text-[#3182CE]'}`}>
                                                        {leave.role === 'tutor' ? 'Instructor' : 'Student'}
                                                    </span>
                                                </div>
                                                <p className="text-[12px] font-medium text-[#A0ABC0] m-0 mt-0.5">{leave.userId?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-0.5 text-[13px] font-semibold text-[#4A5568]">
                                            <span className="text-[#27225B]">{new Date(leave.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="text-[11px] text-[#A0ABC0] font-medium">to</span>
                                            <span className="text-[#27225B]">{new Date(leave.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-[13px] font-medium text-[#4A5568] line-clamp-2 max-w-[280px] m-0 leading-relaxed" title={leave.reason}>
                                            {leave.reason}
                                        </p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider border ${
                                            leave.status === 'approved' ? 'bg-[#ECFDF5] text-[#4ABCA8] border-[#A7F3D0]' :
                                            leave.status === 'rejected' ? 'bg-[#FEE2E2] text-[#E53E3E] border-[#FECACA]' :
                                            'bg-[#FFF7ED] text-[#FC8730] border-[#FDBA74]'
                                        }`}>
                                            {leave.status === 'approved' && <CheckCircle2 size={14} strokeWidth={3} />}
                                            {leave.status === 'rejected' && <XCircle size={14} strokeWidth={3} />}
                                            {leave.status === 'pending' && <Clock size={14} strokeWidth={3} />}
                                            {leave.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {leave.status === 'pending' ? (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleAction(leave._id, 'approved')}
                                                    disabled={actionLoading === leave._id}
                                                    className="px-3 py-1.5 bg-[#ECFDF5] text-[#4ABCA8] hover:bg-[#4ABCA8] hover:text-white border border-[#4ABCA8] rounded-lg text-[12px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {actionLoading === leave._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={3} />}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(leave._id, 'rejected')}
                                                    disabled={actionLoading === leave._id}
                                                    className="px-3 py-1.5 bg-[#FEE2E2] text-[#E53E3E] hover:bg-[#E53E3E] hover:text-white border border-[#E53E3E] rounded-lg text-[12px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {actionLoading === leave._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} strokeWidth={3} />}
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[12px] font-semibold text-[#A0ABC0] italic">— Processed —</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination Footer */}
                <div className="px-6 py-4 border-t border-[#F4F0FD] flex items-center justify-between bg-white mt-2">
                    <span className="text-[13px] font-bold text-[#7D8DA6]">Showing {leaves.length} of {leaves.length} requests</span>
                    <div className="flex items-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer disabled:opacity-50"><ChevronLeft size={16}/></button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F0FD] text-[#6B4DF1] font-bold border-none cursor-default text-[13px]">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#E9DFFC] text-[#7D8DA6] hover:text-[#6B4DF1] cursor-pointer disabled:opacity-50"><ChevronRight size={16}/></button>
                    </div>
                </div>
            </div>
        </div>
    );
}