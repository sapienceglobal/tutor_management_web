'use client';

import { useState, useEffect } from 'react';
import { 
    MdHourglassEmpty, MdHistory, MdPerson, MdSecurity, MdManageAccounts, 
    MdSchool, MdAccessTime, MdArticle, MdCheckCircle, MdBolt 
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

export default function SuperAdminActivityPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchActivity(); }, []);

    const fetchActivity = async () => {
        try {
            const res = await api.get('/superadmin/activity');
            if (res.data.success) setActivities(res.data.activities);
        } catch (error) { 
            toast.error('Failed to load activity log'); 
        } finally { 
            setLoading(false); 
        }
    };

    const getRoleConfig = (role) => {
        const config = {
            admin: { icon: MdSecurity, bg: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}` },
            tutor: { icon: MdManageAccounts, bg: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}` },
            student: { icon: MdSchool, bg: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` },
        };
        return config[role] || { icon: MdPerson, bg: C.surfaceWhite, color: C.textFaint, border: `1px solid ${C.cardBorder}` };
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading activity logs...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6 pb-8" style={{ backgroundColor: C.pageBg, ...pageStyle }}>
            
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center shrink-0" 
                        style={{ width: 56, height: 56, borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <MdHistory style={{ width: 24, height: 24, color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            System Activity Logs
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>
                            Real-time audit trail of user actions and system events.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2" style={{ backgroundColor: C.cardBg, padding: '10px 16px', borderRadius: '10px', border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C.success }}></div>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>
                            System Status: <span style={{ color: C.success }}>Healthy</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex flex-col overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                    <h2 className="flex items-center gap-2 m-0" style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>
                        <MdArticle style={{ width: 18, height: 18, color: C.btnPrimary }}/> Recent Events
                    </h2>
                    <span style={{ padding: '4px 12px', backgroundColor: C.innerBg, color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.black, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                        Total Records: {activities.length}
                    </span>
                </div>

                <div className="p-6">
                    {activities.length === 0 ? (
                        <div className="p-14 text-center border border-dashed" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                            <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdHistory style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>No activity recorded yet</h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, margin: 0, marginTop: 4 }}>System events, logins, and modifications will appear here in real-time.</p>
                        </div>
                    ) : (
                        <div className="relative space-y-8 pb-4" style={{ borderLeft: `2px solid ${C.cardBorder}`, marginLeft: '24px' }}>
                            {activities.map((activity, idx) => {
                                const roleConfig = getRoleConfig(activity.user?.role);
                                const RoleIcon = roleConfig.icon;

                                return (
                                    <div key={activity._id || idx} className="relative group" style={{ paddingLeft: '32px' }}>
                                        
                                        {/* Timeline Dot */}
                                        <div className="absolute top-1 flex items-center justify-center transition-all duration-300"
                                            style={{ 
                                                left: '-17px', width: '32px', height: '32px', borderRadius: R.full, 
                                                backgroundColor: C.cardBg, border: `2px solid ${C.cardBorder}`, boxShadow: S.cardHover 
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = C.btnPrimary;
                                                e.currentTarget.firstChild.style.color = C.btnPrimary;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = C.cardBorder;
                                                e.currentTarget.firstChild.style.color = C.textFaint;
                                            }}
                                        >
                                            <MdBolt style={{ width: 14, height: 14, color: C.textFaint, transition: 'color 0.3s' }} />
                                        </div>

                                        {/* Activity Card */}
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 transition-all duration-300"
                                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, padding: '20px', boxShadow: S.card }}
                                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = S.cardHover; e.currentTarget.style.borderColor = C.btnPrimary; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = S.card; e.currentTarget.style.borderColor = C.cardBorder; }}
                                        >
                                            
                                            {/* User Avatar & Info */}
                                            <div className="flex items-center gap-3 min-w-[220px]">
                                                <div className="flex items-center justify-center shrink-0 overflow-hidden"
                                                    style={{ width: 40, height: 40, borderRadius: R.full, backgroundColor: roleConfig.bg, border: roleConfig.border }}>
                                                    {activity.user?.profileImage ? (
                                                        <img src={activity.user.profileImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <RoleIcon style={{ width: 18, height: 18, color: roleConfig.color }} />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate max-w-[120px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>
                                                            {activity.user?.name || 'System User'}
                                                        </span>
                                                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, backgroundColor: roleConfig.bg, color: roleConfig.color, border: roleConfig.border }}>
                                                            {activity.user?.role || 'System'}
                                                        </span>
                                                    </div>
                                                    <span className="truncate max-w-[150px]" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, marginTop: '2px' }}>
                                                        {activity.user?.email || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Description */}
                                            <div className="flex-1 flex items-center gap-3" style={{ backgroundColor: C.innerBg, padding: '12px 16px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, borderRadius: R.full, backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                                    <MdCheckCircle style={{ width: 12, height: 12, color: C.btnPrimary }} />
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, margin: 0, lineHeight: T.leading.relaxed }}>
                                                    {activity.description}
                                                </p>
                                            </div>

                                            {/* Time & Stamp */}
                                            <div className="flex flex-col items-end min-w-[100px] shrink-0 text-right">
                                                <div className="flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, backgroundColor: C.innerBg, padding: '4px 10px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                                    <MdAccessTime style={{ width: 12, height: 12 }} /> {timeAgo(activity.timestamp)}
                                                </div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, margin: 0, marginTop: '6px', textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
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