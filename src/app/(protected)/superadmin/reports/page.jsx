'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, Flag, AlertTriangle, ShieldAlert, CheckCircle2, 
    XCircle, Search, User, BookOpen, MessageSquareQuote, Eye 
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [kpis, setKpis] = useState({ totalReports: 0, pendingCount: 0, reviewedCount: 0, resolvedCount: 0, dismissedCount: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchReports();
    }, [statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/superadmin/reports?status=${statusFilter}`);
            if (res.data.success) {
                setReports(res.data.data.reports);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await api.patch(`/superadmin/reports/${id}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success(res.data.message);
                // Update local state instantly
                setReports(reports.map(r => r._id === id ? { ...r, status: newStatus } : r));
                // Recalculate KPIs optimistically (or just refetch)
                fetchReports();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getReasonConfig = (reason) => {
        switch(reason) {
            case 'Spam': return 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]';
            case 'Harassment': return 'bg-[#FEF2F2] text-[#E53E3E] border-[#FECACA]';
            case 'Inappropriate Content': return 'bg-[#FFF5F5] text-[#E53E3E] border-[#FECACA]';
            case 'Misleading Information': return 'bg-[#F4F0FD] text-[#6B4DF1] border-[#E9DFFC]';
            default: return 'bg-[#F8F6FC] text-[#7D8DA6] border-[#E9DFFC]';
        }
    };

    const getTargetIcon = (type) => {
        if (type === 'Course') return <BookOpen size={14} className="text-[#6B4DF1]" />;
        if (type === 'Tutor') return <User size={14} className="text-[#10B981]" />;
        if (type === 'Review') return <MessageSquareQuote size={14} className="text-[#F59E0B]" />;
        return <Flag size={14} />;
    };

    const filteredReports = reports.filter(r => 
        r.reporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.targetName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <ShieldAlert className="w-6 h-6 text-[#E53E3E]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Content Moderation & Reports</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Review flagged users, courses, and handle platform abuse.</p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className={`bg-white rounded-[20px] p-5 shadow-sm border flex items-start gap-4 transition-all ${kpis.pendingCount > 0 ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#E9DFFC]'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpis.pendingCount > 0 ? 'bg-[#FEE2E2] text-[#E53E3E]' : 'bg-[#F4F0FD] text-[#6B4DF1]'}`}>
                        <AlertTriangle size={20} className={kpis.pendingCount > 0 ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                        <p className={`text-[11px] font-bold uppercase tracking-wider m-0 mb-1 ${kpis.pendingCount > 0 ? 'text-[#E53E3E]' : 'text-[#7D8DA6]'}`}>Pending Action</p>
                        <h3 className={`text-[24px] font-black m-0 ${kpis.pendingCount > 0 ? 'text-[#E53E3E]' : 'text-[#27225B]'}`}>{kpis.pendingCount}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E9DFFC] flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0"><Eye size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Under Review</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.reviewedCount}</h3></div>
                </div>

                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E9DFFC] flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0"><CheckCircle2 size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Resolved Valid</p><h3 className="text-[24px] font-black text-[#10B981] m-0">{kpis.resolvedCount}</h3></div>
                </div>

                <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#E9DFFC] flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F8F6FC] text-[#A0ABC0] flex items-center justify-center shrink-0"><XCircle size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Dismissed Fake</p><h3 className="text-[24px] font-black text-[#A0ABC0] m-0">{kpis.dismissedCount}</h3></div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all capitalize whitespace-nowrap border-none cursor-pointer ${statusFilter === status ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                            {status === 'all' ? 'All Reports' : status}
                        </button>
                    ))}
                </div>
                <div className="relative w-full xl:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input type="text" placeholder="Search reporter or target..." className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* ── Reports Grid ── */}
            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>
            ) : filteredReports.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E9DFFC] p-16 text-center shadow-sm">
                    <ShieldAlert className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                    <h3 className="text-[18px] font-black text-[#27225B] m-0">No reports found</h3>
                    <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">The platform is currently clean and safe.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredReports.map((report) => (
                        <div key={report._id} className={`bg-white rounded-[24px] border overflow-hidden hover:-translate-y-1 transition-transform flex flex-col group shadow-sm ${report.status === 'Pending' ? 'border-[#FECACA]' : 'border-[#E9DFFC]'}`}>
                            
                            {/* Card Header */}
                            <div className="px-5 py-4 border-b border-[#F4F0FD] bg-[#FDFBFF] flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#E9DFFC] flex items-center justify-center overflow-hidden shrink-0 border border-[#D5C2F6]">
                                        {report.reporter?.profileImage ? <img src={report.reporter.profileImage} className="w-full h-full object-cover"/> : <User size={16} className="text-[#6B4DF1]"/>}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0">Reported By</p>
                                        <p className="text-[14px] font-bold text-[#27225B] m-0 leading-tight">{report.reporter?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getReasonConfig(report.reason)}`}>
                                    {report.reason}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                {/* Target Info */}
                                <div className="bg-[#F8F6FC] rounded-xl p-3 border border-[#E9DFFC] mb-4">
                                    <div className="flex items-center gap-2 text-[12px] font-black text-[#6B4DF1] uppercase tracking-wider mb-1">
                                        {getTargetIcon(report.targetType)} Target: {report.targetType}
                                    </div>
                                    <p className="text-[14px] font-bold text-[#27225B] m-0 line-clamp-1" title={report.targetName}>{report.targetName}</p>
                                    <p className="text-[10px] font-mono text-[#A0ABC0] m-0 mt-0.5">ID: {report.targetId}</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">Reporter Comments</p>
                                    <p className="text-[13px] font-medium text-[#4A5568] m-0 italic border-l-2 border-[#D1C4F9] pl-3 py-1 bg-[#FDFBFF]">
                                        "{report.description || 'No additional context provided.'}"
                                    </p>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-4 border-t border-[#F4F0FD] flex items-center justify-between gap-3 bg-[#FDFBFF]">
                                <span className="text-[11px] font-bold text-[#7D8DA6]">
                                    {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                                
                                <select 
                                    value={report.status} 
                                    onChange={(e) => handleStatusChange(report._id, e.target.value)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border-none cursor-pointer outline-none shadow-sm transition-colors ${
                                        report.status === 'Pending' ? 'bg-[#FEE2E2] text-[#E53E3E]' :
                                        report.status === 'Reviewed' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                                        report.status === 'Resolved' ? 'bg-[#ECFDF5] text-[#10B981]' :
                                        'bg-[#F8F6FC] text-[#A0ABC0]'
                                    }`}
                                >
                                    <option value="Pending">🚨 Pending</option>
                                    <option value="Reviewed">👀 Under Review</option>
                                    <option value="Resolved">✅ Resolved</option>
                                    <option value="Dismissed">❌ Dismissed</option>
                                </select>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}