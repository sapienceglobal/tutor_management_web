'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, Users, Search, Building2, Calendar, 
    BookOpen, CheckCircle2, Clock, AlertCircle, UserCog 
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminBatchesPage() {
    const [batches, setBatches] = useState([]);
    const [kpis, setKpis] = useState({ totalBatches: 0, activeBatches: 0, completedBatches: 0, avgStudentsPerBatch: 0, totalStudentsInBatches: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchBatches();
    }, [statusFilter]);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/batches?status=${statusFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;
            
            const res = await api.get(query);
            if (res.data.success) {
                setBatches(res.data.data.batches);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load global batches');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchBatches();
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'active': return { color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', border: 'border-[#D1FAE5]', icon: CheckCircle2, label: 'Active Now' };
            case 'upcoming': return { color: 'text-[#F59E0B]', bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]', icon: Clock, label: 'Upcoming' };
            case 'completed': return { color: 'text-[#6B4DF1]', bg: 'bg-[#F4F0FD]', border: 'border-[#E9DFFC]', icon: CheckCircle2, label: 'Completed' };
            default: return { color: 'text-[#7D8DA6]', bg: 'bg-[#F8F6FC]', border: 'border-[#E9DFFC]', icon: AlertCircle, label: status };
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <Users className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Global Batches Directory</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Read-only oversight of all course batches and student distributions across the platform.</p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><Users size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Batches</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.totalBatches}</h3></div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0"><CheckCircle2 size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Active Batches</p><h3 className="text-[24px] font-black text-[#10B981] m-0">{kpis.activeBatches}</h3></div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0"><UserCog size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Avg Students / Batch</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.avgStudentsPerBatch}</h3></div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF8FF] text-[#3182CE] flex items-center justify-center shrink-0"><BookOpen size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Batched Students</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.totalStudentsInBatches.toLocaleString()}</h3></div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {['all', 'active', 'upcoming', 'completed'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all capitalize whitespace-nowrap border-none cursor-pointer ${statusFilter === status ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                            {status === 'all' ? 'All Batches' : status}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="relative w-full xl:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input type="text" placeholder="Search by batch name..." className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </form>
            </div>

            {/* ── Batches List ── */}
            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>
            ) : batches.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E9DFFC] p-16 text-center shadow-sm">
                    <Users className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                    <h3 className="text-[18px] font-black text-[#27225B] m-0">No batches found</h3>
                    <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">No records match your current filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {batches.map(batch => {
                        const statusData = getStatusConfig(batch.status);
                        const StatusIcon = statusData.icon;
                        const studentCount = batch.students?.length || 0;

                        return (
                            <div key={batch._id} className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden hover:-translate-y-1 transition-transform flex flex-col group shadow-sm">
                                
                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm border ${statusData.bg} ${statusData.color} ${statusData.border}`}>
                                            <StatusIcon size={10}/> {statusData.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#27225B] bg-[#F8F6FC] px-2 py-1 rounded-lg border border-[#E9DFFC]">
                                            <Users size={14} className="text-[#6B4DF1]"/> {studentCount} Students
                                        </div>
                                    </div>
                                    
                                    <h3 className="font-black text-[16px] text-[#27225B] mb-1 leading-snug">{batch.name}</h3>
                                    <p className="text-[12px] font-bold text-[#6B4DF1] m-0 mb-4 line-clamp-1">{batch.courseId?.title || 'Unknown Course'}</p>
                                    
                                    {/* Context Details */}
                                    <div className="space-y-3 mt-auto bg-[#F9F7FC] p-3 rounded-xl border border-[#E9DFFC]/50">
                                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4A5568]">
                                            <Building2 size={14} className="text-[#A0ABC0] shrink-0" />
                                            <span className="truncate">{batch.instituteId ? batch.instituteId.name : 'Global Platform'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4A5568]">
                                            <div className="w-4 h-4 rounded-full bg-[#E9DFFC] flex items-center justify-center overflow-hidden shrink-0">
                                                {batch.tutorId?.profileImage ? <img src={batch.tutorId.profileImage} className="w-full h-full object-cover"/> : <span className="text-[8px] font-bold text-[#6B4DF1]">T</span>}
                                            </div>
                                            <span className="truncate">{batch.tutorId?.name || 'Unknown Tutor'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Dates */}
                                <div className="p-4 border-t border-[#F4F0FD] bg-[#FDFBFF] flex items-center justify-between gap-3 text-[11px] font-bold text-[#7D8DA6]">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-[#A0ABC0]"/>
                                        {new Date(batch.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 
                                        {batch.endDate ? ` - ${new Date(batch.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ' (Ongoing)'}
                                    </span>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}