'use client';

import { useState, useEffect } from 'react';
import { 
    MdSecurity, 
    MdWarning, 
    MdCheckCircle, 
    MdInfoOutline, 
    MdLock, 
    MdAccessTime, 
    MdFilterList, 
    MdChevronLeft, 
    MdChevronRight,
    MdShield
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import StatCard from '@/components/StatCard';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

export default function AdminSecurityPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('all'); // all, error, warning, info, success, system

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
            case 'error': return { bg: C.dangerBg, color: C.danger, border: C.dangerBorder };
            case 'warning': return { bg: C.warningBg, color: C.warning, border: C.warningBorder };
            case 'success': return { bg: C.successBg, color: C.success, border: C.successBorder };
            case 'system': return { bg: C.btnViewAllBg, color: C.btnPrimary, border: C.cardBorder };
            case 'info':
            default: return { bg: C.innerBg, color: C.text, border: C.cardBorder };
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'error': return <MdWarning style={{ width: 14, height: 14 }} />;
            case 'warning': return <MdLock style={{ width: 14, height: 14 }} />;
            case 'success': return <MdCheckCircle style={{ width: 14, height: 14 }} />;
            case 'system': return <MdShield style={{ width: 14, height: 14 }} />;
            case 'info':
            default: return <MdInfoOutline style={{ width: 14, height: 14 }} />;
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
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading logs...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen w-full" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="mb-2">
                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                    Security & Audit Logs
                </h1>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                    Monitor system activity, access attempts, and critical security events
                </p>
            </div>

            {/* ── KPI Stats Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdSecurity}
                    value={logs.length || '0'}
                    label="Total Events"
                    iconBg={C.btnViewAllBg}
                    iconColor={C.btnPrimary}
                />
                <StatCard 
                    icon={MdLock}
                    value={warningsCount || '0'}
                    label="Warnings"
                    iconBg={C.warningBg}
                    iconColor={C.warning}
                />
                <StatCard 
                    icon={MdWarning}
                    value={errorsCount || '0'}
                    label="Errors"
                    iconBg={C.dangerBg}
                    iconColor={C.danger}
                />
                <StatCard 
                    icon={MdShield}
                    value={systemCount || '0'}
                    label="System Checks"
                    iconBg={C.successBg}
                    iconColor={C.success}
                />
            </div>

            {/* ── Main Integrated Table Area ── */}
            <div className="flex flex-col overflow-hidden mb-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}` }}>
                
                {/* Table Header & Filters */}
                <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4" style={{ backgroundColor: C.surfaceWhite, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Activity Audit Log</h2>
                    
                    {/* Custom Styled Filter Tabs */}
                    <div className="flex p-1 w-full md:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '12px' }}>
                        {['all', 'info', 'success', 'warning', 'error', 'system'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className="capitalize transition-colors duration-300 whitespace-nowrap cursor-pointer border-none"
                                style={{
                                    padding: '8px 16px',
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.sm,
                                    fontWeight: T.weight.bold,
                                    borderRadius: '10px',
                                    backgroundColor: filter === type ? C.surfaceWhite : 'transparent',
                                    color: filter === type ? C.btnPrimary : C.text,
                                    boxShadow: filter === type ? S.active : 'none'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead style={{ backgroundColor: C.innerBg }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Severity</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Event Type</th>
                                <th style={{ padding: '16px 16px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}` }}>Message Details</th>
                                <th style={{ padding: '16px 24px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'right' }}>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16">
                                        <div className="p-14 text-center border border-dashed"
                                             style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                            <div className="flex items-center justify-center mx-auto mb-4"
                                                 style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                <MdSecurity style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>No Logs Found</h3>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 4 }}>
                                                No {filter !== 'all' ? filter : ''} logs found matching your criteria.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.map((log, index) => {
                                const styles = getSeverityStyles(log.severity);
                                return (
                                    <tr key={index} className="transition-colors group" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.cardBg; }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.xs,
                                                fontWeight: T.weight.bold,
                                                borderRadius: '10px',
                                                textTransform: 'uppercase',
                                                letterSpacing: T.tracking.wider,
                                                backgroundColor: styles.bg,
                                                color: styles.color,
                                                border: `1px solid ${styles.border}`
                                            }}>
                                                {getSeverityIcon(log.severity)}
                                                {log.severity}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>{log.type}</div>
                                        </td>
                                        <td style={{ padding: '16px 16px' }}>
                                            <div className="max-w-[400px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, lineHeight: 1.6 }}>
                                                {log.message}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <div className="flex flex-col items-end gap-1">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {new Date(log.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: C.btnViewAllBg, padding: '2px 8px', borderRadius: '6px', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                                    <MdAccessTime style={{ width: 12, height: 12 }} />
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination Footer */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: C.surfaceWhite, borderTop: `1px solid ${C.cardBorder}` }}>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>Showing {filteredLogs.length} of {logs.length} logs</span>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; }}>
                            <MdChevronLeft style={{ width: 20, height: 20 }} />
                        </button>
                        <button className="flex items-center justify-center border-none cursor-default"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                            1
                        </button>
                        <button className="flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                            style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}
                            onMouseEnter={e => { e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.backgroundColor = C.btnViewAllBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.backgroundColor = C.surfaceWhite; }}>
                            <MdChevronRight style={{ width: 20, height: 20 }} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}