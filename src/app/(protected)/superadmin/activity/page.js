'use client';

import { useState, useEffect } from 'react';
import { Loader2, Activity, User, Shield, UserCog, GraduationCap, Clock } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function SuperAdminActivityPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchActivity(); }, []);

    const fetchActivity = async () => {
        try {
            const res = await api.get('/superadmin/activity');
            if (res.data.success) setActivities(res.data.activities);
        } catch (error) { toast.error('Failed to load activity log'); }
        finally { setLoading(false); }
    };

    const getRoleIcon = (role) => {
        if (role === 'admin') return <Shield className="w-4 h-4 text-purple-500" />;
        if (role === 'tutor') return <UserCog className="w-4 h-4 text-blue-500" />;
        return <GraduationCap className="w-4 h-4 text-emerald-500" />;
    };

    const getRoleBadge = (role) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-700',
            tutor: 'bg-blue-100 text-blue-700',
            student: 'bg-emerald-100 text-emerald-700',
        };
        return styles[role] || 'bg-slate-100 text-slate-600';
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
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Activity Log</h1>
                        <p className="text-slate-500">Recent platform activity and user registrations</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : activities.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-medium text-slate-600">No activity yet</h3>
                    <p className="text-slate-400 text-sm mt-1">Activity will appear here as users join and interact with the platform</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity, idx) => (
                        <div key={activity._id || idx} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-all hover:border-indigo-100 group">
                            {/* Timeline dot */}
                            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
                                {activity.user?.profileImage ? (
                                    <img src={activity.user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    getRoleIcon(activity.user?.role)
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-800">{activity.user?.name}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${getRoleBadge(activity.user?.role)}`}>
                                        {activity.user?.role}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-0.5">{activity.description}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{activity.user?.email}</p>
                            </div>

                            {/* Time */}
                            <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo(activity.timestamp)}
                                </div>
                                <p className="text-[10px] text-slate-300 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
