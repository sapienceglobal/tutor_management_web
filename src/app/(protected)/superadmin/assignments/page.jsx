'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, FileText, Search, Building2, CheckCircle2, 
    Clock, AlertCircle, Inbox, BookOpen, Calendar
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminAssignmentsPage() {
    const [assignments, setAssignments] = useState([]);
    const [kpis, setKpis] = useState({ totalAssignments: 0, activeAssignments: 0, totalGlobalSubmissions: 0, globalPendingGrading: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchAssignments();
    }, [statusFilter]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/assignments?status=${statusFilter}`;
            if (searchTerm) query += `&search=${searchTerm}`;
            
            const res = await api.get(query);
            if (res.data.success) {
                setAssignments(res.data.data.assignments);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAssignments();
    };

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <FileText className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Global Assignments</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Monitor coursework, submission rates, and tutor grading backlogs.</p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-[20px] p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><FileText size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Assignments</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.totalAssignments}</h3></div>
                </div>
                <div className="bg-white rounded-[20px] p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0"><CheckCircle2 size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Published</p><h3 className="text-[24px] font-black text-[#10B981] m-0">{kpis.activeAssignments}</h3></div>
                </div>
                <div className="bg-white rounded-[20px] p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF8FF] text-[#3182CE] flex items-center justify-center shrink-0"><Inbox size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Submissions</p><h3 className="text-[24px] font-black text-[#3182CE] m-0">{kpis.totalGlobalSubmissions.toLocaleString()}</h3></div>
                </div>
                <div className="bg-[#27225B] rounded-[20px] p-5 border border-[#1e1a48] shadow-lg relative overflow-hidden flex items-start gap-4">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-[#EF4444] opacity-20 rounded-bl-full blur-xl"></div>
                    <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center shrink-0 relative z-10"><Clock size={20}/></div>
                    <div className="relative z-10"><p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">Pending Grading</p><h3 className="text-[24px] font-black text-white m-0">{kpis.globalPendingGrading.toLocaleString()}</h3></div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {['all', 'published', 'draft'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all capitalize whitespace-nowrap border-none cursor-pointer ${statusFilter === status ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                            {status === 'all' ? 'All Assignments' : status}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="relative w-full xl:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input type="text" placeholder="Search assignments..." className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </form>
            </div>

            {/* ── Assignments List ── */}
            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>
            ) : assignments.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E9DFFC] p-16 text-center shadow-sm">
                    <FileText className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                    <h3 className="text-[18px] font-black text-[#27225B] m-0">No assignments found</h3>
                    <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">No records match your search or filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {assignments.map((assignment, idx) => {
                        const isPublished = assignment.status === 'published';
                        const total = assignment.stats.totalSubmissions;
                        const pending = assignment.stats.pendingGrading;
                        const graded = assignment.stats.gradedCount;
                        
                        // Calculate percentage graded for the progress bar
                        const gradedPercentage = total > 0 ? ((graded / total) * 100).toFixed(0) : 0;

                        return (
                            <div key={assignment._id || idx} className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden hover:-translate-y-1 transition-transform flex flex-col group shadow-sm">
                                
                                {/* Header */}
                                <div className="px-5 py-4 border-b border-[#F4F0FD] bg-[#FDFBFF] flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <h3 className="font-black text-[16px] text-[#27225B] mb-1 line-clamp-1">{assignment.title}</h3>
                                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#6B4DF1]">
                                            <BookOpen size={14}/> <span className="line-clamp-1">{assignment.courseId?.title || 'Unknown Course'}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 border ${isPublished ? 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5]' : 'bg-[#F8F6FC] text-[#7D8DA6] border-[#E9DFFC]'}`}>
                                        {assignment.status}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="bg-[#F8F6FC] p-3 rounded-xl border border-[#E9DFFC]">
                                            <p className="text-[10px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1">Submissions</p>
                                            <h4 className="text-[20px] font-black text-[#27225B] m-0">{total}</h4>
                                        </div>
                                        <div className="bg-[#FFF7ED] p-3 rounded-xl border border-[#FFEDD5]">
                                            <p className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider m-0 mb-1">Needs Grading</p>
                                            <h4 className="text-[20px] font-black text-[#EA580C] m-0 flex items-center gap-1">
                                                {pending} {pending > 0 && <AlertCircle size={14} className="animate-pulse"/>}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1.5 mb-5 mt-auto">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-[#7D8DA6]">Grading Progress</span>
                                            <span className="text-[#6B4DF1]">{gradedPercentage}% Completed</span>
                                        </div>
                                        <div className="w-full h-2 bg-[#F4F0FD] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#6B4DF1] rounded-full" style={{ width: `${gradedPercentage}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Context Details */}
                                    <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4A5568] bg-[#F9F7FC] p-2.5 rounded-lg border border-[#E9DFFC]/50">
                                        <Building2 size={14} className="text-[#A0ABC0] shrink-0" />
                                        <span className="truncate">{assignment.instituteId ? assignment.instituteId.name : 'Global Master Assignment'}</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-[#F4F0FD] bg-[#FDFBFF] flex items-center justify-between gap-3 text-[11px] font-bold">
                                    <span className="flex items-center gap-1.5 text-[#A0ABC0]">
                                        <CheckCircle2 size={14}/> Max Marks: {assignment.totalMarks || 100}
                                    </span>
                                    <span className={`flex items-center gap-1.5 ${assignment.dueDate && new Date(assignment.dueDate) < new Date() ? 'text-[#E53E3E]' : 'text-[#6B4DF1]'}`}>
                                        <Calendar size={14}/> 
                                        {assignment.dueDate ? `Due: ${new Date(assignment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'No Deadline'}
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