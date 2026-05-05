'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdSensors, MdPeople, MdVideocam, MdPowerSettingsNew, 
    MdWarning, MdBusiness, MdAccessTime, MdCalendarMonth, MdOpenInNew 
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

export default function SuperAdminLiveRadar() {
    const [sessions, setSessions] = useState([]);
    const [kpis, setKpis] = useState({ totalActiveStreams: 0, totalCCU: 0, streamsToday: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRadarData();
        // Live feel: Refresh every 30 seconds
        const interval = setInterval(fetchRadarData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchRadarData = async () => {
        try {
            const res = await api.get('/superadmin/live-classes/radar');
            if (res.data.success) {
                setSessions(res.data.data.activeSessions);
                setKpis(res.data.data.kpis);
            }
        } catch (error) {
            console.error('Failed to load radar');
        } finally {
            setLoading(false);
        }
    };

    const handleForceKill = async (id, title) => {
        if (!confirm(`🚨 DANGER: Are you sure you want to FORCE KILL the live stream: "${title}"? All participants will be disconnected immediately.`)) return;

        try {
            const res = await api.patch(`/superadmin/live-classes/${id}/force-kill`);
            if (res.data.success) {
                // Remove killed session from UI instantly
                setSessions(sessions.filter(s => s._id !== id));
                setKpis(prev => ({ 
                    ...prev, 
                    totalActiveStreams: prev.totalActiveStreams - 1,
                    // Note: CCU won't be perfectly accurate until next refresh, but acceptable for UX
                }));
                toast.success('Stream successfully terminated!');
            }
        } catch (error) {
            toast.error('Failed to force kill stream');
        }
    };

    // Calculate duration
    const getDuration = (startedAt) => {
        const diffMs = Date.now() - new Date(startedAt).getTime();
        const hrs = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    if (loading && sessions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading radar data...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header & Radar Pulse ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0 relative" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        {/* Red Pulse Animation for "Live" feel */}
                        <div className="absolute inset-0 border-[2px] animate-ping opacity-75" style={{ borderColor: C.danger, borderRadius: '10px' }}></div>
                        <MdSensors style={{ width: 24, height: 24, color: C.danger }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Live Class Radar
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Air traffic control for all ongoing video streams and concurrent users.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchRadarData} 
                        className="flex items-center gap-2 transition-colors cursor-pointer"
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
                        <MdSensors style={{ width: 18, height: 18, color: C.btnPrimary }}/> Ping Radar
                    </button>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard 
                    icon={MdVideocam} 
                    value={kpis.totalActiveStreams} 
                    label="Active Streams" 
                    iconBg={C.dangerBg} 
                    iconColor={C.danger} 
                />
                <StatCard 
                    icon={MdPeople} 
                    value={kpis.totalCCU.toLocaleString()} 
                    label="Concurrent Users (CCU)" 
                    subtext="Watching Now"
                    iconBg="#EEF2FF" 
                    iconColor="#4F46E5" 
                />
                <StatCard 
                    icon={MdCalendarMonth} 
                    value={kpis.streamsToday} 
                    label="Total Streams Today" 
                    iconBg="#ECFDF5" 
                    iconColor="#10B981" 
                />
            </div>

            {/* ── Active Streams Grid ── */}
            {sessions.length === 0 ? (
                <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                        <MdSensors style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No classes are currently live</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 4, margin: 0 }}>The radar is quiet. Active streams will appear here instantly.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sessions.map(session => (
                        <div key={session._id} className="flex flex-col transition-transform hover:-translate-y-1" 
                            style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = S.cardHover; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = S.card; }}
                        >
                            
                            {/* Card Header (Live Badge & CCU) */}
                            <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}`, borderTopLeftRadius: R['2xl'], borderTopRightRadius: R['2xl'] }}>
                                <span className="flex items-center gap-1.5" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}` }}>
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.danger }}></div> Live
                                </span>
                                <div className="flex items-center gap-1.5" style={{ padding: '4px 10px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                    <MdPeople style={{ width: 14, height: 14, color: C.btnPrimary }}/> {session.participantCount}
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="line-clamp-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0, marginBottom: '4px' }}>{session.title}</h3>
                                <p className="line-clamp-1" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0, marginBottom: '16px' }}>{session.courseId?.title || 'Unknown Course'}</p>
                                
                                <div className="space-y-3 mt-auto">
                                    <div className="flex items-center gap-2.5">
                                        <MdBusiness style={{ width: 16, height: 16, color: C.textFaint, flexShrink: 0 }} />
                                        <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>{session.instituteId ? session.instituteId.name : 'Global Platform'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center justify-center shrink-0 overflow-hidden" style={{ width: 20, height: 20, borderRadius: R.full, backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                            {session.tutorId?.profileImage ? <img src={session.tutorId.profileImage} className="w-full h-full object-cover"/> : <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary }}>T</span>}
                                        </div>
                                        <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.text }}>{session.tutorId?.name || 'Unknown Tutor'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                                    <MdAccessTime style={{ width: 14, height: 14, color: C.textFaint }}/> Uptime: {getDuration(session.startedAt)}
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex items-center justify-center transition-colors cursor-pointer" 
                                        style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, color: C.btnPrimary, boxShadow: S.cardHover }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.surfaceWhite; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.innerBg; }}
                                        title="Join silently as Admin">
                                        <MdOpenInNew style={{ width: 16, height: 16 }}/>
                                    </button>
                                    <button 
                                        onClick={() => handleForceKill(session._id, session.title)}
                                        className="flex items-center gap-1.5 transition-colors cursor-pointer"
                                        style={{ padding: '0 12px', height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.dangerBorder}`, color: C.danger, boxShadow: S.cardHover, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerBg; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = C.surfaceWhite; }}
                                        title="Kill Stream"
                                    >
                                        <MdPowerSettingsNew style={{ width: 14, height: 14 }}/> Kill
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}