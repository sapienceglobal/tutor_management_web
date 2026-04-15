'use client';

import { useState, useEffect } from 'react';
import { Loader2, Activity, User, Shield, UserCog, GraduationCap, Clock, FileText, CheckCircle2, Zap } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminActivityPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

    useEffect(() => { fetchActivity(); }, []);

    const fetchActivity = async () => {
        try {
            const res = await api.get('/superadmin/activity');
            if (res.data.success) setActivities(res.data.activities);
        } catch (error) { toast.error('Failed to load activity log'); }
        finally { setLoading(false); }
    };

    const getRoleConfig = (role) => {
        const config = {
            admin: { icon: Shield, bg: 'bg-[#F4F0FD]', color: 'text-[#6B4DF1]', border: 'border-[#E9DFFC]' },
            tutor: { icon: UserCog, bg: 'bg-[#FFF7ED]', color: 'text-[#EA580C]', border: 'border-[#FFEDD5]' },
            student: { icon: GraduationCap, bg: 'bg-[#ECFDF5]', color: 'text-[#10B981]', border: 'border-[#D1FAE5]' },
        };
        return config[role] || { icon: User, bg: 'bg-slate-100', color: 'text-slate-600', border: 'border-slate-200' };
    };

    const timeAgo = (date) => {
        const ms = Date.now() - new Date(date).getTime();
        const mins = Math.floor(ms / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#E9DFFC] shadow-sm">
                        <Activity className="w-6 h-6 text-[#6B4DF1]" />
                    </div>
                    <div>
                        <h1 className="text-[24px] font-black text-[#27225B] m-0">System Activity Logs</h1>
                        <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Real-time audit trail of user actions and system events.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-[#E9DFFC] flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                        <span className="text-[12px] font-bold text-[#4A5568]">System Status: <span className="text-[#10B981]">Healthy</span></span>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="bg-white rounded-[24px] border border-[#E9DFFC] overflow-hidden" style={{ boxShadow: softShadow }}>
                <div className="px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF] flex items-center justify-between">
                    <h2 className="text-[16px] font-black text-[#27225B] m-0 flex items-center gap-2">
                        <FileText size={18} className="text-[#6B4DF1]"/> Recent Events
                    </h2>
                    <span className="px-3 py-1 bg-[#F4F0FD] text-[#6B4DF1] text-[12px] font-black rounded-lg border border-[#E9DFFC]">
                        Total Records: {activities.length}
                    </span>
                </div>

                <div className="p-6">
                    {activities.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-[#D5C2F6] rounded-[24px] bg-[#F9F7FC]/50">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-[#E9DFFC]">
                                <Activity className="w-6 h-6 text-[#D1C4F9]" />
                            </div>
                            <h3 className="text-[18px] font-black text-[#27225B] m-0">No activity recorded yet</h3>
                            <p className="text-[13px] text-[#7D8DA6] mt-1 text-center max-w-sm">System events, logins, and modifications will appear here in real-time.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-[#E9DFFC] ml-6 space-y-8 pb-4">
                            {activities.map((activity, idx) => {
                                const roleConfig = getRoleConfig(activity.user?.role);
                                const RoleIcon = roleConfig.icon;

                                return (
                                    <div key={activity._id || idx} className="relative pl-8 group">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-white border-2 border-[#E9DFFC] flex items-center justify-center shadow-sm group-hover:border-[#6B4DF1] group-hover:scale-110 transition-all duration-300">
                                            <Zap size={14} className="text-[#A0ABC0] group-hover:text-[#6B4DF1]" />
                                        </div>

                                        {/* Activity Card */}
                                        <div className="bg-white border border-[#E9DFFC] rounded-[20px] p-5 shadow-sm hover:shadow-md hover:border-[#D5C2F6] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-4">
                                            
                                            {/* User Avatar & Info */}
                                            <div className="flex items-center gap-3 min-w-[220px]">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border overflow-hidden ${roleConfig.bg} ${roleConfig.border}`}>
                                                    {activity.user?.profileImage ? (
                                                        <img src={activity.user.profileImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <RoleIcon size={18} className={roleConfig.color} />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[14px] font-black text-[#27225B] truncate max-w-[120px]">{activity.user?.name || 'System User'}</span>
                                                        <span className={`px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase tracking-wider border ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}>
                                                            {activity.user?.role || 'System'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-[#A0ABC0] truncate max-w-[150px]">{activity.user?.email || 'N/A'}</span>
                                                </div>
                                            </div>

                                            {/* Action Description */}
                                            <div className="flex-1 bg-[#F9F7FC] px-4 py-3 rounded-xl border border-[#E9DFFC]/50 flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E9DFFC]">
                                                    <CheckCircle2 size={12} className="text-[#6B4DF1]" />
                                                </div>
                                                <p className="text-[13px] font-semibold text-[#4A5568] m-0 leading-relaxed">
                                                    {activity.description}
                                                </p>
                                            </div>

                                            {/* Time & Stamp */}
                                            <div className="flex flex-col items-end min-w-[100px] shrink-0 text-right">
                                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#6B4DF1] bg-[#F4F0FD] px-2.5 py-1 rounded-lg border border-[#E9DFFC]">
                                                    <Clock size={12} /> {timeAgo(activity.timestamp)}
                                                </div>
                                                <p className="text-[10px] font-bold text-[#A0ABC0] m-0 mt-1.5 uppercase tracking-wider">
                                                    {new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}