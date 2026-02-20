'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import StatsCard from '@/components/widgets/StatsCard';
import AnalyticsChart from '@/components/widgets/AnalyticsChart';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const formatTrend = (val) => {
        if (val === null) return 'New';
        const trendType = val >= 0 ? 'increase' : 'decrease';
        return `${Math.abs(val).toFixed(1)}% ${trendType}`;
    };

    const statsData = [
        {
            title: 'Total Tutors',
            value: stats?.totalTutors?.toLocaleString() || '0',
            subtext: 'in Last week',
            trend: formatTrend(stats?.trends?.users),
            trendUp: (stats?.trends?.users === null) || (stats?.trends?.users >= 0)
        },
        {
            title: 'Total Students',
            value: stats?.totalStudents?.toLocaleString() || '0',
            subtext: 'than 1 yrs ago',
            trend: formatTrend(stats?.trends?.users),
            trendUp: (stats?.trends?.users === null) || (stats?.trends?.users >= 0)
        },
        {
            title: 'Active Courses',
            value: stats?.activeCourses?.toLocaleString() || '0',
            subtext: 'than last week',
            trend: formatTrend(stats?.trends?.courses),
            trendUp: (stats?.trends?.courses === null) || (stats?.trends?.courses >= 0)
        },
        {
            title: 'Total Revenue',
            value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
            subtext: 'last month',
            trend: formatTrend(stats?.trends?.earnings),
            trendUp: (stats?.trends?.earnings === null) || (stats?.trends?.earnings >= 0)
        }
    ];

    return (
        <div className="space-y-6">
            {/* Bizdire-style Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-[#2C3E50]">Admin Dasboard</h1>
                    <div className="text-sm text-[#7D8DA6]">
                        <span className="text-[#7D8DA6]">admin</span>
                        <span className="mx-2">/</span>
                        <span className="text-[#FF9F43]">dashboard</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts & Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Growth Chart */}
                <div className="lg:col-span-2">
                    <AnalyticsChart
                        data={stats?.monthlyData}
                        title="Platform Growth"
                    />
                </div>

                {/* Recent Registrations */}
                <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-[#2C3E50]">Recent Users</h3>
                        <button className="text-sm text-[#FF9F43] hover:text-[#FF9F43]/80 font-medium">View All</button>
                    </div>
                    <div className="space-y-4">
                        {stats?.recentUsers?.map((user) => (
                            <div key={user._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                <img
                                    src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full border border-slate-200"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#2C3E50] truncate">{user.name}</p>
                                    <p className="text-xs text-[#7D8DA6] truncate">{user.email}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'tutor'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}