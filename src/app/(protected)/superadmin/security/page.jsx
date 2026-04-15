'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, ShieldCheck, Search, Activity, AlertOctagon, 
    TerminalSquare, Server, Globe, Clock, User, X
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminSecurityPage() {
    const [logs, setLogs] = useState([]);
    const [kpis, setKpis] = useState({ totalLogs: 0, criticalActions: 0, failedAttempts: 0 });
    const [loading, setLoading] = useState(true);
    const [methodFilter, setMethodFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal for viewing JSON details
    const [selectedLog, setSelectedLog] = useState(null);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchLogs();
    }, [methodFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = `/superadmin/security/logs?method=${methodFilter}&limit=100`;
            if (searchTerm) query += `&search=${searchTerm}`;
            
            const res = await api.get(query);
            if (res.data.success) {
                setLogs(res.data.data.logs);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load security logs');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs();
    };

    const getMethodBadge = (method) => {
        switch(method) {
            case 'GET': return 'bg-[#EBF8FF] text-[#3182CE] border-[#BEE3F8]';
            case 'POST': return 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5]';
            case 'PUT': 
            case 'PATCH': return 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]';
            case 'DELETE': return 'bg-[#FEF2F2] text-[#E53E3E] border-[#FECACA]';
            default: return 'bg-[#F8F6FC] text-[#7D8DA6] border-[#E9DFFC]';
        }
    };

    const getStatusColor = (code) => {
        if (!code) return 'text-[#A0ABC0]';
        if (code >= 200 && code < 300) return 'text-[#10B981]';
        if (code >= 400 && code < 500) return 'text-[#EA580C]';
        if (code >= 500) return 'text-[#E53E3E]';
        return 'text-[#6B4DF1]';
    };

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <ShieldCheck className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Audit & Security Logs</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Track all system mutations, user actions, and security events.</p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-[20px] p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center shrink-0"><TerminalSquare size={24}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Total Recorded Logs</p><h3 className="text-[28px] font-black text-[#27225B] m-0">{kpis.totalLogs.toLocaleString()}</h3></div>
                </div>
                
                <div className="bg-white rounded-[20px] p-5 border border-[#E9DFFC] shadow-sm flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0"><Activity size={24}/></div>
                    <div><p className="text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider m-0 mb-1">Critical Mutations</p><h3 className="text-[28px] font-black text-[#27225B] m-0">{kpis.criticalActions.toLocaleString()}</h3></div>
                </div>

                <div className={`rounded-[20px] p-5 shadow-sm border flex items-start gap-4 relative overflow-hidden ${kpis.failedAttempts > 0 ? 'bg-[#27225B] border-[#1e1a48]' : 'bg-white border-[#E9DFFC]'}`}>
                    {kpis.failedAttempts > 0 && <div className="absolute right-0 top-0 w-24 h-24 bg-[#EF4444] opacity-20 rounded-bl-full blur-xl animate-pulse"></div>}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative z-10 ${kpis.failedAttempts > 0 ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#FEE2E2] text-[#E53E3E]'}`}>
                        <AlertOctagon size={24}/>
                    </div>
                    <div className="relative z-10">
                        <p className={`text-[11px] font-bold uppercase tracking-wider m-0 mb-1 ${kpis.failedAttempts > 0 ? 'text-[#A0ABC0]' : 'text-[#7D8DA6]'}`}>Failed / Unauthorized</p>
                        <h3 className={`text-[28px] font-black m-0 ${kpis.failedAttempts > 0 ? 'text-white' : 'text-[#E53E3E]'}`}>{kpis.failedAttempts.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-white rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 border border-[#E9DFFC]/50" style={{ boxShadow: softShadow }}>
                <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {['all', 'GET', 'POST', 'PUT', 'DELETE'].map(method => (
                        <button key={method} onClick={() => setMethodFilter(method)} className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all whitespace-nowrap border-none cursor-pointer ${methodFilter === method ? 'bg-white text-[#6B4DF1] shadow-sm' : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'}`}>
                            {method === 'all' ? 'All Methods' : method}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="relative w-full xl:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0ABC0]" />
                    <input type="text" placeholder="Search IP, Path, or Action..." className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9DFFC] text-[#27225B] text-[13px] font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] placeholder-[#A0ABC0]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </form>
            </div>

            {/* ── Logs Table ── */}
            <div className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden" style={{ boxShadow: softShadow }}>
                {loading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>
                ) : logs.length === 0 ? (
                    <div className="bg-white p-16 text-center">
                        <TerminalSquare className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4" />
                        <h3 className="text-[18px] font-black text-[#27225B] m-0">No logs recorded</h3>
                        <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">System events will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="bg-[#FDFBFF] border-b border-[#F4F0FD]">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">User / Actor</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Action & Path</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Network</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F0FD]">
                                {logs.map((log) => {
                                    const user = log.userId || log.adminId; // Fallback for legacy
                                    const isFailed = log.statusCode >= 400;

                                    return (
                                        <tr key={log._id} className={`hover:bg-[#F9F7FC] transition-colors group ${isFailed ? 'bg-[#FEF2F2]/30' : ''}`}>
                                            
                                            {/* Time */}
                                            <td className="px-6 py-4">
                                                <p className="text-[13px] font-bold text-[#27225B] m-0">{new Date(log.createdAt).toLocaleDateString('en-GB')}</p>
                                                <p className="text-[11px] font-mono text-[#7D8DA6] m-0 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(log.createdAt).toLocaleTimeString()}</p>
                                            </td>

                                            {/* Actor */}
                                            <td className="px-6 py-4">
                                                {user ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#E9DFFC] flex items-center justify-center overflow-hidden shrink-0 border border-[#D5C2F6]">
                                                            {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover"/> : <User size={14} className="text-[#6B4DF1]"/>}
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-bold text-[#27225B] m-0 leading-tight truncate max-w-[150px]">{user.name}</p>
                                                            <p className="text-[10px] font-black text-[#6B4DF1] uppercase tracking-wider m-0 mt-0.5">{user.role}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] font-bold text-[#A0ABC0] px-2.5 py-1 bg-gray-50 rounded-md border border-gray-200">System / Guest</span>
                                                )}
                                            </td>

                                            {/* Action / Path */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    {log.method && (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getMethodBadge(log.method)}`}>{log.method}</span>
                                                    )}
                                                    <span className={`text-[12px] font-black ${getStatusColor(log.statusCode)}`}>{log.statusCode || 'N/A'}</span>
                                                    <span className="text-[13px] font-bold text-[#27225B] truncate max-w-[200px]">{log.action}</span>
                                                </div>
                                                {log.path && (
                                                    <p className="text-[11px] font-mono text-[#7D8DA6] bg-[#F8F6FC] px-2 py-1 rounded-md border border-[#E9DFFC] inline-block m-0 truncate max-w-[250px]">
                                                        {log.path}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Network */}
                                            <td className="px-6 py-4">
                                                <p className="text-[12px] font-mono font-bold text-[#4A5568] m-0 flex items-center gap-1.5 mb-1"><Globe size={12} className="text-[#A0ABC0]"/> {log.ip || 'Unknown IP'}</p>
                                                <p className="text-[10px] font-medium text-[#A0ABC0] m-0 truncate max-w-[150px]" title={log.userAgent}>{log.userAgent || 'Unknown Device'}</p>
                                            </td>

                                            {/* Details Button */}
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedLog(log)}
                                                    className="px-3 py-1.5 bg-white border border-[#E9DFFC] text-[#6B4DF1] hover:bg-[#F4F0FD] font-bold text-[11px] rounded-lg transition-all shadow-sm cursor-pointer"
                                                >
                                                    View Payload
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── MODAL: View JSON Payload ── */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1a48]/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#27225B] rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden border border-[#1e1a48]">
                        
                        <div className="px-6 py-4 border-b border-[#3b3575] flex justify-between items-center">
                            <h2 className="text-[16px] font-black text-white flex items-center gap-2 m-0">
                                <Server className="w-5 h-5 text-[#6B4DF1]" /> Event Payload Details
                            </h2>
                            <button onClick={() => setSelectedLog(null)} className="text-[#7D8DA6] hover:text-white bg-transparent border-none cursor-pointer"><X size={20}/></button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-4 text-[12px]">
                                <div><span className="text-[#7D8DA6] font-bold">Event ID:</span> <span className="text-white font-mono">{selectedLog._id}</span></div>
                                <div><span className="text-[#7D8DA6] font-bold">Entity Type:</span> <span className="text-[#10B981] font-black">{selectedLog.entityType || 'None'}</span></div>
                                <div className="col-span-2"><span className="text-[#7D8DA6] font-bold">Entity ID:</span> <span className="text-[#F59E0B] font-mono">{selectedLog.entityId || 'N/A'}</span></div>
                            </div>
                            
                            <p className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider mb-2">Request Body / Details</p>
                            <div className="bg-[#151232] p-4 rounded-xl border border-[#3b3575] max-h-[300px] overflow-y-auto custom-scrollbar">
                                <pre className="text-[12px] font-mono text-[#A78BFA] whitespace-pre-wrap break-all m-0">
                                    {Object.keys(selectedLog.details || {}).length > 0 
                                        ? JSON.stringify(selectedLog.details, null, 2) 
                                        : '// No extra payload details recorded for this event.'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}