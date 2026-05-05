'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdSecurity, MdSearch, MdShowChart, MdWarning, 
    MdCode, MdDns, MdPublic, MdAccessTime, MdPerson, MdClose 
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

// ─── Base Input Style ─────────────────────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

export default function SuperAdminSecurityPage() {
    const [logs, setLogs] = useState([]);
    const [kpis, setKpis] = useState({ totalLogs: 0, criticalActions: 0, failedAttempts: 0 });
    const [loading, setLoading] = useState(true);
    const [methodFilter, setMethodFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal for viewing JSON details
    const [selectedLog, setSelectedLog] = useState(null);

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
            case 'GET': return { bg: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` };
            case 'POST': return { bg: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` };
            case 'PUT': 
            case 'PATCH': return { bg: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}` };
            case 'DELETE': return { bg: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` };
            default: return { bg: C.innerBg, color: C.textMuted, border: `1px solid ${C.cardBorder}` };
        }
    };

    const getStatusColor = (code) => {
        if (!code) return C.textMuted;
        if (code >= 200 && code < 300) return C.success;
        if (code >= 400 && code < 500) return C.warning;
        if (code >= 500) return C.danger;
        return C.btnPrimary;
    };

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdSecurity style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Audit & Security Logs
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Track all system mutations, user actions, and security events.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard 
                    icon={MdCode} 
                    value={kpis.totalLogs.toLocaleString()} 
                    label="Total Recorded Logs" 
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdShowChart} 
                    value={kpis.criticalActions.toLocaleString()} 
                    label="Critical Mutations" 
                    iconBg="#FFF7ED" 
                    iconColor="#EA580C" 
                />
                <StatCard 
                    icon={MdWarning} 
                    value={kpis.failedAttempts.toLocaleString()} 
                    label="Failed / Unauthorized" 
                    iconBg={kpis.failedAttempts > 0 ? C.dangerBg : C.innerBg} 
                    iconColor={kpis.failedAttempts > 0 ? C.danger : C.textFaint} 
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    {['all', 'GET', 'POST', 'PUT', 'DELETE'].map(method => (
                        <button 
                            key={method} 
                            onClick={() => setMethodFilter(method)} 
                            className="transition-all whitespace-nowrap border-none cursor-pointer"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                backgroundColor: methodFilter === method ? C.surfaceWhite : 'transparent',
                                color: methodFilter === method ? C.btnPrimary : C.textFaint,
                                boxShadow: methodFilter === method ? S.active : 'none'
                            }}
                        >
                            {method === 'all' ? 'All Methods' : method}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full xl:w-[350px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" 
                        placeholder="Search IP, Path, or Action..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </form>
            </div>

            {/* ── Logs Table ── */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                {loading ? (
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-12 h-12">
                                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                                Loading security logs...
                            </p>
                        </div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                        <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                            <MdCode style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No logs recorded</h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>System events will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead style={{ backgroundColor: C.innerBg }}>
                                <tr>
                                    {['Timestamp', 'User / Actor', 'Action & Path', 'Network', 'Details'].map((header, idx) => (
                                        <th key={idx} style={{
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.bold,
                                            color: C.statLabel,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                            padding: '16px 24px',
                                            borderBottom: `1px solid ${C.cardBorder}`,
                                            textAlign: header === 'Details' ? 'right' : 'left'
                                        }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const user = log.userId || log.adminId; // Fallback for legacy
                                    const isFailed = log.statusCode >= 400;
                                    const methodConfig = getMethodBadge(log.method);

                                    return (
                                        <tr key={log._id} className="transition-colors"
                                            style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: isFailed ? C.dangerBg : 'transparent' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isFailed ? C.dangerBg : C.innerBg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isFailed ? C.dangerBg : 'transparent'; }}
                                        >
                                            
                                            {/* Time */}
                                            <td className="px-6 py-4">
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                    {new Date(log.createdAt).toLocaleDateString('en-GB')}
                                                </p>
                                                <p className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamilyMono, fontSize: T.size.xs, color: C.textMuted, margin: 0, marginTop: 4 }}>
                                                    <MdAccessTime style={{ width: 14, height: 14 }}/> {new Date(log.createdAt).toLocaleTimeString()}
                                                </p>
                                            </td>

                                            {/* Actor */}
                                            <td className="px-6 py-4">
                                                {user ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center overflow-hidden shrink-0" 
                                                            style={{ width: 36, height: 36, borderRadius: R.full, backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                            {user.profileImage ? (
                                                                <img src={user.profileImage} className="w-full h-full object-cover"/>
                                                            ) : (
                                                                <MdPerson style={{ width: 18, height: 18, color: C.btnPrimary }}/>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate max-w-[150px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1.2 }}>
                                                                {user.name}
                                                            </p>
                                                            <span style={{ 
                                                                display: 'inline-block', padding: '2px 8px', borderRadius: '10px', 
                                                                fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, 
                                                                backgroundColor: C.surfaceWhite, color: C.btnPrimary, textTransform: 'uppercase', 
                                                                letterSpacing: T.tracking.wider, border: `1px solid ${C.cardBorder}`, marginTop: '4px' 
                                                            }}>
                                                                {user.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.innerBg, color: C.textMuted, border: `1px solid ${C.cardBorder}` }}>
                                                        System / Guest
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action / Path */}
                                            <td className="px-6 py-4 min-w-[250px]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {log.method && (
                                                        <span style={{ 
                                                            padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: T.weight.black,
                                                            backgroundColor: methodConfig.bg, color: methodConfig.color, border: methodConfig.border 
                                                        }}>
                                                            {log.method}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: T.size.xs, fontWeight: T.weight.black, color: getStatusColor(log.statusCode) }}>
                                                        {log.statusCode || 'N/A'}
                                                    </span>
                                                    <span className="truncate max-w-[200px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                                {log.path && (
                                                    <p className="truncate max-w-[300px]" style={{ 
                                                        fontFamily: T.fontFamilyMono, fontSize: '11px', color: C.textMuted, 
                                                        backgroundColor: C.innerBg, padding: '4px 8px', borderRadius: '8px', 
                                                        border: `1px solid ${C.cardBorder}`, display: 'inline-block', margin: 0 
                                                    }}>
                                                        {log.path}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Network */}
                                            <td className="px-6 py-4">
                                                <p className="flex items-center gap-1.5 mb-1.5" style={{ fontFamily: T.fontFamilyMono, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, margin: 0 }}>
                                                    <MdPublic style={{ width: 14, height: 14, color: C.textMuted }}/> {log.ip || 'Unknown IP'}
                                                </p>
                                                <p className="truncate max-w-[150px]" title={log.userAgent} style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                                                    {log.userAgent || 'Unknown Device'}
                                                </p>
                                            </td>

                                            {/* Details Button */}
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedLog(log)}
                                                    className="transition-colors cursor-pointer border-none"
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: C.surfaceWhite,
                                                        border: `1px solid ${C.cardBorder}`,
                                                        color: C.btnPrimary,
                                                        fontFamily: T.fontFamily,
                                                        fontSize: '11px',
                                                        fontWeight: T.weight.bold,
                                                        borderRadius: '10px',
                                                        boxShadow: S.cardHover
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.surfaceWhite; }}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="flex flex-col w-full max-w-2xl overflow-hidden" style={{ backgroundColor: C.pageBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        
                        {/* Modal Header */}
                        <div className="px-6 py-4 flex justify-between items-center shrink-0" style={{ backgroundColor: C.darkCard, borderBottom: `1px solid ${C.cardBorder}` }}>
                            <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <MdDns style={{ width: 20, height: 20, color: C.btnPrimary }} /> Event Payload Details
                            </h2>
                            <button onClick={() => setSelectedLog(null)} className="bg-transparent border-none cursor-pointer p-1 transition-colors"
                                style={{ color: C.textFaint, borderRadius: '10px' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textFaint; }}
                            >
                                <MdClose style={{ width: 24, height: 24 }}/>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6" style={{ backgroundColor: C.cardBg }}>
                            <div className="grid grid-cols-2 gap-4 mb-6" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs }}>
                                <div style={{ backgroundColor: C.innerBg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <span style={{ fontWeight: T.weight.bold, color: C.statLabel, display: 'block', marginBottom: '4px' }}>Event ID:</span> 
                                    <span style={{ fontFamily: T.fontFamilyMono, color: C.heading, fontWeight: T.weight.bold }}>{selectedLog._id}</span>
                                </div>
                                <div style={{ backgroundColor: C.innerBg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <span style={{ fontWeight: T.weight.bold, color: C.statLabel, display: 'block', marginBottom: '4px' }}>Entity Type:</span> 
                                    <span style={{ color: C.success, fontWeight: T.weight.black }}>{selectedLog.entityType || 'None'}</span>
                                </div>
                                <div className="col-span-2" style={{ backgroundColor: C.innerBg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <span style={{ fontWeight: T.weight.bold, color: C.statLabel, display: 'block', marginBottom: '4px' }}>Entity ID:</span> 
                                    <span style={{ fontFamily: T.fontFamilyMono, color: C.warning, fontWeight: T.weight.bold }}>{selectedLog.entityId || 'N/A'}</span>
                                </div>
                            </div>
                            
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '8px', margin: 0 }}>
                                Request Body / Details
                            </p>
                            <div style={{ backgroundColor: C.darkCard, padding: '16px', borderRadius: '10px', border: `1px solid ${C.cardBorder}`, maxHeight: '300px', overflowY: 'auto' }}>
                                <pre style={{ fontFamily: T.fontFamilyMono, fontSize: T.size.xs, color: '#A78BFA', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
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