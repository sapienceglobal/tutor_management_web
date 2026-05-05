'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdShowChart, MdDns, MdWarning, MdStorage, 
    MdMemory, MdAccessTime, MdErrorOutline, MdAutoAwesome, MdGppMaybe, MdArticle 
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Section Header Component ─────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div className="flex items-center justify-center rounded-lg shrink-0"
                style={{ width: 40, height: 40, backgroundColor: C.iconBg }}>
                <Icon style={{ width: 16, height: 16, color: C.iconColor }} />
            </div>
            <h2 style={{
                fontFamily: T.fontFamily, fontSize: T.size.xl,
                fontWeight: T.weight.semibold, color: C.heading, margin: 0
            }}>
                {title}
            </h2>
        </div>
    );
}

export default function SystemMonitoringPage() {
    const [loading, setLoading] = useState(true);
    const [sysData, setSysData] = useState({
        server: { uptimeSeconds: 0, memoryUsagePercent: 0, usedMemoryMB: 0, totalMemoryMB: 0 },
        apiHealth: { totalRequests24h: 0, failedRequests24h: 0, errorRate: 0, recentErrors: [] },
        storage: { documentStorageMB: 0 },
        ai: { totalTokensUsed: 0 },
        moderation: { pendingReports: 0 }
    });

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
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading system metrics...
                    </p>
                </div>
            </div>
        );
    }

    const { server, apiHealth, storage, ai, moderation } = sysData;

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdShowChart style={{ width: 24, height: 24, color: C.danger }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            System Health & Monitoring
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Live infrastructure metrics, API errors, and storage usage.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchMonitoringData} className="flex items-center gap-2 transition-colors cursor-pointer"
                        style={{
                            backgroundColor: C.cardBg,
                            color: C.heading,
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: '10px',
                            padding: '10px 20px',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            boxShadow: S.cardHover
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.cardBg}
                    >
                        <MdShowChart style={{ width: 18, height: 18, color: C.btnPrimary }}/> Refresh Pulse
                    </button>
                </div>
            </div>

            {/* ── Top Level Infrastructure KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdDns} 
                    value={formatUptime(server.uptimeSeconds)} 
                    label="Node.js Uptime" 
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdWarning} 
                    value={`${apiHealth.errorRate}%`} 
                    label="API Error Rate (24h)" 
                    subtext={`${apiHealth.failedRequests24h} Fails`}
                    iconBg={apiHealth.errorRate > 5 ? C.dangerBg : "#ECFDF5"} 
                    iconColor={apiHealth.errorRate > 5 ? C.danger : "#10B981"} 
                />
                <StatCard 
                    icon={MdMemory} 
                    value={`${server.memoryUsagePercent}%`} 
                    label="Memory Usage" 
                    subtext={`${server.usedMemoryMB} / ${server.totalMemoryMB} MB`}
                    iconBg="#FFF7ED" 
                    iconColor="#EA580C" 
                />
                <StatCard 
                    icon={MdStorage} 
                    value={`${storage.documentStorageMB} MB`} 
                    label="DB File Storage" 
                    subtext="Lessons Data"
                    iconBg="#EBF8FF" 
                    iconColor="#3182CE" 
                />
            </div>

            {/* ── Detailed Sections ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: API Error Logs */}
                <div className="lg:col-span-2 flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 pt-5 pb-1 flex justify-between items-start" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <SectionHeader icon={MdErrorOutline} title="Failed API Requests" />
                        <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.surfaceWhite, color: C.textMuted, border: `1px solid ${C.cardBorder}` }}>
                            Last 5 Errors
                        </span>
                    </div>
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left border-collapse">
                            <thead style={{ backgroundColor: C.innerBg }}>
                                <tr>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>Status</th>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>Method & Path</th>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>Action Name</th>
                                    <th style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '16px 24px', borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Time & IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F4F0FD]">
                                {apiHealth.recentErrors.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8">
                                            <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                    <MdErrorOutline style={{ width: 28, height: 28, color: C.success, opacity: 0.5 }} />
                                                </div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No errors detected recently</h3>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>System is clean!</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : apiHealth.recentErrors.map((err, idx) => (
                                    <tr key={idx} className="transition-colors" style={{ backgroundColor: 'transparent', borderBottom: `1px solid ${C.cardBorder}` }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <td className="px-6 py-4">
                                            <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.bold, backgroundColor: C.dangerBg, color: C.danger, textTransform: 'uppercase', letterSpacing: T.tracking.wider, border: `1px solid ${C.dangerBorder}` }}>
                                                {err.statusCode || '500'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span style={{ 
                                                    fontSize: '10px', fontWeight: T.weight.bold, padding: '2px 6px', borderRadius: '4px',
                                                    backgroundColor: err.method === 'GET' ? '#EBF8FF' : err.method === 'POST' ? C.successBg : C.warningBg,
                                                    color: err.method === 'GET' ? '#3182CE' : err.method === 'POST' ? C.success : C.warning,
                                                    border: `1px solid ${err.method === 'GET' ? '#BEE3F8' : err.method === 'POST' ? C.successBorder : C.warningBorder}`
                                                }}>
                                                    {err.method || 'REQ'}
                                                </span>
                                                <span style={{ fontFamily: T.fontFamilyMono, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>{err.path || '/unknown/route'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{err.action}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{new Date(err.createdAt).toLocaleTimeString()}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>{err.ip || 'Unknown IP'}</p>
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
                    <div style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '24px', boxShadow: S.card }}>
                        <SectionHeader icon={MdGppMaybe} title="Content Moderation" />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: '-12px', marginBottom: '16px', marginLeft: '50px' }}>User generated reports</p>
                        <div className="flex items-center justify-between" style={{ backgroundColor: C.innerBg, padding: '16px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Pending Reports</span>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: moderation.pendingReports > 0 ? C.danger : C.success }}>
                                {moderation.pendingReports} Active
                            </span>
                        </div>
                    </div>

                    {/* AI Usage Log */}
                    <div style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '24px', boxShadow: S.card }}>
                        <SectionHeader icon={MdAutoAwesome} title="AI API Usage" />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: '-12px', marginBottom: '16px', marginLeft: '50px' }}>Global tokens consumed</p>
                        <div className="flex items-center justify-between" style={{ backgroundColor: C.innerBg, padding: '16px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Total Tokens Used</span>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                {ai.totalTokensUsed.toLocaleString()}
                            </span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}