'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, FileCheck, Search, Building2, CheckCircle2, 
    AlertTriangle, ShieldAlert, BookOpen, Clock, Target, Eye
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminExamsPage() {
    const [exams, setExams] = useState([]);
    const [kpis, setKpis] = useState({ totalExams: 0, activeExams: 0, totalGlobalAttempts: 0, globalCheatingAlerts: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchExams();
    }, [statusFilter]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/exams?status=${statusFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;
            
            const res = await api.get(query);
            if (res.data.success) {
                setExams(res.data.data.exams);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load global exams');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchExams();
    };

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <FileCheck className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Global Exams & Proctoring</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Monitor all assessments and AI-detected cheating alerts across the platform.</p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-[20px] p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><FileCheck size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Exams</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.totalExams}</h3></div>
                </div>
                <div className="bg-white rounded-[20px] p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0"><CheckCircle2 size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Active / Live</p><h3 className="text-[24px] font-black text-[#10B981] m-0">{kpis.activeExams}</h3></div>
                </div>
                <div className="bg-white rounded-[20px] p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF8FF] text-[#3182CE] flex items-center justify-center shrink-0"><Target size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Attempts</p><h3 className="text-[24px] font-black text-[#3182CE] m-0">{kpis.totalGlobalAttempts.toLocaleString()}</h3></div>
                </div>
                
                {/* 🚨 Global Cheating Radar */}
                <div className={`rounded-[20px] p-5 shadow-lg relative overflow-hidden flex items-start gap-4 border ${kpis.globalCheatingAlerts > 0 ? 'bg-[#27225B] border-[#1e1a48]' : 'bg-white border-[#E9DFFC]'}`}>
                    {kpis.globalCheatingAlerts > 0 && <div className="absolute right-0 top-0 w-16 h-16 bg-[#EF4444] opacity-20 rounded-bl-full blur-xl animate-pulse"></div>}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative z-10 ${kpis.globalCheatingAlerts > 0 ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F8F6FC] text-[#A0ABC0]'}`}>
                        <ShieldAlert size={20}/>
                    </div>
                    <div className="relative z-10">
                        <p className={`text-[11px] font-bold uppercase tracking-wider m-0 mb-1 ${kpis.globalCheatingAlerts > 0 ? 'text-[#A0ABC0]' : 'text-[#7D8DA6]'}`}>AI Proctor Flags</p>
                        <h3 className={`text-[24px] font-black m-0 ${kpis.globalCheatingAlerts > 0 ? 'text-white' : 'text-[#27225B]'}`}>{kpis.globalCheatingAlerts.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {['all', 'published', 'draft'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all capitalize whitespace-nowrap border-none cursor-pointer ${statusFilter === status ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                            {status === 'all' ? 'All Exams' : status}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="relative w-full xl:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input type="text" placeholder="Search exam title..." className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </form>
            </div>

            {/* ── Exams List ── */}
            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>
            ) : exams.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E9DFFC] p-16 text-center shadow-sm">
                    <FileCheck className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                    <h3 className="text-[18px] font-black text-[#27225B] m-0">No exams found</h3>
                    <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">No records match your search or filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {exams.map((exam, idx) => {
                        const isPublished = exam.status === 'published';
                        const totalAttempts = exam.stats.totalAttempts;
                        const alerts = exam.stats.suspiciousAttempts;
                        
                        return (
                            <div key={exam._id || idx} className={`bg-white rounded-[24px] border overflow-hidden hover:-translate-y-1 transition-transform flex flex-col group shadow-sm ${alerts > 0 ? 'border-[#FECACA]' : 'border-[#E9DFFC]'}`}>
                                
                                {/* Header */}
                                <div className={`px-5 py-4 border-b flex items-start justify-between gap-2 ${alerts > 0 ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-[#FDFBFF] border-[#F4F0FD]'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-black text-[16px] text-[#27225B] m-0 line-clamp-1">{exam.title}</h3>
                                            {exam.isProctoringEnabled && <ShieldAlert size={14} className="text-[#6B4DF1]" title="Proctoring Enabled"/>}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#6B4DF1]">
                                            <BookOpen size={14}/> <span className="line-clamp-1">{exam.courseId?.title || 'Unknown Course'}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 border ${isPublished ? 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5]' : 'bg-[#F8F6FC] text-[#7D8DA6] border-[#E9DFFC]'}`}>
                                        {exam.status}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-[#F8F6FC] p-3 rounded-xl border border-[#E9DFFC]">
                                            <p className="text-[10px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">Total Attempts</p>
                                            <h4 className="text-[20px] font-black text-[#27225B] m-0">{totalAttempts}</h4>
                                        </div>
                                        <div className={`p-3 rounded-xl border ${alerts > 0 ? 'bg-[#FFF5F5] border-[#FECACA]' : 'bg-[#F8F6FC] border-[#E9DFFC]'}`}>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider m-0 mb-1 ${alerts > 0 ? 'text-[#E53E3E]' : 'text-[#A0ABC0]'}`}>AI Alerts</p>
                                            <h4 className={`text-[20px] font-black m-0 flex items-center gap-1.5 ${alerts > 0 ? 'text-[#E53E3E]' : 'text-[#27225B]'}`}>
                                                {alerts} {alerts > 0 && <AlertTriangle size={14} className="animate-pulse"/>}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 mt-auto text-[12px] font-bold text-[#4A5568]">
                                        <div className="flex justify-between border-b border-[#F4F0FD] pb-2">
                                            <span className="flex items-center gap-1.5 text-[#A0ABC0]"><Clock size={14}/> Duration</span>
                                            <span className="text-[#27225B]">{exam.duration} mins</span>
                                        </div>
                                        <div className="flex justify-between border-b border-[#F4F0FD] pb-2">
                                            <span className="flex items-center gap-1.5 text-[#A0ABC0]"><Target size={14}/> Total Marks</span>
                                            <span className="text-[#27225B]">{exam.totalMarks} (Pass: {exam.passingMarks || `${exam.passingPercentage}%`})</span>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span className="flex items-center gap-1.5 text-[#A0ABC0]"><Building2 size={14}/> Context</span>
                                            <span className="text-[#6B4DF1] truncate max-w-[150px] text-right">{exam.instituteId ? exam.instituteId.name : 'Global Master'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}