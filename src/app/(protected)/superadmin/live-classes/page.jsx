'use client';

import { useState, useEffect } from 'react';
import { 
    Loader2, Radio, Users, Video, PowerOff, AlertTriangle, 
    Building2, Clock, CalendarDays, ExternalLink 
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminLiveRadar() {
    const [sessions, setSessions] = useState([]);
    const [kpis, setKpis] = useState({ totalActiveStreams: 0, totalCCU: 0, streamsToday: 0 });
    const [loading, setLoading] = useState(true);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

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
        return <div className="flex items-center justify-center h-screen bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;
    }

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header & Radar Pulse ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm relative">
                        {/* Red Pulse Animation for "Live" feel */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-[#EF4444] animate-ping opacity-75"></div>
                        <Radio className="w-6 h-6 text-[#EF4444]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">Live Class Radar</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Air traffic control for all ongoing video streams and concurrent users.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchRadarData} className="bg-white px-5 py-2.5 rounded-xl border border-[#E9DFFC] text-[#27225B] text-[13px] font-bold flex items-center gap-2 shadow-sm hover:bg-[#F9F7FC] transition-colors cursor-pointer border-none">
                        <Radio size={16} className="text-[#6B4DF1]"/> Ping Radar
                    </button>
                </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#27225B] rounded-[20px] p-6 border border-[#1e1a48] relative overflow-hidden shadow-lg">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-[#EF4444] opacity-20 rounded-bl-full filter blur-xl"></div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <Video size={18} className="text-[#A0ABC0]" />
                        <span className="text-[12px] font-bold text-[#A0ABC0] uppercase tracking-wider">Active Streams</span>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <h3 className="text-[32px] font-black text-white leading-none m-0">{kpis.totalActiveStreams}</h3>
                        <span className="flex items-center gap-1 text-[10px] font-black bg-red-500/20 text-red-400 px-2 py-1 rounded-md uppercase tracking-wider"><div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div> Live</span>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-[#E9DFFC] relative overflow-hidden" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={18} className="text-[#7D8DA6]" />
                        <span className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Concurrent Users (CCU)</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-[32px] font-black text-[#6B4DF1] leading-none m-0">{kpis.totalCCU.toLocaleString()}</h3>
                        <span className="text-[11px] font-bold text-[#A0ABC0]">Watching Now</span>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-[#E9DFFC] relative overflow-hidden" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarDays size={18} className="text-[#7D8DA6]" />
                        <span className="text-[12px] font-bold text-[#7D8DA6] uppercase tracking-wider">Total Streams Today</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-[32px] font-black text-[#27225B] leading-none m-0">{kpis.streamsToday}</h3>
                    </div>
                </div>
            </div>

            {/* ── Active Streams Grid ── */}
            {sessions.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E9DFFC] p-16 text-center shadow-sm">
                    <Radio className="w-14 h-14 text-[#D1C4F9] mx-auto mb-4 opacity-50" />
                    <h3 className="text-[18px] font-black text-[#27225B] m-0">No classes are currently live</h3>
                    <p className="text-[13px] text-[#7D8DA6] mt-2 m-0">The radar is quiet. Active streams will appear here instantly.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sessions.map(session => (
                        <div key={session._id} className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden hover:-translate-y-1 transition-transform flex flex-col group shadow-sm">
                            
                            {/* Card Header (Live Badge & CCU) */}
                            <div className="px-5 py-4 border-b border-[#F4F0FD] bg-[#FDFBFF] flex items-center justify-between">
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm border border-[#FECACA] bg-[#FEE2E2] text-[#E53E3E]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#E53E3E] animate-pulse"></div> Live
                                </span>
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#27225B] bg-[#F8F6FC] px-2 py-1 rounded-lg border border-[#E9DFFC]">
                                    <Users size={14} className="text-[#6B4DF1]"/> {session.participantCount}
                                </div>
                            </div>

                            {/* Content Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-black text-[16px] text-[#27225B] mb-1 line-clamp-1">{session.title}</h3>
                                <p className="text-[12px] font-bold text-[#6B4DF1] m-0 mb-4 line-clamp-1">{session.courseId?.title || 'Unknown Course'}</p>
                                
                                <div className="space-y-3 mt-auto">
                                    <div className="flex items-center gap-2.5 text-[12px] font-semibold text-[#4A5568]">
                                        <Building2 size={16} className="text-[#A0ABC0] shrink-0" />
                                        <span className="truncate">{session.instituteId ? session.instituteId.name : 'Global Platform'}</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[12px] font-semibold text-[#4A5568]">
                                        <div className="w-5 h-5 rounded-full bg-[#E9DFFC] flex items-center justify-center overflow-hidden shrink-0 border border-[#D5C2F6]">
                                            {session.tutorId?.profileImage ? <img src={session.tutorId.profileImage} className="w-full h-full object-cover"/> : <span className="text-[9px] font-bold text-[#6B4DF1]">T</span>}
                                        </div>
                                        <span className="truncate">{session.tutorId?.name || 'Unknown Tutor'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-[#F4F0FD] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A0ABC0]">
                                    <Clock size={14} className="text-[#7D8DA6]"/> Uptime: {getDuration(session.startedAt)}
                                </div>

                                <div className="flex gap-2">
                                    <button className="w-9 h-9 rounded-xl bg-[#F9F7FC] border border-[#E9DFFC] flex items-center justify-center text-[#6B4DF1] hover:bg-[#F4F0FD] transition-colors cursor-pointer shadow-sm" title="Join silently as Admin">
                                        <ExternalLink size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => handleForceKill(session._id, session.title)}
                                        className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white border border-[#FECACA] text-[#E53E3E] hover:bg-[#FEE2E2] transition-colors cursor-pointer shadow-sm text-[12px] font-bold"
                                        title="Kill Stream"
                                    >
                                        <PowerOff size={14}/> Kill
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