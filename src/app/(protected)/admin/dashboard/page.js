'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import StatsCard from '@/components/widgets/StatsCard';
import AnalyticsChart from '@/components/widgets/AnalyticsChart';
import { Calendar, Filter, X, Users, Mail, Plus, Building2, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilter, setShowFilter] = useState(false);

    const fetchStats = async (start = startDate, end = endDate) => {
        setLoading(true);
        try {
            const params = {};
            if (start && end) {
                params.startDate = start;
                params.endDate = end;
            }
            const res = await api.get('/admin/stats', { params });
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
            toast.error(error.response?.data?.message || 'Failed to load dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchInstitute = async () => {
        try {
            const res = await api.get('/user-institute/me');
            if (res.data?.success) {
                setInstitute(res.data.institute);
            }
        } catch (err) {
            console.error('Failed to fetch institute info:', err);
        }
    };

    const handleApplyFilter = () => {
        if (!startDate || !endDate) {
            toast.error('Please select both start and end date');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Start date cannot be after end date');
            return;
        }

        fetchStats(startDate, endDate);
        setShowFilter(false);
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        fetchStats('', '');
    };

    if (loading && !stats) {
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

    const hasActiveFilter = startDate && endDate;

    return (
        <div className="space-y-6">
            {/* Bizdire-style Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                <div>
                    <h1 className="text-2xl font-bold text-[#2C3E50]">Admin Dashboard</h1>
                    <div className="text-sm text-[#7D8DA6] mt-1">
                        <span className="text-[#7D8DA6]">admin</span>
                        <span className="mx-2">/</span>
                        <span className="text-[#FF9F43]">dashboard</span>
                    </div>
                </div>

                {/* Filter Toggle Button */}
                <div>
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm border ${
                            hasActiveFilter 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <Calendar className={`w-4 h-4 ${hasActiveFilter ? 'text-indigo-600' : 'text-slate-500'}`} />
                        {hasActiveFilter ? 'Filtered Range' : 'Date Filter'}
                        {hasActiveFilter && (
                            <span className="ml-1 w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        )}
                    </button>

                    {/* Filter Dropdown Popover */}
                    {showFilter && (
                        <div className="absolute top-[85px] right-6 z-10 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-5 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-indigo-500" />
                                    Filter Analytics
                                </h3>
                                <button onClick={() => setShowFilter(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none px-3 py-2 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none px-3 py-2 transition-all"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            handleApplyFilter();
                                            setShowFilter(false);
                                        }}
                                        disabled={!startDate || !endDate}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg text-sm px-4 py-2 transition-colors flex justify-center items-center"
                                    >
                                        Apply
                                    </button>
                                    {(startDate || endDate) && (
                                        <button
                                            onClick={() => {
                                                handleClearFilter();
                                                setShowFilter(false);
                                            }}
                                            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-sm transition-colors"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Quick Actions - Industry Level */}
            <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-[#2C3E50] text-lg">Quick Actions</h3>
                    <Settings className="w-5 h-5 text-[#7D8DA6]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Generate Tutor Invite */}
                    <Link href="/admin/invites" className="group">
                        <div className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-all">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <Mail className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-purple-900">Generate Tutor Invite</h4>
                                <p className="text-sm text-purple-700">Create invite link for new tutors</p>
                            </div>
                            <Plus className="w-5 h-5 text-purple-600 group-hover:rotate-90 transition-transform" />
                        </div>
                    </Link>

                    {/* Generate Student Invite */}
                    <Link href="/admin/invites" className="group">
                        <div className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-900">Generate Student Invite</h4>
                                <p className="text-sm text-blue-700">Create invite link for students</p>
                            </div>
                            <Plus className="w-5 h-5 text-blue-600 group-hover:rotate-90 transition-transform" />
                        </div>
                    </Link>

                    {/* Institute Settings */}
                    <Link href="/admin/settings" className="group">
                        <div className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-all">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                <Building2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-green-900">Institute Settings</h4>
                                <p className="text-sm text-green-700">Manage institute configuration</p>
                            </div>
                            <Settings className="w-5 h-5 text-green-600 group-hover:rotate-90 transition-transform" />
                        </div>
                    </Link>
                </div>
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
