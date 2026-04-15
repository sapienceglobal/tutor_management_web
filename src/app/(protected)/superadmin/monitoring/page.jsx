'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, Activity, Server, AlertTriangle, Database, 
    Cpu, Clock, AlertOctagon, BrainCircuit, ShieldAlert, FileText 
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SystemMonitoringPage() {
    const [loading, setLoading] = useState(true);
    const [sysData, setSysData] = useState({
        server: { uptimeSeconds: 0, memoryUsagePercent: 0, usedMemoryMB: 0, totalMemoryMB: 0 },
        apiHealth: { totalRequests24h: 0, failedRequests24h: 0, errorRate: 0, recentErrors: [] },
        storage: { documentStorageMB: 0 },
        ai: { totalTokensUsed: 0 },
        moderation: { pendingReports: 0 }
    });

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchMonitoringData();
        // Optional: Auto-refresh every 30 seconds for live feel
        const interval = setInterval(fetchMonitoringData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchMonitoringData = async () => {
        try {
            const res = await api.get('/superadmin/monitoring/overview');
            if (res.data.success) setSysData(res.data.data);
        } catch (error) {
            console.error('Failed to load monitoring data');
        } finally {
            setLoading(false);
        }
    };

    // Format uptime helper
    const formatUptime = (seconds) => {
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        if (d > 0) return `${d}d ${h}h`;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    if (loading && !sysData.server.uptimeSeconds) {
        return <div className="flex h-screen items-center justify-center bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;
    }

    const { server, apiHealth, storage, ai, moderation } = sysData;

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <Activity className="w-6 h-6 text-[#EF4444]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">System Health & Monitoring</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Live infrastructure metrics, API errors, and storage usage.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchMonitoringData} className="bg-white px-5 py-2.5 rounded-xl border border-[#E9DFFC] text-[#27225B] text-[13px] font-bold flex items-center gap-2 shadow-sm hover:bg-[#F9F7FC] transition-colors cursor-pointer border-none">
                        <Activity size={16} className="text-[#6B4DF1]"/> Refresh Pulse
                    </button>
                </div>
            </div>

            {/* ── Top Level Infrastructure KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Server Uptime */}
                <div className="bg-[#27225B] rounded-[20px] p-6 border border-[#1e1a48] relative overflow-hidden shadow-lg flex flex-col justify-between">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-[#6B4DF1] opacity-20 rounded-bl-full filter blur-xl"></div>
                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <Server size={18} className="text-[#A0ABC0]" />
                        <span className="text-[12px] font-bold text-[#A0ABC0] uppercase tracking-wider">Node.js Uptime</span>
                    </div>
                    <div className="relative z-10 flex items-end justify-between">
                        <h3 className="text-[28px] font-black text-white leading-none m-0">{formatUptime(server.uptimeSeconds)}</h3>
                        <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md uppercase tracking-wider"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Online</span>
                    </div>
                </div>

                {/* API Error Rate */}
                <div className="bg-white rounded-[20px] p-6 border border-[#E9DFFC] relative overflow-hidden" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={18} className="text-[#7D8DA6]" />
                        <span className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">API Error Rate (24h)</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className={`text-[28px] font-black leading-none m-0 ${apiHealth.errorRate > 5 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                            {apiHealth.errorRate}%
                        </h3>
                        <span className="text-[11px] font-bold text-[#A0ABC0]">{apiHealth.failedRequests24h} Fails</span>
                    </div>
                </div>

                {/* RAM Usage */}
                <div className="bg-white rounded-[20px] p-6 border border-[#E9DFFC] relative overflow-hidden flex flex-col" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Cpu size={18} className="text-[#7D8DA6]" />
                        <span className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Memory Usage</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex items-end justify-between mb-2">
                            <h3 className="text-[24px] font-black text-[#27225B] leading-none m-0">{server.memoryUsagePercent}%</h3>
                            <span className="text-[11px] font-bold text-[#A0ABC0]">{server.usedMemoryMB} / {server.totalMemoryMB} MB</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-[#F4F0FD] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${server.memoryUsagePercent > 80 ? 'bg-[#EF4444]' : 'bg-[#6B4DF1]'}`} style={{ width: `${server.memoryUsagePercent}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Database Storage (Docs) */}
                <div className="bg-white rounded-[20px] p-6 border border-[#E9DFFC] relative overflow-hidden" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-2 mb-4">
                        <Database size={18} className="text-[#7D8DA6]" />
                        <span className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">DB File Storage</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-[28px] font-black text-[#FC8730] leading-none m-0">{storage.documentStorageMB} <span className="text-[16px]">MB</span></h3>
                        <span className="text-[11px] font-bold text-[#A0ABC0]">Lessons Data</span>
                    </div>
                </div>
            </div>

            {/* ── Detailed Sections ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: API Error Logs */}
                <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#E9DFFC] flex flex-col" style={{ boxShadow: softShadow }}>
                    <div className="px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF] rounded-t-[24px] flex justify-between items-center">
                        <h2 className="text-[16px] font-black text-[#27225B] m-0 flex items-center gap-2">
                            <AlertOctagon size={18} className="text-[#EF4444]"/> Failed API Requests
                        </h2>
                        <span className="text-[11px] font-bold text-[#A0ABC0] bg-white px-2 py-1 rounded border border-[#E9DFFC]">Last 5 Errors</span>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F9F7FC]/50">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Method & Path</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider">Action Name</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-[#A0ABC0] uppercase tracking-wider text-right">Time & IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F0FD]">
                                {apiHealth.recentErrors.length === 0 ? (
                                    <tr><td colSpan="4" className="p-12 text-center text-[#A0ABC0] font-medium">No errors detected recently. System is clean!</td></tr>
                                ) : apiHealth.recentErrors.map((err, idx) => (
                                    <tr key={idx} className="hover:bg-[#F9F7FC] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FEE2E2] text-[#E53E3E]">
                                                {err.statusCode || '500'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${err.method === 'GET' ? 'bg-blue-100 text-blue-700' : err.method === 'POST' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {err.method || 'REQ'}
                                                </span>
                                                <span className="text-[13px] font-mono font-bold text-[#4A5568]">{err.path || '/unknown/route'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[13px] font-bold text-[#27225B]">{err.action}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-[12px] font-bold text-[#27225B] m-0">{new Date(err.createdAt).toLocaleTimeString()}</p>
                                            <p className="text-[10px] font-medium text-[#A0ABC0] m-0">{err.ip || 'Unknown IP'}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Security & Quotas */}
                <div className="flex flex-col gap-6">
                    
                    {/* Moderation & Reports */}
                    <div className="bg-white rounded-[24px] border border-[#E9DFFC] p-6" style={{ boxShadow: softShadow }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center border border-[#FFEDD5]">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-black text-[#27225B] m-0">Content Moderation</h3>
                                <p className="text-[11px] font-medium text-[#7D8DA6] m-0 mt-0.5">User generated reports</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-[#F8F6FC] p-4 rounded-xl border border-[#E9DFFC]">
                            <span className="text-[13px] font-bold text-[#4A5568]">Pending Reports</span>
                            <span className={`text-[14px] font-black ${moderation.pendingReports > 0 ? 'text-[#E53E3E]' : 'text-[#10B981]'}`}>
                                {moderation.pendingReports} Active
                            </span>
                        </div>
                    </div>

                    {/* AI Usage Log */}
                    <div className="bg-white rounded-[24px] border border-[#E9DFFC] p-6" style={{ boxShadow: softShadow }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#F4F0FD] text-[#6B4DF1] flex items-center justify-center border border-[#E9DFFC]">
                                <BrainCircuit size={20} />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-black text-[#27225B] m-0">AI API Usage</h3>
                                <p className="text-[11px] font-medium text-[#7D8DA6] m-0 mt-0.5">Global tokens consumed</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-[#F8F6FC] p-4 rounded-xl border border-[#E9DFFC]">
                            <span className="text-[13px] font-bold text-[#4A5568]">Total Tokens Used</span>
                            <span className="text-[14px] font-black text-[#6B4DF1]">
                                {ai.totalTokensUsed.toLocaleString()}
                            </span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}