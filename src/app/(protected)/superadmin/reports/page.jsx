'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdFlag, MdWarning, MdSecurity, MdCheckCircle, 
    MdCancel, MdSearch, MdPerson, MdMenuBook, MdMessage, MdVisibility 
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

export default function SuperAdminReportsPage() {
    const [reports, setReports] = useState([]);
    const [kpis, setKpis] = useState({ totalReports: 0, pendingCount: 0, reviewedCount: 0, resolvedCount: 0, dismissedCount: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReports();
    }, [statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/superadmin/reports?status=${statusFilter}`);
            if (res.data.success) {
                setReports(res.data.data.reports);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await api.patch(`/superadmin/reports/${id}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success(res.data.message);
                // Update local state instantly
                setReports(reports.map(r => r._id === id ? { ...r, status: newStatus } : r));
                // Recalculate KPIs optimistically (or just refetch)
                fetchReports();
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getReasonConfig = (reason) => {
        switch(reason) {
            case 'Spam': return { bg: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}` };
            case 'Harassment': return { bg: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` };
            case 'Inappropriate Content': return { bg: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` };
            case 'Misleading Information': return { bg: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` };
            default: return { bg: C.innerBg, color: C.textMuted, border: `1px solid ${C.cardBorder}` };
        }
    };

    const getTargetIcon = (type) => {
        if (type === 'Course') return <MdMenuBook style={{ width: 14, height: 14, color: C.btnPrimary }} />;
        if (type === 'Tutor') return <MdPerson style={{ width: 14, height: 14, color: C.success }} />;
        if (type === 'Review') return <MdMessage style={{ width: 14, height: 14, color: C.warning }} />;
        return <MdFlag style={{ width: 14, height: 14, color: C.textMuted }} />;
    };

    const filteredReports = reports.filter(r => 
        r.reporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.targetName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdSecurity style={{ width: 24, height: 24, color: C.danger }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Content Moderation & Reports
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Review flagged users, courses, and handle platform abuse.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard 
                    icon={MdWarning} 
                    value={kpis.pendingCount} 
                    label="Pending Action" 
                    iconBg={kpis.pendingCount > 0 ? C.dangerBg : C.innerBg} 
                    iconColor={kpis.pendingCount > 0 ? C.danger : C.btnPrimary} 
                />
                <StatCard 
                    icon={MdVisibility} 
                    value={kpis.reviewedCount} 
                    label="Under Review" 
                    iconBg="#FFF7ED" 
                    iconColor="#EA580C" 
                />
                <StatCard 
                    icon={MdCheckCircle} 
                    value={kpis.resolvedCount} 
                    label="Resolved Valid" 
                    iconBg={C.successBg} 
                    iconColor={C.success} 
                />
                <StatCard 
                    icon={MdCancel} 
                    value={kpis.dismissedCount} 
                    label="Dismissed Fake" 
                    iconBg={C.innerBg} 
                    iconColor={C.textMuted} 
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="flex p-1.5 w-full xl:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map(status => (
                        <button 
                            key={status} 
                            onClick={() => setStatusFilter(status)} 
                            className="transition-all capitalize whitespace-nowrap border-none cursor-pointer"
                            style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                backgroundColor: statusFilter === status ? C.surfaceWhite : 'transparent',
                                color: statusFilter === status ? C.btnPrimary : C.textFaint,
                                boxShadow: statusFilter === status ? S.active : 'none'
                            }}
                        >
                            {status === 'all' ? 'All Reports' : status}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full xl:w-[320px]">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{ width: 18, height: 18, color: C.textFaint }} />
                    <input 
                        type="text" 
                        placeholder="Search reporter or target..." 
                        style={{ ...baseInputStyle, paddingLeft: '44px' }}
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </form>
            </div>

            {/* ── Reports Grid ── */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative w-12 h-12">
                            <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                            Loading reports...
                        </p>
                    </div>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdSecurity style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No reports found</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>The platform is currently clean and safe.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredReports.map((report) => (
                        <div key={report._id} className="flex flex-col transition-transform hover:-translate-y-1 overflow-hidden group" 
                            style={{ 
                                backgroundColor: C.cardBg, 
                                borderRadius: R['2xl'], 
                                border: `1px solid ${report.status === 'Pending' ? C.dangerBorder : C.cardBorder}`, 
                                boxShadow: S.card 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = S.cardHover}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = S.card}
                        >
                            
                            {/* Card Header */}
                            <div className="px-5 py-4 flex items-start justify-between" 
                                style={{ backgroundColor: report.status === 'Pending' ? C.dangerBg : C.innerBg, borderBottom: `1px solid ${report.status === 'Pending' ? C.dangerBorder : C.cardBorder}`, borderTopLeftRadius: R['2xl'], borderTopRightRadius: R['2xl'] }}>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center overflow-hidden shrink-0" 
                                        style={{ width: 40, height: 40, borderRadius: R.full, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                        {report.reporter?.profileImage ? (
                                            <img src={report.reporter.profileImage} className="w-full h-full object-cover"/>
                                        ) : (
                                            <MdPerson style={{ width: 20, height: 20, color: C.btnPrimary }}/>
                                        )}
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '2px' }}>Reported By</p>
                                        <p className="line-clamp-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{report.reporter?.name || 'Unknown'}</p>
                                    </div>
                                </div>
                                {(() => {
                                    const rConf = getReasonConfig(report.reason);
                                    return (
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: T.weight.black, 
                                            textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                            backgroundColor: rConf.bg, color: rConf.color, border: rConf.border 
                                        }}>
                                            {report.reason}
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                {/* Target Info */}
                                <div className="mb-4" style={{ backgroundColor: C.innerBg, padding: '12px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center gap-2 mb-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                        {getTargetIcon(report.targetType)} Target: {report.targetType}
                                    </div>
                                    <p className="line-clamp-1" title={report.targetName} style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0, marginBottom: '4px' }}>
                                        {report.targetName}
                                    </p>
                                    <p style={{ fontFamily: T.fontFamilyMono, fontSize: '10px', color: C.textMuted, margin: 0 }}>
                                        ID: {report.targetId}
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '4px' }}>
                                        Reporter Comments
                                    </p>
                                    <p style={{ 
                                        fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, 
                                        margin: 0, fontStyle: 'italic', borderLeft: `3px solid ${C.btnPrimary}`, paddingLeft: '12px', 
                                        paddingTop: '4px', paddingBottom: '4px', backgroundColor: C.surfaceWhite, borderRadius: '0 8px 8px 0' 
                                    }}>
                                        "{report.description || 'No additional context provided.'}"
                                    </p>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-4 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg, borderBottomLeftRadius: R['2xl'], borderBottomRightRadius: R['2xl'] }}>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                                    {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                
                                <select 
                                    value={report.status} 
                                    onChange={(e) => handleStatusChange(report._id, e.target.value)}
                                    style={{ 
                                        ...baseInputStyle, 
                                        padding: '6px 12px', 
                                        fontSize: '11px', 
                                        fontWeight: T.weight.black, 
                                        textTransform: 'uppercase', 
                                        letterSpacing: T.tracking.wider, 
                                        width: 'auto', 
                                        cursor: 'pointer',
                                        ...(report.status === 'Pending' ? { backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` } :
                                            report.status === 'Reviewed' ? { backgroundColor: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}` } :
                                            report.status === 'Resolved' ? { backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` } :
                                            { backgroundColor: C.cardBg, color: C.textMuted, border: `1px solid ${C.cardBorder}` })
                                    }}
                                >
                                    <option value="Pending">🚨 Pending</option>
                                    <option value="Reviewed">👀 Under Review</option>
                                    <option value="Resolved">✅ Resolved</option>
                                    <option value="Dismissed">❌ Dismissed</option>
                                </select>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}