'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdAssignmentTurnedIn, MdWarning, MdAccessTime, 
    MdCancel, MdSearch, MdCheckCircle, MdSchool, MdBusiness
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

export default function SuperAdminAttendancePage() {
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [kpis, setKpis] = useState({ totalLogs: 0, presentCount: 0, lateCount: 0, absentCount: 0, presentPercentage: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

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
            case 'present': return { color: C.success, bg: C.successBg, border: `1px solid ${C.successBorder}`, icon: MdCheckCircle, label: 'Present' };
            case 'absent': return { color: C.danger, bg: C.dangerBg, border: `1px solid ${C.dangerBorder}`, icon: MdCancel, label: 'Absent' };
            case 'late': return { color: C.warning, bg: C.warningBg, border: `1px solid ${C.warningBorder}`, icon: MdAccessTime, label: 'Late' };
            default: return { color: C.textMuted, bg: C.innerBg, border: `1px solid ${C.cardBorder}`, icon: MdWarning, label: status };
        }
    };

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdAssignmentTurnedIn style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Platform Attendance
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Monitor live class attendance patterns across all institutes.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {/* Overall Present % - Custom Styling */}
                <div className="p-6 relative overflow-hidden flex flex-col justify-center" 
                    style={{ backgroundColor: C.darkCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="absolute right-0 top-0 opacity-20 rounded-bl-full" style={{ width: 100, height: 100, background: `linear-gradient(to bottom right, ${C.btnPrimary}, transparent)` }}></div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textFaint, textTransform: 'uppercase', letterSpacing: T.tracking.wider, margin: 0, marginBottom: '8px', position: 'relative', zIndex: 10 }}>
                        Platform Health
                    </p>
                    <div className="flex items-end gap-2 relative z-10">
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, margin: 0, color: kpis.presentPercentage < 50 ? C.danger : C.success }}>
                            {kpis.presentPercentage}%
                        </h3>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textFaint, marginBottom: '4px' }}>Present Avg.</span>
                    </div>
                </div>

                <StatCard 
                    icon={MdCheckCircle} 
                    value={kpis.presentCount.toLocaleString()} 
                    label="Total Present" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
                <StatCard 
                    icon={MdAccessTime} 
                    value={kpis.lateCount.toLocaleString()} 
                    label="Total Late" 
                    iconBg="#FFF7ED" 
                    iconColor="#F59E0B" 
                />
                <StatCard 
                    icon={MdCancel} 
                    value={kpis.absentCount.toLocaleString()} 
                    label="Total Absent" 
                    iconBg={C.dangerBg} 
                    iconColor={C.danger} 
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4" 
                style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                
                <div className="flex p-1.5 w-full sm:w-auto overflow-x-auto" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                    {['all', 'present', 'late', 'absent'].map(status => (
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
                            {status === 'all' ? 'All Records' : status}
                        </button>
                    ))}
                </div>
                
                <div style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, backgroundColor: C.innerBg, padding: '10px 16px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                    Showing Latest 50 Logs
                </div>
            </div>

            {/* ── Attendance Log Table ── */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                {loading ? (
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative w-12 h-12">
                                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                                Loading attendance...
                            </p>
                        </div>
                    </div>
                ) : attendanceLogs.length === 0 ? (
                    <div className="p-14 text-center border border-dashed m-8" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                        <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                            <MdAssignmentTurnedIn style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No attendance records found</h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4 }}>Data will populate as students join live classes.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead style={{ backgroundColor: C.innerBg }}>
                                <tr>
                                    {['Student Name', 'Course / Context', 'Join Time', 'Status'].map((header, idx) => (
                                        <th key={idx} style={{
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.bold,
                                            color: C.statLabel,
                                            textTransform: 'uppercase',
                                            letterSpacing: T.tracking.wider,
                                            padding: '16px 24px',
                                            borderBottom: `1px solid ${C.cardBorder}`
                                        }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceLogs.map((log, idx) => {
                                    const statusData = getStatusConfig(log.status);
                                    const StatusIcon = statusData.icon;

                                    return (
                                        <tr key={log._id || idx} className="transition-colors"
                                            style={{ borderBottom: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center shrink-0 overflow-hidden" 
                                                        style={{ width: 40, height: 40, borderRadius: R.full, backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                        {log.studentId?.profileImage ? (
                                                            <img src={log.studentId.profileImage} className="w-full h-full object-cover"/>
                                                        ) : (
                                                            <MdSchool style={{ width: 16, height: 16, color: C.btnPrimary }}/>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1.2 }}>{log.studentId?.name || 'Unknown Student'}</p>
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4 }}>{log.studentId?.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="line-clamp-1 max-w-xs" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>
                                                    {log.courseId?.title || 'Unknown Course'}
                                                </p>
                                                {log.courseId?.instituteId && (
                                                    <div className="flex items-center gap-1.5 mt-2" style={{ color: C.textMuted, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold }}>
                                                        <MdBusiness style={{ width: 14, height: 14 }} />
                                                        <span>Institute Enrolled</span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    <MdAccessTime style={{ width: 16, height: 16, color: C.textFaint }}/>
                                                    {new Date(log.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, marginTop: 4, marginLeft: '24px' }}>
                                                    {new Date(log.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5" 
                                                    style={{ 
                                                        padding: '6px 12px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                        backgroundColor: statusData.bg, color: statusData.color, border: statusData.border 
                                                    }}
                                                >
                                                    <StatusIcon style={{ width: 14, height: 14 }}/> {statusData.label}
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