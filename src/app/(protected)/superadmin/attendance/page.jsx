'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, UserCheck, AlertCircle, Clock, XCircle, 
    Search, CheckCircle2, Building2, User 
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminAttendancePage() {
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [kpis, setKpis] = useState({ totalLogs: 0, presentCount: 0, lateCount: 0, absentCount: 0, presentPercentage: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchAttendance();
    }, [statusFilter]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/superadmin/attendance?status=${statusFilter}`);
            if (res.data.success) {
                setAttendanceLogs(res.data.data.logs);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load global attendance data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'present': return { color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]', border: 'border-[#D1FAE5]', icon: CheckCircle2, label: 'Present' };
            case 'absent': return { color: 'text-[#E53E3E]', bg: 'bg-[#FEE2E2]', border: 'border-[#FECACA]', icon: XCircle, label: 'Absent' };
            case 'late': return { color: 'text-[#F59E0B]', bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]', icon: Clock, label: 'Late' };
            default: return { color: 'text-[#7D8DA6]', bg: 'bg-[#F8F6FC]', border: 'border-[#E9DFFC]', icon: AlertCircle, label: status };
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <UserCheck className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Platform Attendance</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Monitor live class attendance patterns across all institutes.</p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {/* Overall Present % */}
                <div className="bg-[#27225B] rounded-2xl p-5 border border-[#1e1a48] shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-20 h-20 bg-[#6B4DF1] opacity-20 rounded-bl-full blur-xl"></div>
                    <p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider m-0 mb-1 relative z-10">Platform Health</p>
                    <div className="flex items-end gap-2 relative z-10">
                        <h3 className={`text-[28px] font-black leading-none m-0 ${kpis.presentPercentage < 50 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                            {kpis.presentPercentage}%
                        </h3>
                        <span className="text-[11px] font-bold text-[#A0ABC0] mb-1">Present Avg.</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0"><CheckCircle2 size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Present</p><h3 className="text-[24px] font-black text-[#27225B] m-0">{kpis.presentCount.toLocaleString()}</h3></div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0"><Clock size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Late</p><h3 className="text-[24px] font-black text-[#EA580C] m-0">{kpis.lateCount.toLocaleString()}</h3></div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#E53E3E] flex items-center justify-center shrink-0"><XCircle size={20}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Absent</p><h3 className="text-[24px] font-black text-[#E53E3E] m-0">{kpis.absentCount.toLocaleString()}</h3></div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full sm:w-auto overflow-x-auto">
                    {['all', 'present', 'late', 'absent'].map(status => (
                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all capitalize whitespace-nowrap border-none cursor-pointer ${statusFilter === status ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                            {status === 'all' ? 'All Records' : status}
                        </button>
                    ))}
                </div>
                <div className="text-[12px] font-bold text-[#A0ABC0] bg-[#F8F6FC] px-4 py-2.5 rounded-xl border border-[#E9DFFC]">
                    Showing Latest 50 Logs
                </div>
            </div>

            {/* ── Attendance Log Table ── */}
            <div className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden" style={{ boxShadow: softShadow }}>
                {loading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>
                ) : attendanceLogs.length === 0 ? (
                    <div className="p-16 text-center">
                        <UserCheck className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                        <h3 className="text-[18px] font-black text-[#27225B] m-0">No attendance records found</h3>
                        <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">Data will populate as students join live classes.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#FDFBFF] border-b border-[#F4F0FD]">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Course / Context</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Join Time</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F0FD]">
                                {attendanceLogs.map((log, idx) => {
                                    const statusData = getStatusConfig(log.status);
                                    const StatusIcon = statusData.icon;

                                    return (
                                        <tr key={log._id || idx} className="hover:bg-[#F9F7FC] transition-colors">
                                            {/* Student Details */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#E9DFFC] border border-[#D5C2F6] flex items-center justify-center overflow-hidden shrink-0">
                                                        {log.studentId?.profileImage ? (
                                                            <img src={log.studentId.profileImage} className="w-full h-full object-cover"/>
                                                        ) : (
                                                            <User size={14} className="text-[#6B4DF1]"/>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-[#27225B] m-0">{log.studentId?.name || 'Unknown Student'}</p>
                                                        <p className="text-[11px] font-medium text-[#7D8DA6] m-0">{log.studentId?.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Course Info */}
                                            <td className="px-6 py-4">
                                                <p className="text-[13px] font-bold text-[#6B4DF1] m-0 line-clamp-1 max-w-xs">{log.courseId?.title || 'Unknown Course'}</p>
                                                {log.courseId?.instituteId && (
                                                    <div className="flex items-center gap-1.5 mt-1 text-[#A0ABC0]">
                                                        <Building2 size={12} />
                                                        <span className="text-[11px] font-semibold">Institute Enrolled</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Join Time */}
                                            <td className="px-6 py-4">
                                                <p className="text-[13px] font-bold text-[#27225B] m-0 flex items-center gap-1.5">
                                                    <Clock size={14} className="text-[#A0ABC0]"/>
                                                    {new Date(log.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-[11px] font-medium text-[#7D8DA6] m-0 mt-0.5 ml-5">
                                                    {new Date(log.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border ${statusData.bg} ${statusData.color} ${statusData.border}`}>
                                                    <StatusIcon size={14}/> {statusData.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}