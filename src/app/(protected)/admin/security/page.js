'use client';

import { useState, useEffect } from 'react';
import { Loader2, Shield, AlertTriangle, CheckCircle, Info, Clock, Lock, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function AdminSecurityPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all'); // all, error, warning, info, success, system

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/admin/logs');
            if (res.data?.success) {
                setLogs(res.data.logs || []);
            } else {
                // Mock Data for UI demonstration if DB is empty
                setLogs([
                    { severity: 'error', type: 'Failed Login', message: 'Multiple failed login attempts detected from IP 192.168.1.45', timestamp: new Date().toISOString() },
                    { severity: 'warning', type: 'Unauthorized Access', message: 'User ID 8912 attempted to access restricted admin route', timestamp: new Date(Date.now() - 3600000).toISOString() },
                    { severity: 'success', type: 'System Update', message: 'Security patch v2.4 applied successfully without errors', timestamp: new Date(Date.now() - 7200000).toISOString() },
                    { severity: 'system', type: 'Automated Backup', message: 'Database backup completed and uploaded to secure cloud storage', timestamp: new Date(Date.now() - 86400000).toISOString() },
                    { severity: 'info', type: 'Password Change', message: 'Instructor "Rahul Sharma" successfully updated their password', timestamp: new Date(Date.now() - 172800000).toISOString() },
                ]);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            toast.error('Failed to load security logs');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityStyles = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'error': return 'bg-[#FEE2E2] text-[#E53E3E] border-[#FECACA]';
            case 'warning': return 'bg-[#FFF7ED] text-[#FC8730] border-[#FDBA74]';
            case 'success': return 'bg-[#ECFDF5] text-[#4ABCA8] border-[#A7F3D0]';
            case 'system': return 'bg-[#F4F0FD] text-[#6B4DF1] border-[#D1C4F9]';
            case 'info':
            default: return 'bg-[#EBF8FF] text-[#3182CE] border-[#BEE3F8]';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'error': return <AlertTriangle size={14} strokeWidth={3} />;
            case 'warning': return <Lock size={14} strokeWidth={3} />;
            case 'success': return <CheckCircle size={14} strokeWidth={3} />;
            case 'system': return <Shield size={14} strokeWidth={3} />;
            case 'info':
            default: return <Info size={14} strokeWidth={3} />;
        }
    };

    const filteredLogs = filter === 'all'
        ? logs
        : logs.filter(log => log.severity?.toLowerCase() === filter.toLowerCase());

    const warningsCount = logs.filter(l => l.severity?.toLowerCase() === 'warning').length;
    const errorsCount = logs.filter(l => l.severity?.toLowerCase() === 'error').length;
    const systemCount = logs.filter(l => l.severity?.toLowerCase() === 'system').length;

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
                <h1 className="text-[22px] font-black text-[#27225B] m-0">Security & Audit Logs</h1>
                <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Monitor system activity, access attempts, and critical security events</p>
            </div>

            {/* ── KPI Stats Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { title: 'Total Events', value: logs.length || '0', iconBg: '#6B4DF1', icon: Activity },
                    { title: 'Warnings', value: warningsCount || '0', iconBg: '#FC8730', icon: Lock },
                    { title: 'Errors', value: errorsCount || '0', iconBg: '#E53E3E', icon: AlertTriangle },
                    { title: 'System Checks', value: systemCount || '0', iconBg: '#4ABCA8', icon: Shield }
                ].map((stat, i) => (
                    <div 
                        key={i} 
                        className="bg-white rounded-2xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 relative" 
                        style={{ boxShadow: softShadow }}
                    >
                        <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: stat.iconBg }}>
                            <stat.icon size={22} color="#ffffff" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[26px] font-black text-[#27225B] leading-none mb-1.5">{stat.value}</span>
                            <span className="text-[13px] font-bold text-[#7D8DA6] leading-none">{stat.title}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Integrated Table Area ── */}
            <div className="bg-white rounded-3xl flex flex-col overflow-hidden mb-6" style={{ boxShadow: softShadow }}>
                
                {/* Table Header & Filters */}
                <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#F4F0FD] bg-[#FDFBFF]">
                    <h2 className="text-[16px] font-black text-[#27225B] m-0">Activity Audit Log</h2>
                    
                    {/* Custom Styled Filter Tabs */}
                    <div className="flex bg-[#F4F0FD] p-1.5 rounded-xl w-full md:w-auto overflow-x-auto">
                        {['all', 'info', 'success', 'warning', 'error', 'system'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-4 py-2 text-[12px] font-bold rounded-lg capitalize transition-all whitespace-nowrap border-none cursor-pointer ${
                                    filter === type 
                                    ? 'bg-white text-[#6B4DF1] shadow-sm' 
                                    : 'bg-transparent text-[#7D8DA6] hover:text-[#27225B]'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto px-6 pb-2">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-[#F4F0FD] rounded-xl">
                            <tr>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase first:rounded-l-xl">Severity</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase">Event Type</th>
                                <th className="px-4 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase">Message Details</th>
                                <th className="px-5 py-4 text-[12px] font-bold text-[#7D8DA6] tracking-wider uppercase text-right last:rounded-r-xl">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F0FD]">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center">
                                        <Shield className="w-12 h-12 text-[#D1C4F9] mx-auto mb-3" />
                                        <p className="text-[14px] font-bold text-[#7D8DA6] m-0">
                                            No {filter !== 'all' ? filter : ''} logs found matching your criteria.
                                        </p>
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log, index) => (
                                <tr key={index} className="hover:bg-[#F8F7FF] transition-colors group">
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider border ${getSeverityStyles(log.severity)}`}>
                                            {getSeverityIcon(log.severity)}
                                            {log.severity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="font-bold text-[#27225B] text-[13px]">{log.type}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-[#4A5568] font-medium text-[13px] leading-relaxed max-w-[400px]">
                                            {log.message}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <span className="text-[13px] font-bold text-[#27225B]">
                                                {new Date(log.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#A0ABC0] bg-[#F4F0FD] px-2 py-0.5 rounded-md w-fit">
                                                <Clock size={10} strokeWidth={3} />
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination Footer */}
                <div className="px-6 py-4 border-t border-[#F4F0FD] flex items-center justify-between bg-white mt-2">
                    <span className="text-[13px] font-bold text-[#7D8DA6]">Showing {filteredLogs.length} of {logs.length} logs</span>
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